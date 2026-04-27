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
    feedbackGiven: 0,
    activityDays: [],
    topicStats: {}
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

// ── Supabase registration (fire-and-forget — app works without it) ───────────
function _registerWithDb(firstName, lastInitial, school) {
  fetch('/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ firstName, lastInitial, school })
  })
  .then(function(r) { return r.ok ? r.json() : Promise.reject(r.status); })
  .then(function(data) {
    if (data && data.userId) {
      currentUser.userId = data.userId;
      saveUser();
      console.log('[DB] Registered, userId:', data.userId);
    }
  })
  .catch(function(e) { console.warn('[DB] Registration sync failed (offline?):', e); });
}

// ── Score sync — debounced, fire-and-forget ───────────────────────────────────
var _syncTimer = null;
function _syncScoreToDb() {
  if (!currentUser || !currentUser.userId) return;
  clearTimeout(_syncTimer);
  _syncTimer = setTimeout(function() {
    fetch('/api/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId:       currentUser.userId,
        points:       state.progress.points,
        streak:       state.progress.streak,
        wordsLearned: state.progress.wordsLearned.length
      })
    }).catch(function(e) { console.warn('[DB] Score sync failed:', e); });
  }, 3000); // debounce — wait 3s before writing to DB
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
  _registerWithDb(firstName, lastInitial, school);
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
  _syncScoreToDb();
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
    progress: { points: 0, wordsLearned: [], streak: 0, lastLessonDate: null, lessonsCompleted: 0, feedbackGiven: 0, activityDays: [], topicStats: {} },
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

// ─── LEADERBOARD ──────────────────────────────────────────────────────────
var LB_MESSAGES = [
  { min:500, emoji:'🇮🇱', text:'Ata mamash Israeli! You are basically a sabra!',     color:'#D4A017' },
  { min:300, emoji:'🔥', text:'Kol HaKavod! You are absolutely crushing Hebrew!',   color:'#2E8B57' },
  { min:150, emoji:'⭐', text:'Yalla! Keep going — fluency is within reach!',       color:'#1B5EE0' },
  { min:75,  emoji:'💪', text:"B'seder! Great start — the streak is everything!",  color:'#8B4513' },
  { min:0,   emoji:'🌱', text:"Yalla, let's learn! Every word counts!",            color:'#2E8B57' },
];

function _lbId() {
  if (!currentUser) return null;
  return (currentUser.firstName + '_' + currentUser.lastInitial + '_' + currentUser.school)
    .toLowerCase().replace(/[^a-z0-9_]/g, '_');
}

function saveLeaderboardEntry() {
  if (!currentUser) return;
  try {
    var id    = _lbId();
    var board = getLeaderboard();
    var idx   = board.findIndex(function(e) { return e.id === id; });
    var entry = {
      id:      id,
      name:    currentUser.firstName + ' ' + currentUser.lastInitial + '.',
      school:  currentUser.school,
      points:  state.progress.points,
      streak:  state.progress.streak,
      words:   state.progress.wordsLearned.length,
      updated: Date.now()
    };
    if (idx >= 0) board[idx] = entry; else board.push(entry);
    localStorage.setItem('kesher_leaderboard', JSON.stringify(board));
  } catch(e) {}
}

function getLeaderboard() {
  try { var s = localStorage.getItem('kesher_leaderboard'); return s ? JSON.parse(s) : []; }
  catch(e) { return []; }
}

function renderMobileProfile() {
  var body = document.getElementById('mob-me-body');
  if (!body) return;
  saveLeaderboardEntry();

  var avatarMap  = { complete_beginner:'🌱', some_exposure:'🌿', basic:'🌳', intermediate:'⭐', advanced:'🔥' };
  var levelNames = { complete_beginner:'Complete Beginner', some_exposure:'Some Exposure',
                     basic:'Basic', intermediate:'Intermediate', advanced:'Advanced' };
  var lvl    = state.userProfile ? state.userProfile.level : null;
  var name   = currentUser ? (currentUser.firstName + ' ' + currentUser.lastInitial + '.') : (state.userProfile ? state.userProfile.name : 'Student');
  var school = currentUser ? currentUser.school : '';
  var pts    = state.progress.points;
  var lbMsg  = LB_MESSAGES.find(function(m){ return pts >= m.min; }) || LB_MESSAGES[LB_MESSAGES.length-1];

  body.innerHTML =
    '<div class="mob-me-hero">' +
      '<div class="mob-me-avatar">' + (avatarMap[lvl]||'👤') + '</div>' +
      '<div class="mob-me-name">' + escapeHtml(name) + '</div>' +
      (school ? '<div class="mob-me-school">' + escapeHtml(school) + '</div>' : '') +
      '<div class="mob-me-level">' + (levelNames[lvl]||'Hebrew Learner') + '</div>' +
    '</div>' +
    '<div class="mob-stats-grid">' +
      '<div class="mob-stat"><div class="mob-stat-icon">🔥</div><div class="mob-stat-val">' + state.progress.streak + '</div><div class="mob-stat-lbl">Streak</div></div>' +
      '<div class="mob-stat"><div class="mob-stat-icon">📖</div><div class="mob-stat-val">' + state.progress.wordsLearned.length + '</div><div class="mob-stat-lbl">Words</div></div>' +
      '<div class="mob-stat"><div class="mob-stat-icon">⭐</div><div class="mob-stat-val">' + pts + '</div><div class="mob-stat-lbl">Points</div></div>' +
      '<div class="mob-stat"><div class="mob-stat-icon">📅</div><div class="mob-stat-val">' + state.progress.lessonsCompleted + '</div><div class="mob-stat-lbl">Lessons</div></div>' +
    '</div>' +
    '<div class="mob-score-msg" style="border-color:' + lbMsg.color + '">' +
      '<span class="mob-score-emoji">' + lbMsg.emoji + '</span>' +
      '<span>' + lbMsg.text + '</span>' +
    '</div>' +
    '<button class="mob-progress-btn" onclick="showProgressScreen()">📊 My Progress</button>' +
    '<button class="mob-lb-open-btn" onclick="showLeaderboardScreen()">🏆 Leaderboard</button>' +
    '<button class="mob-share-btn" onclick="shareScore()">📤 Share My Score</button>' +
    '<div class="mob-action-list">' +
      '<button class="mob-action-btn" onclick="showNotebook()">' +
        '<span class="mob-action-icon">📓</span>' +
        '<div><div class="mob-action-title">My Notebook</div><div class="mob-action-sub">' + state.progress.wordsLearned.length + ' words collected</div></div>' +
      '</button>' +
      '<button class="mob-action-btn" onclick="showFeedback()">' +
        '<span class="mob-action-icon">📝</span>' +
        '<div><div class="mob-action-title">Lesson Feedback</div><div class="mob-action-sub">Rate your session</div></div>' +
      '</button>' +
      '<button class="mob-action-btn" onclick="goHome();switchTab(' + "'learn'" + ')">' +
        '<span class="mob-action-icon">🏠</span>' +
        '<div><div class="mob-action-title">Home</div><div class="mob-action-sub">Word of the Day &amp; settings</div></div>' +
      '</button>' +
    '</div>';
}

// ─── LEADERBOARD OVERLAY ─────────────────────────────────────────────────────
var MOCK_LEADERS = [
  { id:'mock_yael',    name:'Yael K.',    school:'Beit Rabban',      points:847, streak:23, words:94  },
  { id:'mock_avi',     name:'Avi S.',     school:'Beit Rabban',      points:712, streak:15, words:78  },
  { id:'mock_miriam',  name:'Miriam L.',  school:'Heschel School',   points:634, streak:19, words:71  },
  { id:'mock_noam',    name:'Noam B.',    school:'Ramaz',            points:589, streak:12, words:65  },
  { id:'mock_talia',   name:'Talia R.',   school:'SAR Academy',      points:521, streak:10, words:58  },
  { id:'mock_ethan',   name:'Ethan M.',   school:'Heschel School',   points:478, streak:8,  words:52  },
  { id:'mock_shira',   name:'Shira D.',   school:'Salanter Akiba',   points:412, streak:14, words:46  },
  { id:'mock_lev',     name:'Lev C.',     school:'Ramaz',            points:356, streak:6,  words:40  },
  { id:'mock_dina',    name:'Dina F.',    school:'SAR Academy',      points:298, streak:9,  words:33  },
  { id:'mock_ori',     name:'Ori G.',     school:'Beit Rabban',      points:241, streak:5,  words:27  },
  { id:'mock_maya',    name:'Maya T.',    school:'Heschel School',   points:189, streak:4,  words:22  },
  { id:'mock_jonah',   name:'Jonah W.',   school:'JCHS',             points:145, streak:7,  words:17  },
  { id:'mock_sara',    name:'Sara P.',    school:'Salanter Akiba',   points:98,  streak:3,  words:12  },
  { id:'mock_ben',     name:'Ben H.',     school:'Ramaz',            points:67,  streak:2,  words:8   },
  { id:'mock_rachel',  name:'Rachel Z.',  school:'Beit Rabban',      points:34,  streak:1,  words:5   },
];

function _buildFullBoard(baseBoard) {
  // baseBoard = real DB rows; falls back to MOCK_LEADERS if unavailable
  var board = (baseBoard || MOCK_LEADERS).slice();
  if (currentUser) {
    // Use the Supabase UUID when available so the DB row and the local entry match
    var myId = currentUser.userId || _lbId();
    board = board.filter(function(e) { return e.id !== myId; });
    board.push({
      id:     myId,
      name:   currentUser.firstName + ' ' + currentUser.lastInitial + '.',
      school: currentUser.school,
      points: state.progress.points,
      streak: state.progress.streak,
      words:  state.progress.wordsLearned.length,
      isMe:   true
    });
  }
  board.sort(function(a,b){ return b.points - a.points; });
  return board;
}

function showLeaderboardScreen() {
  var el = document.getElementById('leaderboard-overlay');
  if (el) { el.classList.remove('lb-hidden'); el.classList.add('lb-visible'); }
  renderLeaderboardScreen(null, true); // show immediately with loading state

  fetch('/api/leaderboard')
    .then(function(r) { return r.ok ? r.json() : Promise.reject('HTTP ' + r.status); })
    .then(function(data) {
      renderLeaderboardScreen(Array.isArray(data.leaderboard) ? data.leaderboard : null, false);
    })
    .catch(function(e) {
      console.warn('[DB] Leaderboard fetch failed, using mock data:', e);
      renderLeaderboardScreen(null, false); // fall back to mock data
    });
}

