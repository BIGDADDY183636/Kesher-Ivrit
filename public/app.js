/* ═══════════════════════════════════════════════════════════
   KESHER IVRIT — Frontend App
   קשר עברית
═══════════════════════════════════════════════════════════ */

// ─── STATE ───────────────────────────────────────────────
let state = {
  userProfile: null,
  messages: [],        // [{role, content}]
  progress: {
    points: 0,
    wordsLearned: [],  // [{hebrew, transliteration, english, points}]
    streak: 0,
    lastLessonDate: null,
    lessonsCompleted: 0,
    feedbackGiven: 0
  },
  currentQuizStep: 0,
  quizAnswers: {},
  feedbackRating: 0
};

// ─── QUIZ QUESTIONS ───────────────────────────────────────
const QUIZ_QUESTIONS = [
  {
    id: 'name',
    icon: '👋',
    title: 'What\'s your name?',
    subtitle: 'So Morah can greet you properly!',
    type: 'text',
    placeholder: 'Your name...'
  },
  {
    id: 'level',
    icon: '📊',
    title: 'What\'s your Hebrew level?',
    subtitle: 'Be honest — there\'s no wrong answer!',
    type: 'choice',
    options: [
      { value: 'complete_beginner', icon: '🌱', text: 'Complete Beginner', sub: 'I don\'t know the alphabet yet' },
      { value: 'some_exposure',     icon: '🌿', text: 'Some Exposure',     sub: 'I know the aleph-bet, a few words' },
      { value: 'basic',             icon: '🌳', text: 'Basic',             sub: 'I can read and know simple phrases' },
      { value: 'intermediate',      icon: '⭐', text: 'Intermediate',      sub: 'I can form sentences and hold simple conversations' },
      { value: 'advanced',          icon: '🔥', text: 'Advanced',          sub: 'I want to reach near-fluency' }
    ]
  },
  {
    id: 'goal',
    icon: '🎯',
    title: 'What\'s your main goal?',
    subtitle: 'This shapes your entire curriculum',
    type: 'choice',
    options: [
      { value: 'prayer',       icon: '🕍', text: 'Prayer & Synagogue',    sub: 'Understand the Siddur and davening' },
      { value: 'bible',        icon: '📜', text: 'Torah & Tanakh',         sub: 'Read the Bible in the original Hebrew' },
      { value: 'conversation', icon: '💬', text: 'Modern Conversation',    sub: 'Speak with Israelis like a sabra' },
      { value: 'heritage',     icon: '🕎', text: 'Jewish Heritage',        sub: 'Connect with my Jewish roots and culture' },
      { value: 'aliyah',       icon: '✈️', text: 'Making Aliyah',          sub: 'Moving to Israel and need to survive' },
      { value: 'travel',       icon: '🏖️', text: 'Traveling to Israel',    sub: 'Get around and enjoy the country' }
    ]
  },
  {
    id: 'learningStyle',
    icon: '🧠',
    title: 'How do you learn best?',
    subtitle: 'Morah will adapt the lessons to your style',
    type: 'choice',
    options: [
      { value: 'visual',      icon: '👁️', text: 'Visual',     sub: 'I love seeing words, charts, and colors' },
      { value: 'stories',     icon: '📚', text: 'Stories',    sub: 'I absorb information through narratives' },
      { value: 'games',       icon: '🎮', text: 'Games',      sub: 'Make it fun with challenges and points' },
      { value: 'structured',  icon: '📋', text: 'Structured', sub: 'Give me grammar rules and clear progression' },
      { value: 'audio',       icon: '🎧', text: 'Audio',      sub: 'I learn by hearing and repeating aloud' }
    ]
  },
  {
    id: 'background',
    icon: '🕎',
    title: 'What\'s your Jewish background?',
    subtitle: 'Helps Morah make cultural connections',
    type: 'choice',
    options: [
      { value: 'orthodox',    icon: '🕌', text: 'Orthodox',         sub: 'Torah observant, yeshiva/day school background' },
      { value: 'conservative', icon: '🕍', text: 'Conservative',   sub: 'Masorti, traditional-but-not-Orthodox' },
      { value: 'reform',      icon: '✡️', text: 'Reform/Progressive', sub: 'Liberal Jewish movement' },
      { value: 'ashkenazi',   icon: '🥐', text: 'Ashkenazi',        sub: 'Eastern European Jewish heritage' },
      { value: 'sephardi',    icon: '🫒', text: 'Sephardi/Mizrahi', sub: 'Middle Eastern or Mediterranean roots' },
      { value: 'secular',     icon: '🌟', text: 'Secular Jewish',   sub: 'Jewish identity without religious practice' },
      { value: 'non_jewish',  icon: '🌎', text: 'Non-Jewish',       sub: 'Interested in Hebrew and Jewish culture' }
    ]
  },
  {
    id: 'curriculum',
    icon: '📚',
    title: 'Which curriculum style?',
    subtitle: 'How should Morah structure your lessons?',
    type: 'choice',
    options: [
      { value: 'ulpan',    icon: '🇮🇱', text: 'Ulpan / Modern Hebrew',   sub: 'Israeli immersion method — modern first' },
      { value: 'prayer',   icon: '📖', text: 'Prayer-Focused',           sub: 'Siddur, blessings, synagogue Hebrew' },
      { value: 'biblical', icon: '📜', text: 'Biblical / Classical',     sub: 'Torah, Tanakh, ancient Hebrew texts' },
      { value: 'mixed',    icon: '🔀', text: 'Mixed / Surprise Me',      sub: 'A blend of modern and classical Hebrew' }
    ]
  },
  {
    id: 'timeAvailable',
    icon: '⏱️',
    title: 'How much time per day?',
    subtitle: 'Even 5 minutes a day makes a difference!',
    type: 'choice',
    options: [
      { value: '5 minutes',      icon: '⚡', text: '5 Minutes',      sub: 'Quick daily vocabulary flash' },
      { value: '10-15 minutes',  icon: '🌙', text: '10-15 Minutes',  sub: 'A focused mini-lesson' },
      { value: '20-30 minutes',  icon: '📚', text: '20-30 Minutes',  sub: 'Full lesson with practice' },
      { value: '45-60 minutes',  icon: '🔥', text: '45-60 Minutes',  sub: 'Intensive deep dive' },
      { value: 'as long as I feel like', icon: '♾️', text: 'Open-Ended', sub: 'No limits — I\'m committed!' }
    ]
  }
];

