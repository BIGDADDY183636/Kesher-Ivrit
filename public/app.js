/* ═══════════════════════════════════════════════════════════
   KESHER IVRIT — Frontend App
   קשר עברית
═══════════════════════════════════════════════════════════ */

// ─── STATE ───────────────────────────────────────────────
const TOPICS = [
  { id: 'Greetings',             label: 'Greetings' },
  { id: 'Verbs',                 label: 'Verbs' },
  { id: 'Infinitives',           label: 'Infinitives' },
  { id: 'Nouns',                 label: 'Nouns' },
  { id: 'Adjectives',            label: 'Adjectives' },
  { id: 'Numbers',               label: 'Numbers' },
  { id: 'Days and Months',       label: 'Days/Months' },
  { id: 'Sentences',             label: 'Sentences' },
  { id: 'Reading Comprehension', label: 'Reading' },
];

let state = {
  userProfile: null,
  messages: [],
  currentTopic: 'Greetings',
  session: {
    wordsThisSession: [],
    skipList: [],           // topics student wants their teacher to cover
    consecutiveCorrect: 0,
    consecutiveWrong: 0,
    totalCorrect: 0,
    totalWrong: 0
  },
  progress: {
    points: 0,
    wordsLearned: [],
    streak: 0,
    lastLessonDate: null,
    lessonsCompleted: 0,
    feedbackGiven: 0
  },
  curriculumProgress: {
    completedLessons: [],
    currentLesson: null
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

// ─── WORD OF THE DAY ─────────────────────────────────────
const WOTD_LIST = [
  { hebrew:'שָׁלוֹם',       trans:'shalom',      english:'peace / hello / goodbye',    example:'שָׁלוֹם לְכֻלָּם — Peace to everyone' },
  { hebrew:'אַהֲבָה',       trans:'ahavah',      english:'love',                        example:'אַהֲבַת יִשְׂרָאֵל — Love of Israel' },
  { hebrew:'חוֹפֶשׁ',       trans:'khofesh',     english:'freedom / vacation',          example:'חוֹפֶשׁ הוּא הַחַיִּים — Freedom is life' },
  { hebrew:'אֱמֶת',        trans:'emet',        english:'truth',                       example:'חוֹתָמוֹ שֶׁל הַקָּדוֹשׁ בָּרוּךְ הוּא אֱמֶת — God\'s seal is truth' },
  { hebrew:'תִּקְוָה',      trans:'tikvah',      english:'hope',                        example:'עוֹד לֹא אָבְדָה תִּקְוָתֵנוּ — Our hope is not yet lost (Hatikvah)' },
  { hebrew:'לֵב',          trans:'lev',         english:'heart / mind',               example:'כׇּל עָם יִשְׂרָאֵל לֵב אֶחָד — All of Israel is one heart' },
  { hebrew:'נֶפֶשׁ',        trans:'nefesh',      english:'soul / self / person',        example:'נֶפֶשׁ יְפָה — A beautiful soul' },
  { hebrew:'חֶסֶד',        trans:'khesed',      english:'lovingkindness / mercy',      example:'עֲשֵׂה חֶסֶד עִם כֻּלָּם — Do kindness with everyone' },
  { hebrew:'שַׁבָּת',       trans:'shabbat',     english:'Sabbath / rest',              example:'שַׁבָּת שָׁלוֹם! — A peaceful Sabbath!' },
  { hebrew:'עַם',          trans:'am',          english:'people / nation',             example:'עַם יִשְׂרָאֵל חַי — The people of Israel live!' },
  { hebrew:'אֶרֶץ',        trans:'eretz',       english:'land / earth / country',      example:'אֶרֶץ יִשְׂרָאֵל — The Land of Israel' },
  { hebrew:'שָׁמַיִם',      trans:'shamayim',    english:'sky / heaven',                example:'הַשָּׁמַיִם מְסַפְּרִים כְּבוֹד אֵל — The heavens declare God\'s glory' },
  { hebrew:'אוֹר',         trans:'or',          english:'light',                       example:'אוֹר לַגּוֹיִם — A light to the nations' },
  { hebrew:'דֶּרֶךְ',       trans:'derekh',      english:'way / path / road',           example:'לֵךְ בַּדֶּרֶךְ הַטּוֹבָה — Go on the good path' },
  { hebrew:'כֹּחַ',        trans:'koach',       english:'strength / power / energy',   example:'יְשַׁר כֹּחֲךָ! — Well done! (lit. May your strength be straight)' },
  { hebrew:'שִׂמְחָה',      trans:'simkhah',     english:'joy / happiness',             example:'שִׂמְחָה שֶׁל מִצְוָה — The joy of a mitzvah' },
  { hebrew:'זִכָּרוֹן',     trans:'zikaron',     english:'memory / remembrance',        example:'יוֹם הַזִּכָּרוֹן — Memorial Day (Israel)' },
  { hebrew:'חֲלוֹם',       trans:'khalom',      english:'dream',                       example:'חֲלוֹמוֹת טוֹבִים — Good dreams' },
  { hebrew:'מַיִם',        trans:'mayim',       english:'water',                       example:'מַיִם חַיִּים — Living water' },
  { hebrew:'לֶחֶם',        trans:'lechem',      english:'bread',                       example:'לֶחֶם הַפָּנִים — The showbread (Temple)' },
  { hebrew:'עֵץ',          trans:'etz',         english:'tree / wood',                 example:'עֵץ חַיִּים הִיא — She is a tree of life (Torah)' },
  { hebrew:'שָׁלֵם',        trans:'shalem',      english:'whole / complete / peaceful', example:'לֵב שָׁלֵם — A whole heart' },
  { hebrew:'גֶּשֶׁם',       trans:'geshem',      english:'rain',                        example:'גֶּשֶׁם בְּרָכָה — Rain of blessing' },
  { hebrew:'כֶּלֶב',        trans:'kelev',       english:'dog',                         example:'כֶּלֶב נֶאֱמָן — A faithful dog' },
  { hebrew:'יֶלֶד',        trans:'yeled',       english:'child / boy',                 example:'מַה יֶּלֶד טוֹב! — What a good child!' },
  { hebrew:'בַּיִת',        trans:'bayit',       english:'house / home',                example:'בֵּית כְּנֶסֶת — Synagogue (House of Assembly)' },
  { hebrew:'שִׁיר',        trans:'shir',        english:'song / poem',                 example:'שִׁיר הַשִּׁירִים — Song of Songs' },
  { hebrew:'יוֹם',         trans:'yom',         english:'day',                         example:'יוֹם טוֹב! — Good day / Happy holiday!' },
  { hebrew:'לַיְלָה',      trans:'lailah',      english:'night',                       example:'לַיְלָה טוֹב — Good night' },
  { hebrew:'רָחוֹק',       trans:'rakhok',      english:'far / distant',               example:'לֹא רָחוֹק מִלִּבֵּנוּ — Not far from our hearts' },
  { hebrew:'קָרוֹב',       trans:'karov',       english:'near / close / relative',     example:'קָרוֹב לַלֵּב — Close to the heart' },
  { hebrew:'חָכְמָה',      trans:'khokhmah',    english:'wisdom',                      example:'רֵאשִׁית חָכְמָה — The beginning of wisdom' },
  { hebrew:'בִּינָה',       trans:'binah',       english:'understanding / insight',     example:'בִּינָה יְתֵרָה — Extra understanding' },
  { hebrew:'עָנָן',        trans:'anan',        english:'cloud',                       example:'עַמּוּד עָנָן — Pillar of cloud (Exodus)' },
  { hebrew:'שֶׁמֶשׁ',       trans:'shemesh',     english:'sun',                         example:'הַשֶּׁמֶשׁ זָרְחָה — The sun rose' },
  { hebrew:'יָרֵחַ',       trans:'yareach',     english:'moon',                        example:'כִּרְאוֹת הַיָּרֵחַ — Like seeing the moon' },
  { hebrew:'כּוֹכָב',       trans:'kokhav',      english:'star',                        example:'כּוֹכְבֵי הַשָּׁמַיִם — Stars of the heaven' },
  { hebrew:'גָּדוֹל',       trans:'gadol',       english:'great / big',                 example:'כֹּהֵן גָּדוֹל — High Priest' },
  { hebrew:'תּוֹדָה',       trans:'todah',       english:'thank you / gratitude',       example:'תּוֹדָה רַבָּה — Thank you very much!' },
  { hebrew:'בְּרָכָה',      trans:'berakhah',    english:'blessing',                    example:'בְּרָכָה וְשָׁלוֹם — Blessing and peace' },
  { hebrew:'יְשׁוּעָה',     trans:'yeshuah',     english:'salvation / rescue',          example:'יְשׁוּעַת ה׳ — The salvation of God' },
  { hebrew:'עוֹלָם',       trans:'olam',        english:'world / eternity / forever',  example:'לְעוֹלָם וָעֶד — Forever and ever' },
  { hebrew:'נֶצַח',        trans:'netzach',     english:'eternity / victory',          example:'נֵצַח יִשְׂרָאֵל לֹא יְשַׁקֵּר — The Eternal One of Israel does not lie' },
];

function renderWordOfDay() {
  // Pick word based on day of year — changes every day, same word all day
  const dayIndex = Math.floor(Date.now() / 86400000) % WOTD_LIST.length;
  const word = WOTD_LIST[dayIndex];
  const card = document.getElementById('wotd-card');
  if (!card) return;
  document.getElementById('wotd-hebrew').textContent  = word.hebrew;
  document.getElementById('wotd-trans').textContent   = word.trans;
  document.getElementById('wotd-english').textContent = word.english;
  document.getElementById('wotd-example').textContent = word.example;
  card.style.display = 'block';
}

// ─── USER ACCOUNT (registration, separate from learning profile) ─────────────
let currentUser = null; // { firstName, lastInitial, school, joinedAt }

function loadUser() {
  try {
    const saved = localStorage.getItem('kesher_user');
    if (saved) currentUser = JSON.parse(saved);
  } catch (e) { currentUser = null; }
}

function saveUser() {
  if (currentUser) localStorage.setItem('kesher_user', JSON.stringify(currentUser));
}

function submitRegistration() {
  const firstName   = (document.getElementById('reg-firstname').value   || '').trim();
  const lastInitial = (document.getElementById('reg-lastinitial').value || '').trim().toUpperCase();
  const school      = (document.getElementById('reg-school').value      || '').trim();
  const errEl = document.getElementById('reg-error');

  if (!firstName) {
    errEl.textContent = 'Please enter your first name.';
    errEl.style.display = 'block';
    document.getElementById('reg-firstname').focus();
    return;
  }
  if (!lastInitial || !/^[A-Za-z]$/.test(lastInitial)) {
    errEl.textContent = 'Last initial must be a single letter.';
    errEl.style.display = 'block';
    document.getElementById('reg-lastinitial').focus();
    return;
  }
  if (!school) {
    errEl.textContent = 'Please enter your school name.';
    errEl.style.display = 'block';
    document.getElementById('reg-school').focus();
    return;
  }

  errEl.style.display = 'none';
  currentUser = { firstName, lastInitial, school, joinedAt: Date.now() };
  saveUser();
  updateUserBadges();
  showScreen('screen-home');
  renderWordOfDay();
  checkReturningUser();
  checkApiKey();
}

function updateUserBadges() {
  if (!currentUser) return;
  const displayName = `${currentUser.firstName} ${currentUser.lastInitial}.`;

  // Home screen badge
  const homeBadge = document.getElementById('home-user-badge');
  if (homeBadge) {
    document.getElementById('hub-name').textContent   = displayName;
    document.getElementById('hub-school').textContent = currentUser.school;
    const lvl = state.userProfile ? state.userProfile.level : null;
    const avatarMap = { complete_beginner:'🌱', some_exposure:'🌿', basic:'🌳', intermediate:'⭐', advanced:'🔥' };
    document.getElementById('hub-avatar').textContent = avatarMap[lvl] || '👤';
    homeBadge.style.display = 'flex';
  }

  // Lesson screen badge
  const lessonBadge = document.getElementById('lesson-user-badge');
  if (lessonBadge) {
    document.getElementById('lub-name').textContent   = displayName;
    document.getElementById('lub-school').textContent = currentUser.school;
    const lvl = state.userProfile ? state.userProfile.level : null;
    const avatarMap = { complete_beginner:'🌱', some_exposure:'🌿', basic:'🌳', intermediate:'⭐', advanced:'🔥' };
    document.getElementById('lub-avatar').textContent = avatarMap[lvl] || '👤';
    lessonBadge.style.display = 'flex';
  }
}

// ─── INIT ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  loadUser();
  loadProgress();
  renderWordOfDay();

  if (!currentUser) {
    showScreen('screen-register');
    setTimeout(() => document.getElementById('reg-firstname').focus(), 100);
  } else {
    updateUserBadges();
    checkReturningUser();
    await checkApiKey();
  }
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
    const curr = localStorage.getItem('kesher_curriculum');
    if (curr) {
      state.curriculumProgress = JSON.parse(curr);
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
      const recent = state.messages.slice(-30);
      localStorage.setItem('kesher_messages', JSON.stringify(recent));
    }
    localStorage.setItem('kesher_curriculum', JSON.stringify(state.curriculumProgress));
  } catch (e) {
    console.warn('Could not save progress:', e);
  }
}