function hideLeaderboardScreen() {
  var el = document.getElementById('leaderboard-overlay');
  if (el) { el.classList.remove('lb-visible'); el.classList.add('lb-hidden'); }
}

function renderLeaderboardScreen(dbBoard, loading) {
  var body = document.getElementById('leaderboard-body');
  if (!body) return;

  if (loading) {
    body.innerHTML = '<div class="lb-loading"><div class="lb-spinner"></div><div class="lb-loading-text">Loading leaderboard…</div></div>';
    return;
  }

  var board  = _buildFullBoard(dbBoard);
  var myId   = _lbId();
  var myRank = 0;
  for (var i = 0; i < board.length; i++) {
    if (board[i].id === myId || board[i].isMe) { myRank = i + 1; break; }
  }
  var myEntry = myRank > 0 ? board[myRank - 1] : null;

  var MEDALS    = ['🥇','🥈','🥉'];
  var MEDAL_BG  = ['#FFF3CD','#F0F0F0','#FFE8D6'];
  var MEDAL_CLR = ['#9A6B00','#6B6B6B','#8B4000'];

  function rankBadge(i) {
    return i < 3
      ? '<span class="lb-medal" style="background:' + MEDAL_BG[i] + ';color:' + MEDAL_CLR[i] + '">' + MEDALS[i] + '</span>'
      : '<span class="lb-rank-num">#' + (i+1) + '</span>';
  }

  function rowHtml(entry, i) {
    var isMe = entry.id === myId || entry.isMe;
    var lvl  = _getLevel ? _getLevel(entry.points) : null;
    return '<div class="lb-row' + (isMe ? ' lb-row-me' : '') + (i < 3 ? ' lb-row-top' : '') + '">' +
      '<div class="lb-row-rank">' + rankBadge(i) + '</div>' +
      '<div class="lb-row-info">' +
        '<div class="lb-row-name">' + escapeHtml(entry.name) +
          (isMe ? ' <span class="lb-you-chip">YOU</span>' : '') +
        '</div>' +
        '<div class="lb-row-school">' + escapeHtml(entry.school) + '</div>' +
      '</div>' +
      '<div class="lb-row-right">' +
        '<div class="lb-row-pts">' + entry.points + ' <span class="lb-pts-label">pts</span></div>' +
        '<div class="lb-row-meta">🔥' + entry.streak + '&nbsp;&nbsp;📖' + entry.words + '</div>' +
      '</div>' +
    '</div>';
  }

  var SHOW_TOP = 10;
  var topRows  = board.slice(0, SHOW_TOP).map(rowHtml).join('');
  var showSep  = myRank > SHOW_TOP && myEntry;
  var myRowHtml = showSep
    ? '<div class="lb-sep">· · ·</div>' + rowHtml(myEntry, myRank - 1)
    : '';

  // Rank card for current user
  var rankCardHtml = myEntry
    ? '<div class="lb-my-rank-card">' +
        '<div class="lb-my-rank-left">' +
          '<div class="lb-my-rank-num">' + (myRank <= 3 ? MEDALS[myRank-1] : '#' + myRank) + '</div>' +
          '<div class="lb-my-rank-label">Your Rank</div>' +
        '</div>' +
        '<div class="lb-my-rank-stats">' +
          '<div class="lb-my-stat"><span class="lb-my-stat-val">' + myEntry.points + '</span><span class="lb-my-stat-lbl">pts</span></div>' +
          '<div class="lb-my-stat"><span class="lb-my-stat-val">' + myEntry.streak + '</span><span class="lb-my-stat-lbl">streak</span></div>' +
          '<div class="lb-my-stat"><span class="lb-my-stat-val">' + myEntry.words + '</span><span class="lb-my-stat-lbl">words</span></div>' +
        '</div>' +
        '<div class="lb-my-rank-msg">' +
          (myRank === 1 ? '🏆 You are #1!' :
           myRank <= 3  ? 'Top 3 — incredible!' :
           myRank <= 5  ? 'Top 5 — keep going!' :
           myRank <= 10 ? 'Top 10 — push harder!' :
                          (myRank <= 3 ? '' : 'Beat ' + (board[myRank-2] ? board[myRank-2].name : 'them') + ' to move up!')) +
        '</div>' +
      '</div>'
    : '<div class="lb-my-rank-card lb-no-user">' +
        '<div class="lb-no-user-msg">Complete a lesson to join the leaderboard!</div>' +
      '</div>';

  body.innerHTML =
    rankCardHtml +
    '<div class="lb-list">' +
      '<div class="lb-list-hdr">' +
        '<span>Learner</span>' +
        '<span>Score</span>' +
      '</div>' +
      topRows +
      myRowHtml +
    '</div>' +
    '<button class="lb-share-btn" onclick="shareScore()">📤 Share My Score &amp; Challenge Friends</button>' +
    '<div class="lb-disclaimer">Rankings include demo students. Compete with real classmates by sharing the app!</div>';
}

function shareScore() {
  var board  = _buildFullBoard();
  var myId   = _lbId();
  var myRank = 0;
  for (var i = 0; i < board.length; i++) {
    if (board[i].id === myId || board[i].isMe) { myRank = i + 1; break; }
  }
  var pts  = state.progress.points;
  var name = currentUser ? (currentUser.firstName + ' ' + currentUser.lastInitial + '.') : 'A learner';
  var school = currentUser ? currentUser.school : '';
  var rankLine = myRank > 0 ? 'Ranked #' + myRank + ' out of ' + board.length + ' learners' : '';

  var text =
    'I am learning Hebrew with Kesher Ivrit!\n' +
    '---\n' +
    name + (school ? '  |  ' + school : '') + '\n' +
    pts + ' points   ' + state.progress.streak + '-day streak   ' + state.progress.wordsLearned.length + ' words\n' +
    (rankLine ? rankLine + '\n' : '') +
    '---\n' +
    'Can you beat me? kesher-ivrit.vercel.app';

  function copied() { showToast('Copied! Share with your classmates!'); }
  function fallback() {
    var ta = document.createElement('textarea');
    ta.value = text; ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); copied(); } catch(e) { showToast('Long-press to copy manually'); }
    document.body.removeChild(ta);
  }
  if (navigator.clipboard && navigator.clipboard.writeText)
    navigator.clipboard.writeText(text).then(copied).catch(fallback);
  else fallback();
}

// ─── LEVEL SYSTEM & PROGRESS SCREEN ──────────────────────────────────────────
var LEVELS = [
  { name:'Beginner',     emoji:'🌱', min:0,    max:99,   color:'#2E8B57' },
  { name:'Elementary',   emoji:'🌿', min:100,  max:299,  color:'#27ae60' },
  { name:'Intermediate', emoji:'🌳', min:300,  max:599,  color:'#1B5EE0' },
  { name:'Advanced',     emoji:'⭐', min:600,  max:999,  color:'#D4A017' },
  { name:'Fluent',       emoji:'🔥', min:1000, max:99999,color:'#C0392B' },
];

function _getLevel(pts) {
  for (var i = LEVELS.length - 1; i >= 0; i--) {
    if (pts >= LEVELS[i].min) return LEVELS[i];
  }
  return LEVELS[0];
}

function showProgressScreen() {
  renderProgressScreen();
  var el = document.getElementById('progress-overlay');
  if (el) { el.classList.remove('prog-hidden'); el.classList.add('prog-visible'); }
}

function hideProgressScreen() {
  var el = document.getElementById('progress-overlay');
  if (el) { el.classList.remove('prog-visible'); el.classList.add('prog-hidden'); }
}