// ─── INIT ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  loadProgress();
  checkReturningUser();
  await checkApiKey();
});

function loadProgress() {
  try {
    const saved = localStorage.getItem('kesher_progress');
    if (saved) {
      const parsed = JSON.parse(saved);
      state.progress = { ...state.progress, ...parsed };
    }
    const profile = localStorage.getItem('kesher_profile');
    if (profile) {
      state.userProfile = JSON.parse(profile);
    }
    const msgs = localStorage.getItem('kesher_messages');
    if (msgs) {
      state.messages = JSON.parse(msgs);
    }
  } catch (e) {
    console.warn('Could not load saved progress:', e);
  }
}

function saveProgress() {
  try {
    localStorage.setItem('kesher_progress', JSON.stringify(state.progress));
    if (state.userProfile) {
      localStorage.setItem('kesher_profile', JSON.stringify(state.userProfile));
    }
    if (state.messages.length) {
      // Only save last 30 messages to avoid bloat
      const recent = state.messages.slice(-30);
      localStorage.setItem('kesher_messages', JSON.stringify(recent));
    }
  } catch (e) {
    console.warn('Could not save progress:', e);
  }
}

function checkReturningUser() {
  if (state.userProfile && state.userProfile.name) {
    document.getElementById('returning-user-section').style.display = 'block';
    document.getElementById('returning-name').textContent = state.userProfile.name;
    document.getElementById('home-streak').textContent = state.progress.streak;
    checkStreak();
  }
}

function checkStreak() {
  const today = new Date().toDateString();
  const last = state.progress.lastLessonDate;
  if (!last) return;

  const lastDate = new Date(last);
  const todayDate = new Date(today);
  const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));

  if (diffDays > 1) {
    const days = diffDays;
    const shameMessages = [
      `${days} days without Hebrew?! Your ancestors crossed the desert for this?`,
      `Oy gevalt! ${days} days gone! Even Pharaoh studied for his job interviews!`,
      `Shanda! ${days} missed days! The Maccabees didn't give up — neither should you!`,
      `${days} days! You've been absent longer than the Jews in the desert... okay, not quite.`,
      `Kvetch all you want, but those ${days} missed days won't bring back your streak! Let's go!`
    ];
    const msg = shameMessages[Math.floor(Math.random() * shameMessages.length)];
    state.progress.streak = 0;
    showStreakModal(
      '😱',
      'Oy Vey!',
      msg
    );
    saveProgress();
  }
}

// ─── NAVIGATION ───────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.remove('active');
    s.style.display = 'none';
  });
  const el = document.getElementById(id);
  el.style.display = id === 'screen-lesson' ? 'flex' : 'flex';
  el.classList.add('active');
  el.style.flexDirection = id === 'screen-lesson' ? 'row' : 'column';
}

function startOnboarding() {
  state.currentQuizStep = 0;
  state.quizAnswers = {};
  showScreen('screen-quiz');
  renderQuizStep();
}

function goHome() {
  showScreen('screen-home');
  checkReturningUser();
}

function continueLearning() {
  if (!state.userProfile) return;
  showScreen('screen-lesson');
  setupLessonScreen();
  if (state.messages.length === 0) {
    startLesson();
  } else {
    renderAllMessages();
  }
}

function resetProgress() {
  if (!confirm('Are you sure? This will clear all your progress, words learned, and streak. Chaval! (What a pity!)')) return;
  localStorage.removeItem('kesher_progress');
  localStorage.removeItem('kesher_profile');
  localStorage.removeItem('kesher_messages');
  state = {
    userProfile: null,
    messages: [],
    progress: { points: 0, wordsLearned: [], streak: 0, lastLessonDate: null, lessonsCompleted: 0, feedbackGiven: 0 },
    currentQuizStep: 0,
    quizAnswers: {},
    feedbackRating: 0
  };
  document.getElementById('returning-user-section').style.display = 'none';
  showToast('Progress cleared. Time for a fresh start! חָדָשׁ!');
}

// ─── QUIZ ─────────────────────────────────────────────────
function renderQuizStep() {
  const q = QUIZ_QUESTIONS[state.currentQuizStep];
  const total = QUIZ_QUESTIONS.length;
  const pct = (state.currentQuizStep / total) * 100;

  document.getElementById('quiz-progress-fill').style.width = pct + '%';
  document.getElementById('quiz-step-label').textContent = `Step ${state.currentQuizStep + 1} of ${total}`;

  const isLast = state.currentQuizStep === total - 1;
  document.getElementById('btn-quiz-next').textContent = isLast ? 'Start Learning! 🇮🇱' : 'Next →';
  document.getElementById('btn-quiz-back').style.display = state.currentQuizStep > 0 ? 'inline-block' : 'none';

  let html = `<div class="quiz-question-wrap">
    <div class="quiz-q-number">Question ${state.currentQuizStep + 1}</div>
    <div class="quiz-q-icon">${q.icon}</div>
    <div class="quiz-q-text">${q.title}</div>
    <div class="quiz-q-sub">${q.subtitle}</div>`;

  if (q.type === 'text') {
    const val = state.quizAnswers[q.id] || '';
    html += `<input type="text" class="quiz-name-input" id="quiz-text-input"
      placeholder="${q.placeholder}" value="${escapeHtml(val)}"
      onkeydown="if(event.key==='Enter') quizNext()" />`;
  } else if (q.type === 'choice') {
    html += `<div class="quiz-options">`;
    for (const opt of q.options) {
      const selected = state.quizAnswers[q.id] === opt.value ? 'selected' : '';
      html += `<div class="quiz-option ${selected}" onclick="selectOption('${q.id}','${opt.value}',this)">
        <span class="quiz-option-icon">${opt.icon}</span>
        <div>
          <div class="quiz-option-text">${opt.text}</div>
          <div class="quiz-option-sub">${opt.sub}</div>
        </div>
      </div>`;
    }
    html += `</div>`;
  }

  html += `</div>`;
  document.getElementById('quiz-content').innerHTML = html;

  if (q.type === 'text') {
    document.getElementById('quiz-text-input').focus();
  }
}

