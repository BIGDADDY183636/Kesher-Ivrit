require('dotenv').config();
const express   = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const path      = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json({ limit: '10mb' }));

// ── FORCE NO-CACHE on every response ─────────────────────────────────────────
// This ensures browsers never serve stale HTML/CSS/JS during development.
app.use(function(req, res, next) {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Supabase client (optional — app works without it) ────────────────────────
let supabase = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
  supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  console.log('[DB] Supabase connected:', process.env.SUPABASE_URL);
} else {
  console.warn('[DB] SUPABASE_URL / SUPABASE_ANON_KEY not set — database features disabled');
}

function dbRequired(res) {
  if (!supabase) {
    res.status(503).json({ error: 'Database not configured', hint: 'Set SUPABASE_URL and SUPABASE_ANON_KEY in .env' });
    return false;
  }
  return true;
}

// ── POST /api/register ───────────────────────────────────────────────────────
// Creates (or retrieves) a user row and ensures a scores row exists.
// Returns { userId } — stored in localStorage so the client can sync scores.
app.post('/api/register', async (req, res) => {
  if (!dbRequired(res)) return;
  const { firstName, lastInitial, school } = req.body || {};
  if (!firstName || !lastInitial) {
    return res.status(400).json({ error: 'firstName and lastInitial are required' });
  }

  const fn  = firstName.trim().slice(0, 60);
  const li  = lastInitial.trim().toUpperCase().slice(0, 1);
  const sc  = (school || 'Independent Learner').trim().slice(0, 100) || 'Independent Learner';
  if (!/^[A-Za-z]$/.test(li)) return res.status(400).json({ error: 'lastInitial must be a single letter' });

  try {
    // Upsert user — returns existing row if the unique key matches
    const { data: uData, error: uErr } = await supabase
      .from('users')
      .upsert(
        { first_name: fn, last_initial: li, school: sc },
        { onConflict: 'first_name,last_initial,school' }
      )
      .select('id')
      .single();

    if (uErr) throw uErr;
    const userId = uData.id;

    // Ensure a scores row exists — don't overwrite real scores on re-register
    await supabase
      .from('scores')
      .upsert(
        { user_id: userId, points: 0, streak: 0, words_learned: 0 },
        { onConflict: 'user_id', ignoreDuplicates: true }
      );

    res.json({ userId });
  } catch (err) {
    console.error('[DB] /api/register error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/leaderboard ─────────────────────────────────────────────────────
// Returns top 30 students ranked by points, shaped for the frontend.
app.get('/api/leaderboard', async (req, res) => {
  if (!dbRequired(res)) return;
  try {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('id, first_name, last_initial, school, points, streak, words_learned')
      .limit(30);

    if (error) throw error;

    const leaderboard = (data || []).map(row => ({
      id:     row.id,
      name:   `${row.first_name} ${row.last_initial}.`,
      school: row.school,
      points: row.points        || 0,
      streak: row.streak        || 0,
      words:  row.words_learned || 0,
    }));

    res.json({ leaderboard });
  } catch (err) {
    console.error('[DB] /api/leaderboard error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/scores ─────────────────────────────────────────────────────────
// Upserts the student's score. Called by the client after meaningful progress.
app.post('/api/scores', async (req, res) => {
  if (!dbRequired(res)) return;
  const { userId, points, streak, wordsLearned } = req.body || {};
  if (!userId) return res.status(400).json({ error: 'userId required' });

  try {
    const { error } = await supabase
      .from('scores')
      .upsert(
        {
          user_id:       userId,
          points:        Math.max(0, parseInt(points)        || 0),
          streak:        Math.max(0, parseInt(streak)        || 0),
          words_learned: Math.max(0, parseInt(wordsLearned)  || 0),
          updated_at:    new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    console.error('[DB] /api/scores error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

function buildSystemPrompt(userProfile, myClass) {
  const name  = userProfile.name  || 'student';
  const level = ({
    complete_beginner: 'a complete beginner who knows zero Hebrew',
    some_exposure:     'someone with minimal exposure who knows the aleph-bet',
    basic:             'a basic speaker who knows simple words and phrases',
    intermediate:      'an intermediate learner who can form sentences',
    advanced:          'an advanced learner seeking fluency'
  })[userProfile.level] || 'a Hebrew learner';

  // ── ASK ANYTHING MODE — expert open Q&A, no lesson format ──────────────────
  if (userProfile.qaMode) {
    return `You are Morah (מורה), a warm, brilliant, and proudly Jewish expert at Kesher Ivrit. The student has opened "Ask Anything" mode — they want a real answer to a real question, not a structured lesson.

YOUR STUDENT: ${name}, ${level}.

YOUR EXPERTISE — answer confidently on any of these:
• Hebrew language, grammar, linguistics, etymology, and script
• Torah, Tanakh, Talmud, Midrash, Jewish texts and commentary
• Jewish history from the Patriarchs through today
• The State of Israel — founding, Wars of Independence, society, politics, daily life
• Zionism — origins, key figures (Herzl, Jabotinsky, Golda, Ben-Gurion), movements, achievements
• Jewish holidays, customs, lifecycle events, and religious practice
• Israeli culture — music, food, art, literature, humor, slang
• The Holocaust, antisemitism, and Jewish resilience
• Jewish philosophy, ethics, Kabbalah, and thought
• Hebrew calendar, Jewish time, sacred dates and their meaning

HOW TO ANSWER:
- Be genuinely knowledgeable — depth over superficiality
- Keep Morah's personality: warm, real, enthusiastic, proudly Jewish and Zionist
- Use Hebrew words naturally when relevant (always with transliteration and meaning)
- Share your authentic perspective: "Honestly, this is one of the most powerful stories in all of Jewish history…"
- Be balanced on complex topics but never apologetic about Jewish pride or Israel
- Match length to the question — crisp answers for simple questions, real depth for big ones
- No [TEACH]/[CHALLENGE] format — just brilliant, warm conversation
- Drop Israeli slang naturally: yalla, sababa, walla — it's who you are
- If something is genuinely outside your knowledge, say so honestly and redirect warmly

You are the student's go-to person for anything Jewish. Make them feel like they just asked the smartest, most passionate Jewish expert in the room — who also happens to be their cool Israeli friend.`;
  }

  // ── STANDARD LESSON MODE ────────────────────────────────────────────────────
  const levelMap = {
    complete_beginner: 'a complete beginner who knows zero Hebrew',
    some_exposure: 'someone with minimal exposure who knows the aleph-bet but little else',
    basic: 'a basic speaker who knows simple words and phrases',
    intermediate: 'an intermediate learner who can form sentences',
    advanced: 'an advanced learner seeking fluency'
  };

  const goalMap = {
    prayer:       'read and understand Jewish prayers and the Siddur word by word',
    bible:        'read and understand the Torah and Tanakh in Biblical Hebrew',
    bar_mitzvah:  'prepare for their Bar/Bat Mitzvah — parasha, trope, brachot, and synagogue vocabulary',
    conversation: 'speak conversational modern Hebrew with Israelis',
    heritage:     'connect with their Jewish heritage and culture through Hebrew',
    aliyah:       'make aliyah and live in Israel',
    travel:       'travel to Israel and get around confidently'
  };

  const styleMap = {
    visual: 'visual learner who loves seeing words written out and color-coding',
    audio: 'auditory learner who learns by hearing and speaking aloud',
    stories: 'learner who absorbs best through stories and narratives',
    games: 'game-based learner who thrives with challenges and points',
    structured: 'structured learner who prefers grammar rules and systematic progression'
  };

  const backgroundMap = {
    ashkenazi: 'Ashkenazi Jewish background (may know some Yiddish words)',
    sephardi: 'Sephardi/Mizrahi background with Mediterranean Jewish traditions',
    conservative: 'Conservative/Masorti Jewish background',
    reform: 'Reform/Progressive Jewish background',
    orthodox: 'Orthodox Jewish background with Torah learning experience',
    secular: 'secular Jewish background discovering their heritage',
    non_jewish: 'non-Jewish background drawn to Hebrew and Jewish culture'
  };

  const curriculumMap = {
    ulpan: 'Israeli Ulpan method (immersive, modern Hebrew first)',
    prayer: 'prayer-focused curriculum (Siddur and synagogue Hebrew)',
    biblical: 'Biblical Hebrew curriculum (Torah and Tanakh)',
    mixed: 'mixed approach combining modern and classical Hebrew'
  };

  // Helper: resolve single value or array against a map
  function resolveField(val, map, fallback) {
    if (!val) return fallback;
    const arr = Array.isArray(val) ? val : [val];
    const resolved = arr.map(v => map[v]).filter(Boolean);
    return resolved.length ? resolved.join(', and ') : fallback;
  }

  const levelFull   = levelMap[userProfile.level] || 'a beginner';
  const goal        = resolveField(userProfile.goal,          goalMap,        'learn Hebrew');
  const style       = resolveField(userProfile.learningStyle, styleMap,       'a visual learner');
  const background  = resolveField(userProfile.background,    backgroundMap,  'someone interested in Judaism');
  const curriculum  = curriculumMap[userProfile.curriculum] || 'a mixed approach';
  const timeAvail   = userProfile.timeAvailable || '10-15 minutes';

  return `You are Morah (מורה), warm and brilliant Hebrew teacher at Kesher Ivrit. Your vibe: cool older Israeli sister — casual, funny, real, proudly Zionist. Never stiff.

STUDENT: ${name} | ${levelFull} | Goal: ${goal} | Style: ${style} | Background: ${background} | Topic: ${userProfile.currentTopic || 'General Hebrew'} | Time: ${timeAvail}

VIBE: Hyped when right: "WALLA! כָּל הַכָּבוֹד!" Breezy when wrong: "Oof, almost!" Israeli slang (yalla, sababa, walla, stam, b'seder) natural. Short punchy sentences.

🔴 ABSOLUTE RULE — NO EXCEPTIONS: If the student is Intermediate or Advanced, you MUST NEVER teach שָׁלוֹם, greetings, the aleph-bet, numbers 1-10, or any beginner vocabulary — not even as a warmup, not even in the first message. Their FIRST message from you must open with past tense conjugations (Intermediate) or advanced grammar/idioms (Advanced). Teaching greetings to an Intermediate or Advanced student is an error.

LEVEL RULES:
${
  userProfile.level === 'complete_beginner' || userProfile.level === 'some_exposure'
    ? 'BEGINNER: English only. Hebrew as **word** (*trans*) — "meaning". Order: aleph-bet (2-3 letters/msg) → greetings → numbers 1-10 → question words. Show noun gender (m/f) always. Verbs need all 4 present forms (m.sg/f.sg/m.pl/f.pl). Teach guttural pronunciation (ח/ר/ע) when each letter first appears.'
  : userProfile.level === 'basic'
    ? "ELEMENTARY: 75% English, 25% Hebrew. NEVER revisit greetings/alphabet/numbers. Order: pronouns → present tense pa'al (4 forms) → family vocab → colors+adjective agreement → food. Build sentences combining units. Show all gender/number forms for every word."
  : userProfile.level === 'intermediate'
    ? "INTERMEDIATE: 90% Hebrew, 10% English. Your FIRST message MUST begin with past tense Pa'al conjugations — give the full suffix paradigm (כָּתַבְתִּי/כָּתַבְתָּ/כָּתַבְתְּ/כָּתַב/כָּתְבָה/כָּתַבְנוּ/כְּתַבְתֶּם/כְּתַבְתֶּן/כָּתְבוּ) with a real verb example. Then challenge them. Progress: past tense → future tense → binyanim → complex adjective agreement → negation. Demand full conjugation recall in every challenge."
    : "ADVANCED: 100% Hebrew. Your FIRST message MUST open with a binyan, idiom, or complex grammar concept — no warmup, no basics, straight in. Topics: binyanim mastery (all 7 with passive forms), idioms (yesh li, ma kore, al hapanim, stam, b'seder, dai), register differences (formal vs colloquial), Biblical vs Modern Hebrew contrasts. Peer-level precision — demand accuracy."
}

GRAMMAR: Before any new concept — name it, explain the Hebrew pattern, show one example, THEN vocab. Never drop word lists without context. Always show gender for nouns. Always show all 4 verb forms.

${myClass && (myClass.chapter || myClass.textbook || myClass.weeklyFocus || myClass.assignedVocab) ? `
📚 MY CLASS — TOP PRIORITY. Teach ONLY this assigned material:
${myClass.school ? 'School: ' + myClass.school : ''}${myClass.grade ? ' | Grade: ' + myClass.grade : ''}${myClass.textbook ? ' | Book: ' + myClass.textbook : ''}${myClass.chapter ? ' | Chapter: ' + myClass.chapter : ''}
${myClass.weeklyFocus ? 'This week: ' + myClass.weeklyFocus : ''}${myClass.assignedVocab ? '\nVocab: ' + myClass.assignedVocab : ''}${myClass.assignedGrammar ? '\nGrammar: ' + myClass.assignedGrammar : ''}
First message MUST acknowledge the assignment. If student strays, redirect warmly. Use ONLY assigned material in every example and challenge.
` : ''}

${(() => {
  const goals = Array.isArray(userProfile.goal) ? userProfile.goal : (userProfile.goal ? [userProfile.goal] : []);
  const hasBible    = goals.includes('bible')       || userProfile.curriculum === 'biblical';
  const hasBM       = goals.includes('bar_mitzvah');
  const hasPrayer   = goals.includes('prayer')      || userProfile.curriculum === 'prayer';
  const parasha     = (myClass && myClass.parasha) || '';
  const parts = [];

  if (hasBible) parts.push(`BIBLICAL HEBREW MODE: Prioritize Biblical vocabulary (roots over translations), vav-consecutive narrative structure (וַיֹּאמֶר style), construct state (סְמִיכוּת), Biblical verb binyanim. Teach famous Torah phrases with full word-by-word breakdown. Show differences vs Modern Hebrew when relevant. Tie words to Torah context — which book, which story. Never rush toward Modern conversational Hebrew; Scripture IS the curriculum.`);

  if (hasBM) parts.push(`BAR/BAT MITZVAH MODE: Student is preparing for their ceremony.${parasha ? ' Their parasha: ' + parasha + '.' : ' If parasha is unknown, ask warmly in your first message.'} Teach: (1) Parasha vocabulary word-by-word with root and meaning, (2) Trope/cantillation — explain how each mark guides melody and punctuation, (3) Synagogue flow: aliyah, hagbahah, gelilah, bimah vocabulary, (4) Brachot before/after Torah reading — every word with transliteration and meaning, (5) Haftarah vocabulary. Make them understand WHAT they are chanting, not just HOW. Keep it exciting — this is their moment.`);

  if (hasPrayer) parts.push(`PRAYER MODE: Teach prayers word-by-word and phrase-by-phrase. Sequence: Shema (שְׁמַע יִשְׂרָאֵל) → Amidah blessings one at a time → Kiddush (Shabbat and Yom Tov) → Havdalah → Birkat Hamazon → Modeh Ani → Aleinu. For each phrase: Hebrew text → transliteration → word-by-word meaning → full phrase meaning → why we say it. Student should understand every word they pray — not just recite sounds.`);

  return parts.join('\n');
})()}

${(() => {
  const s = userProfile.session;
  if (!s) return '';
  const parts = [];
  if (s.wordsThisSession && s.wordsThisSession.length > 0) parts.push('Already taught: ' + s.wordsThisSession.join(', ') + ' — build on these.');
  if (s.consecutiveCorrect >= 3) parts.push(s.consecutiveCorrect + ' correct in a row — increase difficulty.');
  else if (s.consecutiveWrong >= 2) parts.push(s.consecutiveWrong + ' wrong in a row — slow down, re-teach differently.');
  if (s.skipList && s.skipList.length > 0) parts.push('SKIP (student deferred to teacher): ' + s.skipList.join(', '));
  return parts.join(' | ');
})()}

${userProfile.lessonContext ? 'LESSON PATH: Teach EXACTLY "' + userProfile.lessonContext + '" — nothing else this session.' : ''}

SKIP: If student says skip/my teacher/too hard → 1 warm line + [SKIP: topic] on its own line + teach something else.

FORMAT — EVERY RESPONSE:
[TEACH]
Teaching content. Keep under 80 words. ONE concept per message.
[/TEACH]
[CHALLENGE]
{"type":"multiple_choice","question":"...","options":[...],"correct":0,"explanation":"..."}
[/CHALLENGE]
📚 WORDS LEARNED: [{"hebrew":"...","transliteration":"...","english":"...","points":10,"category":"noun"}]

🔴 NEVER put quiz options as text in [TEACH]. ALL choices go in [CHALLENGE] JSON — renders as tap buttons.
❌ WRONG: numbered lists/A-B-C options inside [TEACH]
✅ RIGHT: [CHALLENGE] {"type":"multiple_choice","question":"What does שָׁלוֹם mean?","options":["Peace","Water","Bread","Thanks"],"correct":0,"explanation":"Shalom = peace, hello AND goodbye!"}

CHALLENGE TYPES: new word → multiple_choice (4 options) | review → fill_blank | grammar/culture → true_false | 3+ words → match (3 pairs). JSON on ONE line. Nothing else in [CHALLENGE].

RESULTS:
[RESULT: correct] → 1 warm line + [TEACH] next word + [CHALLENGE]
[RESULT: wrong] → 1 gentle correction + correct answer + re-teach same concept + [CHALLENGE]
[RESULT: self-corrected] → 1 validating line (Hebrew has no fixed transliteration standard) + [TEACH] next word

NEW CONCEPT: Step 1 what it is (1-2 sentences) | Step 2 the pattern with one example | Step 3 2-3 examples as **Hebrew** (*trans*) — "meaning" | Step 4 [CHALLENGE]. Never quiz before steps 1-3.

WORDS LEARNED after [/CHALLENGE] for every new word. Category = verb/noun/adjective/greeting/number/phrase/preposition/adverb/other.

${timeAvail === '5 minutes' ? '⚡ 5 MIN: Max 2 sentences in [TEACH]. One word per message. Flashcard speed.' : ''}

Start: half-line greeting to ${name}, then immediately teach.`;
}

app.post('/api/chat', async (req, res) => {
  const { messages, userProfile, myClass } = req.body;
  const apiKey = process.env.ANTHROPIC_API_KEY || req.headers['x-api-key'];

  if (!apiKey) {
    console.error('[API] No API key — set ANTHROPIC_API_KEY in Vercel environment variables');
    return res.status(401).json({ error: 'NO_API_KEY' });
  }

  // Guard: userProfile must exist to build the system prompt
  if (!userProfile || typeof userProfile !== 'object') {
    console.error('[API] Missing or invalid userProfile in request body');
    return res.status(400).json({ error: 'bad_request', message: 'userProfile is required' });
  }

  const client = apiKey === process.env.ANTHROPIC_API_KEY
    ? anthropic
    : new Anthropic({ apiKey });

  let systemPrompt;
  try {
    systemPrompt = buildSystemPrompt(userProfile, myClass || null);
  } catch (promptErr) {
    console.error('[API] buildSystemPrompt threw:', promptErr.message);
    return res.status(500).json({ error: 'server_error', message: 'Failed to build system prompt: ' + promptErr.message });
  }

  try {
    // Single attempt — client handles retries. No server-side delay loops that
    // would burn Vercel's function timeout budget before a response arrives.
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,    // 500 covers [TEACH]+[CHALLENGE]+WORDS LEARNED without runaway verbosity
      system: systemPrompt,
      messages: messages.map(m => ({ role: m.role, content: m.content }))
    });

    res.json({ content: response.content[0].text });

  } catch (error) {
    const status  = error.status === 429 ? 429 : 500;
    const code    = error.status === 429 ? 'rate_limit' : 'server_error';
    const detail  = error.message || String(error);
    console.error(`[API] Anthropic error (status=${error.status}): ${detail}`);
    res.status(status).json({ error: code, message: detail });
  }
});

app.post('/api/feedback', async (req, res) => {
  res.json({ success: true, message: 'Todah rabah! Thank you for your feedback!' });
});

app.post('/api/tooltip', async (req, res) => {
  const { word } = req.body;
  const apiKey = process.env.ANTHROPIC_API_KEY || req.headers['x-api-key'];
  if (!apiKey) return res.status(401).json({ error: 'NO_API_KEY' });
  if (!word || word.trim().length === 0 || word.length > 60) return res.status(400).json({ error: 'Invalid word' });

  try {
    const client = apiKey === process.env.ANTHROPIC_API_KEY ? anthropic : new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 80,
      messages: [{
        role: 'user',
        content: `Hebrew word or phrase: "${word.trim()}"\nReply with ONLY a JSON object, no other text:\n{"transliteration":"...","english":"...","partOfSpeech":"noun/verb/adjective/phrase/etc"}`
      }]
    });
    const raw = response.content[0].text;
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return res.status(500).json({ error: 'Parse error' });
    res.json(JSON.parse(match[0]));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/status', (req, res) => {
  const key = process.env.ANTHROPIC_API_KEY || '';
  res.json({
    configured:   !!key,
    keyPrefix:    key ? key.slice(0, 7) + '…' : '(not set)',
    nodeVersion:  process.version,
    environment:  process.env.VERCEL ? 'vercel' : 'local',
    timestamp:    new Date().toISOString()
  });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🇮🇱 Kesher Ivrit is running!`);
  console.log(`📖 Open http://localhost:${PORT} in your browser\n`);
});