function renderProgressScreen() {
  var body = document.getElementById('progress-body');
  if (!body) return;

  var pts          = state.progress.points;
  var words        = state.progress.wordsLearned.length;
  var streak       = state.progress.streak;
  var lessons      = state.progress.lessonsCompleted;
  var activityDays = state.progress.activityDays || [];
  var topicStats   = state.progress.topicStats   || {};

  // Level progress
  var level    = _getLevel(pts);
  var lvlIdx   = LEVELS.indexOf(level);
  var nextLvl  = lvlIdx < LEVELS.length - 1 ? LEVELS[lvlIdx + 1] : null;
  var lvlPct   = nextLvl ? Math.min(100, Math.round(((pts - level.min) / (nextLvl.min - level.min)) * 100)) : 100;
  var toNext   = nextLvl ? (nextLvl.min - pts) : 0;

  // Words goal
  var wordGoals = [25, 50, 100, 200, 500, 1000];
  var wordGoal  = wordGoals.find(function(g){ return g > words; }) || (words + 100);
  var wordPct   = Math.min(100, Math.round((words / wordGoal) * 100));

  // Topics / curriculum
  var completed  = (state.curriculumProgress && state.curriculumProgress.completedLessons) || [];
  var totalLsn   = 0;
  if (typeof CURRICULUM !== 'undefined') {
    CURRICULUM.forEach(function(u){ totalLsn += (u.lessons||[]).length; });
  }
  var masterPct = totalLsn > 0 ? Math.round((completed.length / totalLsn) * 100) : 0;

  // Weekly activity (last 7 days)
  var today      = new Date();
  var DAY_SHORT  = ['Su','M','Tu','W','Th','F','Sa'];
  var weekDots   = '';
  var weekCount  = 0;
  for (var d = 6; d >= 0; d--) {
    var day     = new Date(today.getFullYear(), today.getMonth(), today.getDate() - d);
    var iso     = day.toISOString().split('T')[0];
    var active  = activityDays.indexOf(iso) >= 0;
    var isToday = d === 0;
    if (active) weekCount++;
    weekDots += '<div class="prog-day' + (active ? ' prog-day-on' : '') + (isToday ? ' prog-day-today' : '') + '">' +
      '<div class="prog-day-dot"></div>' +
      '<div class="prog-day-lbl">' + DAY_SHORT[day.getDay()] + '</div>' +
    '</div>';
  }
  var weekMsg = weekCount >= 6 ? 'Perfect week! You are unstoppable!' :
                weekCount >= 4 ? 'Great consistency this week!' :
                weekCount >= 2 ? 'Good habit forming — keep going!' :
                                 'Practice daily to build your streak!';

  // Topic performance
  var topicPerf = [];
  Object.keys(topicStats).forEach(function(id) {
    var s = topicStats[id];
    var total = (s.correct||0) + (s.wrong||0);
    if (total < 3) return;
    topicPerf.push({
      id: id,
      label: id,
      correct: s.correct||0,
      wrong: s.wrong||0,
      pct: Math.round(((s.correct||0) / total) * 100),
      total: total
    });
  });
  topicPerf.sort(function(a,b){ return b.pct - a.pct; });
  var strongest = topicPerf.slice(0, 3);
  var weakest   = topicPerf.length > 3 ? topicPerf.slice(-Math.min(3, topicPerf.length - 1)).reverse() : [];

  function barHtml(pct, color, cls) {
    cls = cls || '';
    return '<div class="prog-bar-track">' +
      '<div class="prog-bar-fill ' + cls + '" style="width:0;background:' + color + '" data-pct="' + pct + '"></div>' +
    '</div>';
  }

  function topicRowHtml(t, color) {
    return '<div class="prog-topic-row">' +
      '<div class="prog-topic-name">' + escapeHtml(t.label) + '</div>' +
      '<div class="prog-topic-bar-wrap">' +
        '<div class="prog-topic-bar" style="width:0;background:' + color + '" data-pct="' + t.pct + '"></div>' +
      '</div>' +
      '<div class="prog-topic-pct">' + t.pct + '%</div>' +
    '</div>';
  }

  var streakEmoji = streak >= 30 ? '🏆' : streak >= 14 ? '🔥' : streak >= 7 ? '⚡' : streak >= 3 ? '✨' : streak > 0 ? '🌟' : '💤';
  var streakMsg   = streak >= 30 ? 'You are a Hebrew legend!' :
                    streak >= 14 ? 'Two-week warrior — incredible!' :
                    streak >= 7  ? 'One whole week! Keep it blazing!' :
                    streak >= 3  ? 'On a roll! Do not break it!' :
                    streak > 0   ? 'Great start — come back tomorrow!' :
                                   'Practice today to start your streak!';

  var html = [];

  // Level card
  html.push(
    '<div class="prog-card prog-card-level">',
      '<div class="prog-level-row">',
        '<div class="prog-level-badge" style="background:' + level.color + '">' + level.emoji + '</div>',
        '<div class="prog-level-info">',
          '<div class="prog-level-name">' + level.name + '</div>',
          '<div class="prog-level-pts">' + pts + ' points' + (nextLvl ? '  ·  ' + toNext + ' to ' + nextLvl.name : '  ·  MAX LEVEL') + '</div>',
        '</div>',
        '<div class="prog-level-pct">' + lvlPct + '%</div>',
      '</div>',
      barHtml(lvlPct, level.color),
      '<div class="prog-level-steps">',
        LEVELS.map(function(l, i) {
          var done = pts >= l.min;
          return '<div class="prog-step' + (done ? ' prog-step-done' : '') + (l === level ? ' prog-step-cur' : '') + '">' +
            '<div class="prog-step-dot"></div>' +
            '<div class="prog-step-lbl">' + l.emoji + '</div>' +
          '</div>';
        }).join(''),
      '</div>',
    '</div>'
  );

  // Streak card
  html.push(
    '<div class="prog-card prog-card-streak">',
      '<div class="prog-streak-inner">',
        '<div class="prog-streak-flame">' + (streak > 0 ? '<span class="flame-ani">' + streakEmoji + '</span>' : streakEmoji) + '</div>',
        '<div>',
          '<div class="prog-streak-num">' + streak + '</div>',
          '<div class="prog-streak-lbl">Day Streak</div>',
        '</div>',
      '</div>',
      '<div class="prog-streak-msg">' + streakMsg + '</div>',
    '</div>'
  );

  // Words progress
  html.push(
    '<div class="prog-card">',
      '<div class="prog-section-hdr">',
        '<span class="prog-section-icon">📖</span>',
        '<span class="prog-section-title">Words Learned</span>',
        '<span class="prog-section-count">' + words + ' / ' + wordGoal + '</span>',
      '</div>',
      barHtml(wordPct, '#1B5EE0'),
      '<div class="prog-hint">' + (wordPct < 100 ? (wordGoal - words) + ' more words to the next milestone!' : 'Milestone reached! Amazing work!') + '</div>',
    '</div>'
  );

  // Weekly chart
  html.push(
    '<div class="prog-card">',
      '<div class="prog-section-hdr">',
        '<span class="prog-section-icon">📅</span>',
        '<span class="prog-section-title">This Week</span>',
        '<span class="prog-section-count">' + weekCount + '/7</span>',
      '</div>',
      '<div class="prog-week">' + weekDots + '</div>',
      '<div class="prog-hint">' + weekMsg + '</div>',
    '</div>'
  );

  // Lessons mastered
  html.push(
    '<div class="prog-card">',
      '<div class="prog-section-hdr">',
        '<span class="prog-section-icon">🗺️</span>',
        '<span class="prog-section-title">Lessons</span>',
        '<span class="prog-section-count">' + completed.length + ' / ' + totalLsn + '</span>',
      '</div>',
      barHtml(masterPct, '#2E8B57'),
      '<div class="prog-topics-pills">',
        TOPICS.map(function(t) {
          var done = completed.some(function(lid){ return lid.startsWith(t.id); });
          return '<div class="prog-pill' + (done ? ' prog-pill-done' : '') + '">' + t.label + '</div>';
        }).join(''),
      '</div>',
    '</div>'
  );

  // Strongest topics
  if (strongest.length > 0) {
    html.push(
      '<div class="prog-card">',
        '<div class="prog-section-hdr">',
          '<span class="prog-section-icon">💪</span>',
          '<span class="prog-section-title">Strongest Topics</span>',
        '</div>',
        strongest.map(function(t){ return topicRowHtml(t, '#2E8B57'); }).join(''),
      '</div>'
    );
  }

  // Needs practice
  if (weakest.length > 0) {
    html.push(
      '<div class="prog-card">',
        '<div class="prog-section-hdr">',
          '<span class="prog-section-icon">📚</span>',
          '<span class="prog-section-title">Needs Practice</span>',
        '</div>',
        weakest.map(function(t){ return topicRowHtml(t, '#E67E22'); }).join(''),
      '</div>'
    );
  }

  // Empty state
  if (topicPerf.length === 0) {
    html.push(
      '<div class="prog-card prog-empty-card">',
        '<div class="prog-empty-icon">🎯</div>',
        '<div class="prog-empty-msg">Answer some quiz questions to see your topic strengths!</div>',
      '</div>'
    );
  }

  body.innerHTML = html.join('');

  // Animate bars after paint
  requestAnimationFrame(function() {
    requestAnimationFrame(function() {
      body.querySelectorAll('[data-pct]').forEach(function(el) {
        el.style.width = el.dataset.pct + '%';
      });
    });
  });
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

function _countUp(el, target) {
  if (!el) return;
  var from = parseInt(el.textContent) || 0;
  if (from === target) return;
  el.classList.add('counting');
  setTimeout(function() { el.classList.remove('counting'); }, 400);
  var steps = Math.min(Math.abs(target - from), 24);
  var step  = 0;
  var timer = setInterval(function() {
    step++;
    el.textContent = Math.round(from + (target - from) * (step / steps));
    if (step >= steps) { el.textContent = target; clearInterval(timer); }
  }, 22);
}

function updateStats() {
  _countUp(document.getElementById('streak-count'),  state.progress.streak);
  _countUp(document.getElementById('words-count'),   state.progress.wordsLearned.length);
  _countUp(document.getElementById('points-count'),  state.progress.points);
  _countUp(document.getElementById('lessons-count'), state.progress.lessonsCompleted);
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
  input.focus();
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
  sendBtn.classList.add('is-loading');
  typingIndicator.style.display = 'flex';
  setMorahStatus('Morah is thinking…');

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
      const err = await response.json().catch(() => ({}));
      if (err.error === 'NO_API_KEY') {
        document.getElementById('modal-apikey').style.display = 'flex';
        throw new Error('no_api_key');
      }
      if (response.status === 429) throw new Error('rate_limit');
      if (response.status >= 500) throw new Error('server_error');
      throw new Error(err.error || 'unknown');
    }

    const data = await response.json();
    const rawContent = data.content;

    const wordsData = extractWordsLearned(rawContent);

    const skipMatches = rawContent.matchAll(/\[SKIP:\s*([^\]]+)\]/gi);
    for (const match of skipMatches) {
      const topic = match[1].trim();
      if (topic && !state.session.skipList.includes(topic)) {
        state.session.skipList.push(topic);
      }
    }

    const cleanContent = rawContent
      .replace(/📚 WORDS LEARNED:.*$/s, '')
      .replace(/\[SKIP:[^\]]*\]/gi, '')
      .trim();

    state.messages.push({ role: 'assistant', content: rawContent });
    saveProgress();

    appendMessage('morah', cleanContent, wordsData);

    if (wordsData.length > 0) {
      addWordsToProgress(wordsData);
    }

    updateStreak();
    setMorahStatus('Ready to teach! 🇮🇱');

  } catch (error) {
    console.error('Chat error:', error);
    appendErrorMessage(error.message);
    setMorahStatus('Ready when you are! 🇮🇱');
  } finally {
    sendBtn.disabled = false;
    sendBtn.classList.remove('is-loading');
    typingIndicator.style.display = 'none';
    document.getElementById('user-input').focus();
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
    var isoDay = new Date().toISOString().split('T')[0];
    if (!state.progress.activityDays) state.progress.activityDays = [];
    if (state.progress.activityDays.indexOf(isoDay) < 0) {
      state.progress.activityDays.push(isoDay);
      if (state.progress.activityDays.length > 90) state.progress.activityDays.shift();
    }
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


    let badgesHtml = '';
    if (wordBadges.length > 0) {
      badgesHtml = `<div class="word-badges">` +
        wordBadges.map((w, i) => `
          <div class="word-badge" style="animation-delay:${i * 0.04}s">
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

        <div class="msg-footer"><span class="msg-time">${time}</span></div>
      </div>`;

    container.appendChild(el);
    if (cId) renderChallenge(cId);
    autoScroll();

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

function appendErrorMessage(errCode) {
  const msgs = {
    no_api_key:   { emoji: '🔑', title: 'No API key set', body: 'Tap the ⚙️ settings icon above to add your key.' },
    rate_limit:   { emoji: '⏳', title: 'Morah needs a moment!', body: 'Too many messages at once — wait a few seconds and try again.' },
    server_error: { emoji: '🛠️', title: 'Server hiccup', body: 'Something went wrong on our end. Try sending again in a moment.' },
  };
  const offline = !navigator.onLine;
  let m = msgs[errCode] || (offline
    ? { emoji: '📶', title: 'No internet connection', body: 'Check your connection and try again.' }
    : { emoji: '😅', title: 'Something went wrong', body: 'Try sending your message again.' });

  const container = document.getElementById('chat-messages');
  const el = document.createElement('div');
  el.className = 'message morah';
  el.innerHTML = `
    <div class="msg-avatar">${m.emoji}</div>
    <div style="flex:1">
      <div class="msg-bubble error-bubble">
        <strong>${m.title}</strong><br/>${m.body}
      </div>
      <div class="msg-footer"><span class="msg-time">${new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span></div>
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

  if (!state.progress.topicStats) state.progress.topicStats = {};
  var _ts = state.progress.topicStats;
  if (!_ts[state.currentTopic]) _ts[state.currentTopic] = { correct: 0, wrong: 0 };
  if (correct) _ts[state.currentTopic].correct++; else _ts[state.currentTopic].wrong++;

  if (!correct || pts <= 0) return;
  state.progress.points += pts;
  updateStats();
  saveProgress();

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


function showCorrectBurst(pts) {
  const el = document.createElement('div');
  el.className = 'correct-burst';
  el.innerHTML = '<span class="burst-check">✓</span><span class="burst-pts">+' + pts + '</span>';
  document.body.appendChild(el);
  setTimeout(function() { el.remove(); }, 1200);
}

// ─── Rich message formatter ───────────────────────────────
// Handles: tables, Hebrew pills, gold bold, headings, lists
function formatMessage(text) {
  let clean = text
    .replace(/\[TEACH\]/g, '').replace(/\[\/TEACH\]/g, '')
    .replace(/\[CHALLENGE\][\s\S]*?\[\/CHALLENGE\]/g, '')
    .replace(/📚 WORDS LEARNED:.*/s, '')
    .trim();

  const lines = clean.split('\n');
  let html = '';
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // ── Pipe table (gender tables, vocab tables) ──────────
    if (line.trim().startsWith('|')) {
      const tblLines = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tblLines.push(lines[i].trim());
        i++;
      }
      html += _buildMsgTable(tblLines);
      continue;
    }

    // ── Markdown heading (# ## ###) ──────────────────────
    const hm = line.match(/^#{1,3}\s+(.+)/);
    if (hm) {
      html += `<div class="msg-heading">${_msgInline(hm[1])}</div>`;
      i++; continue;
    }

    // ── Bullet list ───────────────────────────────────────
    if (/^[-*•]\s/.test(line)) {
      let li = '<ul class="msg-list">';
      while (i < lines.length && /^[-*•]\s/.test(lines[i])) {
        li += `<li>${_msgInline(lines[i].replace(/^[-*•]\s/, ''))}</li>`;
        i++;
      }
      html += li + '</ul>';
      continue;
    }

    // ── Numbered list ─────────────────────────────────────
    if (/^\d+[.)]\s/.test(line)) {
      let li = '<ol class="msg-list">';
      while (i < lines.length && /^\d+[.)]\s/.test(lines[i])) {
        li += `<li>${_msgInline(lines[i].replace(/^\d+[.)]\s/, ''))}</li>`;
        i++;
      }
      html += li + '</ol>';
      continue;
    }

    // ── Blank line ────────────────────────────────────────
    if (line.trim() === '') { i++; continue; }

    // ── Normal paragraph (accumulate until break) ─────────
    let para = '';
    while (i < lines.length) {
      const l = lines[i];
      if (l.trim() === '' || l.trim().startsWith('|') ||
          /^#{1,3}\s/.test(l) || /^[-*•]\s/.test(l) || /^\d+[.)]\s/.test(l)) break;
      para += (para ? ' ' : '') + l;
      i++;
    }
    if (para.trim()) html += `<p>${_msgInline(para)}</p>`;
  }

  return html || '<p></p>';
}

// Inline formatter: bold → heb-pill or gold-bold, italic, code
function _msgInline(raw) {
  let h = escapeHtml(raw);
  // **text** → Hebrew pill if starts with Hebrew char, else gold bold
  h = h.replace(/\*\*([^*]+)\*\*/g, function(_, inner) {
    return /^[֐-׿]/.test(inner.trim())
      ? `<span class="heb-pill" dir="rtl">${inner}</span>`
      : `<strong class="msg-bold">${inner}</strong>`;
  });
  // *text* → italic
  h = h.replace(/\*([^*\n]+)\*/g, '<em class="msg-em">$1</em>');
  // `code`
  h = h.replace(/`([^`]+)`/g, '<code class="msg-code">$1</code>');
  // em-dash quoted examples
  h = h.replace(/—\s*(?:&quot;|")([^"&]+)(?:&quot;|")/g, '— <code class="msg-code">$1</code>');
  return h;
}

// Build a styled HTML table from pipe-separated lines
function _buildMsgTable(lines) {
  // Drop separator rows like |---|---|
  const rows = lines.filter(l => !/^\|[\s|:\-]+\|?$/.test(l));
  if (!rows.length) return '';
  let out = '<div class="msg-table-wrap"><table class="msg-table"><tbody>';
  rows.forEach((row, idx) => {
    const cells = row.split('|').slice(1, -1);
    const isHdr = idx === 0;
    const tag   = isHdr ? 'th' : 'td';
    const rc    = !isHdr && idx % 2 === 0 ? ' class="msg-row-even"' : '';
    out += `<tr${rc}>`;
    cells.forEach(cell => {
      const c = cell.trim();
      const isHeb = /[֐-׿]/.test(c);
      out += `<${tag}>${isHeb ? `<span class="tbl-heb" dir="rtl">${escapeHtml(c)}</span>` : _msgInline(c)}</${tag}>`;
    });
    out += '</tr>';
  });
  return out + '</tbody></table></div>';
}

// ─── UI HELPERS ───────────────────────────────────────────
function setMorahStatus(text) {
  document.getElementById('morah-status').textContent = text;
}

var _toastTimer = null;
function showToast(msg, duration) {
  duration = duration || 3500;
  const toast = document.getElementById('toast');
  clearTimeout(_toastTimer);
  toast.textContent = msg;
  toast.classList.add('toast-show');
  _toastTimer = setTimeout(function() {
    toast.classList.remove('toast-show');
  }, duration);
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
  if (sr.pool.length < 4) {
    const need = 4 - sr.pool.length;
    showToast('Learn ' + need + ' more word' + (need > 1 ? 's' : '') + ' in a lesson first! 📖', 4000);
    return;
  }

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
  const t   = Math.max(0, sr.timeLeft);
  const num = document.getElementById('sr-timer-num');
  const bar = document.getElementById('sr-timer-bar');
  if (num) num.textContent = t;
  if (bar) {
    bar.style.width = (t / 60 * 100) + '%';
    bar.className = 'sr-timer-bar' + (t <= 10 ? ' danger' : t <= 20 ? ' warning' : '');
  }
  if (num) {
    num.className = 'sr-timer-num' + (t <= 10 ? ' danger' : t <= 20 ? ' warning' : '');
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
  
    triggerCelebration();
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


// ═══════════════════════════════════════════════════════════════════════════
// ▼▼▼  HEBREW WORDLE  ▼▼▼
// ═══════════════════════════════════════════════════════════════════════════

// ─── Word list ─────────────────────────────────────────────────────────────
var WORDLE_WORDS = [
  { base:'משפחה', display:'מִשְׁפָּחָה', translit:'mishpacha', english:'family',
    fact:'In Israeli culture, mishpacha means your entire extended clan, not just nuclear family. "Kol hamishpacha" — the whole family — is heard at every Israeli gathering!' },
  { base:'תפילה', display:'תְּפִילָה', translit:'tefila', english:'prayer',
    fact:'Tefila shares a root with "to judge" — prayer in Hebrew originally meant judging oneself. Jewish prayer is a conversation and self-examination, not just a request.' },
  { base:'מנורה', display:'מְנוֹרָה', translit:'menorah', english:'menorah / candelabra',
    fact:'The 7-branched menorah was lit in the Jerusalem Temple for over 1,000 years. The Chanukah menorah (chanukiyah) has 9 branches — a related but distinct symbol.' },
  { base:'אמונה', display:'אֱמוּנָה', translit:'emunah', english:'faith / trust',
    fact:'Emunah shares a root with "amen" — the word of confirmation. Both come from the root meaning firm, reliable, trustworthy. Faith in Hebrew is about reliability, not blind belief.' },
  { base:'גבורה', display:'גְּבוּרָה', translit:'gvura', english:'heroism / strength',
    fact:'Gevurot is one of the central blessings in the Amidah prayer. On Yom HaAtzmaut, gvura symbolizes the strength of the modern Jewish state reborn from the ashes.' },
  { base:'עבודה', display:'עֲבוֹדָה', translit:'avoda', english:'work / worship / service',
    fact:'Avoda means both work and worship. In Jewish thought there is no difference — the Temple service was Avodat HaMikdash, and meaningful daily work is itself a form of prayer.' },
  { base:'זכרון', display:'זִכָּרוֹן', translit:'zikaron', english:'memory / remembrance',
    fact:'"Zachor" (remember) appears in the Torah 169 times. Yom HaZikaron, Israel\'s Memorial Day, is the most solemn day of the national calendar — a nation that never forgets.' },
  { base:'סליחה', display:'סְלִיחָה', translit:'slicha', english:'sorry / excuse me / forgiveness',
    fact:'Slicha does triple duty: excuse me when passing someone, sorry when wrong, and the name of the pre-High Holiday forgiveness prayers (Selichot). One word, three essential uses!' },
  { base:'תפארת', display:'תִּפְאֶרֶת', translit:'tiferet', english:'glory / beauty / splendor',
    fact:'Tiferet is the sixth sefira in Kabbalah, representing balance and beauty. It sits at the heart of the Tree of Life, harmonizing divine love (chesed) and judgment (gevurah).' },
  { base:'חברים', display:'חֲבֵרִים', translit:'chaverim', english:'friends',
    fact:'Chaver means friend, kibbutz member, and political party member. In Talmudic times a chaver was a scholar following strict purity laws. One word, many communities.' },
  { base:'ילדים', display:'יְלָדִים', translit:'yeladim', english:'children',
    fact:'The root yod-lamed-dalet (to give birth) connects yeled (child), leida (birth), and yoledet (a woman who just gave birth). Same root, the full circle of life.' },
  { base:'דברים', display:'דְּבָרִים', translit:'dvarim', english:'things / words / matters',
    fact:'Dvarim is also the Hebrew name for Deuteronomy — the Book of Words. Because Deuteronomy is Moses\'s great final speech to the people, "the words" is the perfect name.' },
  { base:'שירים', display:'שִׁירִים', translit:'shirim', english:'songs',
    fact:'"Shir HaShirim" (Song of Songs) is one of the most beautiful books of the Hebrew Bible. Rabbi Akiva called it "the Holy of Holies" of all writings in the canon.' },
  { base:'מלכים', display:'מְלָכִים', translit:'melachim', english:'kings',
    fact:'Melachim is the Hebrew name for the Books of Kings. The root mem-lamed-kaf gives us malka (queen), mamlacha (kingdom), and the prayer Avinu Malkeinu — Our Father, Our King.' },
  { base:'אלהים', display:'אֱלֹהִים', translit:'Elohim', english:'God',
    fact:'Elohim is grammatically plural (the -im ending) but takes singular verbs when referring to God. This "majestic plural" is one of the great grammatical puzzles of Biblical Hebrew.' },
  { base:'אנשים', display:'אֲנָשִׁים', translit:'anashim', english:'people / men',
    fact:'The plural of ish (man) is completely irregular — anashim has a totally different root! Like English "person/people," Hebrew has its surprising irregularities too.' },
  { base:'כלבים', display:'כְּלָבִים', translit:'klavim', english:'dogs',
    fact:'Dogs in the Bible were not pets — they were working animals. Today in Israel, klavim are beloved pets, and Tel Aviv is one of the most dog-friendly cities in the world.' },
  { base:'ברכות', display:'בְּרָכוֹת', translit:'brachot', english:'blessings',
    fact:'Brachot is the first tractate of the Mishnah, dealing with prayers and blessings. Every Hebrew blessing begins "Baruch Atah Adonai" — blessed are You — from the same root.' },
  { base:'שולחן', display:'שֻׁלְחָן', translit:'shulchan', english:'table',
    fact:'The Shulchan Aruch ("Set Table") is the most authoritative code of Jewish law, written in 1563. Its name is a metaphor: Jewish law as a beautifully prepared table, ready to use.' },
  { base:'עפרון', display:'עִפָּרוֹן', translit:'iparon', english:'pencil',
    fact:'Iparon comes from afar (dust/earth). A pencil is literally "the dusty one" — because graphite leaves dusty marks. Hebrew often builds words from earthy, physical origins.' },
  { base:'חשבון', display:'חֶשְׁבּוֹן', translit:'cheshbon', english:'bill / math / reckoning',
    fact:'"Cheshbon HaNefesh" (Accounting of the Soul) is a classical Jewish book about moral self-examination. Even mathematics carries spiritual depth in the Hebrew language.' },
  { base:'מחברת', display:'מַחְבֶּרֶת', translit:'machberet', english:'notebook',
    fact:'Machberet comes from the root chet-bet-resh (to connect, to join). A notebook connects pages together. Same root: chaver (friend), chevra (group), and chaber (to compose a book).' },
  { base:'מסעדה', display:'מִסְעָדָה', translit:'misada', english:'restaurant',
    fact:'Misada comes from the root samekh-ayin-dalet meaning "to support, to sustain." A restaurant sustains you — literally and linguistically. Israeli food culture is legendary worldwide.' },
  { base:'אנחנו', display:'אֲנַחְנוּ', translit:'anachnu', english:'we',
    fact:'Anachnu is one of the first words immigrants learn. In fast spoken Israeli Hebrew it often shortens to just "anu" — a small window into how a living language evolves.' },
  { base:'הלכנו', display:'הָלַכְנוּ', translit:'halakhnu', english:'we went / we walked',
    fact:'"Halacha" (Jewish law) literally means "the way to walk." The root heh-lamed-kaf (to go, to walk) is one of the most ancient in Semitic languages — it is the path of life itself.' },
  { base:'למדנו', display:'לָמַדְנוּ', translit:'lamadnu', english:'we learned / we studied',
    fact:'The root lamed-mem-dalet connects lomed (student), melamed (teacher), talmid (student), and Talmud (study). In Judaism, learning is not preparation for life — it is life itself.' },
  { base:'ראינו', display:'רָאִינוּ', translit:"ra'inu", english:'we saw',
    fact:'The root resh-alef-heh (to see) gives us re\'ia (sight), mar\'e (appearance), and the name Re\'uven — "behold, a son!" God is sometimes called "El Ro\'i" — the God who sees me.' },
  { base:'ישראל', display:'יִשְׂרָאֵל', translit:'Yisrael', english:'Israel',
    fact:'"Yisrael" means "one who struggles with God." Given to Jacob after he wrestled with an angel all night and refused to let go. The name captures the Jewish relationship with the divine.' },
  { base:'גדולה', display:'גְּדוֹלָה', translit:'gdola', english:'big / great (feminine)',
    fact:'The root gimel-dalet-lamed gives us gadol (big), gdola (big f.), gdolim (great sages), and "Gadlu l\'Adonai iti" — Exalt God with me. Greatness has physical and spiritual dimensions.' },
  { base:'שאלות', display:'שְׁאֵלוֹת', translit:"she'elot", english:'questions',
    fact:'Judaism is built on questions. The Passover Seder opens with four questions. The Talmud is structured as questions and answers. "She\'elot u\'teshuvot" is the name for all rabbinic legal responsa.' },
  { base:'מילים', display:'מִלִּים', translit:'milim', english:'words',
    fact:'The Hebrew word mila means both "word" AND "circumcision" (brit mila) — different words, identical spelling. In Hebrew, every letter counts. Even a single vowel mark changes meaning completely.' },
  { base:'ספרים', display:'סְפָרִים', translit:'sfarim', english:'books',
    fact:'The root samekh-peh-resh gives sefer (book), safra (scribe), mispar (number), and sipur (story). In ancient times, sofrim (scribes) were the most important people — the keepers of all knowledge.' },
  { base:'לבבות', display:'לְבָבוֹת', translit:'levavot', english:'hearts',
    fact:'"V\'ahavta et Adonai Elohecha b\'chol levavcha" — Love God with all your heart. Levav in Hebrew is the seat of thought, will, and emotion — not just feeling, but the entire inner self.' },
  { base:'נפשות', display:'נְפָשׁוֹת', translit:'nafshot', english:'souls / lives',
    fact:'"Kol hamekayem nefesh achat..." — whoever saves a single soul, it is as if they saved an entire world (Talmud). Nefesh is not just soul — it means the whole living being, breath and all.' },
  { base:'מצרים', display:'מִצְרַיִם', translit:'Mitzrayim', english:'Egypt',
    fact:'Mitzrayim is related to metzar (narrow place). Egypt was the "narrow place" — and the Exodus from that narrow place (Yetziat Mitzrayim) is the central story of Jewish identity and freedom.' },
  { base:'רימון', display:'רִמּוֹן', translit:'rimon', english:'pomegranate',
    fact:'Tradition says a pomegranate has 613 seeds — one for each mitzvah. Torah scrolls are adorned with silver pomegranate crowns (rimonim), one of the Seven Species of the Land of Israel.' },
  { base:'זיתים', display:'זֵיתִים', translit:'zeitim', english:'olives',
    fact:'The olive tree is the symbol of Israel — "And the dove returned with an olive leaf." Central to Israeli cuisine and identity, some olive trees in Israel are over 1,000 years old.' },
  { base:'שיעור', display:'שִׁיעוּר', translit:'shiur', english:'lesson / class',
    fact:'A shiur in Jewish tradition is not just a class — it is a sacred encounter with text. Giving a shiur Torah is a mitzvah. Many Israelis attend a weekly Torah shiur well into adulthood.' },
  { base:'דגלים', display:'דְּגָלִים', translit:'dgalim', english:'flags',
    fact:'"Degel" (flag) appears in Numbers — each of Israel\'s twelve tribes had its own flag. The modern Israeli flag, with its blue stripes and Star of David, became one of the most recognized symbols on Earth.' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
var _WL_FINALS = {'ך':'כ','ם':'מ','ן':'נ','ף':'פ','ץ':'צ'};

function _wlNorm(s) {
  return s.split('').map(function(c) {
    var code = c.charCodeAt(0);
    if (code >= 0x05B0 && code <= 0x05C7) return ''; // strip nikud
    return _WL_FINALS[c] || c;
  }).join('');
}

function _wlDateStr() {
  var d = new Date();
  return d.getFullYear() + '-' + (d.getMonth()+1) + '-' + d.getDate();
}

function _wlDaily() {
  var epoch = new Date(2025, 0, 1);
  var today = new Date(); today.setHours(0,0,0,0);
  var day   = Math.floor((today - epoch) / 86400000);
  return WORDLE_WORDS[((day % WORDLE_WORDS.length) + WORDLE_WORDS.length) % WORDLE_WORDS.length];
}

var _WL_KEY     = function() { return 'kesher_wordle_' + _wlDateStr(); };
var _WL_STK_KEY = 'kesher_wordle_streak';

function _wlLoadState()  { try { return JSON.parse(localStorage.getItem(_WL_KEY()))     || {guesses:[],won:false,lost:false}; } catch(e) { return {guesses:[],won:false,lost:false}; } }
function _wlSaveState(s) { localStorage.setItem(_WL_KEY(), JSON.stringify(s)); }
function _wlLoadStreak() { try { return JSON.parse(localStorage.getItem(_WL_STK_KEY)) || {n:0,last:null}; } catch(e) { return {n:0,last:null}; } }

function _wlBumpStreak(won) {
  var stk = _wlLoadStreak();
  var today = _wlDateStr();
  if (!won) { localStorage.setItem(_WL_STK_KEY, JSON.stringify(stk)); return stk; }
  if (stk.last === today) return stk;
  var yest = new Date(Date.now() - 86400000);
  var yStr = yest.getFullYear()+'-'+(yest.getMonth()+1)+'-'+yest.getDate();
  stk.n = (stk.last === yStr) ? stk.n + 1 : 1;
  stk.last = today;
  localStorage.setItem(_WL_STK_KEY, JSON.stringify(stk));
  return stk;
}

// ─── Guess evaluation ─────────────────────────────────────────────────────────
function _wlEval(guess, target) {
  var r     = ['gray','gray','gray','gray','gray'];
  var tUsed = [false,false,false,false,false];
  var gUsed = [false,false,false,false,false];
  for (var i = 0; i < 5; i++) {
    if (guess[i] === target[i]) { r[i]='green'; tUsed[i]=true; gUsed[i]=true; }
  }
  for (var i = 0; i < 5; i++) {
    if (gUsed[i]) continue;
    for (var j = 0; j < 5; j++) {
      if (tUsed[j]) continue;
      if (guess[i] === target[j]) { r[i]='yellow'; tUsed[j]=true; break; }
    }
  }
  return r;
}

// ─── Current-guess state ──────────────────────────────────────────────────────
var _wlCurrent = [];
var _wlBusy    = false;

// ─── Render ───────────────────────────────────────────────────────────────────
function _wlRenderBoard() {
  var board = document.getElementById('wl-board');
  if (!board) return;
  var state  = _wlLoadState();
  var target = _wlNorm(_wlDaily().base);
  var html   = '';

  for (var row = 0; row < 6; row++) {
    html += '<div class="wl-row" id="wl-row-' + row + '">';
    var guess = state.guesses[row];
    if (guess) {
      var g      = _wlNorm(guess);
      var colors = _wlEval(g, target);
      for (var col = 0; col < 5; col++) {
        html += '<div class="wl-tile wl-' + colors[col] + ' wl-filled" style="animation-delay:' + (col*0.12) + 's">' + guess[col] + '</div>';
      }
    } else if (row === state.guesses.length && !state.won && !state.lost) {
      for (var col = 0; col < 5; col++) {
        var letter = _wlCurrent[col] || '';
        html += '<div class="wl-tile' + (letter ? ' wl-active' : '') + '">' + letter + '</div>';
      }
    } else {
      for (var col = 0; col < 5; col++) {
        html += '<div class="wl-tile"></div>';
      }
    }
    html += '</div>';
  }
  board.innerHTML = html;
}

function _wlKeyColors() {
  var state  = _wlLoadState();
  var target = _wlNorm(_wlDaily().base);
  var pri    = {green:3,yellow:2,gray:1};
  var colors = {};
  state.guesses.forEach(function(guess) {
    var g  = _wlNorm(guess);
    var rs = _wlEval(g, target);
    for (var i = 0; i < 5; i++) {
      var letter = _WL_FINALS[g[i]] || g[i];
      if (!colors[letter] || pri[rs[i]] > pri[colors[letter]]) colors[letter] = rs[i];
    }
  });
  return colors;
}

function _wlRenderKeyboard() {
  var kb = document.getElementById('wl-keyboard');
  if (!kb) return;
  var colors = _wlKeyColors();
  var rows = [
    ['א','ב','ג','ד','ה','ו','ז','ח','ט'],
    ['י','כ','ל','מ','נ','ס','ע','פ','צ'],
    ['ק','ר','ש','ת'],
    ['ך','ם','ן','ף','ץ'],
    ['ENTER','⌫'],
  ];
  var html = '';
  rows.forEach(function(row) {
    html += '<div class="wl-kb-row">';
    row.forEach(function(k) {
      var norm  = _WL_FINALS[k] || k;
      var cls   = colors[norm] ? ' wl-key-' + colors[norm] : '';
      var wide  = (k === 'ENTER' || k === '⌫') ? ' wl-key-wide' : '';
      var fn    = k === 'ENTER' ? 'wordleSubmit()' : k === '⌫' ? 'wordleBack()' : "wordleType('" + k + "')";
      html += '<button class="wl-key' + cls + wide + '" onclick="' + fn + '">' + k + '</button>';
    });
    html += '</div>';
  });
  kb.innerHTML = html;
}

function _wlShowMsg(msg, color) {
  var el = document.getElementById('wl-msg');
  if (!el) return;
  el.textContent = msg;
  el.style.color = color || '#ffffff';
  clearTimeout(el._t);
  if (msg) el._t = setTimeout(function(){ el.textContent = ''; }, 2200);
}

var _WL_WIN_MSGS = ['Metzuyan! 🎉','WALLA! Perfect!','Sababa! 🌟','Kol HaKavod! 🇮🇱','Yesss!','Just in time!'];

function _wlShowResult(won) {
  var word = _wlDaily();
  var el   = document.getElementById('wl-result');
  if (!el) return;
  var stk  = _wlLoadStreak();
  el.innerHTML =
    '<div class="wl-res-word">' + word.display + '</div>' +
    '<div class="wl-res-translit">' + escapeHtml(word.translit) + '</div>' +
    '<div class="wl-res-english">' + escapeHtml(word.english) + '</div>' +
    '<div class="wl-res-fact">' + escapeHtml(word.fact) + '</div>' +
    (won
      ? '<div class="wl-res-streak">🔥 Wordle streak: ' + stk.n + ' day' + (stk.n===1?'':'s') + '</div>'
      : '<div class="wl-res-lost">Come back tomorrow for a new word!</div>'
    ) +
    '<button class="wl-share-btn" onclick="wordleShare()">📤 Share Result</button>';
  el.style.display = 'block';
}

// ─── Input ────────────────────────────────────────────────────────────────────
function wordleType(letter) {
  if (_wlBusy) return;
  var state = _wlLoadState();
  if (state.won || state.lost) return;
  if (_wlCurrent.length >= 5) return;
  _wlCurrent.push(letter);
  _wlRenderBoard();
}

function wordleBack() {
  if (_wlBusy) return;
  var state = _wlLoadState();
  if (state.won || state.lost) return;
  if (_wlCurrent.length === 0) return;
  _wlCurrent.pop();
  _wlRenderBoard();
}

function wordleSubmit() {
  if (_wlBusy) return;
  var state = _wlLoadState();
  if (state.won || state.lost) return;
  if (_wlCurrent.length < 5) {
    _wlShakeRow(state.guesses.length);
    _wlShowMsg('Need 5 letters!');
    return;
  }

  var guess  = _wlCurrent.join('');
  var gNorm  = _wlNorm(guess);
  var target = _wlNorm(_wlDaily().base);
  var colors = _wlEval(gNorm, target);
  var won    = colors.every(function(c){ return c === 'green'; });

  state.guesses.push(guess);
  if (won) state.won = true;
  if (!won && state.guesses.length === 6) state.lost = true;
  _wlSaveState(state);
  _wlCurrent = [];

  _wlBusy = true;
  var rowIdx = state.guesses.length - 1;
  _wlFlipRow(rowIdx, guess, colors, function() {
    _wlBusy = false;
    _wlRenderKeyboard();
    if (won) {
      _wlBumpStreak(true);
      _wlUpdateStreakBadge();
      _wlShowMsg(_WL_WIN_MSGS[Math.min(rowIdx, _WL_WIN_MSGS.length-1)], '#6aaa64');
      triggerCelebration();
      setTimeout(function() { _wlBounceRow(rowIdx); _wlShowResult(true); }, 400);
    } else if (state.lost) {
      _wlShowMsg('The word was: ' + _wlDaily().display, '#ff6b6b');
      setTimeout(function() { _wlShowResult(false); }, 900);
    }
  });
}

// ─── Animations ───────────────────────────────────────────────────────────────
function _wlFlipRow(rowIdx, guess, colors, onDone) {
  var row = document.getElementById('wl-row-' + rowIdx);
  if (!row) { onDone(); return; }
  var tiles = row.querySelectorAll('.wl-tile');
  for (var col = 0; col < 5; col++) {
    (function(c, tile) {
      setTimeout(function() {
        tile.classList.add('wl-flipping');
        setTimeout(function() {
          tile.classList.remove('wl-flipping');
          tile.classList.add('wl-' + colors[c], 'wl-filled');
          tile.textContent = guess[c];
          if (c === 4) setTimeout(onDone, 80);
        }, 240);
      }, c * 300);
    })(col, tiles[col]);
  }
}

function _wlBounceRow(rowIdx) {
  var row = document.getElementById('wl-row-' + rowIdx);
  if (!row) return;
  row.querySelectorAll('.wl-tile').forEach(function(t, i) {
    setTimeout(function() { t.classList.add('wl-bounce'); }, i * 100);
  });
}

function _wlShakeRow(rowIdx) {
  var row = document.getElementById('wl-row-' + rowIdx);
  if (!row) return;
  row.classList.add('wl-shake');
  setTimeout(function() { row.classList.remove('wl-shake'); }, 600);
}

// ─── Streak badge & card button ───────────────────────────────────────────────
function _wlUpdateStreakBadge() {
  var badge = document.getElementById('wl-streak-badge');
  if (badge) badge.textContent = '🔥 ' + _wlLoadStreak().n;
}

function _wlUpdateCardBtn() {
  var state = _wlLoadState();
  var btn   = document.getElementById('wordle-card-btn');
  if (!btn) return;
  if (state.won)       { btn.textContent = 'Played Today ✓'; btn.style.background = '#538d4e'; btn.style.color = '#fff'; }
  else if (state.lost) { btn.textContent = 'See Result'; }
}

// ─── Physical keyboard ────────────────────────────────────────────────────────
var _wlKbHandler = null;
function _wlAttachKb() {
  _wlKbHandler = function(e) {
    var overlay = document.getElementById('wordle-overlay');
    if (!overlay || !overlay.classList.contains('wl-visible')) return;
    var key = e.key;
    if (/^[א-תװ-״]$/.test(key)) { wordleType(key); return; }
    if (key === 'Backspace') { e.preventDefault(); wordleBack(); return; }
    if (key === 'Enter')     { wordleSubmit(); return; }
  };
  document.addEventListener('keydown', _wlKbHandler);
}
function _wlDetachKb() {
  if (_wlKbHandler) { document.removeEventListener('keydown', _wlKbHandler); _wlKbHandler = null; }
}

// ─── Share ────────────────────────────────────────────────────────────────────
function wordleShare() {
  var state  = _wlLoadState();
  var target = _wlNorm(_wlDaily().base);
  var EMO    = {green:'🟩',yellow:'🟨',gray:'⬛'};
  var grid   = state.guesses.map(function(g) {
    return _wlEval(_wlNorm(g), target).map(function(c){ return EMO[c]; }).join('');
  }).join('\n');
  var result = state.won ? state.guesses.length + '/6' : 'X/6';
  var text   = 'Hebrew Wordle ' + _wlDateStr() + ' ' + result + '\n\n' + grid + '\n\nkesher-ivrit.vercel.app';
  function copied() { showToast('Copied! Share with your class 🎉'); }
  function fallback() {
    var ta = document.createElement('textarea');
    ta.value = text; ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); copied(); } catch(ex) {}
    document.body.removeChild(ta);
  }
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(copied).catch(fallback);
  else fallback();
}

// ─── Show / Hide ──────────────────────────────────────────────────────────────
function showWordleGame() {
  var el = document.getElementById('wordle-overlay');
  if (!el) return;
  _wlCurrent = [];
  _wlBusy    = false;
  el.classList.remove('wl-gone');
  el.classList.add('wl-visible');
  var wlResult = document.getElementById('wl-result');
  if (wlResult) wlResult.style.display = 'none';
  document.getElementById('wl-msg').textContent = '';
  _wlUpdateStreakBadge();
  _wlRenderBoard();
  _wlRenderKeyboard();
  var state = _wlLoadState();
  if (state.won || state.lost) _wlShowResult(state.won);
  _wlAttachKb();
}

function hideWordleGame() {
  var el = document.getElementById('wordle-overlay');
  if (!el) return;
  el.classList.remove('wl-visible');
  el.classList.add('wl-gone');
  _wlDetachKb();
  _wlUpdateCardBtn();
}

// Patch switchTab to refresh card button when Games tab opens
(function() {
  var origSwitch = window.switchTab;
  if (typeof origSwitch === 'function') {
    window.switchTab = function(tab) {
      origSwitch.call(this, tab);
      if (tab === 'games') setTimeout(_wlUpdateCardBtn, 50);
    };
  }
})();

// ▲▲▲  END HEBREW WORDLE  ▲▲▲


// ═══════════════════════════════════════════════════════════════════════════
// ▼▼▼  HEBREW UNSCRAMBLE  ▼▼▼
// ═══════════════════════════════════════════════════════════════════════════

// ─── Word pool (organised by difficulty level 1–3) ─────────────────────────
var US_WORDS = [
  // Level 1 — 3-4 base letters, core vocabulary
  { base:'ילד',   display:'יֶלֶד',    english:'boy / child',        level:1 },
  { base:'ספר',   display:'סֵפֶר',    english:'book',               level:1 },
  { base:'בית',   display:'בַּיִת',   english:'house / home',       level:1 },
  { base:'כלב',   display:'כֶּלֶב',   english:'dog',                level:1 },
  { base:'לחם',   display:'לֶחֶם',    english:'bread',              level:1 },
  { base:'שמש',   display:'שֶׁמֶשׁ',  english:'sun',                level:1 },
  { base:'ירח',   display:'יָרֵחַ',   english:'moon',               level:1 },
  { base:'ראש',   display:'רֹאשׁ',    english:'head',               level:1 },
  { base:'עין',   display:'עַיִן',    english:'eye',                level:1 },
  { base:'שנה',   display:'שָׁנָה',   english:'year',               level:1 },
  { base:'שבת',   display:'שַׁבָּת',  english:'Shabbat / Sabbath',  level:1 },
  { base:'ערב',   display:'עֶרֶב',    english:'evening',            level:1 },
  { base:'בקר',   display:'בֹּקֶר',   english:'morning',            level:1 },
  { base:'שלום',  display:'שָׁלוֹם',  english:'peace / hello',      level:1 },
  { base:'תודה',  display:'תּוֹדָה',  english:'thank you',          level:1 },
  { base:'אהבה',  display:'אַהֲבָה',  english:'love',               level:1 },
  { base:'ילדה',  display:'יַלְדָּה', english:'girl',               level:1 },
  { base:'מורה',  display:'מוֹרֶה',   english:'teacher',            level:1 },
  { base:'תורה',  display:'תּוֹרָה',  english:'Torah',              level:1 },
  { base:'שמחה',  display:'שִׂמְחָה', english:'joy',                level:1 },
  { base:'כוכב',  display:'כּוֹכָב',  english:'star',               level:1 },
  { base:'אדמה',  display:'אֲדָמָה',  english:'earth / soil',       level:1 },
  { base:'שלחן',  display:'שֻׁלְחָן', english:'table',              level:1 },
  { base:'קדוש',  display:'קָדוֹשׁ',  english:'holy',               level:1 },
  { base:'שמים',  display:'שָׁמַיִם', english:'sky / heavens',      level:1 },
  { base:'גדול',  display:'גָּדוֹל',  english:'big / great',        level:1 },
  { base:'ברוך',  display:'בָּרוּךְ', english:'blessed',            level:1 },
  { base:'חיים',  display:'חַיִּים',  english:'life',               level:1 },
  { base:'שלום',  display:'שָׁלוֹם',  english:'peace / hello',      level:1 },
  // Level 2 — 4-5 base letters, intermediate vocabulary
  { base:'ישראל', display:'יִשְׂרָאֵל',  english:'Israel',              level:2 },
  { base:'מנורה', display:'מְנוֹרָה',    english:'menorah',             level:2 },
  { base:'סליחה', display:'סְלִיחָה',   english:'sorry / excuse me',   level:2 },
  { base:'תפילה', display:'תְּפִילָה',  english:'prayer',              level:2 },
  { base:'גבורה', display:'גְּבוּרָה',  english:'strength / heroism',  level:2 },
  { base:'אמונה', display:'אֱמוּנָה',   english:'faith / trust',       level:2 },
  { base:'זכרון', display:'זִכָּרוֹן',  english:'memory',              level:2 },
  { base:'אנחנו', display:'אֲנַחְנוּ',  english:'we',                  level:2 },
  { base:'ברכות', display:'בְּרָכוֹת',  english:'blessings',           level:2 },
  { base:'חברים', display:'חֲבֵרִים',   english:'friends',             level:2 },
  { base:'ילדים', display:'יְלָדִים',   english:'children',            level:2 },
  { base:'שירים', display:'שִׁירִים',   english:'songs',               level:2 },
  { base:'מלכים', display:'מְלָכִים',   english:'kings',               level:2 },
  { base:'עבודה', display:'עֲבוֹדָה',   english:'work / worship',      level:2 },
  { base:'עפרון', display:'עִפָּרוֹן',  english:'pencil',              level:2 },
  { base:'חשבון', display:'חֶשְׁבּוֹן', english:'arithmetic / bill',   level:2 },
  { base:'דגלים', display:'דְּגָלִים',  english:'flags',               level:2 },
  { base:'כלבים', display:'כְּלָבִים',  english:'dogs',                level:2 },
  { base:'ספרים', display:'סְפָרִים',   english:'books',               level:2 },
  { base:'שאלות', display:'שְׁאֵלוֹת',  english:'questions',           level:2 },
  // Level 3 — 5+ base letters, advanced vocabulary
  { base:'משפחה', display:'מִשְׁפָּחָה', english:'family',             level:3 },
  { base:'תפארת', display:'תִּפְאֶרֶת', english:'glory / splendor',   level:3 },
  { base:'מחברת', display:'מַחְבֶּרֶת', english:'notebook',           level:3 },
  { base:'לבבות', display:'לְבָבוֹת',   english:'hearts',             level:3 },
  { base:'נפשות', display:'נְפָשׁוֹת',  english:'souls / lives',      level:3 },
  { base:'דברים', display:'דְּבָרִים',  english:'things / words',     level:3 },
  { base:'מסעדה', display:'מִסְעָדָה',  english:'restaurant',         level:3 },
  { base:'אנשים', display:'אֲנָשִׁים',  english:'people / men',       level:3 },
  { base:'מצרים', display:'מִצְרַיִם',  english:'Egypt',              level:3 },
  { base:'שאלות', display:'שְׁאֵלוֹת',  english:'questions',          level:3 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
var _US_FINALS = {'ך':'כ','ם':'מ','ן':'נ','ף':'פ','ץ':'צ'};

function _usNorm(s) {
  return s.split('').filter(function(c) {
    var code = c.charCodeAt(0);
    return !((code >= 0x05B0 && code <= 0x05C7) || code === 0xFB1E);
  }).map(function(c) { return _US_FINALS[c] || c; }).join('');
}

function _usScramble(letters) {
  var arr = letters.slice(), attempts = 0;
  var orig = arr.join('');
  do {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    attempts++;
  } while (arr.join('') === orig && attempts < 20);
  return arr;
}

function _usGetLevel() {
  var pts = state.progress.points;
  if (pts >= 400) return 3;
  if (pts >= 100) return 2;
  return 1;
}

function _usBuildRound() {
  var level = _usGetLevel();

  // Pull from student's learned words
  var learned = (state.progress.wordsLearned || [])
    .filter(function(w) { return w.hebrew && w.english && _usNorm(w.hebrew).length >= 3; })
    .map(function(w) {
      var b = _usNorm(w.hebrew);
      return { base: b, display: w.hebrew, english: w.english, level: b.length <= 4 ? 1 : b.length <= 5 ? 2 : 3 };
    });

  // Pool from curated list up to current level
  var pool = US_WORDS.filter(function(w) { return w.level <= level; });

  // Merge, deduplicate by normalised base
  var seen = {}, combined = [];
  learned.concat(pool).forEach(function(w) {
    var key = _usNorm(w.base);
    if (!seen[key] && key.length >= 3) { seen[key] = true; combined.push(w); }
  });

  // Shuffle, then sort by word length (easier first → harder last)
  combined = combined.sort(function() { return Math.random() - 0.5; });
  combined.sort(function(a, b) { return _usNorm(a.base).length - _usNorm(b.base).length; });

  // Pad to 10 if needed
  while (combined.length < 10) { combined = combined.concat(combined); }
  return combined.slice(0, 10);
}

// ─── Game state ───────────────────────────────────────────────────────────────
var US = {
  words: [], idx: 0, tiles: [], answer: [], origTiles: [],
  triesThisWord: 0, correct: 0, totalPoints: 0,
};

// ─── Render ───────────────────────────────────────────────────────────────────
function _usRenderHeader() {
  var prog = document.getElementById('us-progress');
  var scr  = document.getElementById('us-score');
  var bar  = document.getElementById('us-prog-bar');
  if (prog) prog.textContent = (US.idx + 1) + ' / ' + US.words.length;
  if (scr)  scr.textContent  = US.totalPoints + ' pts';
  if (bar)  bar.style.width  = ((US.idx / US.words.length) * 100) + '%';
}

function _usTileSize(len) {
  if (len <= 3) return 68;
  if (len <= 4) return 60;
  if (len <= 5) return 52;
  if (len <= 6) return 46;
  return 42;
}

function _usRenderWord() {
  var word = US.words[US.idx];
  var base = _usNorm(word.base);
  var sz   = _usTileSize(base.length);

  document.getElementById('us-english').textContent = word.english;

  // Reset state
  US.triesThisWord = 0;
  US.answer = new Array(base.length).fill(null);
  var scrambled = _usScramble(base.split(''));
  US.tiles = scrambled.map(function(l, i) { return { id: i, letter: l, used: false }; });
  US.origTiles = US.tiles.map(function(t) { return { id: t.id, letter: t.letter, used: false }; });

  _usRenderAnswer(sz);
  _usRenderTiles(sz);
  _usRenderHeader();
}

function _usRenderAnswer(sz) {
  var word = US.words[US.idx];
  var base = _usNorm(word.base);
  sz = sz || _usTileSize(base.length);
  var html = '';
  US.answer.forEach(function(slot, i) {
    if (slot) {
      html += '<div class="us-slot us-slot-filled" style="width:' + sz + 'px;height:' + sz + 'px" onclick="usRemoveLetter(' + i + ')">' + slot.letter + '</div>';
    } else {
      html += '<div class="us-slot us-slot-empty" style="width:' + sz + 'px;height:' + sz + 'px"></div>';
    }
  });
  document.getElementById('us-answer').innerHTML = html;
}

function _usRenderTiles(sz) {
  var word = US.words[US.idx];
  var base = _usNorm(word.base);
  sz = sz || _usTileSize(base.length);
  var html = '';
  US.tiles.forEach(function(tile) {
    if (tile.used) {
      html += '<div class="us-tile us-tile-ghost" style="width:' + sz + 'px;height:' + sz + 'px"></div>';
    } else {
      html += '<div class="us-tile" style="width:' + sz + 'px;height:' + sz + 'px" onclick="usAddLetter(' + tile.id + ')">' + tile.letter + '</div>';
    }
  });
  document.getElementById('us-letters').innerHTML = html;
}

// ─── Input ────────────────────────────────────────────────────────────────────
function usAddLetter(tileId) {
  var tile = null;
  for (var i = 0; i < US.tiles.length; i++) { if (US.tiles[i].id === tileId) { tile = US.tiles[i]; break; } }
  if (!tile || tile.used) return;
  var emptyIdx = US.answer.indexOf(null);
  if (emptyIdx < 0) return;
  tile.used = true;
  US.answer[emptyIdx] = { id: tileId, letter: tile.letter };
  _usRenderTiles();
  _usRenderAnswer();
  if (US.answer.indexOf(null) < 0) {
    setTimeout(_usCheckAnswer, 120);
  }
}

function usRemoveLetter(slotIdx) {
  var slot = US.answer[slotIdx];
  if (!slot) return;
  for (var i = 0; i < US.tiles.length; i++) { if (US.tiles[i].id === slot.id) { US.tiles[i].used = false; break; } }
  US.answer[slotIdx] = null;
  _usRenderTiles();
  _usRenderAnswer();
}

function usClear() {
  US.tiles = US.origTiles.map(function(t) { return { id: t.id, letter: t.letter, used: false }; });
  US.answer = new Array(_usNorm(US.words[US.idx].base).length).fill(null);
  _usRenderTiles();
  _usRenderAnswer();
}

// ─── Check answer ─────────────────────────────────────────────────────────────
function _usCheckAnswer() {
  var word   = US.words[US.idx];
  var target = _usNorm(word.base);
  var answer = US.answer.map(function(s) { return s ? s.letter : ''; }).join('');
  US.triesThisWord++;

  if (_usNorm(answer) === target) {
    var pts = US.triesThisWord === 1 ? 20 : US.triesThisWord === 2 ? 10 : 5;
    US.totalPoints += pts;
    if (US.triesThisWord === 1) US.correct++;
    _usShowCorrect(pts);
  } else {
    _usShakeAnswer();
    setTimeout(usClear, 620);
  }
}

function _usShowCorrect(pts) {
  // Flash answer tiles green
  var slots = document.querySelectorAll('.us-slot-filled');
  slots.forEach(function(s) { s.classList.add('us-slot-correct'); });
  // Show points pop
  _usPtsPop('+' + pts);
  triggerCelebration();
  // Brief celebration then next word
  setTimeout(function() {
    US.idx++;
    if (US.idx >= US.words.length) {
      _usShowResults();
    } else {
      _usRenderWord();
    }
  }, 900);
}

function _usShakeAnswer() {
  var el = document.getElementById('us-answer');
  if (!el) return;
  el.classList.add('us-shake');
  // Flash tiles red briefly
  var slots = document.querySelectorAll('#us-answer .us-slot-filled');
  slots.forEach(function(s) { s.classList.add('us-slot-wrong'); });
  setTimeout(function() {
    el.classList.remove('us-shake');
    slots.forEach(function(s) { s.classList.remove('us-slot-wrong'); });
  }, 600);
}

function _usPtsPop(text) {
  var el = document.createElement('div');
  el.className = 'us-pts-pop';
  el.textContent = text;
  document.getElementById('us-body').appendChild(el);
  setTimeout(function() { el.remove(); }, 1000);
}

// ─── Results ──────────────────────────────────────────────────────────────────
function _usShowResults() {
  var pct = Math.round((US.correct / 10) * 100);
  // Bonus for strong performance
  var bonus = US.correct >= 10 ? 50 : US.correct >= 8 ? 25 : US.correct >= 6 ? 10 : 0;
  US.totalPoints += bonus;
  state.progress.points += US.totalPoints;
  updateStats();
  saveProgress();

  var emoji = pct >= 90 ? '🏆' : pct >= 70 ? '🌟' : pct >= 50 ? '💪' : '🌱';
  var msg   = pct >= 90 ? 'Metzuyan! You crushed it!' :
              pct >= 70 ? 'Kol HaKavod! Great round!' :
              pct >= 50 ? "B'seder! Keep it up!" :
                          'Yalla, practice makes perfect!';

  var body = document.getElementById('us-body');
  var res  = document.getElementById('us-results');
  body.style.display = 'none';
  res.classList.remove('us-hidden');

  res.innerHTML =
    '<div class="us-res-emoji">' + emoji + '</div>' +
    '<div class="us-res-correct">' + US.correct + ' / 10 correct</div>' +
    '<div class="us-res-msg">' + msg + '</div>' +
    '<div class="us-res-pts">+' + US.totalPoints + ' points' + (bonus > 0 ? ' (incl. ' + bonus + ' pt bonus!)' : '') + '</div>' +
    '<div class="us-res-actions">' +
      '<button class="us-btn-primary" onclick="startUnscramble()">▶ Play Again</button>' +
      '<button class="us-btn-secondary" onclick="hideUnscrambleGame()">Done</button>' +
    '</div>';
}

// ─── Show / Hide ──────────────────────────────────────────────────────────────
function startUnscramble() {
  US.words = _usBuildRound();
  US.idx = 0;
  US.correct = 0;
  US.totalPoints = 0;

  var body = document.getElementById('us-body');
  var res  = document.getElementById('us-results');
  if (body) body.style.display = '';
  if (res)  res.classList.add('us-hidden');

  _usRenderWord();
}

function showUnscrambleGame() {
  var el = document.getElementById('unscramble-overlay');
  if (!el) return;
  el.classList.remove('us-gone');
  el.classList.add('us-visible');
  startUnscramble();
}

function hideUnscrambleGame() {
  var el = document.getElementById('unscramble-overlay');
  if (!el) return;
  el.classList.remove('us-visible');
  el.classList.add('us-gone');
}

// ▲▲▲  END HEBREW UNSCRAMBLE  ▲▲▲

// ═══════════════════════════════════════════════════════════════════════════
//  CELEBRATION ANIMATION — Magen David + Blue/White/Gold confetti
// ═══════════════════════════════════════════════════════════════════════════
function triggerCelebration(cx, cy) {
  cx = cx != null ? cx : window.innerWidth  / 2;
  cy = cy != null ? cy : window.innerHeight / 2;

  // Magen David star burst
  var star = document.createElement('div');
  star.className = 'celeb-star';
  star.textContent = '✡';
  star.style.left = cx + 'px';
  star.style.top  = cy + 'px';
  document.body.appendChild(star);
  setTimeout(function() { if (star.parentNode) star.parentNode.removeChild(star); }, 1400);

  // Confetti particles in Israeli blue/white/gold
  var palette = ['#0038B8','#1B5EE0','#4A90D9','#D4A017','#FFE57F','#ffffff','#003399'];
  for (var i = 0; i < 44; i++) {
    (function(i) {
      var angle  = (i / 44) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      var dist   = 70 + Math.random() * 160;
      var px     = Math.cos(angle) * dist;
      var py     = Math.sin(angle) * dist;
      var size   = 7 + Math.random() * 9;
      var isRect = Math.random() > 0.55;
      var dur    = 0.55 + Math.random() * 0.55;
      var delay  = Math.random() * 0.18;
      var color  = palette[Math.floor(Math.random() * palette.length)];
      var rot    = (Math.random() * 720 - 360) + 'deg';

      var p = document.createElement('div');
      p.className = 'celeb-particle';
      p.style.cssText =
        'left:' + cx + 'px;top:' + cy + 'px;' +
        'width:' + size + 'px;height:' + (isRect ? size * 0.45 : size) + 'px;' +
        'background:' + color + ';' +
        '--px:' + px + 'px;--py:' + py + 'px;' +
        '--rot:' + rot + ';' +
        '--dur:' + dur + 's;' +
        '--delay:' + delay + 's;' +
        '--br:' + (isRect ? '2px' : '50%') + ';';
      document.body.appendChild(p);
      setTimeout(function() { if (p.parentNode) p.parentNode.removeChild(p); }, (dur + delay) * 1000 + 100);
    })(i);
  }
}