function selectOption(questionId, value, el) {
  state.quizAnswers[questionId] = value;
  el.closest('.quiz-options').querySelectorAll('.quiz-option').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
}

function quizNext() {
  const q = QUIZ_QUESTIONS[state.currentQuizStep];

  // Validate
  if (q.type === 'text') {
    const val = document.getElementById('quiz-text-input').value.trim();
    if (!val) { showToast('Please enter your name!'); return; }
    state.quizAnswers[q.id] = val;
  } else if (q.type === 'choice') {
    if (!state.quizAnswers[q.id]) { showToast('Please pick an option!'); return; }
  }

  if (state.currentQuizStep < QUIZ_QUESTIONS.length - 1) {
    state.currentQuizStep++;
    renderQuizStep();
  } else {
    finishQuiz();
  }
}

function quizBack() {
  if (state.currentQuizStep > 0) {
    state.currentQuizStep--;
    renderQuizStep();
  }
}

function finishQuiz() {
  state.userProfile = { ...state.quizAnswers };
  saveProgress();
  showToast(`Shalom, ${state.userProfile.name}! Let's learn! 🇮🇱`);
  showScreen('screen-lesson');
  setupLessonScreen();
  startLesson();
}

// ─── LESSON / CHAT ────────────────────────────────────────
function setupLessonScreen() {
  if (!state.userProfile) return;
  initScrollWatcher();
  initTooltips();

  const avatarMap = {
    complete_beginner: '🌱', some_exposure: '🌿', basic: '🌳',
    intermediate: '⭐', advanced: '🔥'
  };
  const levelNames = {
    complete_beginner: 'Complete Beginner', some_exposure: 'Some Exposure',
    basic: 'Basic', intermediate: 'Intermediate', advanced: 'Advanced'
  };

  document.getElementById('student-name-display').textContent = state.userProfile.name || 'Student';
  document.getElementById('student-avatar').textContent = avatarMap[state.userProfile.level] || '👤';
  document.getElementById('student-level-display').textContent = levelNames[state.userProfile.level] || 'Learner';

  updateStats();
  renderWordsList();
}

function updateStats() {
  document.getElementById('streak-count').textContent = state.progress.streak;
  document.getElementById('words-count').textContent = state.progress.wordsLearned.length;
  document.getElementById('points-count').textContent = state.progress.points;
  document.getElementById('lessons-count').textContent = state.progress.lessonsCompleted;
}

function renderWordsList() {
  const container = document.getElementById('words-list');
  if (!state.progress.wordsLearned.length) {
    container.innerHTML = '<p class="empty-words">Start your first lesson to begin collecting Hebrew words!</p>';
    return;
  }
  const recent = [...state.progress.wordsLearned].reverse().slice(0, 25);
  container.innerHTML = recent.map(w => `
    <div class="word-chip" title="${escapeHtml(w.english)}">
      <span class="word-chip-heb">${escapeHtml(w.hebrew)}</span>
      <span class="word-chip-info">${escapeHtml(w.transliteration)} — ${escapeHtml(w.english)}</span>
    </div>
  `).join('');
}

async function startLesson() {
  state.messages = [];
  document.getElementById('chat-messages').innerHTML = '';
  setMorahStatus('Starting your lesson... 📖');
  await sendToMorah([{ role: 'user', content: 'Please start our lesson! Greet me and let\'s begin.' }]);
}

function newLesson() {
  if (!confirm('Start a new topic? This will begin a fresh conversation with Morah.')) return;
  startLesson();
}

// ─── MESSAGE HANDLING ─────────────────────────────────────
async function sendMessage() {
  const input = document.getElementById('user-input');
  const text = input.value.trim();
  if (!text) return;

  input.value = '';
  appendMessage('user', text);
  state.messages.push({ role: 'user', content: text });

  await sendToMorah(state.messages);
}

function sendQuick(text) {
  document.getElementById('user-input').value = text;
  sendMessage();
}

function handleInputKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

async function sendToMorah(messages) {
  const sendBtn = document.getElementById('btn-send');
  const typingIndicator = document.getElementById('typing-indicator');

  sendBtn.disabled = true;
  typingIndicator.style.display = 'flex';
  setMorahStatus('Thinking... 💭');

  try {
    const headers = { 'Content-Type': 'application/json' };
    const apiKey = getApiKey();
    if (apiKey) headers['x-api-key'] = apiKey;

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers,
      body: JSON.stringify({ messages, userProfile: state.userProfile })
    });

    if (!response.ok) {
      const err = await response.json();
      if (err.error === 'NO_API_KEY') {
        document.getElementById('modal-apikey').style.display = 'flex';
        throw new Error('API key required. Please enter your Anthropic API key.');
      }
      throw new Error(err.error || 'Server error');
    }

    const data = await response.json();
    const rawContent = data.content;

    // Extract words learned from response
    const wordsData = extractWordsLearned(rawContent);
    const cleanContent = rawContent.replace(/📚 WORDS LEARNED:.*$/s, '').trim();

    state.messages.push({ role: 'assistant', content: rawContent });
    saveProgress();

    appendMessage('morah', cleanContent, wordsData);

    if (wordsData.length > 0) {
      addWordsToProgress(wordsData);
    }

    // Update lesson count and streak
    updateStreak();
    setMorahStatus('Ready to teach! 🇮🇱');

  } catch (error) {
    console.error('Chat error:', error);
    appendErrorMessage(error.message);
    setMorahStatus('Something went wrong... try again');
  } finally {
    sendBtn.disabled = false;
    typingIndicator.style.display = 'none';
  }
}