function checkReturningUser() {
  if (!state.userProfile || !state.userProfile.name) return;

  document.getElementById('returning-user-section').style.display = 'block';
  document.getElementById('returning-name').textContent = state.userProfile.name;

  // Avatar by level
  const avatarMap = { complete_beginner:'🌱', some_exposure:'🌿', basic:'🌳', intermediate:'⭐', advanced:'🔥' };
  const av = document.getElementById('returning-avatar');
  if (av) av.textContent = avatarMap[state.userProfile.level] || '👤';

  // Stats line
  const statsEl = document.getElementById('returning-stats');
  if (statsEl) {
    const parts = [];
    if (state.progress.streak > 0)             parts.push('🔥 ' + state.progress.streak + '-day streak');
    if (state.progress.wordsLearned.length > 0) parts.push('📖 ' + state.progress.wordsLearned.length + ' words learned');
    if (state.progress.points > 0)              parts.push('⭐ ' + state.progress.points + ' pts');
    statsEl.textContent = parts.join('  ·  ');
  }

  // Last message preview
  const previewEl = document.getElementById('returning-preview');
  if (previewEl && state.messages.length > 0) {
    const last = state.messages[state.messages.length - 1];
    const raw = (last.content || '').replace(/\[TEACH\][\s\S]*?\[\/TEACH\]/g, '').replace(/\[CHALLENGE\][\s\S]*?\[\/CHALLENGE\]/g, '').replace(/📚 WORDS LEARNED:.*/s, '').replace(/\*/g, '').replace(/\s+/g, ' ').trim().slice(0, 80);
    previewEl.textContent = last.role === 'assistant' ? '💬 Morah: ' + raw + '…' : '';
  }

  checkStreak();
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
  // Pre-fill name from registration
  if (currentUser) {
    state.quizAnswers.name = `${currentUser.firstName} ${currentUser.lastInitial}.`;
  }
  showScreen('screen-quiz');
  renderQuizStep();
}

function goHome() {
  showScreen('screen-home');
  updateUserBadges();
  checkReturningUser();
}

function continueLearning() {
  if (!state.userProfile) return;
  showScreen('screen-lesson');
  setupLessonScreen();
  updateUserBadges();
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
  localStorage.removeItem('kesher_user');
  currentUser = null;
  state = {
    userProfile: null,
    messages: [],
    progress: { points: 0, wordsLearned: [], streak: 0, lastLessonDate: null, lessonsCompleted: 0, feedbackGiven: 0 },
    curriculumProgress: { completedLessons: [], currentLesson: null },
    currentQuizStep: 0,
    quizAnswers: {},
    feedbackRating: 0
  };
  document.getElementById('returning-user-section').style.display = 'none';
  showToast('Progress cleared. Time for a fresh start! חָדָשׁ!');
  showScreen('screen-register');
  setTimeout(() => document.getElementById('reg-firstname').focus(), 100);
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
  updateUserBadges();
  startLesson();
}

// ─── MOBILE TAB NAVIGATION ───────────────────────────────
var _mobTab = 'learn';

function switchTab(tab) {
  _mobTab = tab;
  document.querySelectorAll('.nav-btn').forEach(function(btn) {
    btn.classList.toggle('active', btn.dataset.panel === tab);
  });
  var sl = document.getElementById('screen-lesson');
  // Remove any existing mob-tab-* class then add the new one
  sl.className = sl.className.replace(/\bmob-tab-\S+/g, '').trim();
  if (tab !== 'learn') sl.classList.add('mob-tab-' + tab);
  if (tab === 'path')  renderMobilePath();
  if (tab === 'me')    renderMobileProfile();
}

function renderMobilePath() {
  var body = document.getElementById('mob-path-body');
  if (!body) return;
  var cp = state.curriculumProgress;
  var level = (state.userProfile && state.userProfile.level) || 'complete_beginner';
  var userLevelIdx = LEVEL_ORDER.indexOf(level);
  var POSITIONS = ['path-pos-left','path-pos-right','path-pos-left','path-pos-right','path-pos-left'];
  var nodeIdx = 0;
  var html = '';

  CURRICULUM.forEach(function(unit, ui) {
    var unlocked = userLevelIdx >= unit.levelReq;
    var completedCount = unit.lessons.filter(function(l) {
      return cp.completedLessons.includes(l.id);
    }).length;

    html += '<div class="path-unit">';
    html += '<div class="path-unit-banner" style="background:' + unit.color +
            (unlocked ? '' : ';filter:grayscale(0.5);opacity:0.75') + '">';
    html += '<span class="path-unit-num">' + (ui + 1) + '</span>';
    html += '<div class="path-unit-info">';
    html += '<div class="path-unit-name">' + (unlocked ? '' : '🔒 ') + unit.title + '</div>';
    html += '<div class="path-unit-heb">' + unit.titleHeb + '</div>';
    html += '</div>';
    html += '<div class="path-unit-done">' + completedCount + '/' + unit.lessons.length + '</div>';
    html += '</div>';

    html += '<div class="path-track">';
    unit.lessons.forEach(function(lesson, li) {
      var done     = cp.completedLessons.includes(lesson.id);
      var current  = cp.currentLesson === lesson.id;
      var prevDone = li === 0 || cp.completedLessons.includes(unit.lessons[li - 1].id);
      var avail    = unlocked && (done || current || prevDone);
      var locked   = !avail;

      var stClass = locked ? 'node-locked' : done ? 'node-done' : current ? 'node-current' : 'node-open';
      var pos     = POSITIONS[li % POSITIONS.length];
      var icon    = locked ? '🔒' : done ? '✓' : lesson.icon;
      var delay   = (nodeIdx * 55) + 'ms';
      var clickFn = locked ? '' : 'onclick="startCurriculumLesson(\'' + lesson.id + '\');switchTab(\'learn\')"';

      if (li > 0) {
        var prevLineDone = cp.completedLessons.includes(unit.lessons[li - 1].id);
        html += '<div class="path-line' + (prevLineDone ? ' path-line-done' : '') + '"></div>';
      }

      html += '<div class="path-node-wrap ' + pos + '">';
      html += '<button class="path-node ' + stClass + '" ' + clickFn +
              ' style="animation-delay:' + delay + '">';
      html += '<span class="path-node-icon">' + icon + '</span>';
      html += '<span class="path-node-label">' + lesson.title + '</span>';
      html += '</button>';
      html += '</div>';
      nodeIdx++;
    });
    html += '</div></div>';
  });

  body.innerHTML = html;
}

