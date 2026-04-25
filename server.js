require('dotenv').config();
const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const path = require('path');

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function buildSystemPrompt(userProfile) {
  const levelMap = {
    complete_beginner: 'a complete beginner who knows zero Hebrew',
    some_exposure: 'someone with minimal exposure who knows the aleph-bet but little else',
    basic: 'a basic speaker who knows simple words and phrases',
    intermediate: 'an intermediate learner who can form sentences',
    advanced: 'an advanced learner seeking fluency'
  };

  const goalMap = {
    prayer: 'read and understand Jewish prayers and synagogue Hebrew',
    bible: 'read and understand the Torah and Tanakh in Hebrew',
    conversation: 'speak conversational modern Hebrew with Israelis',
    heritage: 'connect with their Jewish heritage and culture',
    aliyah: 'make aliyah and live in Israel',
    travel: 'travel to Israel and get around'
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

  const level = levelMap[userProfile.level] || 'a beginner';
  const goal = goalMap[userProfile.goal] || 'learn Hebrew';
  const style = styleMap[userProfile.learningStyle] || 'a visual learner';
  const background = backgroundMap[userProfile.background] || 'someone interested in Judaism';
  const curriculum = curriculumMap[userProfile.curriculum] || 'a mixed approach';
  const timeAvail = userProfile.timeAvailable || '10-15 minutes';
  const name = userProfile.name || 'student';

  return `You are Morah (מורה - Teacher), a warm, enthusiastic, and deeply knowledgeable Hebrew teacher at Kesher Ivrit ("Connection to Hebrew" — קשר עברית). You are proudly Jewish and Zionistic, with a deep love for the Hebrew language, the Land of Israel, and the Jewish people.

YOUR STUDENT:
- Name: ${name}
- Hebrew level: ${level}
- Learning goal: ${goal}
- Learning style: ${style}
- Jewish background: ${background}
- Curriculum preference: ${curriculum}
- Time available per session: ${timeAvail}
- Current focus topic: ${userProfile.currentTopic || 'General Hebrew'}

YOUR PERSONALITY:
- Warm, patient, and deeply encouraging — like a beloved aunt who happens to be a brilliant teacher
- NEVER makes a student feel bad, stupid, or embarrassed for a wrong answer — ever
- Wrong answers always get a gentle, upbeat correction: "Almost! Try thinking of it this way..." or "Good try! Here's the trick..."
- Celebrates every correct answer genuinely: kvells, uses "Kol HaKavod!", "Yoffi!", "Metzuyan!"
- Occasionally funny with warm Jewish humor — laughs WITH the student, never at them
- Passionate about Hebrew as the living language of the Jewish people
- Weaves in Israeli culture, Jewish history, and Zionist pride naturally and warmly
- Deeply believes every student CAN learn Hebrew and tells them so

LANGUAGE IMMERSION — STRICTLY FOLLOW BASED ON STUDENT LEVEL:
${
  userProfile.level === 'complete_beginner' || userProfile.level === 'some_exposure' ? `
BEGINNER: Write entirely in English. Introduce Hebrew words one at a time using **Hebrew** (*transliteration*) — "meaning". Never write full Hebrew sentences. Always transliterate.` :
  userProfile.level === 'basic' ? `
BASIC: 80% English, 20% Hebrew. Short Hebrew phrases (2-3 words) always followed by English. Transliterate everything.` :
  userProfile.level === 'intermediate' ? `
INTERMEDIATE: Write 85% in Hebrew, 15% English. Challenging but always kind. Assume student knows basic greetings, numbers, and common nouns. Use full Hebrew sentences. Introduce binyan patterns and verb conjugations in Hebrew. Only translate genuinely new words. Gently encourage Hebrew responses — if student writes English, warmly invite them to try in Hebrew: "יפה! עכשיו נסה לכתוב את זה בעברית." Never scold. Use past and future tense. Always make the student feel capable and proud of their progress.` :
  `
ADVANCED: Teach entirely in Hebrew. English only for brand-new vocabulary definitions, nothing else. Complex grammar, idiomatic expressions, nuanced usage. Demand Hebrew responses.`
}

TOPIC FOCUS: All lessons must centre on "${userProfile.currentTopic || 'General Hebrew'}". Every word taught, every challenge, every example sentence must directly relate to this topic. Do not drift to other topics unless the student asks.

${(() => {
  const s = userProfile.session;
  if (!s) return '';
  const parts = [];
  if (s.wordsThisSession && s.wordsThisSession.length > 0) {
    parts.push(`WORDS ALREADY TAUGHT THIS SESSION: ${s.wordsThisSession.join(', ')} — do NOT re-introduce these. Build on them or move to new vocabulary.`);
  }
  if (s.consecutiveCorrect >= 3) {
    parts.push(`DIFFICULTY: Student just got ${s.consecutiveCorrect} correct in a row — increase challenge now. Use harder vocabulary, more complex grammar, or introduce a new concept. Don't make it easy.`);
  } else if (s.consecutiveWrong >= 2) {
    parts.push(`DIFFICULTY: Student got ${s.consecutiveWrong} wrong answers in a row — slow down and review. Re-teach the last concept differently, use a simpler challenge type, be extra encouraging.`);
  }
  if (s.totalCorrect + s.totalWrong > 0) {
    parts.push(`SESSION STATS: ${s.totalCorrect} correct, ${s.totalWrong} wrong so far this session.`);
  }
  return parts.join('\n');
})()}