function extractWordsLearned(content) {
  const match = content.match(/📚 WORDS LEARNED:\s*(\[.*?\])/s);
  if (!match) return [];
  try {
    return JSON.parse(match[1]);
  } catch (e) {
    return [];
  }
}

function addWordsToProgress(words) {
  let newPoints = 0;
  let newWords = 0;

  for (const word of words) {
    const exists = state.progress.wordsLearned.some(w => w.hebrew === word.hebrew);
    if (!exists) {
      state.progress.wordsLearned.push(word);
      newPoints += (word.points || 10);
      newWords++;
    }
  }

  if (newPoints > 0) {
    state.progress.points += newPoints;
    updateStats();
    renderWordsList();
    saveProgress();
    showPointsPop(newPoints);
    if (newWords > 0) {
      showToast(`+${newWords} new word${newWords > 1 ? 's' : ''} learned! +${newPoints} points! 🎉`);
    }
  }
}

function updateStreak() {
  const today = new Date().toDateString();
  const last = state.progress.lastLessonDate;

  if (last !== today) {
    const lastDate = last ? new Date(last) : null;
    const todayDate = new Date(today);
    const diffDays = lastDate ? Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24)) : 0;

    if (diffDays <= 1) {
      state.progress.streak++;
    } else {
      state.progress.streak = 1;
    }
    state.progress.lastLessonDate = today;
    state.progress.lessonsCompleted++;
    state.progress.points += 5; // Lesson participation bonus
    updateStats();
    saveProgress();

    if (state.progress.streak > 1 && state.progress.streak % 7 === 0) {
      showStreakModal('🔥', `${state.progress.streak}-Day Streak!`,
        `Incredible! ${state.progress.streak} days in a row! You're practically a sabra! 🇮🇱 The Hebrew language is coming alive in you!`);
    }
  }
}

// ─── SCROLL MANAGEMENT ───────────────────────────────────
function initScrollWatcher() {
  const container = document.getElementById('chat-messages');
  const btn = document.getElementById('btn-scroll-bottom');
  container.addEventListener('scroll', () => {
    const distFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    btn.style.display = distFromBottom > 120 ? 'block' : 'none';
  });
}

function scrollToBottom() {
  const container = document.getElementById('chat-messages');
  container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
  document.getElementById('btn-scroll-bottom').style.display = 'none';
}

function autoScroll() {
  const container = document.getElementById('chat-messages');
  const distFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
  // Only auto-scroll if user is within 200px of the bottom
  if (distFromBottom < 200) {
    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
  } else {
    document.getElementById('btn-scroll-bottom').style.display = 'block';
  }
}

// ─── TEXT TO SPEECH ───────────────────────────────────────
const msgContentMap = {};
let msgCounter = 0;
let activeSpeakBtn = null;