function renderMobileProfile() {
  var body = document.getElementById('mob-me-body');
  if (!body) return;
  var avatarMap = { complete_beginner:'🌱', some_exposure:'🌿', basic:'🌳', intermediate:'⭐', advanced:'🔥' };
  var levelNames = { complete_beginner:'Complete Beginner', some_exposure:'Some Exposure',
                     basic:'Basic', intermediate:'Intermediate', advanced:'Advanced' };
  var lvl  = state.userProfile ? state.userProfile.level : null;
  var name = currentUser
    ? (currentUser.firstName + ' ' + currentUser.lastInitial + '.')
    : (state.userProfile ? state.userProfile.name : 'Student');
  var school = currentUser ? currentUser.school : '';

  body.innerHTML =
    '<div class="mob-me-hero">' +
      '<div class="mob-me-avatar">' + (avatarMap[lvl] || '👤') + '</div>' +
      '<div class="mob-me-name">'   + escapeHtml(name) + '</div>' +
      (school ? '<div class="mob-me-school">' + escapeHtml(school) + '</div>' : '') +
      '<div class="mob-me-level">'  + (levelNames[lvl] || 'Hebrew Learner') + '</div>' +
    '</div>' +
    '<div class="mob-stats-grid">' +
      '<div class="mob-stat"><div class="mob-stat-icon">🔥</div>' +
        '<div class="mob-stat-val">' + state.progress.streak + '</div>' +
        '<div class="mob-stat-lbl">Streak</div></div>' +
      '<div class="mob-stat"><div class="mob-stat-icon">📖</div>' +
        '<div class="mob-stat-val">' + state.progress.wordsLearned.length + '</div>' +
        '<div class="mob-stat-lbl">Words</div></div>' +
      '<div class="mob-stat"><div class="mob-stat-icon">⭐</div>' +
        '<div class="mob-stat-val">' + state.progress.points + '</div>' +
        '<div class="mob-stat-lbl">Points</div></div>' +
      '<div class="mob-stat"><div class="mob-stat-icon">📅</div>' +
        '<div class="mob-stat-val">' + state.progress.lessonsCompleted + '</div>' +
        '<div class="mob-stat-lbl">Lessons</div></div>' +
    '</div>' +
    '<div class="mob-action-list">' +
      '<button class="mob-action-btn" onclick="showNotebook()">' +
        '<span class="mob-action-icon">📓</span>' +
        '<div><div class="mob-action-title">My Notebook</div>' +
        '<div class="mob-action-sub">' + state.progress.wordsLearned.length + ' words collected</div></div>' +
      '</button>' +
      '<button class="mob-action-btn" onclick="showFeedback()">' +
        '<span class="mob-action-icon">📝</span>' +
        '<div><div class="mob-action-title">Lesson Feedback</div>' +
        '<div class="mob-action-sub">Rate your session</div></div>' +
      '</button>' +
      '<button class="mob-action-btn" onclick="goHome();switchTab(\'learn\')">' +
        '<span class="mob-action-icon">🏠</span>' +
        '<div><div class="mob-action-title">Home</div>' +
        '<div class="mob-action-sub">Word of the Day &amp; settings</div></div>' +
      '</button>' +
    '</div>';
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
  renderTopics();
  const sel = document.getElementById('topic-select');
  if (sel) sel.value = state.currentTopic;
}

function renderTopics() {
  const grid = document.getElementById('topic-grid');
  if (!grid) return;
  grid.innerHTML = TOPICS.map(t => `
    <button class="topic-chip ${state.currentTopic === t.id ? 'active' : ''}"
      onclick="selectTopic('${t.id}')">
      ${t.label}
    </button>`).join('');
}

function selectTopic(topicId) {
  state.currentTopic = topicId;
  // Sync the dropdown in the header
  const sel = document.getElementById('topic-select');
  if (sel) sel.value = topicId;
  renderTopics();
  showToast(`Topic changed to: ${topicId}`);
  startLesson();
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
  state.session = { wordsThisSession: [], skipList: [], consecutiveCorrect: 0, consecutiveWrong: 0, totalCorrect: 0, totalWrong: 0 };
  document.getElementById('chat-messages').innerHTML = '';
  setMorahStatus('Starting your lesson...');
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
      body: JSON.stringify({ messages, userProfile: { ...state.userProfile, currentTopic: state.currentTopic, session: state.session } })
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

    // Extract and store any skip tags — [SKIP: topic name]
    const skipMatches = rawContent.matchAll(/\[SKIP:\s*([^\]]+)\]/gi);
    for (const match of skipMatches) {
      const topic = match[1].trim();
      if (topic && !state.session.skipList.includes(topic)) {
        state.session.skipList.push(topic);
      }
    }

    // Remove words-learned block and skip tags from displayed text
    const cleanContent = rawContent
      .replace(/📚 WORDS LEARNED:.*$/s, '')
      .replace(/\[SKIP:[^\]]*\]/gi, '')
      .trim();

    state.messages.push({ role: 'assistant', content: rawContent });
    saveProgress();

    const newMsgId = appendMessage('morah', cleanContent, wordsData);

    if (wordsData.length > 0) {
      addWordsToProgress(wordsData);
    }

    // Auto-play Morah's response via OpenAI TTS
    if (newMsgId) speakMessage(newMsgId);

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
      state.session.wordsThisSession.push(word.transliteration || word.english);
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

// ═══════════════════════════════════════════════════════════════════════
// ▼▼▼  CANONICAL VOICE ENGINE — DO NOT MODIFY OR DUPLICATE  ▼▼▼
//
//  ALL speech synthesis goes through speakText(rawText, btn).
//  No other code may call SpeechSynthesisUtterance directly.
//  Open the browser DevTools console to see per-segment logs.
//  Call testHebrew() in the console to test Hebrew audio.
// ═══════════════════════════════════════════════════════════════════════

// ── State ──────────────────────────────────────────────────────────────
const msgContentMap = {};
let msgCounter     = 0;
let activeSpeakBtn = null;
let ttsActive      = false;

// ── Female voice heuristic ──────────────────────────────────────────────
var _FEMALE = [
  'female','samantha','karen','victoria','moira','fiona','tessa','veena',
  'allison','ava','susan','zira','hazel','eva','emily','sara','linda',
  'joanna','salli','kimberly','kendra','ivy','ruth','helena','alice',
  'amelie','anna','carmit','damayanti','ioana','kyoko','laura','lekha',
  'luciana','mariska','melina','milena','nora','paulina','tamar','zosia',
  'google uk english female','microsoft zira','microsoft hazel'
];
function _isFemale(v) {
  var n = v.name.toLowerCase();
  for (var k = 0; k < _FEMALE.length; k++) {
    if (n.indexOf(_FEMALE[k]) >= 0) return true;
  }
  return false;
}

// ── Voice pickers — fetch fresh every call so Chrome list is never stale ─
function _pickHebrewVoice() {
  var vs = window.speechSynthesis.getVoices();
  for (var i = 0; i < vs.length; i++) { if (vs[i].lang === 'he-IL' && _isFemale(vs[i])) return vs[i]; }
  for (var i = 0; i < vs.length; i++) { if (vs[i].lang === 'he-IL') return vs[i]; }
  for (var i = 0; i < vs.length; i++) { if (vs[i].lang.startsWith('he')) return vs[i]; }
  return null;
}
function _pickEnglishVoice() {
  var vs = window.speechSynthesis.getVoices();
  for (var i = 0; i < vs.length; i++) { if (vs[i].name === 'Google UK English Female') return vs[i]; }
  for (var i = 0; i < vs.length; i++) { if (vs[i].lang === 'en-GB' && _isFemale(vs[i])) return vs[i]; }
  for (var i = 0; i < vs.length; i++) { if (vs[i].lang === 'en-GB') return vs[i]; }
  for (var i = 0; i < vs.length; i++) { if (vs[i].name === 'Samantha') return vs[i]; }
  for (var i = 0; i < vs.length; i++) { if (vs[i].lang === 'en-US' && _isFemale(vs[i])) return vs[i]; }
  for (var i = 0; i < vs.length; i++) { if (vs[i].lang.startsWith('en') && _isFemale(vs[i])) return vs[i]; }
  return null;
}

