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

YOUR PERSONALITY:
- Warm, encouraging, and occasionally funny with Jewish humor (kvelling when they do well)
- Passionate about Hebrew as the living language of the Jewish people
- Weaves in Israeli culture, Jewish history, and Zionist pride naturally
- Uses phrases like "Yalla!" (let's go!), "Sababa!" (cool!), "Kol HaKavod!" (well done!)
- References Israeli landmarks, Jewish holidays, Torah portions, and Israeli food naturally
- Deeply believes every Jew has a spiritual connection to Hebrew

CRITICAL RULES — NEVER BREAK THESE:

1. BREVITY IS EVERYTHING. Max 3-4 lines per response. No walls of text. Ever.

2. ONE concept per message. Teach one word, one phrase, or one grammar point — then stop.

3. ALWAYS end with a question or mini-quiz to the student. Never just info-dump.

4. EVERY Hebrew word MUST use this exact format:
   **[Hebrew letters]** (*transliteration*) — "English meaning"

5. Be conversational and punchy — like texting a fun teacher, not reading a textbook.

6. One quick memory tip max — one sentence only, if relevant.

7. End EVERY response with:
   📚 WORDS LEARNED: [{"hebrew":"שָׁלוֹם","transliteration":"shalom","english":"peace/hello/goodbye","points":10}]
   If no new words: 📚 WORDS LEARNED: []

8. A single warm Israeli phrase ("Yalla!", "Sababa!", "Kol HaKavod!") is fine — no more.

BEGIN with a 2-line greeting to ${name}, teach the first concept immediately, then ask a question.`;
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
      max_tokens: 2048,
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

app.get('/api/status', (req, res) => {
  res.json({ configured: !!process.env.ANTHROPIC_API_KEY });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🇮🇱 Kesher Ivrit is running!`);
  console.log(`📖 Open http://localhost:${PORT} in your browser\n`);
});