function cleanForSpeech(text) {
  return text
    .replace(/\[TEACH\]|\[\/TEACH\]/g, '')
    .replace(/\[CHALLENGE\][\s\S]*?\[\/CHALLENGE\]/g, '')
    .replace(/📚 WORDS LEARNED:.*/s, '')
    .replace(/\*+([^*\n]+)\*+/g, '$1')
    .replace(/[#`~_>]/g, '')
    .replace(/—/g, ', ')
    // Strip all emoji and pictographic symbols
    .replace(/\p{Emoji}/gu, '')
    // Strip any remaining non-ASCII non-Hebrew characters (symbols, arrows, etc.)
    .replace(/[^\w\sְ-׿א-ת.,!?;:()\-']/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function speakMessage(msgId) {
  if (!window.speechSynthesis) { showToast('Speech not supported in this browser.'); return; }

  const btn = document.querySelector(`[data-speak-id="${msgId}"]`);
  const raw = msgContentMap[msgId];
  if (!raw) return;

  // Stop / toggle off
  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
    document.querySelectorAll('[data-speak-id]').forEach(b => {
      b.innerHTML = '🔊 <span>Hear Morah</span>';
      b.classList.remove('speaking');
    });
    activeSpeakBtn = null;
    if (activeSpeakBtn === btn) return; // was already this button — just stop
  }

  const clean = cleanForSpeech(raw);
  if (!clean) return;

  const u = new SpeechSynthesisUtterance(clean);
  u.rate = 0.9;
  u.pitch = 1.1;
  u.volume = 1;

  // Loop through available voices to find he-IL, then he, then English fallback
  const allVoices = window.speechSynthesis.getVoices();
  let picked = null;
  for (const v of allVoices) {
    if (v.lang === 'he-IL') { picked = v; break; }
  }
  if (!picked) {
    for (const v of allVoices) {
      if (v.lang.startsWith('he')) { picked = v; break; }
    }
  }
  if (!picked) {
    for (const v of allVoices) {
      if (v.lang === 'en-US' && v.name.includes('Google')) { picked = v; break; }
    }
  }
  if (!picked) {
    for (const v of allVoices) {
      if (v.lang === 'en-US') { picked = v; break; }
    }
  }

  if (picked) { u.voice = picked; u.lang = picked.lang; }
  else { u.lang = 'he-IL'; }

  u.onstart = () => {
    activeSpeakBtn = btn;
    if (btn) { btn.innerHTML = '⏹ <span>Stop</span>'; btn.classList.add('speaking'); }
  };
  u.onend = u.onerror = () => {
    activeSpeakBtn = null;
    if (btn) { btn.innerHTML = '🔊 <span>Hear Morah</span>'; btn.classList.remove('speaking'); }
  };

  window.speechSynthesis.speak(u);
}

// Chrome loads voices asynchronously — trigger early and cache on change
if (window.speechSynthesis) {
  // Initial trigger — may return empty on first call, that's expected
  window.speechSynthesis.getVoices();
  // Cache fires once voices are ready
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices(); // ensure internal cache is populated
  };
  // Also retry after a short delay since Chrome can be slow on first load
  setTimeout(() => window.speechSynthesis.getVoices(), 1000);
}

// ─── CHALLENGE STORE ─────────────────────────────────────
const challengeStore = {};  // challengeId -> { challenge, answered }
let challengeCounter = 0;

function parseMorahResponse(raw) {
  const teachMatch = raw.match(/\[TEACH\]([\s\S]*?)\[\/TEACH\]/);
  const challengeMatch = raw.match(/\[CHALLENGE\]([\s\S]*?)\[\/CHALLENGE\]/);
  const teach = teachMatch ? teachMatch[1].trim() : raw.replace(/📚 WORDS LEARNED:.*/s, '').trim();
  let challenge = null;
  if (challengeMatch) {
    try { challenge = JSON.parse(challengeMatch[1].trim()); } catch (e) { /* malformed JSON */ }
  }
  return { teach, challenge };
}

// ─── RENDERING ───────────────────────────────────────────
function appendMessage(role, content, wordBadges = []) {
  const container = document.getElementById('chat-messages');
  const el = document.createElement('div');
  el.className = `message ${role}`;
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (role === 'morah') {
    const { teach, challenge } = parseMorahResponse(content);
    const msgId = ++msgCounter;
    msgContentMap[msgId] = teach;

    let badgesHtml = '';
    if (wordBadges.length > 0) {
      badgesHtml = `<div class="word-badges">` +
        wordBadges.map((w, i) => `
          <div class="word-badge" style="animation-delay:${i * 0.1}s">
            <span class="word-badge-heb">${escapeHtml(w.hebrew)}</span>
            <span class="word-badge-trans">${escapeHtml(w.transliteration)}</span>
            <span class="word-badge-eng">${escapeHtml(w.english)}</span>
          </div>`).join('') + `</div>`;
    }

    const cId = challenge ? ++challengeCounter : null;
    if (cId) challengeStore[cId] = { challenge, answered: false };

    el.innerHTML = `
      <div class="msg-avatar">👩‍🏫</div>
      <div style="flex:1;min-width:0;">
        <div class="msg-bubble">
          ${formatMessage(teach)}
          ${badgesHtml}
          ${cId ? `<div class="challenge-widget" id="challenge-${cId}"></div>` : ''}
        </div>
        <button class="btn-hear-morah" data-speak-id="${msgId}" onclick="speakMessage(${msgId})">
          🔊 <span>Hear Morah</span>
        </button>
        <div class="msg-footer"><span class="msg-time">${time}</span></div>
      </div>`;

    container.appendChild(el);
    if (cId) renderChallenge(cId);
    autoScroll();
    return msgId;

  } else {
    el.innerHTML = `
      <div class="msg-avatar">${state.userProfile?.name?.[0] || '👤'}</div>
      <div style="flex:1;min-width:0;">
        <div class="msg-bubble">${formatMessage(content)}</div>
        <div class="msg-footer"><span class="msg-time">${time}</span></div>
      </div>`;
    container.appendChild(el);
    autoScroll();
    return null;
  }
}

function appendErrorMessage(errText) {
  const container = document.getElementById('chat-messages');
  const el = document.createElement('div');
  el.className = 'message morah';
  el.innerHTML = `
    <div class="msg-avatar">⚠️</div>
    <div>
      <div class="msg-bubble" style="border-color:#C0392B;background:#FFF5F5;color:#C0392B;">
        <strong style="background:none;color:#C0392B;">Error:</strong> ${escapeHtml(errText)}
        <br/><br/>Check that your <code>ANTHROPIC_API_KEY</code> is set correctly.
      </div>
    </div>`;
  container.appendChild(el);
  autoScroll();
}

function renderAllMessages() {
  const container = document.getElementById('chat-messages');
  container.innerHTML = '';
  for (const msg of state.messages) {
    const raw = msg.content;
    const words = extractWordsLearned(raw);
    appendMessage(msg.role, raw, []);
  }
}

// ─── CHALLENGE RENDERERS ──────────────────────────────────
function renderChallenge(cId) {
  const { challenge } = challengeStore[cId];
  const container = document.getElementById(`challenge-${cId}`);
  if (!container || !challenge) return;

  switch (challenge.type) {
    case 'multiple_choice': renderMultipleChoice(cId, challenge, container); break;
    case 'fill_blank':      renderFillBlank(cId, challenge, container);      break;
    case 'true_false':      renderTrueFalse(cId, challenge, container);      break;
    case 'match':           renderMatch(cId, challenge, container);          break;
    default: break;
  }
}

function renderMultipleChoice(cId, c, container) {
  // Extract Hebrew word from question to display prominently
  const hebMatch = c.question.match(/[֐-׿יִ-ﭏ]+[\s֐-׿יִ-ﭏ]*/);
  const hebWord = hebMatch ? `<div class="tap-hebrew">${escapeHtml(hebMatch[0].trim())}</div>` : '';

  container.innerHTML = `
    ${hebWord}
    <div class="challenge-question">${escapeHtml(c.question)}</div>
    <div class="challenge-options mc-options">
      ${c.options.map((opt, i) => `
        <button class="mc-btn" data-idx="${i}" onclick="answerMC(${cId},${i})">
          ${escapeHtml(opt)}
        </button>`).join('')}
    </div>
    <div class="challenge-feedback" id="cf-${cId}"></div>`;

  // Auto-speak the Hebrew word so students hear it
  if (hebMatch && window.speechSynthesis) {
    const utter = new SpeechSynthesisUtterance(hebMatch[0].trim());
    utter.lang = 'he-IL';
    const heVoice = window.speechSynthesis.getVoices().find(v => v.lang.startsWith('he'));
    if (heVoice) utter.voice = heVoice;
    utter.rate = 0.8;
    setTimeout(() => window.speechSynthesis.speak(utter), 400);
  }
}

function answerMC(cId, selected) {
  const { challenge, answered } = challengeStore[cId];
  if (answered) return;
  challengeStore[cId].answered = true;

  const correct = selected === challenge.correct;
  const container = document.getElementById(`challenge-${cId}`);
  const btns = container.querySelectorAll('.mc-btn');

  btns.forEach((btn, i) => {
    btn.disabled = true;
    if (i === challenge.correct) btn.classList.add('mc-correct');
    else if (i === selected && !correct) btn.classList.add('mc-wrong');
  });

  showChallengeFeedback(cId, correct, challenge.explanation);
  awardChallengePoints(correct, 10);
}

function renderFillBlank(cId, c, container) {
  container.innerHTML = `
    <div class="challenge-question">${escapeHtml(c.question)}</div>
    ${c.hint ? `<div class="challenge-hint">💡 Hint: ${escapeHtml(c.hint)}</div>` : ''}
    <div class="fill-row">
      <input class="fill-input" id="fill-${cId}" placeholder="Type your answer…"
        onkeydown="if(event.key==='Enter') answerFill(${cId})" autocomplete="off" />
      <button class="fill-submit" onclick="answerFill(${cId})">Check →</button>
    </div>
    <div class="challenge-feedback" id="cf-${cId}"></div>`;
  setTimeout(() => document.getElementById(`fill-${cId}`)?.focus(), 100);
}

function answerFill(cId) {
  const { challenge, answered } = challengeStore[cId];
  if (answered) return;

  const input = document.getElementById(`fill-${cId}`);
  const val = input.value.trim().toLowerCase();
  const expected = challenge.answer.toLowerCase();
  // Allow close matches (strip spaces/dashes)
  const correct = val === expected || val.replace(/[\s-]/g,'') === expected.replace(/[\s-]/g,'');

  challengeStore[cId].answered = true;
  input.disabled = true;
  input.classList.add(correct ? 'fill-correct' : 'fill-wrong');
  document.querySelector(`#challenge-${cId} .fill-submit`).disabled = true;

  showChallengeFeedback(cId, correct, challenge.explanation);
  awardChallengePoints(correct, 10);
}

function renderTrueFalse(cId, c, container) {
  container.innerHTML = `
    <div class="challenge-question">${escapeHtml(c.statement)}</div>
    <div class="challenge-options mc-options">
      <button class="mc-btn tf-true"  onclick="answerTF(${cId}, true)">✅ True</button>
      <button class="mc-btn tf-false" onclick="answerTF(${cId}, false)">❌ False</button>
    </div>
    <div class="challenge-feedback" id="cf-${cId}"></div>`;
}

function answerTF(cId, selected) {
  const { challenge, answered } = challengeStore[cId];
  if (answered) return;
  challengeStore[cId].answered = true;

  const correct = selected === challenge.correct;
  const container = document.getElementById(`challenge-${cId}`);
  container.querySelectorAll('.mc-btn').forEach(btn => {
    btn.disabled = true;
    const isTrueBtn = btn.classList.contains('tf-true');
    if (isTrueBtn === challenge.correct) btn.classList.add('mc-correct');
    else if (isTrueBtn === selected && !correct) btn.classList.add('mc-wrong');
  });

  showChallengeFeedback(cId, correct, challenge.explanation);
  awardChallengePoints(correct, 10);
}

function renderMatch(cId, c, container) {
  const pairs = c.pairs;
  const shuffledEng = [...pairs].sort(() => Math.random() - 0.5);
  container.dataset.selected = '';
  container.dataset.matched = '[]';

  container.innerHTML = `
    <div class="challenge-question">${escapeHtml(c.instruction || 'Match the Hebrew to its meaning')}</div>
    <div class="match-grid">
      <div class="match-col" id="match-heb-${cId}">
        ${pairs.map((p, i) => `
          <button class="match-btn match-heb" data-idx="${i}" data-cid="${cId}" onclick="selectMatch(this,'heb')">
            <span class="match-heb-word">${escapeHtml(p.hebrew)}</span>
            <span class="match-trans">${escapeHtml(p.transliteration)}</span>
          </button>`).join('')}
      </div>
      <div class="match-col" id="match-eng-${cId}">
        ${shuffledEng.map((p, i) => {
          const origIdx = pairs.indexOf(p);
          return `<button class="match-btn match-eng" data-idx="${origIdx}" data-cid="${cId}" onclick="selectMatch(this,'eng')">
            ${escapeHtml(p.english)}
          </button>`;
        }).join('')}
      </div>
    </div>
    <div class="challenge-feedback" id="cf-${cId}"></div>`;
}

let matchSelected = { heb: null, eng: null };

function selectMatch(btn, side) {
  const cId = parseInt(btn.dataset.cid);
  const { answered } = challengeStore[cId];
  if (answered) return;

  // Deselect same side if already selected
  if (matchSelected[side]) matchSelected[side].classList.remove('match-selected');
  matchSelected[side] = btn;
  btn.classList.add('match-selected');

  // If both sides selected, check pair
  if (matchSelected.heb && matchSelected.eng) {
    const hebIdx = parseInt(matchSelected.heb.dataset.idx);
    const engIdx = parseInt(matchSelected.eng.dataset.idx);
    const correct = hebIdx === engIdx;

    matchSelected.heb.classList.remove('match-selected');
    matchSelected.eng.classList.remove('match-selected');

    if (correct) {
      matchSelected.heb.classList.add('match-done-correct');
      matchSelected.eng.classList.add('match-done-correct');
      matchSelected.heb.disabled = true;
      matchSelected.eng.disabled = true;
      awardChallengePoints(true, 5);

      // Check if all matched
      const container = document.getElementById(`challenge-${cId}`);
      const total = challengeStore[cId].challenge.pairs.length;
      const done = container.querySelectorAll('.match-done-correct').length / 2;
      if (done >= total) {
        challengeStore[cId].answered = true;
        showChallengeFeedback(cId, true, 'Perfect match! Metzuyan! מְצֻיָּן!');
      }
    } else {
      matchSelected.heb.classList.add('match-flash-wrong');
      matchSelected.eng.classList.add('match-flash-wrong');
      setTimeout(() => {
        matchSelected.heb?.classList.remove('match-flash-wrong');
        matchSelected.eng?.classList.remove('match-flash-wrong');
      }, 600);
      awardChallengePoints(false, 0);
    }
    matchSelected = { heb: null, eng: null };
  }
}

function showChallengeFeedback(cId, correct, explanation) {
  const fb = document.getElementById(`cf-${cId}`);
  if (!fb) return;
  fb.className = `challenge-feedback ${correct ? 'fb-correct' : 'fb-wrong'}`;
  fb.innerHTML = correct
    ? `<span class="fb-icon">🎉</span> <strong>Correct!</strong> ${escapeHtml(explanation || '')}`
    : `<span class="fb-icon">❌</span> <strong>Not quite.</strong> ${escapeHtml(explanation || '')}`;
  fb.style.display = 'flex';
  autoScroll();
}

function awardChallengePoints(correct, pts) {
  if (!correct || pts <= 0) return;
  state.progress.points += pts;
  updateStats();
  saveProgress();
  showPointsPop(pts);
  triggerConfetti();
}

function triggerConfetti() {
  const colors = ['#0038B8','#FFD700','#FFFFFF','#4A90D9','#2E8B57'];
  for (let i = 0; i < 22; i++) {
    const c = document.createElement('div');
    c.className = 'confetti-piece';
    c.style.cssText = `
      left:${Math.random()*100}vw;
      background:${colors[Math.floor(Math.random()*colors.length)]};
      width:${6+Math.random()*6}px;
      height:${6+Math.random()*6}px;
      animation-duration:${0.9+Math.random()*0.8}s;
      animation-delay:${Math.random()*0.3}s;
      border-radius:${Math.random()>0.5?'50%':'2px'};`;
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 1800);
  }
}

function formatMessage(text) {
  // Strip [TEACH]/[CHALLENGE]/WORDS LEARNED blocks — show only clean text
  let clean = text
    .replace(/\[TEACH\]/g, '').replace(/\[\/TEACH\]/g, '')
    .replace(/\[CHALLENGE\][\s\S]*?\[\/CHALLENGE\]/g, '')
    .replace(/📚 WORDS LEARNED:.*/s, '')
    .trim();

  let html = escapeHtml(clean);
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
  html = html.replace(/—\s*&quot;([^&]+)&quot;/g, '— <code>$1</code>');
  html = html.replace(/—\s*"([^"]+)"/g, '— <code>$1</code>');
  html = html.replace(/\n\n/g, '</p><p>');
  html = html.replace(/\n/g, '<br/>');
  html = `<p>${html}</p>`.replace(/<p><\/p>/g, '');
  return html;
}