// ── Hebrew character detection — explicit hex, never raw Unicode ──────────
// Covers: full Hebrew block U+0590-U+05FF (letters, nikud, cantillation)
//          + presentation forms U+FB1D-U+FB4F
function _isHebrewChar(code) {
  return (code >= 0x0590 && code <= 0x05FF) ||
         (code >= 0xFB1D && code <= 0xFB4F);
}

// ── Belt-and-suspenders: check if ANY character in a string is Hebrew ────
function _containsHebrew(str) {
  for (var i = 0; i < str.length; i++) {
    if (_isHebrewChar(str.charCodeAt(i))) return true;
  }
  return false;
}

// ── Pronunciation dictionary (Latin / transliteration segments only) ─────
var _PHONETICS = {
  'todah rabah':    'to-DAH ra-BAH',
  'boker tov':      'BOH-ker tov',
  'erev tov':       'EH-rev tov',
  'laila tov':      'LYE-la tov',
  'shabbat shalom': 'sha-BAT sha-LOME',
  'kol hakavod':    'kohl ha-ka-VODE',
  'tikkun olam':    'tee-KOON oh-LAHM',
  'shalom':    'sha-LOME',   'todah':     'to-DAH',
  'bevakasha': 'be-va-ka-SHAH', 'lehitraot': 'le-hit-ra-OHT',
  'anachnu':   'ah-NAKH-noo',  'atem':    'ah-TEM',
  'sababa':    'sa-BA-ba',    'yalla':   'YAH-la',
  'walla':     'WAH-la',      'stam':    'stahm',
  'achi':      'ah-KHEE',     'ahoti':   'ah-HOH-tee',
  'davka':     'DAV-ka',      'yoffi':   'YOF-ee',
  'metzuyan':  'me-tsoo-YAN', 'beseder': 'be-SEH-der',
  'mayim':     'MA-yim',      'lechem':  'LEH-khem',
  'bayit':     'BA-yit',      'yom':     'yome',
  'lailah':    'LYE-la',      'ahavah':  'a-ha-VAH',
  'eretz':     'EH-rets',     'shamayim':'sha-MA-yim',
  'sefer':     'SEH-fer',     'nefesh':  'NEH-fesh',
  'ruakh':     'ROO-akh',     'emunah':  'e-moo-NAH',
  'emet':      'EH-met',      'khesed':  'KHEH-sed',
  'kavod':     'ka-VODE',     'tzedek':  'TZEH-dek',
  'mitzvah':   'mitz-VAH',    'kavanah': 'ka-va-NAH',
  'bereshit':  'be-re-SHEET', 'mishpakhah':'mish-pa-KHAH',
  'gadol':     'ga-DOLE',     'katan':   'ka-TAN',
  'yafeh':     'ya-FEH',      'yafah':   'ya-FAH',
  'kashuv':    'ka-SHOOV',    'maher':   'ma-HEHR',
  'larutz':    'la-ROOTS',    'ledaber': 'le-da-BEHR',
  'lakhshov':  'lakh-SHOHV',  'lehavin': 'le-ha-VEEN',
  'likhtov':   'likh-TOVE',   'lalechet':'la-LEH-khet',
  'halakhti':  'ha-lakh-TEE', 'halakhta':'ha-LAKH-ta',
  'halekhu':   'ha-lekh-OO',  'yelekh':  'ye-LEKH',
  'diber':     'dee-BEHR',    'hevin':   'he-VEEN',
  'katav':     'ka-TAV',      'etmol':   'et-MOLE',
  'makhar':    'ma-KHAR',     'akhshav': 'akh-SHAHV',
  'hayom':     'ha-YOME',     'binyan':  'bin-YAN',
  'avar':      'a-VAR',       'atid':    'a-TEED',
  'ani':       'ah-NEE',      'ata':     'ah-TAH',
  'at':        'aht',         'hu':      'hoo',
  'hi':        'hee',         'ken':     'kehn',
  'lo':        'loh',         'nu':      'noo',
  'tov':       'tove',        'ra':      'rah',
  'lev':       'lehv',        'ir':      'eer',
  'paal':      'pa-AHL',      'hifil':   'hee-FEEL',
};
var _PHON_KEYS = Object.keys(_PHONETICS).sort(function(a,b){ return b.length - a.length; });