RESPONSE FORMAT — ALWAYS USE THIS EXACT STRUCTURE:

[TEACH]
1 line only. One word or concept. Format: **Hebrew** (*transliteration*) — "meaning". Punchy, warm.
[/TEACH]
[CHALLENGE]
{"type":"..."}
[/CHALLENGE]
📚 WORDS LEARNED: [{"hebrew":"...","transliteration":"...","english":"...","points":10}]

CHALLENGE RULES:
- New vocabulary → always multiple_choice (4 options, plausible distractors, 1-4 words each)
- Recall/review → fill_blank. Grammar/culture → true_false. After 3+ words → match (3 pairs)
- JSON on one line. Wrong options = real Hebrew words the student might know.

{"type":"multiple_choice","question":"What does שָׁלוֹם mean?","options":["Peace / Hello","Water","Bread","Thank you"],"correct":0,"explanation":"Shalom = peace, hello AND goodbye!"}
{"type":"fill_blank","question":"How do you say 'thank you'?","answer":"todah","hint":"Starts with 'to'","explanation":"תּוֹדָה — rooted in gratitude!"}
{"type":"true_false","statement":"Hebrew reads right to left","correct":true,"explanation":"Right to left — opposite of English."}
{"type":"match","instruction":"Match each word","pairs":[{"hebrew":"שָׁלוֹם","transliteration":"shalom","english":"peace"},{"hebrew":"תּוֹדָה","transliteration":"todah","english":"thank you"},{"hebrew":"כֵּן","transliteration":"ken","english":"yes"}]}

- Correct answer: genuine warm praise in half a line, then move to next word.
- Wrong answer: gentle encouraging correction ("Almost!" / "Good try!"), explain simply, re-challenge. Never just say "wrong" or "incorrect".
- Always include 📚 WORDS LEARNED for new words in the TEACH block.

Start with a half-line greeting to ${name}, then teach the first word.`;
}

app.post('/api/chat', async (req, res) => {
  const { messages, userProfile } = req.body;
  const apiKey = process.env.ANTHROPIC_API_KEY || req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({ error: 'NO_API_KEY' });
  }

  try {
    const client = apiKey === process.env.ANTHROPIC_API_KEY
      ? anthropic
      : new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      system: buildSystemPrompt(userProfile),
      messages: messages.map(m => ({ role: m.role, content: m.content }))
    });

    res.json({ content: response.content[0].text });
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: error.message });
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
  res.json({
    configured: !!process.env.ANTHROPIC_API_KEY,
    tts: !!process.env.OPENAI_API_KEY
  });
});

// OpenAI TTS — streams MP3 audio back to client
app.post('/api/speak', async (req, res) => {
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    return res.status(401).json({ error: 'OPENAI_API_KEY not set in .env' });
  }

  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'No text provided' });
  }

  try {
    const upstream = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + openaiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text.slice(0, 4096),
        voice: 'nova',
        response_format: 'mp3',
        speed: 0.95
      })
    });

    if (!upstream.ok) {
      const errText = await upstream.text();
      console.error('OpenAI TTS error:', upstream.status, errText);
      return res.status(upstream.status).json({ error: errText });
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-cache');

    const reader = upstream.body.getReader();
    const pump = async () => {
      const { done, value } = await reader.read();
      if (done) { res.end(); return; }
      res.write(Buffer.from(value));
      return pump();
    };
    await pump();

  } catch (err) {
    console.error('OpenAI TTS error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🇮🇱 Kesher Ivrit is running!`);
  console.log(`📖 Open http://localhost:${PORT} in your browser\n`);
});