// ─── UI HELPERS ───────────────────────────────────────────
function setMorahStatus(text) {
  document.getElementById('morah-status').textContent = text;
}

function showToast(msg, duration = 3500) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.style.display = 'block';
  setTimeout(() => { toast.style.display = 'none'; }, duration);
}

function showPointsPop(points) {
  const el = document.createElement('div');
  el.className = 'points-pop';
  el.textContent = `+${points} pts!`;
  const x = window.innerWidth * 0.75;
  const y = window.innerHeight * 0.5;
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1600);
}

function showStreakModal(emoji, title, message) {
  document.getElementById('streak-emoji').textContent = emoji;
  document.getElementById('streak-title').textContent = title;
  document.getElementById('streak-message').textContent = message;
  document.getElementById('modal-streak').style.display = 'flex';
}

function closeStreakModal() {
  document.getElementById('modal-streak').style.display = 'none';
}

// ─── FEEDBACK ─────────────────────────────────────────────
function showFeedback() {
  state.feedbackRating = 0;
  document.getElementById('stars-rating').querySelectorAll('.star').forEach(s => s.classList.remove('active'));
  document.getElementById('feedback-positive').value = '';
  document.getElementById('feedback-improve').value = '';
  document.getElementById('feedback-other').value = '';
  document.getElementById('modal-feedback').style.display = 'flex';
}