// ── Text cleaning — IMPORTANT: no raw Unicode chars in regex patterns ────
function _cleanText(raw) {
  return raw
    .replace(/\[TEACH\]|\[\/TEACH\]/g, '')
    .replace(/\[CHALLENGE\][\s\S]*?\[\/CHALLENGE\]/g, '')
    .replace(/\[RESULT:[^\]]*\]/g, '')
    .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')
    .replace(/[\u{2600}-\u{27BF}]/gu, '')
    .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '')
    .replace(/[\u{FE00}-\u{FEFF}]/gu, '')
    .replace(/📚 WORDS LEARNED:[\s\S]*/g, '')
    .replace(/\*+/g, '')
    .replace(/[#`~_>|\\]/g, '')
    .replace(/[.!?]+/g, '\n')
    .replace(/[,—–;:]/g, ' ')
    // WHITELIST — keep only: ASCII letters/digits, Hebrew block, spaces, newlines.
    // Written with \uXXXX escapes so no encoding drift can corrupt them.
    .replace(/[^a-zA-Z0-9֐-׿יִ-ﭏ\s\n]/g, '')
    .replace(/[^\S\n]+/g, ' ')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

// ── Transliteration phonetic fixes (Latin segments only) ─────────────────
function _fixPronunciation(text) {
  var r = text;
  _PHON_KEYS.forEach(function(w) {
    var re = new RegExp('(?<![\\w-])' + w.replace(/[-]/g, '\\-') + '(?![\\w-])', 'gi');
    r = r.replace(re, _PHONETICS[w]);
  });
  r = r.replace(/ch/gi, 'kh');          // chet/khaf
  r = r.replace(/tz/gi, 'ts');          // tzadik
  r = r.replace(/ai/gi, 'eye');         // diphthong ai → eye
  r = r.replace(/ei\b/gi, 'ay');        // word-final ei → ay
  return r;
}

// ── Character-level Hebrew/Latin run splitter ─────────────────────────────
function _segmentRuns(text) {
  var runs = [], cur = '', curHeb = null;
  for (var i = 0; i < text.length; i++) {
    var isHeb = _isHebrewChar(text.charCodeAt(i));
    if (curHeb === null) curHeb = isHeb;
    if (isHeb !== curHeb) {
      if (cur.trim()) runs.push({ text: cur, isHebrew: curHeb });
      cur = ''; curHeb = isHeb;
    }
    cur += text[i];
  }
  if (cur.trim()) runs.push({ text: cur, isHebrew: curHeb });
  return runs;
}

// ── Build final utterance segment list ────────────────────────────────────
function _buildSegments(cleanedText) {
  var lines = cleanedText.split('\n')
    .map(function(s) { return s.trim(); })
    .filter(function(s) { return s.length > 0; });

  var segments = [];
  lines.forEach(function(line, li) {
    var isLastLine = (li === lines.length - 1);
    _segmentRuns(line).forEach(function(run, ri, arr) {
      var spoken = run.isHebrew
        ? run.text.trim()
        : _fixPronunciation(run.text.trim());
      // Whitelist — \uXXXX escapes, immune to encoding drift:
      spoken = spoken
        .replace(/[^a-zA-Z0-9֐-׿יִ-ﭏ\s\-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (!spoken) return;
      segments.push({
        text:       spoken,
        isHebrew:   run.isHebrew,
        pauseAfter: (ri === arr.length - 1 && !isLastLine) ? 350 : 250,
      });
    });
  });
  return segments;
}

// ── Button state helper ───────────────────────────────────────────────────
function setSpeakBtnState(btn, active) {
  if (!btn) return;
  btn.innerHTML = active ? '⏹ <span>Stop</span>' : '🔊 <span>Hear Morah</span>';
  btn.classList.toggle('speaking', active);
}

// ── Stop speech ───────────────────────────────────────────────────────────
function stopSpeech() {
  ttsActive = false;
  if (window.speechSynthesis) window.speechSynthesis.cancel();
  setSpeakBtnState(activeSpeakBtn, false);
  activeSpeakBtn = null;
}

// ── speakText — THE ONLY ENTRY POINT ─────────────────────────────────────
function speakText(rawText, btn) {
  if (!window.speechSynthesis) return;
  if (!rawText || !rawText.trim()) return;

  if (ttsActive) {
    var wasBtn = activeSpeakBtn;
    stopSpeech();
    if (btn && btn === wasBtn) return;
  }

  var clean = _cleanText(rawText);
  if (!clean) { console.warn('[TTS] _cleanText returned empty for input:', rawText.slice(0,80)); return; }

  var segments = _buildSegments(clean);
  if (!segments.length) { console.warn('[TTS] No segments after building. Clean text:', clean.slice(0,80)); return; }

  console.log('[TTS] Starting. Segments:', segments.length, '| Raw snippet:', rawText.slice(0,60));

  ttsActive      = true;
  activeSpeakBtn = btn || null;
  setSpeakBtnState(btn, true);
  var idx = 0;

  function next() {
    if (!ttsActive || idx >= segments.length) {
      ttsActive = false;
      setSpeakBtnState(activeSpeakBtn, false);
      activeSpeakBtn = null;
      return;
    }
    var seg = segments[idx++];

    // Belt-and-suspenders: force Hebrew routing even if segmentation missed it.
    var treatAsHebrew = seg.isHebrew || _containsHebrew(seg.text);
    var hv = treatAsHebrew ? _pickHebrewVoice() : null;

    // ── Per-segment log (open DevTools Console to see this) ─────────────
    console.log(
      '[TTS seg ' + idx + '/' + segments.length + ']',
      JSON.stringify(seg.text),
      '| hebrew=' + treatAsHebrew,
      '| nativeVoice=' + (hv ? hv.name : 'none'),
      '| googleTTS-fallback=' + (treatAsHebrew && !hv ? 'YES' : 'no')
    );

    // ── HEBREW FALLBACK: Google Translate TTS via Audio element ─────────
    // Used when no native he-IL voice is installed in the OS.
    // new Audio() is not subject to CORS restrictions — loads directly.
    if (treatAsHebrew && !hv) {
      var gtUrl = 'https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=he&ttsspeed=0.7&q='
                  + encodeURIComponent(seg.text);
      var gtAudio = new Audio(gtUrl);
      gtAudio.volume = 1.0;
      console.log('[TTS] Google Translate TTS:', seg.text);
      gtAudio.onended = function() { setTimeout(next, seg.pauseAfter); };
      gtAudio.onerror = function(e) {
        console.error('[TTS] Google TTS failed:', e.type, gtUrl);
        setTimeout(next, seg.pauseAfter);  // skip segment, keep going
      };
      gtAudio.play().catch(function(err) {
        console.error('[TTS] Audio.play() rejected:', err.message);
        setTimeout(next, seg.pauseAfter);
      });
      return;  // Google TTS handles this segment; Web Speech not called
    }

    // ── Web Speech API (English always; Hebrew when native voice exists) ─
    var u = new SpeechSynthesisUtterance(seg.text);
    if (treatAsHebrew) {
      u.lang = 'he-IL';
      if (hv) u.voice = hv;
    } else {
      u.lang = 'en-GB';
      var ev = _pickEnglishVoice();
      if (ev) { u.voice = ev; u.lang = ev.lang; }
    }
    u.rate = 0.85; u.pitch = 1.1; u.volume = 1.0;
    u.onend  = function() { setTimeout(next, seg.pauseAfter); };
    u.onerror = function(e) {
      console.error('[TTS error]', e.error, '| text:', seg.text, '| lang:', u.lang);
      ttsActive = false;
      setSpeakBtnState(activeSpeakBtn, false);
      activeSpeakBtn = null;
    };
    window.speechSynthesis.speak(u);
  }

  if (window.speechSynthesis.getVoices().length === 0) {
    var _onReady = function() {
      window.speechSynthesis.removeEventListener('voiceschanged', _onReady);
      next();
    };
    window.speechSynthesis.addEventListener('voiceschanged', _onReady);
  } else {
    next();
  }
}
// ▲▲▲  END speakText — DO NOT ADD SPEECH CALLS OUTSIDE THIS BLOCK  ▲▲▲

// ── Self-test (runs once on load) ─────────────────────────────────────────
(function _ttsSelfTest() {
  var r = {
    aleph:   _isHebrewChar(0x05D0),  // must be true
    shin:    _isHebrewChar(0x05E9),  // must be true
    nikud:   _isHebrewChar(0x05B8),  // must be true
    asciiA:  _isHebrewChar(0x0041),  // must be false
    space:   _isHebrewChar(0x0020),  // must be false
    shalomStr: _containsHebrew('שָׁלוֹמ') // שָׁלוֹם → true
  };
  var ok = r.aleph && r.shin && r.nikud && !r.asciiA && !r.space && r.shalomStr;
  console.log('[TTS self-test]', ok ? 'PASSED' : 'FAILED', r);
  if (!ok) console.error('[TTS] SELF-TEST FAILED — Hebrew detection broken. Check _isHebrewChar.');
})();

// ── testHebrew() — call this in the browser console to test Hebrew audio ──
window.testHebrew = function() {
  var hv = _pickHebrewVoice();
  console.log('[TTS] testHebrew() called');
  console.log('[TTS]   native he-IL voice :', hv ? hv.name : 'NONE — will use Google Translate TTS');
  speakText('שָׁלוֹם');
};

// ── Thin wrapper ──────────────────────────────────────────────────────────
function speakMessage(msgId) {
  var btn = document.querySelector('[data-speak-id="' + msgId + '"]');
  speakText(msgContentMap[msgId] || '', btn);
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

  // Auto-speak the Hebrew word through the canonical speakText() — no direct utterances.
  if (hebMatch) {
    setTimeout(() => speakText(hebMatch[0].trim()), 400);
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
  setTimeout(() => sendChallengeResult(correct, challenge, challenge.options ? challenge.options[selected] : null), 800);
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
  setTimeout(() => sendChallengeResult(correct, challenge, input.value.trim()), 800);
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
  setTimeout(() => sendChallengeResult(correct, challenge, selected ? 'True' : 'False'), 800);
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
        setTimeout(() => sendChallengeResult(true, challengeStore[cId].challenge, 'all pairs matched'), 800);
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

// After every challenge answer, send a silent result message so Morah always responds
function sendChallengeResult(correct, challenge, chosenLabel) {
  let msg;
  if (correct) {
    msg = '[RESULT: correct]';
    if (challenge.question) msg += ' Question: ' + challenge.question;
  } else {
    msg = '[RESULT: wrong]';
    if (chosenLabel)                                      msg += ' Student chose: "' + chosenLabel + '".';
    if (challenge.options && challenge.correct !== undefined) msg += ' Correct answer: "' + challenge.options[challenge.correct] + '".';
    if (challenge.answer)                                 msg += ' Correct answer: "' + challenge.answer + '".';
    if (challenge.statement)                              msg += ' Statement was: "' + challenge.statement + '". Correct: ' + challenge.correct + '.';
    if (challenge.explanation)                            msg += ' Explanation: ' + challenge.explanation;
  }
  // Push silently — no user bubble in chat
  state.messages.push({ role: 'user', content: msg });
  // Trigger Morah's response
  sendToMorah(state.messages);
}

function awardChallengePoints(correct, pts) {
  // Track session streak for difficulty adaptation
  if (correct) {
    state.session.consecutiveCorrect++;
    state.session.consecutiveWrong = 0;
    state.session.totalCorrect++;
  } else {
    state.session.consecutiveWrong++;
    state.session.consecutiveCorrect = 0;
    state.session.totalWrong++;
  }

  if (!correct || pts <= 0) return;
  state.progress.points += pts;
  updateStats();
  saveProgress();
  playCorrectTone();
  showCorrectBurst(pts);
  triggerConfetti();
}

function triggerConfetti() {
  const colors = ['#0038B8','#FFD700','#FFFFFF','#4A90D9','#2E8B57','#FF6B6B','#C0392B'];
  for (let i = 0; i < 48; i++) {
    const c = document.createElement('div');
    c.className = 'confetti-piece';
    c.style.cssText = `
      left:${Math.random()*100}vw;
      background:${colors[Math.floor(Math.random()*colors.length)]};
      width:${5+Math.random()*9}px;
      height:${5+Math.random()*9}px;
      animation-duration:${0.8+Math.random()*1}s;
      animation-delay:${Math.random()*0.4}s;
      border-radius:${Math.random()>0.4?'50%':'3px'};
      transform:rotate(${Math.random()*360}deg);`;
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 2200);
  }
}

function playCorrectTone() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const notes = [523, 659, 784]; // C5-E5-G5 major chord
    notes.forEach(function(freq, i) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.1);
      gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + i * 0.1 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.35);
      osc.start(ctx.currentTime + i * 0.1);
      osc.stop(ctx.currentTime + i * 0.1 + 0.4);
    });
  } catch(e) {}
}