function closeFeedback() {
  document.getElementById('modal-feedback').style.display = 'none';
}

function setRating(val) {
  state.feedbackRating = val;
  document.getElementById('stars-rating').querySelectorAll('.star').forEach(s => {
    s.classList.toggle('active', parseInt(s.dataset.val) <= val);
  });
}

async function submitFeedback() {
  const positive = document.getElementById('feedback-positive').value.trim();
  const improve = document.getElementById('feedback-improve').value.trim();
  const other = document.getElementById('feedback-other').value.trim();

  if (!state.feedbackRating) { showToast('Please rate the lesson!'); return; }

  try {
    await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rating: state.feedbackRating,
        positive, improve, other,
        userProfile: state.userProfile,
        lessonSummary: `${state.progress.wordsLearned.length} words learned, ${state.progress.lessonsCompleted} lessons`
      })
    });
    state.progress.feedbackGiven++;
    state.progress.points += 15; // Bonus for feedback
    updateStats();
    saveProgress();
    closeFeedback();
    showToast('Todah rabah! תּוֹדָה רַבָּה! Your feedback means everything! +15 bonus points!');
  } catch (e) {
    showToast('Feedback saved locally! Thank you!');
    closeFeedback();
  }
}

// ─── VOICE INPUT ─────────────────────────────────────────
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let micActive = false;
let micLang = 'en-US'; // toggles between en-US and he-IL