function showCorrectBurst(pts) {
  const el = document.createElement('div');
  el.className = 'correct-burst';
  el.innerHTML = '<span class="burst-check">✓</span><span class="burst-pts">+' + pts + '</span>';
  document.body.appendChild(el);
  setTimeout(function() { el.remove(); }, 1200);
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

// ─── SPEED ROUND ─────────────────────────────────────────
// Beginner — greetings, animals, family, basic nouns/adjectives/numbers
const SR_POOL_BEGINNER = [
  { hebrew:'שָׁלוֹם',     transliteration:'shalom',    english:'hello / peace' },
  { hebrew:'תּוֹדָה',     transliteration:'todah',     english:'thank you' },
  { hebrew:'כֵּן',       transliteration:'ken',       english:'yes' },
  { hebrew:'לֹא',       transliteration:'lo',        english:'no' },
  { hebrew:'בְּבַקָּשָׁה', transliteration:'bevakasha', english:'please / you\'re welcome' },
  { hebrew:'כֶּלֶב',     transliteration:'kelev',     english:'dog' },
  { hebrew:'חָתוּל',     transliteration:'khatul',    english:'cat' },
  { hebrew:'צִפּוֹר',    transliteration:'tzipor',    english:'bird' },
  { hebrew:'דָּג',       transliteration:'dag',       english:'fish' },
  { hebrew:'אִמָּא',     transliteration:'ima',       english:'mom' },
  { hebrew:'אַבָּא',     transliteration:'aba',       english:'dad' },
  { hebrew:'אָח',       transliteration:'akh',       english:'brother' },
  { hebrew:'אָחוֹת',     transliteration:'akhot',     english:'sister' },
  { hebrew:'מַיִם',     transliteration:'mayim',     english:'water' },
  { hebrew:'לֶחֶם',     transliteration:'lechem',    english:'bread' },
  { hebrew:'בַּיִת',     transliteration:'bayit',     english:'house' },
  { hebrew:'יוֹם',      transliteration:'yom',       english:'day' },
  { hebrew:'לַיְלָה',    transliteration:'lailah',    english:'night' },
  { hebrew:'טוֹב',      transliteration:'tov',       english:'good' },
  { hebrew:'גָּדוֹל',    transliteration:'gadol',     english:'big' },
  { hebrew:'קָטָן',     transliteration:'katan',     english:'small' },
  { hebrew:'אֶחָד',     transliteration:'echad',     english:'one' },
  { hebrew:'שְׁנַיִם',   transliteration:'shnayim',   english:'two' },
  { hebrew:'שָׁלוֹשׁ',   transliteration:'shalosh',   english:'three' },
  { hebrew:'אָדֹם',     transliteration:'adom',      english:'red' },
  { hebrew:'כָּחוֹל',    transliteration:'kakhol',    english:'blue' },
  { hebrew:'לָבָן',     transliteration:'lavan',     english:'white' },
  { hebrew:'שָׁחֹר',    transliteration:'shakhor',   english:'black' },
  { hebrew:'שֶׁמֶשׁ',    transliteration:'shemesh',   english:'sun' },
  { hebrew:'סֵפֶר',     transliteration:'sefer',     english:'book' },
];

// Intermediate — verb conjugations, tenses, adjectives, time words, infinitives
const SR_POOL_INTERMEDIATE = [
  { hebrew:'לָרוּץ',     transliteration:'larutz',    english:'to run' },
  { hebrew:'לְדַבֵּר',   transliteration:'ledaber',   english:'to speak' },
  { hebrew:'לַחְשֹׁב',   transliteration:'lakhshov',  english:'to think' },
  { hebrew:'לְהָבִין',   transliteration:'lehavin',   english:'to understand' },
  { hebrew:'לִכְתֹּב',   transliteration:'likhtov',   english:'to write' },
  { hebrew:'לִקְרֹא',    transliteration:'likro',     english:'to read' },
  { hebrew:'לֶאֱכֹל',   transliteration:'le\'ekhol', english:'to eat' },
  { hebrew:'לָלֶכֶת',   transliteration:'lalechet',  english:'to go / walk' },
  { hebrew:'הָלַכְתִּי',  transliteration:'halakhti',  english:'I went (past)' },
  { hebrew:'הָלְכוּ',    transliteration:'halekhu',   english:'they went (past)' },
  { hebrew:'הִיא הָלְכָה', transliteration:'hi halkha', english:'she went (past)' },
  { hebrew:'יֵלֵךְ',     transliteration:'yelekh',    english:'he will go (future)' },
  { hebrew:'אֶכְתֹּב',   transliteration:'ekhtov',    english:'I will write (future)' },
  { hebrew:'דִּבֵּר',    transliteration:'diber',     english:'he spoke (past)' },
  { hebrew:'הֵבִין',    transliteration:'hevin',     english:'he understood (past)' },
  { hebrew:'רָץ',      transliteration:'ratz',      english:'he ran (past)' },
  { hebrew:'אֶתְמוֹל',   transliteration:'etmol',     english:'yesterday' },
  { hebrew:'מָחָר',     transliteration:'makhar',    english:'tomorrow' },
  { hebrew:'עַכְשָׁו',   transliteration:'akhshav',   english:'now' },
  { hebrew:'יָפֶה',     transliteration:'yafeh',     english:'beautiful (m)' },
  { hebrew:'יָפָה',     transliteration:'yafah',     english:'beautiful (f)' },
  { hebrew:'חָשׁוּב',    transliteration:'kashuv',    english:'important' },
  { hebrew:'מְעַנְיֵן',  transliteration:'me\'anyen', english:'interesting' },
  { hebrew:'מַהֵר',     transliteration:'maher',     english:'fast / quickly' },
  { hebrew:'קַל',      transliteration:'kal',       english:'easy / light' },
  { hebrew:'קָשֶׁה',    transliteration:'kashe',     english:'hard / difficult' },
  { hebrew:'בִּנְיָן',   transliteration:'binyan',    english:'verb pattern / building' },
  { hebrew:'עָבָר',     transliteration:'avar',      english:'past tense / passed' },
  { hebrew:'עָתִיד',    transliteration:'atid',      english:'future tense' },
  { hebrew:'הוֹוֶה',    transliteration:'hove',      english:'present tense' },
];

// Advanced — idioms, biblical terms, complex grammar, philosophical vocabulary
const SR_POOL_ADVANCED = [
  { hebrew:'דַּוְקָא',      transliteration:'davka',       english:'specifically / despite' },
  { hebrew:'סְתָם',        transliteration:'stam',        english:'just / for no reason' },
  { hebrew:'עַל הַפָּנִים', transliteration:'al hapanim',  english:'awesome (lit: on the face)' },
  { hebrew:'חֶסֶד',        transliteration:'khesed',      english:'lovingkindness / mercy' },
  { hebrew:'אֱמֶת',        transliteration:'emet',        english:'truth' },
  { hebrew:'אֱמוּנָה',     transliteration:'emunah',      english:'faith / belief' },
  { hebrew:'צֶדֶק',        transliteration:'tzedek',      english:'justice / righteousness' },
  { hebrew:'חוֹפֶשׁ',      transliteration:'khofesh',     english:'freedom / vacation' },
  { hebrew:'כָּבוֹד',      transliteration:'kavod',       english:'honor / respect' },
  { hebrew:'נֶפֶשׁ',       transliteration:'nefesh',      english:'soul / self' },
  { hebrew:'רוּחַ',        transliteration:'ruakh',       english:'spirit / wind' },
  { hebrew:'לֵב',         transliteration:'lev',         english:'heart / mind' },
  { hebrew:'מִצְוָה',      transliteration:'mitzvah',     english:'commandment / good deed' },
  { hebrew:'גָּלוּת',      transliteration:'galut',       english:'exile / diaspora' },
  { hebrew:'בְּרֵאשִׁית',   transliteration:'bereshit',    english:'in the beginning (Genesis)' },
  { hebrew:'תִּקּוּן עוֹלָם', transliteration:'tikkun olam', english:'repairing the world' },
  { hebrew:'לְדוֹר וָדוֹר', transliteration:'ledor vador', english:'from generation to generation' },
  { hebrew:'חִנָּם',        transliteration:'khinam',      english:'for free / in vain' },
  { hebrew:'לְהִתְבּוֹנֵן',  transliteration:'lehitbonen',  english:'to contemplate' },
  { hebrew:'לְהִתְפַּשֵּׁר',  transliteration:'lehitpasher', english:'to compromise' },
  { hebrew:'הִתְפַּעֲלוּת',  transliteration:'hitpa\'alut', english:'excitement / hitpa\'el form' },
  { hebrew:'גְּאֻלָּה',     transliteration:'ge\'ulah',    english:'redemption' },
  { hebrew:'שְׁכִינָה',     transliteration:'shekhinah',   english:'divine presence' },
  { hebrew:'כִּבְיָכוֹל',   transliteration:'kivyakhol',   english:'so to speak / as it were' },
  { hebrew:'עַמְּךָ עַמִּי', transliteration:'amekha ami',  english:'your people are my people' },
  { hebrew:'לֹא בַשָּׁמַיִם הִיא', transliteration:'lo vashamayim hi', english:'it is not in heaven (Deut)' },
  { hebrew:'מִדָּה כְּנֶגֶד מִדָּה', transliteration:'mida keneged mida', english:'measure for measure' },
  { hebrew:'בִּלְשׁוֹן הַקֹּדֶשׁ', transliteration:'bilshon hakodesh', english:'in the holy tongue' },
  { hebrew:'צַדִּיק',       transliteration:'tzaddik',     english:'righteous person' },
  { hebrew:'כַּוָּנָה',      transliteration:'kavanah',     english:'intention / devotion' },
];

const SR_MESSAGES = [
  { min:0,  max:3,  emoji:'💪', msg:'Even the Maccabees had bad days. You\'ll crush it next time!' },
  { min:4,  max:6,  emoji:'👍', msg:'Sababa! Not bad — keep going, you\'re getting there!' },
  { min:7,  max:9,  emoji:'🔥', msg:'Kol HaKavod! Almost perfect — you\'ve got this!' },
  { min:10, max:10, emoji:'🇮🇱', msg:'You\'re basically Israeli now. Mazal tov!' },
];

const sr = {
  active: false,
  words: [],
  pool: [],
  idx: 0,
  correct: 0,
  timeLeft: 60,
  timer: null,
  answered: false,
  pointsEarned: 0
};

function getSRBuiltInPool() {
  var level = (state.userProfile && state.userProfile.level) || 'complete_beginner';
  if (level === 'advanced') return SR_POOL_ADVANCED;
  if (level === 'intermediate') return SR_POOL_INTERMEDIATE;
  return SR_POOL_BEGINNER; // complete_beginner, some_exposure, basic
}

function buildSRPool() {
  var builtIn = getSRBuiltInPool();
  // Include learned words — Morah already taught them at the right level
  var learned = state.progress.wordsLearned.map(function(w) {
    return { hebrew: w.hebrew, transliteration: w.transliteration, english: w.english };
  });
  var seen = {};
  var combined = [];
  learned.concat(builtIn).forEach(function(w) {
    if (!seen[w.hebrew] && w.english) { seen[w.hebrew] = true; combined.push(w); }
  });
  return combined;
}

function shuffle(arr) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
  }
  return a;
}