function initRecognition() {
  if (!SpeechRecognition) return null;
  const r = new SpeechRecognition();
  r.continuous = false;
  r.interimResults = true;
  r.lang = micLang;

  r.onstart = () => {
    micActive = true;
    document.getElementById('btn-mic').classList.add('listening');
    document.getElementById('btn-mic').querySelector('.mic-icon').textContent = '🔴';
    document.getElementById('mic-status').style.display = 'flex';
    document.getElementById('mic-status-text').textContent =
      micLang.startsWith('he') ? '…מקשיב, דבר בעברית' : 'Listening… speak in Hebrew or English';
  };

  r.onresult = (e) => {
    const transcript = Array.from(e.results)
      .map(r => r[0].transcript).join('');
    const input = document.getElementById('user-input');
    input.value = transcript;
    // Auto-resize textarea
    input.style.height = 'auto';
    input.style.height = input.scrollHeight + 'px';
  };

  r.onend = () => {
    stopMic();
    // If there's text in the box, send automatically
    const val = document.getElementById('user-input').value.trim();
    if (val) sendMessage();
  };

  r.onerror = (e) => {
    stopMic();
    if (e.error === 'not-allowed') {
      showToast('Microphone access denied. Please allow mic access in your browser.');
    } else if (e.error !== 'no-speech') {
      showToast(`Mic error: ${e.error}`);
    }
  };

  return r;
}

function toggleVoiceInput() {
  if (!SpeechRecognition) {
    showToast('Voice input not supported in this browser. Try Chrome or Edge.');
    return;
  }
  if (micActive) {
    recognition?.stop();
    stopMic();
  } else {
    recognition = initRecognition();
    recognition?.start();
  }
}

function stopMic() {
  micActive = false;
  const btn = document.getElementById('btn-mic');
  if (btn) {
    btn.classList.remove('listening');
    btn.querySelector('.mic-icon').textContent = '🎤';
    btn.querySelector('.mic-label').textContent = 'דַּבֵּר';
  }
  document.getElementById('mic-status').style.display = 'none';
}

function toggleMicLang() {
  micLang = micLang.startsWith('he') ? 'en-US' : 'he-IL';
  const toggle = document.getElementById('mic-lang-toggle');
  if (toggle) toggle.textContent = micLang.startsWith('he') ? 'עב ✓ / EN' : 'עב / EN ✓';
  showToast(micLang.startsWith('he') ? 'Switched to Hebrew input 🇮🇱' : 'Switched to English input 🇺🇸');
  // Restart if currently listening
  if (micActive) {
    recognition?.stop();
    setTimeout(() => { recognition = initRecognition(); recognition?.start(); }, 300);
  }
}

// ─── VOCABULARY TOOLTIPS ─────────────────────────────────
const HEB_RE = /[א-תְ-ֽיִ-פֿ]/;  // Hebrew letter/vowel range
let tooltipTimeout = null;
let tooltipVisible = false;

function initTooltips() {
  const chatEl = document.getElementById('chat-messages');
  if (!chatEl) return;

  const onSelect = () => {
    clearTimeout(tooltipTimeout);
    const sel = window.getSelection();
    const word = sel?.toString().trim();
    if (!word || !HEB_RE.test(word) || word.length > 50) {
      closeTooltip();
      return;
    }
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return;

    tooltipTimeout = setTimeout(() => showTooltip(word, rect), 350);
  };

  document.addEventListener('mouseup', onSelect);
  document.addEventListener('touchend', onSelect);

  // Close when clicking elsewhere
  document.addEventListener('mousedown', (e) => {
    if (!e.target.closest('#vocab-tooltip')) closeTooltip();
  });
}

async function showTooltip(word, rect) {
  const tip = document.getElementById('vocab-tooltip');
  if (!tip) return;

  // Position above the selection
  const scrollY = window.scrollY;
  const tipTop = rect.top + scrollY - 10;
  const tipLeft = Math.min(rect.left + rect.width / 2, window.innerWidth - 220);
  tip.style.top = `${tipTop}px`;
  tip.style.left = `${Math.max(8, tipLeft)}px`;
  tip.style.display = 'block';
  tooltipVisible = true;

  document.getElementById('tt-hebrew').textContent = word;
  document.getElementById('tt-trans').textContent = '…';
  document.getElementById('tt-english').textContent = '';
  document.getElementById('tt-pos').textContent = '';

  try {
    const headers = { 'Content-Type': 'application/json' };
    const apiKey = getApiKey();
    if (apiKey) headers['x-api-key'] = apiKey;

    const res = await fetch('/api/tooltip', {
      method: 'POST',
      headers,
      body: JSON.stringify({ word })
    });
    if (!res.ok) throw new Error('lookup failed');
    const data = await res.json();

    if (!tooltipVisible) return; // closed while loading
    document.getElementById('tt-trans').textContent = data.transliteration || '';
    document.getElementById('tt-english').textContent = data.english || '';
    document.getElementById('tt-pos').textContent = data.partOfSpeech || '';
  } catch (e) {
    document.getElementById('tt-trans').textContent = 'Could not look up word';
  }
}

function closeTooltip() {
  const tip = document.getElementById('vocab-tooltip');
  if (tip) tip.style.display = 'none';
  tooltipVisible = false;
  clearTimeout(tooltipTimeout);
}

// ─── API KEY MANAGEMENT ───────────────────────────────────
async function checkApiKey() {
  try {
    const r = await fetch('/api/status');
    const d = await r.json();
    if (!d.configured) {
      const stored = sessionStorage.getItem('kesher_api_key');
      if (!stored) {
        document.getElementById('modal-apikey').style.display = 'flex';
      }
    }
  } catch (e) { /* server not reachable */ }
}

function saveApiKey() {
  const key = document.getElementById('apikey-input').value.trim();
  if (!key || !key.startsWith('sk-')) {
    showToast('Please enter a valid Anthropic API key (starts with sk-)');
    return;
  }
  sessionStorage.setItem('kesher_api_key', key);
  document.getElementById('modal-apikey').style.display = 'none';
  showToast('API key saved for this session! Baruch Haba! ✡️');
}

function getApiKey() {
  return sessionStorage.getItem('kesher_api_key') || '';
}

// ─── UTILITY ──────────────────────────────────────────────
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Close modals on overlay click
document.addEventListener('click', (e) => {
  if (e.target.id === 'modal-feedback') closeFeedback();
  if (e.target.id === 'modal-streak') closeStreakModal();
});