function startSpeedRound() {
  sr.pool = buildSRPool();
  if (sr.pool.length < 4) { showToast('Learn a few more words first!'); return; }

  sr.words   = shuffle(sr.pool).slice(0, 10);
  sr.idx     = 0;
  sr.correct = 0;
  sr.timeLeft = 60;
  sr.answered = false;
  sr.pointsEarned = 0;
  sr.active  = true;

  document.getElementById('sr-modal').style.display = 'flex';
  document.getElementById('sr-game').style.display  = 'flex';
  document.getElementById('sr-results').style.display = 'none';

  updateSRTimer();
  renderSRWord();

  sr.timer = setInterval(function() {
    sr.timeLeft--;
    updateSRTimer();
    if (sr.timeLeft <= 0) endSpeedRound();
  }, 1000);
}

function updateSRTimer() {
  const num = document.getElementById('sr-timer-num');
  const bar = document.getElementById('sr-timer-bar');
  if (num) num.textContent = sr.timeLeft;
  if (bar) {
    bar.style.width = (sr.timeLeft / 60 * 100) + '%';
    bar.className = 'sr-timer-bar' +
      (sr.timeLeft <= 10 ? ' danger' : sr.timeLeft <= 20 ? ' warning' : '');
  }
  if (num) {
    num.className = 'sr-timer-num' +
      (sr.timeLeft <= 10 ? ' danger' : sr.timeLeft <= 20 ? ' warning' : '');
  }
}

function renderSRWord() {
  const word = sr.words[sr.idx];
  const card = document.getElementById('sr-word-card');

  document.getElementById('sr-word-num').textContent = (sr.idx + 1) + ' / ' + sr.words.length;
  document.getElementById('sr-stat-correct').textContent = sr.correct + ' ✓';

  // Animate card in
  if (card) { card.classList.remove('sr-slide-in'); void card.offsetWidth; card.classList.add('sr-slide-in'); }
  document.getElementById('sr-hebrew').textContent = word.hebrew;
  document.getElementById('sr-trans').textContent  = word.transliteration;

  // Build 4 options: 1 correct + 3 distractors
  const distractors = shuffle(sr.pool.filter(function(w) { return w.hebrew !== word.hebrew; })).slice(0, 3);
  const options = shuffle([word].concat(distractors));

  const container = document.getElementById('sr-options');
  container.innerHTML = '';
  options.forEach(function(opt) {
    const btn = document.createElement('button');
    btn.className = 'sr-opt-btn';
    btn.textContent = opt.english;
    btn.onclick = function() { answerSR(opt, word, btn, container); };
    container.appendChild(btn);
  });
}

function answerSR(chosen, correct, btn, container) {
  if (sr.answered) return;
  sr.answered = true;

  const isCorrect = chosen.hebrew === correct.hebrew;

  // Highlight all buttons
  Array.from(container.children).forEach(function(b) {
    b.disabled = true;
    if (b.textContent === correct.english) {
      b.classList.add('sr-correct');
    } else if (b === btn && !isCorrect) {
      b.classList.add('sr-wrong');
    }
  });

  if (isCorrect) {
    sr.correct++;
    sr.pointsEarned += 10;
    state.progress.points += 10;
    updateStats();
    saveProgress();
    playCorrectTone();
  }

  // Brief pause then advance
  setTimeout(function() {
    sr.idx++;
    sr.answered = false;
    if (sr.idx >= sr.words.length) {
      endSpeedRound();
    } else {
      renderSRWord();
    }
  }, isCorrect ? 600 : 1000);
}

function endSpeedRound() {
  clearInterval(sr.timer);
  sr.active = false;

  const pct = sr.correct / sr.words.length;
  const msg = SR_MESSAGES.find(function(m) { return sr.correct >= m.min && sr.correct <= m.max; }) || SR_MESSAGES[0];

  document.getElementById('sr-game').style.display    = 'none';
  document.getElementById('sr-results').style.display = 'flex';
  document.getElementById('sr-results-emoji').textContent = msg.emoji;
  document.getElementById('sr-results-msg').textContent   = msg.msg;
  document.getElementById('res-correct').textContent  = sr.correct + ' / ' + sr.words.length;
  document.getElementById('res-time').textContent     = sr.timeLeft + 's';
  document.getElementById('res-points').textContent   = '+' + sr.pointsEarned;

  if (sr.correct === sr.words.length) triggerConfetti();
}

function quitSpeedRound() {
  clearInterval(sr.timer);
  sr.active = false;
  closeSpeedRound();
}

function closeSpeedRound() {
  clearInterval(sr.timer);
  sr.active = false;
  document.getElementById('sr-modal').style.display = 'none';
}

// ─── NOTEBOOK ────────────────────────────────────────────
const CATEGORY_ORDER = ['verb','noun','adjective','greeting','number','phrase','preposition','adverb','other'];
const CATEGORY_LABELS = {
  verb: 'Verbs', noun: 'Nouns', adjective: 'Adjectives', greeting: 'Greetings',
  number: 'Numbers', phrase: 'Phrases', preposition: 'Prepositions',
  adverb: 'Adverbs', other: 'Other'
};

function showNotebook() {
  renderNotebook('');
  document.getElementById('notebook-panel').style.display = 'flex';
  document.getElementById('notebook-overlay').style.display = 'block';
  document.getElementById('notebook-search').value = '';
  document.getElementById('notebook-search').focus();
}

function closeNotebook() {
  document.getElementById('notebook-panel').style.display = 'none';
  document.getElementById('notebook-overlay').style.display = 'none';
}

function filterNotebook(query) {
  renderNotebook(query.toLowerCase().trim());
}

function renderNotebook(query) {
  const words = state.progress.wordsLearned;
  const filtered = query
    ? words.filter(w =>
        (w.hebrew || '').includes(query) ||
        (w.transliteration || '').toLowerCase().includes(query) ||
        (w.english || '').toLowerCase().includes(query))
    : words;

  document.getElementById('notebook-sub').textContent =
    words.length + ' word' + (words.length !== 1 ? 's' : '') + ' learned';

  // Group by category
  const groups = {};
  filtered.forEach(function(w) {
    const cat = w.category || 'other';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(w);
  });

  const body = document.getElementById('notebook-body');
  if (!filtered.length) {
    body.innerHTML = '<div class="notebook-empty">' +
      (query ? 'No words matching "' + escapeHtml(query) + '"' : 'No words yet — start a lesson!') +
      '</div>';
    return;
  }

  let html = '';
  CATEGORY_ORDER.forEach(function(cat) {
    if (!groups[cat] || !groups[cat].length) return;
    html += '<div class="nb-category">';
    html += '<div class="nb-cat-title">' + (CATEGORY_LABELS[cat] || cat) +
            ' <span class="nb-cat-count">' + groups[cat].length + '</span></div>';
    html += '<div class="nb-words">';
    groups[cat].forEach(function(w) {
      html += '<div class="nb-word">' +
        '<span class="nb-heb">' + escapeHtml(w.hebrew || '') + '</span>' +
        '<span class="nb-trans">' + escapeHtml(w.transliteration || '') + '</span>' +
        '<span class="nb-eng">' + escapeHtml(w.english || '') + '</span>' +
        '</div>';
    });
    html += '</div></div>';
  });
  body.innerHTML = html;
}

// ─── CURRICULUM MAP ──────────────────────────────────────
const CURRICULUM = [
  {
    id: 'unit1',
    title: 'Unit 1: The Basics',
    titleHeb: 'יְסוֹדוֹת',
    levelReq: 0,
    color: '#2E8B57',
    lessons: [
      { id: 'u1l1', title: 'The Aleph-Bet',   icon: '🔤', prompt: 'Teach me the Hebrew alphabet — the Aleph-Bet. Start with the first several letters, their names, and how to recognize and write them. Make it fun and visual.' },
      { id: 'u1l2', title: 'Greetings',        icon: '👋', prompt: 'Teach me essential Hebrew greetings: shalom, boker tov, erev tov, lailah tov, lehitraot, and how to say "how are you" and "what\'s up" in Israeli Hebrew.' },
      { id: 'u1l3', title: 'Numbers 1–10',     icon: '🔢', prompt: 'Teach me Hebrew numbers 1 through 10. Include both masculine and feminine forms, and how to use them in simple phrases.' },
      { id: 'u1l4', title: 'Colors',            icon: '🎨', prompt: 'Teach me Hebrew color words: red, blue, white, black, green, yellow, orange, and pink. Show me how adjectives match gender in Hebrew.' },
      { id: 'u1l5', title: 'Family Words',      icon: '👨‍👩‍👧', prompt: 'Teach me Hebrew family vocabulary: ima, aba, akh, akhot, saba, savta, ben, bat, dod, dodah. Use fun example sentences.' },
    ]
  },
  {
    id: 'unit2',
    title: 'Unit 2: Building Sentences',
    titleHeb: 'מִשְׁפָּטִים',
    levelReq: 2,
    color: '#1B5EE0',
    lessons: [
      { id: 'u2l1', title: 'Present Tense',    icon: '⚡', prompt: 'Teach me how to conjugate verbs in the Hebrew present tense (hove). Cover holekh/holekhet, medaber/medaberet, akhel/okhelet, roeh/roah for all pronouns.' },
      { id: 'u2l2', title: 'Food & Drink',     icon: '🥙', prompt: 'Teach me Hebrew words for common food and drink: lechem, mayim, shoko, tapuakh, falafel, hummus, gvina, basar, dag. Include how to order food in a restaurant.' },
      { id: 'u2l3', title: 'Days & Months',    icon: '📅', prompt: 'Teach me the Hebrew days of the week (yom rishon through shabbat) and the Hebrew months. Include how to say today, yesterday, and tomorrow.' },
      { id: 'u2l4', title: 'At Home',          icon: '🏠', prompt: 'Teach me Hebrew vocabulary for rooms and objects in a house: bayit, kheder, mitbakh, shulkhan, kise, mita, delet, khalon, ambatya.' },
      { id: 'u2l5', title: 'Asking Questions', icon: '❓', prompt: 'Teach me how to form questions in Hebrew: ma (what), mi (who), eifoh (where), matai (when), lamah (why), eikh (how), kama (how much/many).' },
    ]
  },
  {
    id: 'unit3',
    title: 'Unit 3: Real Conversation',
    titleHeb: 'שִׂיחָה אֲמִיתִּית',
    levelReq: 3,
    color: '#8B4513',
    lessons: [
      { id: 'u3l1', title: 'Past Tense',       icon: '⏪', prompt: 'Teach me Hebrew past tense (avar). How to conjugate pa\'al binyan verbs in the past for all pronouns: ani, atah/at, hu/hi, anakhnu, atem/aten, hem/hen.' },
      { id: 'u3l2', title: 'Future Tense',     icon: '⏩', prompt: 'Teach me Hebrew future tense (atid). How to conjugate pa\'al binyan verbs in the future for all pronouns. Compare with past and present forms.' },
      { id: 'u3l3', title: 'Adjectives',       icon: '🌟', prompt: 'Teach me common Hebrew adjectives and the rule that they must agree with nouns in gender and number. Cover: gadol/gdolah, katan/ktanah, tov/tovah, yafeh/yafah, etc.' },
      { id: 'u3l4', title: 'Work & School',    icon: '💼', prompt: 'Teach me Hebrew vocabulary for work and school: misrad, beit sefer, moreh/morah, talmid/talmidah, avoda, boss, khalash, makhshev, telefon.' },
      { id: 'u3l5', title: 'Israeli Slang',    icon: '😎', prompt: 'Teach me authentic Israeli slang that\'s used every day: sababa, yalla, walla, stam, nu, al hapanim, davka, achi/ahoti, b\'seder, chill, chai b\'seret.' },
    ]
  },
  {
    id: 'unit4',
    title: 'Unit 4: Advanced Hebrew',
    titleHeb: 'עִבְרִית מִתְקַדֶּמֶת',
    levelReq: 4,
    color: '#6B0AC9',
    lessons: [
      { id: 'u4l1', title: 'The Binyanim',     icon: '🏗️', prompt: 'Teach me the seven Hebrew binyanim (verb patterns): pa\'al, nif\'al, pi\'el, pu\'al, hif\'il, huf\'al, hitpa\'el. Show the pattern and give 2 examples for each.' },
      { id: 'u4l2', title: 'Hebrew Idioms',    icon: '💡', prompt: 'Teach me authentic Hebrew idioms and expressions that Israelis actually use: al ha\'lev, b\'kef, dai, lama lo, kvar, kacha kacha, ein mah la\'asot.' },
      { id: 'u4l3', title: 'Complex Grammar',  icon: '📜', prompt: 'Teach me complex Hebrew sentence structures: relative clauses with she-, conditional sentences with im...az, passive voice, and the construct state (smichut).' },
      { id: 'u4l4', title: 'Biblical Hebrew',  icon: '📖', prompt: 'Teach me the key differences between Biblical Hebrew (lashon hakodesh) and modern Israeli Hebrew. Cover key Torah vocabulary and how ancient roots appear in modern words.' },
      { id: 'u4l5', title: 'Mastery Challenge',icon: '🏆', prompt: 'Give me a comprehensive mastery challenge covering all levels of Hebrew: vocabulary from all categories, grammar patterns, a short reading comprehension, and a conversation exercise.' },
    ]
  }
];

const LEVEL_ORDER = ['complete_beginner', 'some_exposure', 'basic', 'intermediate', 'advanced'];

function showCurriculumMap() {
  renderCurriculumMap();
  document.getElementById('curriculum-panel').style.display = 'flex';
  document.getElementById('curriculum-overlay').style.display = 'block';
}

function closeCurriculumMap() {
  document.getElementById('curriculum-panel').style.display = 'none';
  document.getElementById('curriculum-overlay').style.display = 'none';
}

function renderCurriculumMap() {
  const cp = state.curriculumProgress;
  const level = (state.userProfile && state.userProfile.level) || 'complete_beginner';
  const userLevelIdx = LEVEL_ORDER.indexOf(level);

  let html = '<div class="curriculum-map">';

  CURRICULUM.forEach(function(unit, unitIdx) {
    const unitUnlocked = userLevelIdx >= unit.levelReq;
    const completedCount = unit.lessons.filter(l => cp.completedLessons.includes(l.id)).length;
    const unitClass = unitUnlocked ? '' : 'cm-unit-locked';

    html += `<div class="cm-unit ${unitClass}">`;
    html += `<div class="cm-unit-header" style="background:${unit.color}">
      <div class="cm-unit-num">${unitIdx + 1}</div>
      <div class="cm-unit-info">
        <div class="cm-unit-title">${unitUnlocked ? unit.title : '🔒 ' + unit.title}</div>
        <div class="cm-unit-heb">${unit.titleHeb}</div>
      </div>
      <div class="cm-unit-badge">${completedCount}/${unit.lessons.length}</div>
    </div>`;

    html += '<div class="cm-lessons-list">';

    unit.lessons.forEach(function(lesson, lessonIdx) {
      const isCompleted = cp.completedLessons.includes(lesson.id);
      const isCurrent   = cp.currentLesson === lesson.id;
      const prevDone    = lessonIdx === 0 || cp.completedLessons.includes(unit.lessons[lessonIdx - 1].id);
      const isAvailable = unitUnlocked && (isCompleted || isCurrent || prevDone);
      const isLocked    = !isAvailable;

      const stateClass = isLocked ? 'cm-locked' : (isCompleted ? 'cm-completed' : (isCurrent ? 'cm-current' : 'cm-available'));
      const clickAttr  = isLocked ? '' : `onclick="startCurriculumLesson('${lesson.id}')"`;

      let iconHtml, statusText;
      if (isLocked)    { iconHtml = '🔒'; statusText = 'Complete the previous lesson to unlock'; }
      else if (isCompleted) { iconHtml = '✓'; statusText = 'Completed — tap to review'; }
      else if (isCurrent)   { iconHtml = lesson.icon; statusText = 'In Progress'; }
      else                  { iconHtml = lesson.icon; statusText = 'Tap to start'; }

      html += `<div class="cm-lesson-row ${stateClass}" ${clickAttr}>
        <div class="cm-lesson-circle" style="${unitUnlocked && !isLocked ? '--unit-color:' + unit.color : ''}">${iconHtml}</div>
        <div class="cm-lesson-info">
          <div class="cm-lesson-name">${lesson.title}</div>
          <div class="cm-lesson-status">${statusText}</div>
        </div>
        ${isCurrent ? '<div class="cm-current-tag">Current</div>' : ''}
        ${!isLocked ? '<div class="cm-lesson-arrow">›</div>' : ''}
      </div>`;

      if (lessonIdx < unit.lessons.length - 1) {
        html += `<div class="cm-path-line ${isCompleted ? 'cm-path-done' : ''}"></div>`;
      }
    });

    html += '</div></div>';
  });

  html += '</div>';
  document.getElementById('curriculum-body').innerHTML = html;
}

function startCurriculumLesson(lessonId) {
  let lesson = null;
  for (const unit of CURRICULUM) {
    for (const l of unit.lessons) {
      if (l.id === lessonId) { lesson = l; break; }
    }
    if (lesson) break;
  }
  if (!lesson) return;

  const cp = state.curriculumProgress;
  const prev = cp.currentLesson;
  if (prev && prev !== lessonId && !cp.completedLessons.includes(prev)) {
    cp.completedLessons.push(prev);
  }
  cp.currentLesson = lessonId;

  if (state.userProfile) {
    state.userProfile.lessonContext = lesson.title + ': ' + lesson.prompt;
  }

  closeCurriculumMap();
  saveProgress();

  state.messages = [];
  state.session = {
    wordsThisSession: [],
    skipList: [],
    consecutiveCorrect: 0,
    consecutiveWrong: 0,
    totalCorrect: 0,
    totalWrong: 0
  };

  renderAllMessages();
  showToast(lesson.icon + ' Starting: ' + lesson.title);
  startLesson();
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
