/* ═══════════════════════════════════════════════════════════
   KESHER IVRIT — Frontend App
   קשר עברית
═══════════════════════════════════════════════════════════ */

// ─── DARK MODE ───────────────────────────────────────────
(function initTheme() {
  var saved = localStorage.getItem('kesher-theme');
  if (saved === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();

function toggleDarkMode() {
  var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  if (isDark) {
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('kesher-theme', 'light');
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('kesher-theme', 'dark');
  }
  if (typeof _mobTab !== 'undefined' && _mobTab === 'me') renderMobileProfile();
}

// ─── ASK ANYTHING MODE ───────────────────────────────────
var _qaMode = false;

function enterQAMode() {
  _qaMode = true;
  var banner = document.getElementById('qa-mode-banner');
  if (banner) banner.style.display = 'flex';
  var input = document.getElementById('user-input');
  if (input) {
    input.placeholder = 'Ask anything about Hebrew, Torah, Israel, or Jewish history…';
    input.focus();
  }
}

function exitQAMode() {
  _qaMode = false;
  var banner = document.getElementById('qa-mode-banner');
  if (banner) banner.style.display = 'none';
  var input = document.getElementById('user-input');
  if (input) input.placeholder = 'Type or speak in Hebrew or English… (Enter to send)';
}

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
    id: 'goal',
    icon: '🎯',
    title: 'What are your goals?',
    subtitle: 'Choose everything that applies — Morah will blend them',
    type: 'choice',
    multi: true,
    maxSelect: 3,
    options: [
      { value: 'bible',        icon: '📜', text: 'Biblical Hebrew',        sub: 'Torah vocabulary, Biblical grammar, famous phrases — read Scripture in the original' },
      { value: 'bar_mitzvah',  icon: '✡️', text: 'Bar / Bat Mitzvah',      sub: 'Your parasha word by word, trope, synagogue blessings — understand every word you chant' },
      { value: 'prayer',       icon: '🕍', text: 'Prayer & Siddur',         sub: 'Shema, Amidah, Kiddush, Havdalah — every prayer phrase by phrase with full meaning' },
      { value: 'conversation', icon: '💬', text: 'Modern Conversation',    sub: 'Speak with Israelis like a sabra — living language, real situations' },
      { value: 'heritage',     icon: '🕎', text: 'Jewish Heritage',        sub: 'Hebrew as a window into Jewish history, culture, and identity' },
      { value: 'aliyah',       icon: '✈️', text: 'Full Fluency / Aliyah',  sub: 'Moving to Israel or aiming for near-fluency in all situations' },
      { value: 'travel',       icon: '🏖️', text: 'Traveling to Israel',    sub: 'Get around, order food, make friends — practical survival Hebrew' }
    ]
  },
  {
    id: 'level',
    icon: '📊',
    title: 'Confirm your Hebrew level',
    subtitle: 'We placed you based on your quiz — change it if we got it wrong!',
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
    id: 'learningStyle',
    icon: '🧠',
    title: 'How do you learn best?',
    subtitle: 'Pick every style that sounds like you',
    type: 'choice',
    multi: true,
    maxSelect: 3,
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
    subtitle: 'Select all that describe you — many people are more than one',
    type: 'choice',
    multi: true,
    maxSelect: 3,
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

// ─── HEBREW PLACEMENT TEST ────────────────────────────────
// ── Goal-adaptive question sets ──────────────────────────
// Each set: Q1-2 Beginner · Q3-4 Elementary · Q5-6 Intermediate · Q7-8 Advanced · Q9-10 Expert
const PT_QUESTION_SETS = {

// ── BIBLICAL: prayer + bible goals ──────────────────────
biblical: [
  { n:1,  emoji:'📖', tier:'Beginner',
    q: 'Which Hebrew letter makes the "B" sound when it has a dot inside it (דָּגֵשׁ)?',
    heb: null,
    opts: ['א', 'ב', 'כ', 'ג'], ans: 1,
    fun: '✨ בּ with dagesh = "b" sound. Without dagesh it becomes "v"! One letter, two sounds!'
  },
  { n:2,  emoji:'📜', tier:'Beginner',
    q: 'What does בְּרֵאשִׁית mean? (the very first word of the Torah)',
    heb: 'בְּרֵאשִׁית',
    opts: ['And God said', 'In the beginning', 'Let there be light', 'In the garden'], ans: 1,
    fun: '🌟 בְּרֵאשִׁית (bereishit) opens the entire Torah: "In the beginning God created..." Six words that started everything!'
  },
  { n:3,  emoji:'🔤', tier:'Elementary',
    q: 'Which vowel mark (נִקּוּד) makes the long "AH" sound?',
    heb: null,
    opts: ['חִירִיק (chirik) — "ee"', 'קָמַץ (kamatz) — "ah"', 'סֶגּוֹל (segol) — "eh"', 'שׁוּרוּק (shuruk) — "oo"'], ans: 1,
    fun: '📚 קָמַץ (ָ) = the "ah" vowel. It looks like a small T under the letter. You see it constantly in Torah!'
  },
  { n:4,  emoji:'🙏', tier:'Elementary',
    q: 'What does שְׁמַע יִשְׂרָאֵל mean?',
    heb: 'שְׁמַע יִשְׂרָאֵל',
    opts: ['Blessed is Israel', 'Holy, Holy, Holy', 'Hear O Israel', 'Remember Israel'], ans: 2,
    fun: '🕍 שְׁמַע (shema) = hear/listen. The Shema is the central declaration of Jewish faith, recited twice daily!'
  },
  { n:5,  emoji:'🌳', tier:'Intermediate',
    q: 'What is the Hebrew root (שׁוֹרֶשׁ) of the word תּוֹרָה?',
    heb: null,
    opts: ['ת-ל-מ (study)', 'ב-ר-כ (bless)', 'י-ר-ה (to direct/teach)', 'ק-ד-שׁ (holy)'], ans: 2,
    fun: '🌳 תּוֹרָה comes from י-ר-ה = to shoot, direct, teach. Torah literally means "The Teaching" or "The Instruction"!'
  },
  { n:6,  emoji:'⚡', tier:'Intermediate',
    q: 'What grammatical function does אֵת serve before a noun?',
    heb: null,
    opts: ['It means "and"', 'It means "from"', 'It marks the definite direct object', 'It means "with"'], ans: 2,
    fun: '⚡ אֵת is the אוֹת הַיָּדַיִם — direct object marker. "God created אֵת the heavens" — it tells you what receives the action!'
  },
  { n:7,  emoji:'🏗️', tier:'Advanced',
    q: 'The prefix מ- (mem) added to a verb root often creates what part of speech?',
    heb: null,
    opts: ['A past tense verb', 'An active participle (one who does X)', 'A command form', 'A future verb'], ans: 1,
    fun: '🏗️ מ- on a root makes a participle! מְדַבֵּר = "speaking / one who speaks" (from ד-ב-ר, speech root)'
  },
  { n:8,  emoji:'⏪', tier:'Advanced',
    q: 'Which is the correct past tense (qal perfect) form for "he wrote" in Biblical Hebrew?',
    heb: null,
    opts: ['יִכְתֹּב', 'כָּתַב', 'כּוֹתֵב', 'לִכְתֹּב'], ans: 1,
    fun: '⏪ כָּתַב (katav) = "he wrote" — the qal perfect (past tense). יִכְתֹּב = he will write (future/imperfect), כּוֹתֵב = writing (present). Same root כ-ת-ב, three forms!'
  },
  { n:9,  emoji:'📿', tier:'Expert',
    q: 'The וָו הַהִיפּוּך (vav-consecutive) in Biblical Hebrew flips a verb how?',
    heb: null,
    opts: ['Turns present to future', 'Turns an imperfect (future form) into past narrative', 'Makes verbs negative', 'Creates the command form'], ans: 1,
    fun: '📿 וַיֹּאמֶר = "and he said" (past). The וַ- prefix on an imperfect form flips it to past narrative — the backbone of all Biblical storytelling!'
  },
  { n:10, emoji:'🏛️', tier:'Expert',
    q: 'Which is the correct construct state (סְמִיכוּת) for "house of God" in Biblical Hebrew?',
    heb: null,
    opts: ['בַּיִת שֶׁל אֱלֹהִים', 'בֵּית אֱלֹהִים', 'הַבַּיִת אֱלֹהִים', 'אֱלֹהִים בַּיִת'], ans: 1,
    fun: '🏛️ בֵּית אֱלֹהִים! In the construct (סְמִיכוּת), בַּיִת (house) becomes בֵּית — vowels shift, the definite article drops. This pattern gives us בֵּית הַמִּקְדָּשׁ = the Temple ("House of the Holy")!'
  },
  { n:11, emoji:'🔄', tier:'Expert',
    q: 'The Niphal binyan (נִפְעַל) expresses what type of meaning?',
    heb: null,
    opts: ['Active — one who performs an action', 'The basic simple action (Kal/Qal)', 'Passive or reflexive — being acted upon or doing to oneself', 'Causing someone else to do an action (Hifil)'],
    ans: 2,
    fun: '🔄 נִפְעַל (Nifal) = passive or reflexive! "הַדָּבָר נֶאֱמַר" = "The thing was said." Compare כָּתַב (he wrote) with נִכְתַּב (it was written). Understanding the seven binyanim is the key to unlocking Biblical Hebrew!'
  },
  { n:12, emoji:'✡️', tier:'Expert',
    q: 'In the Shema, the letters עַ (of שְׁמַע) and דָּ (of אֶחָד) are written enlarged. Together they spell:',
    heb: 'שְׁמַע יִשְׂרָאֵל — אֶחָד',
    opts: ['אֵל (El) — God', 'עֵד (Ed) — witness', 'עַד (Ad) — eternity', 'דַּע (Da) — know'],
    ans: 1,
    fun: '✡️ עַ + דָּ = עֵד (witness)! The enlarged letters teach that when we recite the Shema, we become witnesses to God\'s absolute oneness. A hidden message woven into the letters of Israel\'s most sacred declaration!'
  }
],

// ── MODERN: conversation + travel goals ─────────────────
modern: [
  { n:1,  emoji:'☕', tier:'Beginner',
    q: 'How do you say "yes" in Modern Hebrew?',
    heb: null,
    opts: ['לֹא', 'אוּלַי', 'כֵּן', 'גַּם'], ans: 2,
    fun: '✅ כֵּן (ken) = yes. לֹא (lo) = no. גַּם (gam) = also. Nail these three and you\'re already communicating!'
  },
  { n:2,  emoji:'🙏', tier:'Beginner',
    q: 'What does תּוֹדָה (toda) mean?',
    heb: 'תּוֹדָה',
    opts: ['Please', 'Good morning', 'Thank you', 'Goodbye'], ans: 2,
    fun: '✨ תּוֹדָה (toda) = thank you! Add רַבָּה (raba) to say תּוֹדָה רַבָּה — "thank you very much" — the most appreciated phrase you can learn!'
  },
  { n:3,  emoji:'🚽', tier:'Elementary',
    q: 'How do you ask "Where is the bathroom?" in Hebrew?',
    heb: null,
    opts: ['מַה הַשֵּׁם שֶׁלְּךָ?', 'כַּמָּה עוֹלֶה?', 'אֵיפֹה הַשֵּׁרוּתִים?', 'מָתַי הָאוֹטוֹבּוּס?'], ans: 2,
    fun: '🚽 אֵיפֹה (eifoh) = where + שֵּׁרוּתִים (sherootim) = facilities/bathroom. Literally "services" — Israel\'s polite word!'
  },
  { n:4,  emoji:'🛍️', tier:'Elementary',
    q: 'At an Israeli market, how do you ask "How much does this cost?"',
    heb: null,
    opts: ['מַה שִּׁמְךָ?', 'כַּמָּה זֶה עוֹלֶה?', 'אֵיפֹה אַתָּה גָּר?', 'מָתַי אַתָּה בָּא?'], ans: 1,
    fun: '🛍️ כַּמָּה (kama) = how much + עוֹלֶה (ole) = costs. Essential for every Israeli שׁוּק (shuk / market)!'
  },
  { n:5,  emoji:'🗣️', tier:'Intermediate',
    q: 'How do you say "I am speaking Hebrew" (present tense) in Hebrew?',
    heb: null,
    opts: ['אֲנִי דִּבַּרְתִּי עִבְרִית', 'אֲנִי מְדַבֵּר עִבְרִית', 'אֲנִי אֲדַבֵּר עִבְרִית', 'אֲנִי לְדַבֵּר עִבְרִית'], ans: 1,
    fun: '🗣️ אֲנִי מְדַבֵּר עִבְרִית! מְדַבֵּר = present tense "speaking." Hebrew present tense works like a participle — it describes what you\'re doing right now!'
  },
  { n:6,  emoji:'📖', tier:'Intermediate',
    q: 'Which sentence correctly means "The girl reads a book" (present tense)?',
    heb: null,
    opts: ['הַיַּלְדָּה קָרְאָה סֵפֶר', 'הַיַּלְדָּה קוֹרֵאת סֵפֶר', 'הַיַּלְדָּה תִּקְרָא סֵפֶר', 'הַיַּלְדָּה לִקְרֹא סֵפֶר'], ans: 1,
    fun: '📖 קוֹרֵאת = feminine present tense of "to read." קָרְאָה = she read (past), תִּקְרָא = she will read (future). Same root ק-ר-א, three tenses!'
  },
  { n:7,  emoji:'⏪', tier:'Advanced',
    q: 'You ate at a restaurant last night. How do you say "I ate" in Hebrew (past tense)?',
    heb: null,
    opts: ['אֲנִי אוֹכֵל', 'אֲנִי אֹכַל', 'אֲנִי אָכַלְתִּי', 'אֲנִי לֶאֱכוֹל'], ans: 2,
    fun: '⏪ אָכַלְתִּי (akhalti) = I ate — past tense! Hebrew past adds suffixes to the verb root. The suffix ‎תִּי- marks first person: "I (did it)."'
  },
  { n:8,  emoji:'🔮', tier:'Advanced',
    q: '"אֲנִי אֵצֵא מָחָר" — what does this sentence mean?',
    heb: 'אֲנִי אֵצֵא מָחָר',
    opts: ['I went out yesterday', 'I am going out now', 'I will go out tomorrow', 'I want to go out'], ans: 2,
    fun: '🔮 אֵצֵא (etze) = I will go out — future tense! The prefix א- marks 1st person future. Root י-צ-א also gives us יְצִיאַת מִצְרַיִם — the Exodus!'
  },
  { n:9,  emoji:'😬', tier:'Expert',
    q: 'What does עַל הַפָּנִים (al ha-panim) mean in Israeli slang?',
    heb: null,
    opts: ['Beautiful (lit. on the face)', 'Excellent — absolutely amazing!', 'Terrible / really bad (lit. face-down)', 'No problem at all'], ans: 2,
    fun: '😬 עַל הַפָּנִים = face-down in the dirt → terrible, awful, the worst! Context is everything in slang.'
  },
  { n:10, emoji:'🎯', tier:'Expert',
    q: 'What does the word בְּדִיּוּק (bediyuk) mean?',
    heb: null,
    opts: ['Approximately / roughly', 'Quickly / fast', 'Maybe / perhaps', 'Exactly / precisely'], ans: 3,
    fun: '🎯 בְּדִיּוּק (bediyuk) = exactly, precisely! From the root ד-י-ק = accuracy. "כֵּן, בְּדִיּוּק!" = "Yes, exactly!"'
  },
  { n:11, emoji:'🎯', tier:'Expert',
    q: 'Which sentence correctly uses the conditional "if" in Hebrew — "If you come, I will be happy"?',
    heb: null,
    opts: ['כְּשֶׁתָּבוֹא, אֶשְׂמַח', 'אִם תָּבוֹא, אֶשְׂמַח', 'אֲשֶׁר תָּבוֹא, אֶשְׂמַח', 'מָתַי שֶׁתָּבוֹא, אֶשְׂמַח'],
    ans: 1,
    fun: '🎯 אִם (im) = if — the classic conditional! כְּשֶׁ (keshe) = when (time-based). אֲשֶׁר = who/which (relative clause). Mastering "if" sentences marks a genuine leap toward natural Hebrew conversation!'
  },
  { n:12, emoji:'😤', tier:'Expert',
    q: 'The Israeli slang phrase "יֵשׁ לוֹ חוּצְפָּה" (yesh lo chutzpah) means he has:',
    heb: null,
    opts: ['Great wisdom and intelligence', 'Deep kindness and generosity', 'Audacity, nerve, or shameless boldness', 'Perfect Hebrew pronunciation'],
    ans: 2,
    fun: '😤 חוּצְפָּה (chutzpah) = audacity, nerve, brazen boldness! In Israeli culture it can be admired — the boldness to push forward. Now you know where the English word came from!'
  }
],

// ── BAR/BAT MITZVAH: bar_mitzvah goal ───────────────────
barmitzvah: [
  { n:1,  emoji:'📖', tier:'Beginner',
    q: 'What is a weekly Torah reading called?',
    heb: null,
    opts: ['בְּרָכָה', 'חַזָּן', 'פָּרָשָׁה', 'עֲלִיָּה'], ans: 2,
    fun: '📖 פָּרָשָׁה (parashah) = Torah portion. There are 54 parashiyot — one (or two!) for each week of the year!'
  },
  { n:2,  emoji:'⬆️', tier:'Beginner',
    q: 'What does עֲלִיָּה לַתּוֹרָה (aliyah la-Torah) mean?',
    heb: null,
    opts: ['Reading the whole Torah aloud', 'Moving to Israel for Torah study', 'Being called up to bless the Torah reading', 'The Torah scroll itself'], ans: 2,
    fun: '⬆️ עֲלִיָּה = "going up." Being called to the bimah for a Torah blessing is literally "going up" — a great honor!'
  },
  { n:3,  emoji:'📜', tier:'Elementary',
    q: 'What is the הַפְטָרָה (Haftarah)?',
    heb: null,
    opts: ['The Kiddush blessing over wine', 'The Torah scroll\'s velvet cover', 'A selection from the Prophets read after the Torah portion', 'The final prayer of every service'], ans: 2,
    fun: '📜 הַפְטָרָה comes from "to conclude" (פ-ט-ר). It\'s the prophetic reading that completes the Torah service!'
  },
  { n:4,  emoji:'🎵', tier:'Elementary',
    q: 'What do the cantillation marks (טַעֲמֵי הַמִּקְרָא / trope) do?',
    heb: null,
    opts: ['Only mark the vowels', 'Show which words to emphasize silently', 'Indicate the musical melody AND serve as punctuation', 'Mark only the most important words to read'], ans: 2,
    fun: '🎵 טַעֲמִים (trop) serve TWO purposes: melody AND punctuation — they tell you how to SING and how to PHRASE the text!'
  },
  { n:5,  emoji:'🔊', tier:'Intermediate',
    q: 'The prayer call "בָּרְכוּ" (barchu) signals what?',
    heb: 'בָּרְכוּ',
    opts: ['The Torah is being put back in the ark', 'The rabbi\'s sermon is beginning', 'A call for the congregation to bless God together', 'The service has ended'], ans: 2,
    fun: '🔊 בָּרְכוּ = "Bless!" A call-and-response where the prayer leader calls out and everyone responds together. Beautiful!'
  },
  { n:6,  emoji:'✡️', tier:'Intermediate',
    q: '"אֲשֶׁר בָּחַר בָּנוּ מִכָּל הָעַמִּים" (in the Torah blessing) means:',
    heb: null,
    opts: ['Who created us from all the nations', 'Who saved us from all the nations', 'Who commands us above all nations', 'Who chose us from all the nations'], ans: 3,
    fun: '✡️ בָּחַר = chose. This blessing acknowledges the covenant between God and the Jewish people — the foundation of Torah!'
  },
  { n:7,  emoji:'🏛️', tier:'Advanced',
    q: 'What does a גַּבַּאי (gabbai) do in a synagogue?',
    heb: null,
    opts: ['Chants the Torah text (ba\'al koreh)', 'Leads the musical prayers (cantor)', 'Coordinates who gets each aliyah and manages the service flow', 'Delivers the sermon and teaches Torah'], ans: 2,
    fun: '🏛️ The גַּבַּאי is the synagogue\'s air traffic controller — managing aliyot, honors, and keeping everything on track!'
  },
  { n:8,  emoji:'💪', tier:'Advanced',
    q: '"חֲזַק חֲזַק וְנִתְחַזֵּק!" (chazak chazak v\'nitchazek) is said when:',
    heb: null,
    opts: ['Beginning a new Torah book', 'Completing an entire book of the Torah', 'The Bar/Bat Mitzvah child finishes chanting', 'Putting the Torah scroll back in the ark'], ans: 1,
    fun: '💪 Three words from the root ח-ז-ק (strength)! Be strong × 2 + may we be strengthened = a communal celebration of finishing!'
  },
  { n:9,  emoji:'📣', tier:'Expert',
    q: 'What is the difference between the בַּעַל קּוֹרֵא (ba\'al koreh) and the עוֹלֶה (oleh)?',
    heb: null,
    opts: ['They are the same person doing both jobs', 'The ba\'al koreh chants the Torah text; the oleh says the blessings before and after', 'The oleh chants; the ba\'al koreh only blesses', 'Both only say blessings — no one chants anymore'], ans: 1,
    fun: '📣 Beautiful division of labor! The בַּעַל קּוֹרֵא chants the Torah; the עוֹלֶה makes the blessings. Teamwork makes Torah work!'
  },
  { n:10, emoji:'🌟', tier:'Expert',
    q: 'The final Torah aliyah (מַפְטִיר) gets its name from the root פ-ט-ר meaning "to conclude." What follows it?',
    heb: null,
    opts: ['The Kiddush over wine', 'The Aleinu closing prayer', 'The Haftarah reading from the Prophets', 'The Torah scroll being dressed and returned'], ans: 2,
    fun: '🌟 The מַפְטִיר aliyah is the gateway to the Haftarah — that person reads or blesses the prophetic portion that concludes the service!'
  },
  { n:11, emoji:'🙏', tier:'Expert',
    q: 'What is a מִי שֶׁבֵּרַךְ (Mi Shebeirach) prayer, and when is it recited?',
    heb: null,
    opts: ['The opening Kiddush blessing before the Torah service', 'A blessing or healing prayer recited after an aliyah on behalf of a person or community', 'The final Aleinu prayer that closes every service', 'The blessing over challah at the Shabbat meal'],
    ans: 1,
    fun: '🙏 מִי שֶׁבֵּרַךְ = "May the One Who Blessed..." It\'s a prayer of blessing or healing, often recited for someone ill (מִי שֶׁבֵּרַךְ לַחוֹלִים) or to honor someone after their aliyah. You\'ll hear it every Shabbat morning!'
  },
  { n:12, emoji:'📜', tier:'Expert',
    q: 'The honor of lifting the Torah scroll is called הַגְבָּהָה (hagbahah). What is the honor of rolling and DRESSING it called?',
    heb: null,
    opts: ['עֲלִיָּה (aliyah) — going up to the Torah', 'גְּלִילָה (gelilah) — rolling and dressing the Torah', 'פְּתִיחָה (petichah) — opening the ark', 'הַחְזָרָה (hachzarah) — returning it to the ark'],
    ans: 1,
    fun: '📜 גְּלִילָה (gelilah) = rolling! After the dramatic lifting (הַגְבָּהָה), the gelilah person ties the binder (מַפָּה), replaces the mantle (מְעִיל), crown (כֶּתֶר), and breastplate. Often the first synagogue honor given to children!'
  }
],

// ── FLUENCY: aliyah goal — hardest mixed test ────────────
fluency: [
  { n:1,  emoji:'❌', tier:'Beginner',
    q: 'What does לֹא (lo) mean in Hebrew?',
    heb: 'לֹא',
    opts: ['Yes', 'Please', 'No', 'Hello'], ans: 2,
    fun: '❌ לֹא (lo) = no! Together with כֵּן (ken = yes), these two tiny words will get you surprisingly far in Israel!'
  },
  { n:2,  emoji:'🕊️', tier:'Beginner',
    q: 'The word שָׁלוֹם has THREE uses in Hebrew. Which answer is correct?',
    heb: 'שָׁלוֹם',
    opts: ['Only means "peace"', 'Hello, goodbye, AND peace', 'Means hello and thank you', 'Only used in prayer'], ans: 1,
    fun: '🕊️ שָׁלוֹם = peace, hello, AND goodbye — one beautiful word! It\'s the most versatile word in the Hebrew language.'
  },
  { n:3,  emoji:'🚌', tier:'Elementary',
    q: 'You need the central bus station (תַּחֲנָה מֶרְכָּזִית). How do you ask directions?',
    heb: null,
    opts: ['מַה הַשֵּׁם שֶׁלְּךָ?', 'אֵיפֹה הַתַּחֲנָה הַמֶּרְכָּזִית?', 'כַּמָּה עוֹלֶה הַכַּרְטִיס?', 'מָתַי הָאוֹטוֹבּוּס בָּא?'], ans: 1,
    fun: '🚌 אֵיפֹה = where. מֶרְכָּזִית (merkazit) = central (from מֶרְכָּז = center). This question will save you on your first day!'
  },
  { n:4,  emoji:'💧', tier:'Elementary',
    q: 'How do you say "I want water, please" in Hebrew?',
    heb: null,
    opts: ['אֲנִי לֹא רוֹצֶה מַיִם', 'אֲנִי רָצִיתִי מַיִם', 'אֲנִי רוֹצֶה מַיִם בְּבַקָּשָׁה', 'אֲנִי אֶרְצֶה מַיִם'], ans: 2,
    fun: '💧 אֲנִי רוֹצֶה (ani rotze) = I want — the most useful tourist phrase! רוֹצֶה (masc.) / רוֹצָה (fem.) — change the ending to match your gender!'
  },
  { n:5,  emoji:'🏥', tier:'Intermediate',
    q: 'What does "אֲנִי עוֹבֵד בְּבֵית חוֹלִים" mean?',
    heb: 'אֲנִי עוֹבֵד בְּבֵית חוֹלִים',
    opts: ['I want to work in a hospital', 'I worked in a hospital', 'I work in a hospital', 'I will work in a hospital'], ans: 2,
    fun: '👨‍⚕️ עוֹבֵד = present tense "working" (masculine). Hebrew present tense describes a current state or habit. בֵּית חוֹלִים = "house of the sick" = hospital!'
  },
  { n:6,  emoji:'📚', tier:'Intermediate',
    q: 'Which sentence correctly says "We study Hebrew every day"?',
    heb: null,
    opts: ['אֲנַחְנוּ לָמַדְנוּ עִבְרִית', 'אֲנַחְנוּ לוֹמְדִים עִבְרִית כָּל יוֹם', 'אֲנַחְנוּ נִלְמַד עִבְרִית', 'אֲנַחְנוּ לֶלְמוֹד עִבְרִית'], ans: 1,
    fun: '📚 לוֹמְדִים (lom\'dim) = present tense "studying" (plural). לָמַדְנוּ = we studied (past), נִלְמַד = we\'ll study (future). Same root ל-מ-ד, three tenses!'
  },
  { n:7,  emoji:'🏢', tier:'Advanced',
    q: 'You hear: "הַמִּשְׂרָד סָגוּר בֵּין שְׁלוֹשׁ לְחָמֵשׁ". What does this mean for your plans?',
    heb: null,
    opts: ['The office opens at 3pm', 'Come back after 5pm', 'The office is closed between 3 and 5', 'The office closes only at 5pm'], ans: 2,
    fun: '🏢 סָגוּר = closed. בֵּין... לְ... = between... and... Israeli bureaucracy loves the midday break!'
  },
  { n:8,  emoji:'🏠', tier:'Advanced',
    q: 'How do you say "I lived in Tel Aviv for two years" (past tense) in Hebrew?',
    heb: null,
    opts: ['אֲנִי גָּר בְּתֵל אָבִיב שְׁנָתַיִם', 'אֲנִי גָּרְתִּי בְּתֵל אָבִיב שְׁנָתַיִם', 'אֲנִי אָגוּר בְּתֵל אָבִיב שְׁנָתַיִם', 'אֲנִי לָגוּר בְּתֵל אָבִיב שְׁנָתַיִם'], ans: 1,
    fun: '🏠 גָּרְתִּי (garti) = I lived — past tense! The suffix תִּי- marks "I" in past tense. גָּר = present, אָגוּר = future — same root ג-ו-ר, three forms!'
  },
  { n:9,  emoji:'📋', tier:'Expert',
    q: 'In Israeli bureaucracy, "לֹא יִהְיֶה בְּסֵדֶר" means:',
    heb: null,
    opts: ['Please wait a moment', 'This will not be in order / acceptable', 'Come back tomorrow morning', 'I don\'t understand your problem'], ans: 1,
    fun: '📋 לֹא = not + יִהְיֶה = will be + בְּסֵדֶר = in order. "This won\'t work" — the bureaucrat\'s most-used phrase!'
  },
  { n:10, emoji:'💰', tier:'Expert',
    q: 'In Israeli banking, what is a זִכּוּי (zikui)?',
    heb: null,
    opts: ['A loan or debt (money you owe)', 'A tax payment to the government', 'A credit or benefit (money in your favor)', 'A penalty for late payment'], ans: 2,
    fun: '💰 זִכּוּי (zikui) = credit/benefit — from ז-כ-ה = to merit/deserve. Practical financial Hebrew for daily Israeli life!'
  },
  { n:11, emoji:'📨', tier:'Expert',
    q: 'In formal Israeli correspondence, what does לְכָבוֹד (lich\'vod) mean at the opening of a letter?',
    heb: null,
    opts: ['Best regards / warm wishes (closing salutation)', 'Dear / To the honored attention of (formal opening address)', 'Subject: (identifying the letter\'s topic)', 'On behalf of (identifying the sender)'],
    ans: 1,
    fun: '📨 לְכָבוֹד = "To the honor of..." — the standard formal letter opener in Israel, equivalent to "Dear" but literally honoring the recipient. From כָּבוֹד (kavod) = honor/respect. Mastering formal register marks true advanced Hebrew!'
  },
  { n:12, emoji:'📞', tier:'Expert',
    q: 'How do you correctly say "I should have called" (expressing past regret) in Hebrew?',
    heb: null,
    opts: ['הָיִיתִי צָרִיךְ לְהַתְקַשֵּׁר', 'אֲנִי צָרִיךְ לְהַתְקַשֵּׁר', 'אֲנִי אַתְקַשֵּׁר', 'הִתְקַשַּׁרְתִּי'],
    ans: 0,
    fun: '📞 הָיִיתִי צָרִיךְ = "I was supposed to / I should have" — the past form of צָרִיךְ. This structure (past auxiliary + infinitive) expresses missed obligations in Hebrew. A genuine advanced-level construction!'
  }
],

// ── HERITAGE: heritage goal — cultural + traditional mix ─
heritage: [
  { n:1,  emoji:'🕯️', tier:'Beginner',
    q: 'What does "שַׁבָּת שָׁלוֹם" (Shabbat Shalom) mean?',
    heb: null,
    opts: ['Happy New Year!', 'Good morning everyone!', 'A peaceful Sabbath', 'Thank you for coming'], ans: 2,
    fun: '🕯️ שַׁבָּת = Sabbath (day of rest). שָׁלוֹם = peace/wholeness. Said from Friday sundown to Saturday night!'
  },
  { n:2,  emoji:'🍎', tier:'Beginner',
    q: 'What is the Hebrew name for the Jewish New Year?',
    heb: null,
    opts: ['פֶּסַח', 'שָׁבוּעוֹת', 'יוֹם כִּפּוּר', 'רֹאשׁ הַשָּׁנָה'], ans: 3,
    fun: '🍎 רֹאשׁ הַשָּׁנָה literally means "Head of the Year" — the beginning of the Jewish calendar! 🍯 Apples and honey!'
  },
  { n:3,  emoji:'🌍', tier:'Elementary',
    q: 'What does תִּקּוּן עוֹלָם (tikkun olam) mean?',
    heb: null,
    opts: ['World creation by God', 'World Torah study', 'Praying for world peace', 'Repairing / healing the world'], ans: 3,
    fun: '🌍 תִּקּוּן = repair/fix (from ת-ק-נ). עוֹלָם = world. Tikkun olam = the Jewish calling to make the world better!'
  },
  { n:4,  emoji:'💨', tier:'Elementary',
    q: 'What is the meaning of נְשָׁמָה (neshamah)?',
    heb: null,
    opts: ['Body (physical form)', 'Heart (center of emotion)', 'Mind / intellect', 'Soul / spirit'], ans: 3,
    fun: '💨 נְשָׁמָה = soul, related to נְשִׁימָה (breathing)! The soul breathes life into us — same ancient root!'
  },
  { n:5,  emoji:'⚖️', tier:'Intermediate',
    q: 'What does the word צְדָקָה (tzedakah) literally mean in Hebrew?',
    heb: null,
    opts: ['Generous personal giving from the heart', 'Prayer for others\' wellbeing', 'Blessing from God', 'Righteousness / justice (giving because it\'s right)'], ans: 3,
    fun: '⚖️ צְדָקָה comes from צֶדֶק (justice). In Judaism, charity is a JUSTICE obligation — not optional generosity!'
  },
  { n:6,  emoji:'🥂', tier:'Intermediate',
    q: 'חַיִּים (chayyim) means "life." Why is the Hebrew word for life always in the PLURAL form?',
    heb: 'לְחַיִּים',
    opts: ['Because Jews celebrate two new years (Rosh Hashanah and Nisan)', 'The singular form doesn\'t exist — life is inherently plural in Hebrew', 'Because life has two parts: body and soul', 'It only became plural after the sages edited the Torah'], ans: 1,
    fun: '🔤 חַיִּים has no singular — like מַיִם (water) and שָׁמַיִם (sky), it\'s "pluralia tantum" — always plural. So every לְחַיִּים toast uses a grammatical mystery!'
  },
  { n:7,  emoji:'⭐', tier:'Advanced',
    q: 'What does מַזָּל טוֹב literally mean in Hebrew?',
    heb: null,
    opts: ['Happy birthday (yom huledet same\'ach)', 'Be happy always (tihye same\'ach)', 'Good luck / good fortune (good star/constellation)', 'May you be blessed (tivarech)'], ans: 2,
    fun: '⭐ מַזָּל (mazal) originally meant star or constellation. Good mazal = good star alignment = good fortune — from astrology to Jewish life!'
  },
  { n:8,  emoji:'✈️', tier:'Advanced',
    q: 'The word עֲלִיָּה has two major meanings in Jewish life. Which pair is correct?',
    heb: null,
    opts: ['Prayer + synagogue honor', 'Shabbat + blessing over wine', 'Being called to the Torah + immigrating to Israel', 'Torah study + going to synagogue'], ans: 2,
    fun: '✈️ עֲלִיָּה = "going up" — (1) called to the Torah bimah, (2) immigrating to Israel. Both are spiritual "going up"!'
  },
  { n:9,  emoji:'🌍', tier:'Expert',
    q: 'What is the Hebrew term for the Jewish diaspora — Jewish communities living outside Israel?',
    heb: null,
    opts: ['אֶרֶץ יִשְׂרָאֵל', 'הַמּוֹלֶדֶת', 'גָּלוּת (galut)', 'עַם יִשְׂרָאֵל'], ans: 2,
    fun: '🌍 גָּלוּת (galut) = exile / diaspora. The opposite is עֲלִיָּה — coming home. This tension is at the heart of Jewish identity!'
  },
  { n:10, emoji:'❤️', tier:'Expert',
    q: 'The Hebrew concept חֶסֶד (chesed) is translated "lovingkindness." Which best captures it?',
    heb: 'חֶסֶד',
    opts: ['Everyday politeness and common courtesy', 'Formal religious obligation you must fulfill', 'Conditional love based on someone\'s merit', 'Unconditional loyal love that goes beyond what is required'], ans: 3,
    fun: '❤️ חֶסֶד is the defining attribute of God in Torah — unconditional, overflowing love and loyalty beyond all expectation!'
  },
  { n:11, emoji:'🌍', tier:'Expert',
    q: 'What does גָּלוּת (galut) mean, and what is its opposite concept in Jewish thought?',
    heb: null,
    opts: ['Prayer (galut) — opposite is Torah study (limud)', 'Exile / diaspora (galut) — opposite is return / homecoming (עֲלִיָּה or גְּאֻלָּה)', 'Mourning (galut) — opposite is celebration (שִׂמְחָה)', 'Darkness (galut) — opposite is light (אוֹר)'],
    ans: 1,
    fun: '🌍 גָּלוּת (galut) = exile, diaspora — Jewish life outside the Land of Israel. Its opposite is עֲלִיָּה (going home) or גְּאֻלָּה (redemption). This tension between exile and return has shaped Jewish identity for 2,000 years!'
  },
  { n:12, emoji:'✨', tier:'Expert',
    q: 'The Kabbalistic concept צִמְצוּם (tzimtzum) refers to:',
    heb: null,
    opts: ['God\'s presence filling and sustaining all of creation', 'God\'s self-contraction to make space for the world to exist', 'The mystical union of divine masculine and feminine forces', 'The Torah\'s divine fire encoded in its letters'],
    ans: 1,
    fun: '✨ צִמְצוּם (tzimtzum) = God\'s self-contraction — the central concept of Lurianic Kabbalah (16th century, Safed). To create the world, the infinite God "withdrew" to make space. This idea deeply shaped Hasidic thought and modern Jewish theology!'
  }
]

}; // end PT_QUESTION_SETS

// Set metadata (title + subtitle shown in test header)
const PT_SET_META = {
  biblical:   { title: '📜 Biblical Hebrew Test',    sub: 'Torah, Nikud & Biblical Grammar' },
  modern:     { title: '🗣️ Modern Hebrew Test',      sub: 'Israeli Conversation & Slang' },
  barmitzvah: { title: '🕍 Bar / Bat Mitzvah Test',  sub: 'Synagogue, Torah & Prayer' },
  fluency:    { title: '🔥 Full Fluency Test',        sub: 'The Complete Hebrew Challenge' },
  heritage:   { title: '✡️ Jewish Heritage Test',    sub: 'Culture, Tradition & Identity' },
};

function _ptSelectSet(goal) {
  if (goal === 'prayer' || goal === 'bible')        return 'biblical';
  if (goal === 'bar_mitzvah')                       return 'barmitzvah';
  if (goal === 'conversation' || goal === 'travel') return 'modern';
  if (goal === 'aliyah')                            return 'fluency';
  if (goal === 'heritage')                          return 'heritage';
  return 'modern';
}

const PT_QUESTIONS = []; // unused — runtime reads _pt.questions (goal-adaptive set)

// Scoring: 2 questions per tier × 6 tiers (12 total)
// 0-1=New · 2-3=Basic · 4-5=Elementary · 6-7=Intermediate · 8-9=Advanced · 10-11=Near Fluent · 12=Expert
const PT_LEVELS = {
  newLvl:     { val: 'complete_beginner', label: 'New',         heb: 'חָדָשׁ',            emoji: '🌱', msg: "Everyone starts at the aleph-bet — and that's exactly the right place to begin! Morah will guide you letter by letter from day one." },
  basic:      { val: 'some_exposure',     label: 'Basic',       heb: 'בְּסִיסִי',          emoji: '🌿', msg: "You've got some vocabulary! Morah will build on your word bank and get you reading and speaking with confidence." },
  elementary: { val: 'basic',             label: 'Elementary',  heb: 'יְסוֹדִי',           emoji: '🌳', msg: "You know your verbs and infinitives! Morah will take you into full sentences, all three tenses, and real conversations." },
  inter:      { val: 'intermediate',      label: 'Intermediate',heb: 'בֵּינוֹנִי',         emoji: '⭐', msg: "Solid Hebrew! You handle past tense and advanced binyanim. Morah will challenge you with complex grammar and authentic texts." },
  adv:        { val: 'advanced',          label: 'Advanced',    heb: 'מִתְקַדֵּם',         emoji: '🔥', msg: "You can navigate Israel independently! You handle complex structures with confidence. Morah will push you toward near-native fluency." },
  nearFluent: { val: 'advanced',          label: 'Near Fluent', heb: 'כִּמְעַט שׁוֹטֵף',   emoji: '🚀', msg: "90% there — impressive! You operate at a high level in Hebrew. Morah will fine-tune your advanced skills toward complete fluency." },
  expert:     { val: 'advanced',          label: 'Expert',      heb: 'מוּמְחֶה',           emoji: '✨', msg: "Fully fluent! Your Hebrew mastery is remarkable — you think, read, and communicate at a near-native level. Morah will be your advanced study partner." }
};

function _ptLevelFromScore(score) {
  if (score <= 1)  return PT_LEVELS.newLvl;
  if (score <= 4)  return PT_LEVELS.basic;
  if (score <= 7)  return PT_LEVELS.elementary;
  if (score <= 10) return PT_LEVELS.inter;      // 8+ = Intermediate
  return PT_LEVELS.adv;                         // 11-12 = Advanced
}

var _pt = { idx: 0, score: 0, answered: false, detectedLevel: null };

function _showPT() {
  var rawGoal = (state.quizAnswers && state.quizAnswers.goal) || 'conversation';
  var goal    = Array.isArray(rawGoal) ? rawGoal[0] : rawGoal;
  var setKey  = _ptSelectSet(goal);
  var meta   = PT_SET_META[setKey];
  _pt = { idx: 0, score: 0, answered: false, detectedLevel: null,
          questions: PT_QUESTION_SETS[setKey], setKey: setKey, meta: meta };
  var titleEl = document.getElementById('pt-header-title-text');
  if (titleEl) titleEl.textContent = meta.title;
  var subEl = document.getElementById('pt-header-sub-text');
  if (subEl) subEl.textContent = meta.sub;
  var el = document.getElementById('pt-overlay');
  if (el) { el.style.display = 'flex'; el.style.opacity = '1'; }
  // Show intro screen first
  document.getElementById('pt-intro-view').style.display = 'flex';
  document.getElementById('pt-quiz-view').style.display  = 'none';
  document.getElementById('pt-results-view').style.display = 'none';
}

function _ptStartTest() {
  document.getElementById('pt-intro-view').style.display = 'none';
  document.getElementById('pt-quiz-view').style.display  = 'flex';
  _ptRender();
}

function _hidePT(cb) {
  var el = document.getElementById('pt-overlay');
  if (!el) { if (cb) cb(); return; }
  el.style.transition = 'opacity 0.35s';
  el.style.opacity = '0';
  setTimeout(function() { el.style.display = 'none'; if (cb) cb(); }, 360);
}

function _ptRender() {
  var q = _pt.questions[_pt.idx];
  _pt.answered = false;

  // Progress
  document.getElementById('pt-progress-fill').style.width = (_pt.idx / _pt.questions.length * 100) + '%';
  document.getElementById('pt-q-num').textContent = _pt.idx + 1 + ' / ' + _pt.questions.length;

  // Tier badge
  var tierEl = document.getElementById('pt-tier');
  if (tierEl) {
    tierEl.textContent = q.tier || '';
    tierEl.className = 'pt-tier pt-tier-' + (q.tier || '').toLowerCase().replace(/\s/g, '-');
  }

  // Question card spring-in
  var card = document.getElementById('pt-question-card');
  card.className = 'pt-card pt-card-in';
  setTimeout(function() { card.classList.remove('pt-card-in'); }, 500);

  document.getElementById('pt-emoji').textContent = q.emoji;
  document.getElementById('pt-q-text').textContent = q.q;

  var hebEl = document.getElementById('pt-heb');
  if (q.heb) { hebEl.textContent = q.heb; hebEl.style.display = 'block'; }
  else        { hebEl.style.display = 'none'; }

  // Answer option buttons
  var optsEl = document.getElementById('pt-options');
  optsEl.innerHTML = '';
  q.opts.forEach(function(opt, i) {
    var btn = document.createElement('button');
    btn.className = 'pt-opt-btn';
    btn.innerHTML = '<span class="pt-opt-text">' + escapeHtml(opt) + '</span>';
    btn.setAttribute('data-idx', i);
    btn.onclick = function() { _ptAnswer(i); };
    optsEl.appendChild(btn);
  });

  // "I don't know" ghost button
  var dk = document.createElement('button');
  dk.className = 'pt-dontknow-btn';
  dk.textContent = "I don't know";
  dk.onclick = ptDontKnow;
  optsEl.appendChild(dk);

  var ff = document.getElementById('pt-fun-fact');
  ff.style.display = 'none';
  ff.innerHTML = '';
}

function _ptAnswer(chosen) {
  if (_pt.answered) return;
  _pt.answered = true;

  var q  = _pt.questions[_pt.idx];
  var ok = chosen === q.ans;
  if (ok) _pt.score++;

  // Disable all buttons and mark correct / wrong
  document.querySelectorAll('.pt-opt-btn, .pt-dontknow-btn').forEach(function(b) { b.disabled = true; });
  document.querySelectorAll('.pt-opt-btn').forEach(function(b, i) {
    if (i === q.ans)               b.classList.add('pt-opt-correct');
    if (i === chosen && !ok)       b.classList.add('pt-opt-wrong');
  });

  // Score badge
  document.getElementById('pt-score').textContent = '✓ ' + _pt.score;

  setTimeout(_ptNext, 700);
}

function ptDontKnow() {
  if (_pt.answered) return;
  _pt.answered = true;
  // score does NOT increment

  var q = _pt.questions[_pt.idx];

  // Disable everything; reveal correct answer
  document.querySelectorAll('.pt-opt-btn, .pt-dontknow-btn').forEach(function(b) { b.disabled = true; });
  document.querySelectorAll('.pt-opt-btn').forEach(function(b, i) {
    if (i === q.ans) b.classList.add('pt-opt-correct');
  });

  setTimeout(_ptNext, 1000);
}

function _ptNext() {
  _pt.idx++;
  if (_pt.idx < _pt.questions.length) {
    _ptRender();
  } else {
    _ptShowResults();
  }
}

function _ptShowResults() {
  var lvl = _ptLevelFromScore(_pt.score);
  _pt.detectedLevel = lvl.val;

  document.getElementById('pt-quiz-view').style.display = 'none';
  var res = document.getElementById('pt-results-view');
  res.style.display = 'flex';
  res.className = 'pt-results pt-results-in';

  var pct = Math.round(_pt.score / _pt.questions.length * 100);

  document.getElementById('pt-res-emoji').textContent    = lvl.emoji;
  var e2 = document.getElementById('pt-res-emoji-2');
  if (e2) e2.textContent = lvl.emoji;
  document.getElementById('pt-res-level').textContent    = lvl.label;
  document.getElementById('pt-res-heb').textContent      = lvl.heb;
  document.getElementById('pt-res-score').textContent    = _pt.score + ' / ' + _pt.questions.length;
  document.getElementById('pt-res-pct').textContent      = pct + '%';
  document.getElementById('pt-res-bar').style.width      = pct + '%';
  document.getElementById('pt-res-msg').textContent      = lvl.msg;

  // Animate score bar
  document.getElementById('pt-res-bar').style.width = '0%';
  setTimeout(function() {
    document.getElementById('pt-res-bar').style.width = pct + '%';
  }, 100);
}

function ptAccept() {
  state.quizAnswers.level = _pt.detectedLevel;
  state.quizAnswers._placementScore = _pt.score;
  _hidePT(function() {
    // Skip the level question — advance two steps from goal (idx 1) to learningStyle (idx 3)
    state.currentQuizStep = 3;
    renderQuizStep();
  });
}

function ptOverride() {
  // Pre-fill with detected level but show the question so they can change it
  state.quizAnswers.level = _pt.detectedLevel;
  state.quizAnswers._placementScore = _pt.score;
  _hidePT(function() {
    state.currentQuizStep = 2; // Show the level question
    renderQuizStep();
  });
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
function _registerWithDb(firstName, lastInitial, school, secretWord, schoolCode) {
  var profile = (state && state.userProfile) || {};
  fetch('/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firstName, lastInitial, school, secretWord,
      schoolCode: schoolCode || null,
      level: profile.level || null,
      goal:  profile.goal  || null
    })
  })
  .then(function(r) { return r.json().then(function(d) { return { ok: r.ok, data: d }; }); })
  .then(function(res) {
    if (res.ok && res.data.userId) {
      currentUser.userId = res.data.userId;
      saveUser();
      console.log('[DB] Registered, userId:', res.data.userId);
    } else {
      console.warn('[DB] Registration failed:', res.data.error);
    }
  })
  .catch(function(e) { console.warn('[DB] Registration sync failed (offline?):', e); });
}

// ── Progress sync — saves words + full progress_blob for teacher dashboard ─────
function _syncProgressToDb() {
  if (!currentUser || !currentUser.userId) return;
  clearTimeout(_syncTimer);
  _syncTimer = setTimeout(function() {
    var up = state.userProfile || {};
    var recentMsgs = [];
    try {
      var msgs = JSON.parse(localStorage.getItem('kesher_messages') || '[]');
      recentMsgs = msgs.filter(function(m){ return m.role === 'user'; })
        .slice(-10).map(function(m){ return m.content.slice(0, 200); });
    } catch(e) {}

    var blob = {
      level:          up.level || null,
      goal:           up.goal  || null,
      timeAvailable:  up.timeAvailable  || null,
      learningStyle:  up.learningStyle  || null,
      background:     up.background     || null,
      myClass:        myClass || null,
      lessonsCompleted: state.progress.lessonsCompleted || 0,
      activityDays:   state.progress.activityDays || [],
      quizHistory:    _safeLS('kesher_quiz_history',    []),
      dailyHistory:   _safeLS('kesher_daily_history',   []),
      weeklyPts:      _safeLS('kesher_weekly_pts',      {}),
      struggles:      _safeLS('kesher_review',          []),
      placement:      _safeLS('kesher_placement',       null),
      recentMessages: recentMsgs,
      syncedAt:       new Date().toISOString()
    };

    fetch('/api/progress/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId:       currentUser.userId,
        points:       state.progress.points,
        streak:       state.progress.streak,
        wordsLearned: state.progress.wordsLearned.length,
        wordsData:    state.progress.wordsLearned,
        progressBlob: blob
      })
    }).catch(function(e) { console.warn('[DB] Progress save failed:', e); });
  }, 3000);
}

function _safeLS(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch(e) { return fallback; }
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

function _hideAllRegPanels() {
  ['reg-panel-choice','reg-panel-create','reg-panel-login','reg-panel-teacher'].forEach(function(id) {
    var el = document.getElementById(id); if (el) el.style.display = 'none';
  });
}
function showChoicePanel()  { _hideAllRegPanels(); document.getElementById('reg-panel-choice').style.display  = ''; }
function showLoginPanel()   { _hideAllRegPanels(); document.getElementById('reg-panel-login').style.display   = ''; document.getElementById('login-firstname').focus(); }
function showRegisterPanel(){ _hideAllRegPanels(); document.getElementById('reg-panel-create').style.display  = ''; document.getElementById('reg-firstname').focus(); }
function showTeacherPanel() { _hideAllRegPanels(); document.getElementById('reg-panel-teacher').style.display = ''; document.getElementById('teacher-name').focus(); }

// ── School code live validation ───────────────────────────────────────────────
var _codeCheckTimer = null;
function onSchoolCodeInput() {
  var inp    = document.getElementById('reg-school-code');
  var status = document.getElementById('reg-code-status');
  if (!inp || !status) return;
  var code = inp.value.replace(/\D/g, '').slice(0, 6);
  inp.value = code;
  delete status.dataset.linkedSchool;
  clearTimeout(_codeCheckTimer);
  if (code.length < 6) {
    status.textContent = ''; status.className = 'reg-code-status';
    // restore school field editability if user cleared the code
    var sf = document.getElementById('reg-school');
    if (sf) sf.removeAttribute('readonly');
    return;
  }
  status.innerHTML = '<span class="ki-loader ki-loader-sm"><span class="ki-letters"><span class="ki-letter">א</span><span class="ki-letter">ב</span><span class="ki-letter">ג</span></span></span>'; status.className = 'reg-code-status';
  _codeCheckTimer = setTimeout(async function() {
    try {
      var r = await fetch('/api/school-code-lookup?code=' + code);
      var d = await r.json();
      if (r.ok) {
        status.textContent = '✓ Linked to ' + d.teacherName + ' at ' + d.school;
        status.className = 'reg-code-status rc-valid';
        status.dataset.linkedSchool = d.school;
        var sf = document.getElementById('reg-school');
        if (sf) { sf.value = d.school; sf.setAttribute('readonly', 'readonly'); }
      } else {
        status.textContent = '✗ ' + (d.error || 'Invalid code — check with your teacher');
        status.className = 'reg-code-status rc-invalid';
        var sf = document.getElementById('reg-school');
        if (sf) sf.removeAttribute('readonly');
      }
    } catch(e) {
      status.textContent = ''; status.className = 'reg-code-status';
    }
  }, 500);
}

// ── Teacher auth ──────────────────────────────────────────────────────────────
var _currentTeacher = null;

async function submitTeacher(mode) {
  var name       = (document.getElementById('teacher-name').value   || '').trim();
  var school     = (document.getElementById('teacher-school').value || '').trim();
  var secretWord = (document.getElementById('teacher-secret').value || '').trim();
  var errEl      = document.getElementById('teacher-error');
  var loginBtn   = document.getElementById('teacher-login-btn');
  var regBtn     = document.getElementById('teacher-reg-btn');
  function showErr(msg) { errEl.textContent = msg; errEl.style.display = 'block'; }
  if (!name)       return showErr('Please enter your name.');
  if (!school)     return showErr('Please enter your school name.');
  if (!secretWord) return showErr('Please enter your secret word.');
  if (mode === 'register' && secretWord.length < 4) return showErr('Secret word must be at least 4 characters.');
  errEl.style.display = 'none';
  loginBtn.disabled = regBtn.disabled = true;
  var origLogin = loginBtn.textContent, origReg = regBtn.textContent;
  var _kiLoader = '<span class="ki-loader ki-loader-sm"><span class="ki-letters"><span class="ki-letter">א</span><span class="ki-letter">ב</span><span class="ki-letter">ג</span></span></span>';
  loginBtn.innerHTML = regBtn.innerHTML = _kiLoader;
  try {
    var r = await fetch('/api/teacher/' + mode, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, school, secretWord })
    });
    var data = await r.json();
    if (!r.ok) { showErr(data.error || 'Something went wrong.'); return; }
    _currentTeacher = { id: data.teacherId, name: data.name, school: data.school, schoolCode: data.schoolCode || '' };
    openTeacherDashboard();
  } catch(e) {
    showErr('Connection error — check your internet and try again.');
  } finally {
    loginBtn.disabled = regBtn.disabled = false;
    loginBtn.textContent = origLogin; regBtn.textContent = origReg;
  }
}

// ═══════════════════════════════════════════════════════════════════════
//  TEACHER DASHBOARD
// ═══════════════════════════════════════════════════════════════════════
var _tdStudents = [], _tdSortKey = 'points', _tdActiveTab = 'students';

function openTeacherDashboard() {
  var el = document.getElementById('teacher-dashboard');
  if (!el) return;
  document.getElementById('td-teacher-name').textContent = _currentTeacher.name;
  document.getElementById('td-school-name').textContent  = _currentTeacher.school;
  el.style.display = 'flex';
  _tdLoadClass();
}
function closeTeacherDashboard() {
  var el = document.getElementById('teacher-dashboard');
  if (el) el.style.display = 'none';
}

async function _tdLoadClass() {
  document.getElementById('td-loading').style.display      = '';
  document.getElementById('td-student-list').style.display = 'none';
  try {
    var r = await fetch('/api/teacher/class?teacherId=' + encodeURIComponent(_currentTeacher.id));
    var data = await r.json();
    if (!r.ok) { document.getElementById('td-loading').textContent = 'Error: ' + (data.error || 'Failed to load'); return; }
    _tdStudents = data.students || [];
    document.getElementById('td-loading').style.display      = 'none';
    document.getElementById('td-student-list').style.display = '';
    _tdRenderStudents();
    _tdRenderOverview();
  } catch(e) {
    document.getElementById('td-loading').textContent = 'Connection error — refresh to retry.';
  }
}

function tdSwitchTab(tab) {
  _tdActiveTab = tab;
  document.getElementById('td-pane-students').style.display = tab === 'students' ? '' : 'none';
  document.getElementById('td-pane-overview').style.display = tab === 'overview' ? '' : 'none';
  document.getElementById('td-tab-students').classList.toggle('td-tab-active', tab === 'students');
  document.getElementById('td-tab-overview').classList.toggle('td-tab-active', tab === 'overview');
}

function tdSort(key) {
  _tdSortKey = key;
  document.querySelectorAll('.td-sort-btn').forEach(function(b) { b.classList.remove('td-sort-active'); });
  event.target.classList.add('td-sort-active');
  _tdRenderStudents();
}

function _tdSorted() {
  var s = _tdStudents.slice();
  if (_tdSortKey === 'points')     return s.sort(function(a,b){ return b.points - a.points; });
  if (_tdSortKey === 'streak')     return s.sort(function(a,b){ return b.streak - a.streak; });
  if (_tdSortKey === 'struggling') return s.sort(function(a,b){ return (a.points + a.wordsLearned*5) - (b.points + b.wordsLearned*5); });
  if (_tdSortKey === 'name')       return s.sort(function(a,b){ return a.name.localeCompare(b.name); });
  return s;
}

var _LEVEL_LABELS = { complete_beginner:'Beginner', some_exposure:'Basic', basic:'Basic', intermediate:'Intermediate', advanced:'Advanced', unknown:'—' };

function _tdRenderStudents() {
  var list = document.getElementById('td-student-list');
  if (!list) return;
  var sorted = _tdSorted();
  if (!sorted.length) {
    list.innerHTML = '<div class="td-empty">No students from <strong>' + escapeHtml(_currentTeacher.school) + '</strong> yet.<br>Students must enter the exact school name when registering.</div>';
    return;
  }
  var html = '<table class="td-table"><thead><tr><th>Student</th><th>Level</th><th>🔥 Streak</th><th>📖 Words</th><th>⭐ Points</th><th>Last Active</th><th></th></tr></thead><tbody>';
  sorted.forEach(function(s, i) {
    var ago = _tdTimeAgo(s.lastActive);
    var stale = !s.lastActive || (Date.now() - new Date(s.lastActive).getTime()) > 7 * 864e5;
    html += '<tr class="td-row' + (stale ? ' td-row-inactive' : '') + '">' +
      '<td class="td-name">' + escapeHtml(s.name) + '</td>' +
      '<td><span class="td-level-badge">' + (_LEVEL_LABELS[s.level] || s.level) + '</span></td>' +
      '<td class="td-num">' + s.streak + '</td>' +
      '<td class="td-num">' + s.wordsLearned + '</td>' +
      '<td class="td-num td-pts">' + s.points + '</td>' +
      '<td class="td-ago' + (stale ? ' td-ago-stale' : '') + '">' + ago + '</td>' +
      '<td><button class="td-detail-btn" onclick="tdOpenDetail(' + i + ')">View →</button></td></tr>';
  });
  list.innerHTML = html + '</tbody></table>';
}

function _tdRenderOverview() {
  var body = document.getElementById('td-overview-body');
  if (!body || !_tdStudents.length) return;
  var s = _tdStudents, n = s.length;
  var avgPts    = Math.round(s.reduce(function(a,b){ return a+b.points; }, 0) / n);
  var avgWords  = Math.round(s.reduce(function(a,b){ return a+b.wordsLearned; }, 0) / n);
  var avgStreak = (s.reduce(function(a,b){ return a+b.streak; }, 0) / n).toFixed(1);
  var active    = s.filter(function(st){ return st.lastActive && (Date.now() - new Date(st.lastActive).getTime()) < 7*864e5; }).length;
  var lvlCount  = {}, catCount = {};
  s.forEach(function(st) {
    lvlCount[st.level] = (lvlCount[st.level]||0) + 1;
    (st.wordsData||[]).forEach(function(w){ var c = w.category||'other'; catCount[c]=(catCount[c]||0)+1; });
  });
  var topCats = Object.entries(catCount).sort(function(a,b){ return b[1]-a[1]; }).slice(0,6);
  var codeHtml = '';
  if (_currentTeacher && _currentTeacher.schoolCode) {
    codeHtml = '<div class="td-code-banner">' +
      '<div class="td-code-banner-left"><div class="td-code-label">Share this code with your students:</div>' +
      '<div class="td-code-display">' + _currentTeacher.schoolCode + '</div>' +
      '<div class="td-code-hint">Students enter this when they register to appear in your dashboard</div></div>' +
      '<button class="td-code-copy-btn" onclick="tdCopySchoolCode()">📋 Copy</button></div>';
  }
  var html = codeHtml + '<div class="td-stat-grid">' +
    '<div class="td-stat-card"><div class="td-stat-val">' + n + '</div><div class="td-stat-lbl">Students</div></div>' +
    '<div class="td-stat-card"><div class="td-stat-val">' + avgPts + '</div><div class="td-stat-lbl">Avg Points</div></div>' +
    '<div class="td-stat-card"><div class="td-stat-val">' + avgWords + '</div><div class="td-stat-lbl">Avg Words</div></div>' +
    '<div class="td-stat-card"><div class="td-stat-val">' + avgStreak + '</div><div class="td-stat-lbl">Avg Streak</div></div>' +
    '<div class="td-stat-card"><div class="td-stat-val">' + active + '/' + n + '</div><div class="td-stat-lbl">Active This Week</div></div>' +
    '</div>';
  html += '<div class="td-section-title">Level Distribution</div><div class="td-level-grid">';
  Object.entries(lvlCount).forEach(function(e) {
    html += '<div class="td-level-row"><span class="td-level-badge">' + (_LEVEL_LABELS[e[0]]||e[0]) + '</span><div class="td-level-bar"><div class="td-level-fill" style="width:' + Math.round(e[1]/n*100) + '%"></div></div><span class="td-level-count">' + e[1] + '</span></div>';
  });
  html += '</div>';
  if (topCats.length) {
    html += '<div class="td-section-title">Most Learned Word Categories</div><div class="td-cat-grid">';
    topCats.forEach(function(c){ html += '<div class="td-cat-card"><div class="td-cat-count">' + c[1] + '</div><div class="td-cat-name">' + escapeHtml(c[0]) + '</div></div>'; });
    html += '</div>';
  }
  body.innerHTML = html;
}

function tdCopySchoolCode() {
  var code = _currentTeacher && _currentTeacher.schoolCode;
  if (!code) return;
  var msg = 'School Code: ' + code + '\nEnter this when registering on Kesher Ivrit to join my class.';
  function done() { showToast('📋 Code copied! Share it with your students.', 3000); }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(msg).then(done).catch(function() {
      navigator.clipboard.writeText(code).then(done);
    });
  } else {
    var ta = document.createElement('textarea');
    ta.value = msg; ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); done(); } catch(e) {}
    document.body.removeChild(ta);
  }
}

// ── Rich student profile ─────────────────────────────────────────────────────
var _tdCurrentStudentId   = null;
var _tdCurrentStudentData = null;
var _tdProfileTab         = 'profile';

async function tdOpenDetail(idx) {
  var s = _tdSorted()[idx];
  if (!s) return;
  _tdCurrentStudentId = s.id;
  _tdProfileTab       = 'profile';

  document.getElementById('td-detail-name').textContent = s.name;
  document.getElementById('td-detail-body').innerHTML =
    '<div class="td-loading">Loading student profile…</div>';
  document.getElementById('td-detail').style.display = '';

  try {
    var r = await fetch('/api/teacher/student/' + s.id + '?teacherId=' + encodeURIComponent(_currentTeacher.id));
    _tdCurrentStudentData = await r.json();
    if (!r.ok) throw new Error(_tdCurrentStudentData.error || 'Failed');
    _tdRenderProfile();
  } catch(e) {
    document.getElementById('td-detail-body').innerHTML =
      '<div class="td-empty">⚠️ ' + e.message + '</div>';
  }
}

function tdCloseDetail() {
  document.getElementById('td-detail').style.display = 'none';
  _tdCurrentStudentId = null; _tdCurrentStudentData = null;
}

function tdSwitchProfileTab(tab) {
  _tdProfileTab = tab;
  document.querySelectorAll('.td-ptab').forEach(function(b) {
    b.classList.toggle('td-ptab-active', b.dataset.tab === tab);
  });
  _tdRenderProfilePane();
}

function _tdRenderProfile() {
  var d   = _tdCurrentStudentData;
  var s   = d.student, sc = d.scores, blob = d.progressBlob || {};
  var tabs = ['profile','activity','quizzes','progress','notes'];
  var labels = { profile:'👤 Profile', activity:'📅 Activity', quizzes:'🎯 Quizzes', progress:'📈 Progress', notes:'📝 Notes' };

  var tabBar = '<div class="td-ptabs">' + tabs.map(function(t) {
    return '<button class="td-ptab' + (t === _tdProfileTab ? ' td-ptab-active' : '') + '" data-tab="' + t + '" onclick="tdSwitchProfileTab(\'' + t + '\')">' + labels[t] + '</button>';
  }).join('') + '</div>';

  document.getElementById('td-detail-name').textContent = s.name + ' — ' + (_LEVEL_LABELS[s.level] || s.level);
  document.getElementById('td-detail-body').innerHTML = tabBar + '<div id="td-profile-pane" class="td-profile-pane"></div>';
  _tdRenderProfilePane();
}

function _tdRenderProfilePane() {
  var pane = document.getElementById('td-profile-pane');
  if (!pane) return;
  var d = _tdCurrentStudentData, s = d.student, sc = d.scores, blob = d.progressBlob || {};
  var t = _tdProfileTab;

  if (t === 'profile')   pane.innerHTML = _tdPaneProfile(s, sc, blob);
  if (t === 'activity')  pane.innerHTML = _tdPaneActivity(blob);
  if (t === 'quizzes')   pane.innerHTML = _tdPaneQuizzes(sc, blob);
  if (t === 'progress')  pane.innerHTML = _tdPaneProgress(sc, blob);
  if (t === 'notes')     pane.innerHTML = _tdPaneNotes(d);
}

// ── Tab: Profile ─────────────────────────────────────────────
function _tdPaneProfile(s, sc, blob) {
  var goal  = blob.goal || s.goal || '—';
  if (Array.isArray(goal)) goal = goal.join(', ');
  else goal = goal.replace(',', ', ');

  var joinedDate = s.joinedAt ? new Date(s.joinedAt).toLocaleDateString() : '—';
  var lastActive = sc.lastActive ? _tdTimeAgo(sc.lastActive) : '—';
  var placement  = blob.placement;
  var mc         = blob.myClass;
  var wordsData  = sc.wordsData || [];
  var catCount   = {};
  wordsData.forEach(function(w){ var c=w.category||'other'; catCount[c]=(catCount[c]||0)+1; });
  var cats = Object.entries(catCount).sort(function(a,b){ return b[1]-a[1]; });
  var maxCat = cats.length ? cats[0][1] : 1;

  var totalSessions = blob.lessonsCompleted || sc.wordsLearned || 0;
  var estMins = Math.round(totalSessions * 12);

  var html = '<div class="td-detail-stats">' +
    '<div class="td-ds"><div class="td-ds-val">' + sc.points + '</div><div class="td-ds-lbl">Points</div></div>' +
    '<div class="td-ds"><div class="td-ds-val">' + sc.streak + '</div><div class="td-ds-lbl">Day Streak</div></div>' +
    '<div class="td-ds"><div class="td-ds-val">' + sc.wordsLearned + '</div><div class="td-ds-lbl">Words</div></div>' +
    '<div class="td-ds"><div class="td-ds-val">~' + estMins + 'm</div><div class="td-ds-lbl">Est. Time</div></div>' +
    '</div>';

  html += '<div class="td-info-grid">' +
    _tdInfoRow('Level',       _LEVEL_LABELS[s.level] || s.level) +
    _tdInfoRow('Goal',        escapeHtml(goal)) +
    _tdInfoRow('Joined',      joinedDate) +
    _tdInfoRow('Last Active', lastActive) +
    (blob.timeAvailable ? _tdInfoRow('Session Length', blob.timeAvailable) : '') +
    (blob.learningStyle ? _tdInfoRow('Learning Style', blob.learningStyle) : '') +
    '</div>';

  if (placement) {
    html += '<div class="td-section-title">Placement Test Result</div>' +
      '<div class="td-placement-card">' +
      '<span class="td-level-badge">' + (_LEVEL_LABELS[placement.level] || placement.level) + '</span>' +
      '<span class="td-placement-date">Set ' + new Date(placement.date).toLocaleDateString() + '</span></div>';
  }

  if (mc && (mc.textbook || mc.chapter || mc.parasha || mc.weeklyFocus || mc.school)) {
    html += '<div class="td-section-title">My Class Info</div><div class="td-info-grid">';
    if (mc.school)      html += _tdInfoRow('School',        escapeHtml(mc.school));
    if (mc.grade)       html += _tdInfoRow('Grade',         escapeHtml(mc.grade));
    if (mc.textbook)    html += _tdInfoRow('Textbook',      escapeHtml(mc.textbook));
    if (mc.chapter)     html += _tdInfoRow('Chapter',       escapeHtml(mc.chapter));
    if (mc.parasha)     html += _tdInfoRow('Parasha',       escapeHtml(mc.parasha));
    if (mc.weeklyFocus) html += _tdInfoRow('Weekly Focus',  escapeHtml(mc.weeklyFocus));
    if (mc.assignedVocab) html += _tdInfoRow('Vocab',       escapeHtml(mc.assignedVocab));
    html += '</div>';
  }

  if (cats.length) {
    html += '<div class="td-section-title">Word Categories Learned</div>';
    cats.forEach(function(c) {
      html += '<div class="td-cat-bar-row"><span class="td-cat-bar-label">' + escapeHtml(c[0]) + '</span>' +
        '<div class="td-cat-bar-track"><div class="td-cat-bar-fill" style="width:' + Math.round(c[1]/maxCat*100) + '%"></div></div>' +
        '<span class="td-cat-bar-num">' + c[1] + '</span></div>';
    });
  }

  if (wordsData.length) {
    html += '<div class="td-section-title">Recently Learned Words</div><div class="td-word-chips">';
    wordsData.slice(-14).reverse().forEach(function(w) {
      html += '<span class="td-word-chip" dir="rtl" title="' + escapeHtml(w.english||'') + '">' + escapeHtml(w.hebrew||w.english||'') + '</span>';
    });
    html += '</div>';
  }

  if (blob.recentMessages && blob.recentMessages.length) {
    html += '<div class="td-section-title">Last ' + blob.recentMessages.length + ' Questions to Morah</div><div class="td-recent-msgs">';
    blob.recentMessages.slice().reverse().forEach(function(m, i) {
      html += '<div class="td-recent-msg"><span class="td-msg-num">' + (blob.recentMessages.length - i) + '</span>' + escapeHtml(m.slice(0,120)) + (m.length > 120 ? '…' : '') + '</div>';
    });
    html += '</div>';
  }

  return html;
}

function _tdInfoRow(label, value) {
  return '<div class="td-info-row"><span class="td-info-label">' + label + '</span><span class="td-info-val">' + value + '</span></div>';
}

// ── Tab: Activity (GitHub contribution calendar) ─────────────
function _tdPaneActivity(blob) {
  var dailyHistory = blob.dailyHistory || [];
  var activityDays = blob.activityDays || [];

  // Build date→score map from dailyHistory
  var dateScore = {};
  dailyHistory.forEach(function(d) {
    if (d.date) dateScore[d.date] = d.score || 1; // 1 = present but no score
  });
  // Also mark activityDays as "active" if not already in dailyHistory
  activityDays.forEach(function(d) { if (!dateScore[d]) dateScore[d] = 1; });

  var weeks = 26;
  var today = new Date(); today.setHours(0,0,0,0);
  // Find Sunday of 26 weeks ago
  var start = new Date(today);
  start.setDate(start.getDate() - (weeks * 7 - 1) - today.getDay());

  var totalDone = 0, html = '<div class="td-cal-wrap">';
  var monthPositions = [];

  // Month labels row
  var monthHtml = '<div class="td-cal-months">';
  var prevMonth = -1, weekIdx = 0;
  for (var w = 0; w < weeks; w++) {
    var weekStart = new Date(start); weekStart.setDate(start.getDate() + w*7);
    var m = weekStart.getMonth();
    if (m !== prevMonth) { monthHtml += '<span style="grid-column:' + (w+1) + '">' + ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m] + '</span>'; prevMonth = m; }
  }
  monthHtml += '</div>';

  // Weeks grid
  html += monthHtml + '<div class="td-cal-grid">';
  for (var w2 = 0; w2 < weeks; w2++) {
    html += '<div class="td-cal-week">';
    for (var d2 = 0; d2 < 7; d2++) {
      var dt = new Date(start); dt.setDate(start.getDate() + w2*7 + d2);
      var dateStr = dt.toDateString();
      var score = dateScore[dateStr];
      var cls = 'td-cal-cell';
      if (score !== undefined) {
        totalDone++;
        if (score >= 80) cls += ' td-cal-high';
        else if (score >= 60) cls += ' td-cal-mid';
        else cls += ' td-cal-done';
      }
      var label = dt.toLocaleDateString() + (score !== undefined ? (score > 1 ? ' — ' + score + '%' : ' — Active') : '');
      html += '<div class="' + cls + '" title="' + label + '"></div>';
    }
    html += '</div>';
  }
  html += '</div>';

  html += '<div class="td-cal-legend">Less <div class="td-cal-cell"></div><div class="td-cal-cell td-cal-done"></div><div class="td-cal-cell td-cal-mid"></div><div class="td-cal-cell td-cal-high"></div> More</div>';
  html += '</div>';

  if (!totalDone) html += '<div class="td-empty">No activity recorded yet.<br>Student needs to complete lessons and sync their progress.</div>';
  else html += '<div class="td-cal-summary">' + totalDone + ' active day' + (totalDone !== 1 ? 's' : '') + ' in the last 6 months</div>';

  // Daily history table
  if (dailyHistory.length) {
    html += '<div class="td-section-title">Daily Lesson History</div><table class="td-hist-table"><thead><tr><th>Date</th><th>Concept</th><th>Session</th><th>Score</th></tr></thead><tbody>';
    dailyHistory.slice().reverse().slice(0, 30).forEach(function(d) {
      var pct = d.score || 0;
      var cls = pct >= 80 ? 'td-score-high' : pct >= 60 ? 'td-score-mid' : 'td-score-low';
      html += '<tr><td>' + new Date(d.isoDate||d.date).toLocaleDateString() + '</td>' +
        '<td>' + escapeHtml((d.title||d.conceptId||'').slice(0,40)) + '</td>' +
        '<td style="text-align:center">' + (d.session||'?') + '/4</td>' +
        '<td><span class="td-score-badge ' + cls + '">' + pct + '%</span></td></tr>';
    });
    html += '</tbody></table>';
  }

  return html;
}

// ── Tab: Quizzes ─────────────────────────────────────────────
function _tdPaneQuizzes(sc, blob) {
  var quizHistory = blob.quizHistory || [];
  var struggles   = blob.struggles   || [];
  var html = '';

  if (!quizHistory.length) {
    html += '<div class="td-empty">No quiz data yet.<br>Student needs to complete Quiz Mode and sync their progress.</div>';
  } else {
    html += '<div class="td-section-title">Quiz History (' + quizHistory.length + ' quizzes)</div>';
    html += '<table class="td-hist-table"><thead><tr><th>Date</th><th>Topic</th><th>Score</th><th>Result</th></tr></thead><tbody>';
    quizHistory.slice().reverse().forEach(function(q) {
      var pct = q.pct || Math.round((q.score/q.total)*100);
      var cls = pct >= 80 ? 'td-score-high' : pct >= 60 ? 'td-score-mid' : 'td-score-low';
      html += '<tr><td>' + new Date(q.date).toLocaleDateString() + '</td>' +
        '<td>' + escapeHtml((q.topic||'').replace('_',' ')) + '</td>' +
        '<td style="text-align:center">' + q.score + '/' + q.total + '</td>' +
        '<td><span class="td-score-badge ' + cls + '">' + pct + '%</span></td></tr>';
    });
    html += '</tbody></table>';
  }

  if (struggles.length) {
    html += '<div class="td-section-title">⚠️ Struggle Areas (' + struggles.length + ' items)</div>';
    html += '<div class="td-word-chips">';
    struggles.slice(-20).forEach(function(w) {
      html += '<div class="td-struggle-chip">' +
        '<div class="td-struggle-q">' + escapeHtml((w.question||'').slice(0,60)) + '</div>' +
        '<div class="td-struggle-a">✓ ' + escapeHtml(w.correct_answer||w.correctAnswer||'') + '</div>' +
      '</div>';
    });
    html += '</div>';
  } else if (quizHistory.length) {
    html += '<div class="td-section-title">Struggle Areas</div><div class="td-empty">No repeated mistakes recorded — great work!</div>';
  }

  return html;
}

// ── Tab: Progress ─────────────────────────────────────────────
function _tdPaneProgress(sc, blob) {
  var weeklyPts = blob.weeklyPts || {};
  var entries   = Object.entries(weeklyPts).sort().slice(-16);
  var html      = '';

  if (entries.length >= 2) {
    var maxPts = Math.max.apply(null, entries.map(function(e){ return e[1]; })) || 1;
    html += '<div class="td-section-title">Points Per Week</div><div class="td-week-chart">';
    entries.forEach(function(e) {
      var h = Math.max(4, Math.round(e[1] / maxPts * 100));
      var weekLabel = e[0].slice(-3); // W01, W02...
      html += '<div class="td-week-bar-col">' +
        '<div class="td-week-bar-inner"><div class="td-week-bar" style="height:' + h + '%"><span class="td-week-val">' + e[1] + '</span></div></div>' +
        '<div class="td-week-label">' + weekLabel + '</div></div>';
    });
    html += '</div>';

    // Trend
    var first = entries[0][1], last2 = entries[entries.length-1][1];
    var trend = last2 > first ? '📈 Improving' : last2 < first ? '📉 Declining' : '→ Steady';
    html += '<div class="td-trend-line">' + trend + ' — ' + Math.abs(last2 - first) + ' points change over ' + entries.length + ' weeks</div>';
  } else {
    html += '<div class="td-empty">Not enough data for a progress chart yet.<br>Student needs multiple weeks of activity.</div>';
  }

  var activityDays = blob.activityDays || [];
  var dailyHistory = blob.dailyHistory || [];
  var totalDays    = Math.max(activityDays.length, dailyHistory.length);
  var lessons      = blob.lessonsCompleted || 0;
  var estMins      = Math.round((sc.wordsLearned || 0) * 2 + totalDays * 12);

  html += '<div class="td-section-title">Learning Summary</div><div class="td-info-grid">' +
    _tdInfoRow('Active Days',   totalDays + (activityDays.length ? '' : '+')) +
    _tdInfoRow('Lessons Completed', lessons + '') +
    _tdInfoRow('Daily Lessons',  dailyHistory.length + ' recorded') +
    _tdInfoRow('Estimated Time', '~' + estMins + ' minutes total') +
    _tdInfoRow('Points',         sc.points + '') +
    _tdInfoRow('Longest Streak', sc.streak + ' days') +
    '</div>';

  return html;
}

// ── Tab: Notes ────────────────────────────────────────────────
function _tdPaneNotes(d) {
  var notes    = d.teacherNotes || '';
  var updated  = d.notesUpdatedAt ? 'Last saved: ' + new Date(d.notesUpdatedAt).toLocaleDateString() : 'Not saved yet';
  return '<div class="td-section-title">Private Teacher Notes</div>' +
    '<p class="td-notes-hint">Only you can see these notes. They are stored securely and never shown to the student.</p>' +
    '<textarea id="td-notes-area" class="td-notes-area" placeholder="Add notes about this student — learning pace, parent concerns, accommodations, Bar/Bat Mitzvah date, parasha details…">' + escapeHtml(notes) + '</textarea>' +
    '<div class="td-notes-actions">' +
    '<button class="btn-quiz-next td-notes-save-btn" onclick="tdSaveNotes()">💾 Save Notes</button>' +
    '<span class="td-notes-updated" id="td-notes-updated">' + updated + '</span></div>';
}

async function tdSaveNotes() {
  var area = document.getElementById('td-notes-area');
  var btn  = document.querySelector('.td-notes-save-btn');
  if (!area || !_currentTeacher || !_tdCurrentStudentId) return;

  var orig = btn.textContent;
  btn.disabled = true; btn.textContent = 'Saving…';
  try {
    var r = await fetch('/api/teacher/notes', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teacherId: _currentTeacher.id, studentId: _tdCurrentStudentId, notes: area.value })
    });
    if (r.ok) {
      if (_tdCurrentStudentData) { _tdCurrentStudentData.teacherNotes = area.value; _tdCurrentStudentData.notesUpdatedAt = new Date().toISOString(); }
      var upd = document.getElementById('td-notes-updated');
      if (upd) upd.textContent = 'Saved ' + new Date().toLocaleTimeString();
      showToast('Notes saved.', 2000);
    } else {
      showToast('Save failed — try again.');
    }
  } catch(e) { showToast('Connection error.'); }
  finally { btn.disabled = false; btn.textContent = orig; }
}

function teacherExportCSV() {
  if (!_tdStudents.length) { showToast('No student data to export yet.'); return; }
  var rows = ['Name,Level,Goal,Streak,Words Learned,Points,Last Active'].concat(
    _tdSorted().map(function(s) {
      return ['"'+s.name+'"', s.level, '"'+(s.goal||'')+'"', s.streak, s.wordsLearned, s.points, '"'+_tdTimeAgo(s.lastActive)+'"'].join(',');
    })
  );
  var csv = rows.join('\n');
  function done() { showToast('📋 CSV copied! Paste into Google Sheets or Excel.', 4000); }
  function fallback() { var ta=document.createElement('textarea'); ta.value=csv; ta.style.cssText='position:fixed;opacity:0'; document.body.appendChild(ta); ta.select(); try{document.execCommand('copy');done();}catch(e){showToast('Could not copy.');} document.body.removeChild(ta); }
  if (navigator.clipboard&&navigator.clipboard.writeText) navigator.clipboard.writeText(csv).then(done).catch(fallback); else fallback();
}

function _tdTimeAgo(isoStr) {
  if (!isoStr) return 'Never';
  var ms=Date.now()-new Date(isoStr).getTime(), min=Math.floor(ms/60000);
  if (min<2) return 'Just now'; if (min<60) return min+'m ago';
  var hr=Math.floor(min/60); if (hr<24) return hr+'h ago';
  var days=Math.floor(hr/24); if (days===1) return 'Yesterday'; if (days<7) return days+' days ago';
  if (days<30) return Math.floor(days/7)+' weeks ago'; return Math.floor(days/30)+' months ago';
}

function submitRegistration() {
  const firstName   = (document.getElementById('reg-firstname').value        || '').trim();
  const lastInitial = (document.getElementById('reg-lastinitial').value      || '').trim().toUpperCase();
  const school      = (document.getElementById('reg-school').value           || '').trim();
  const secretWord  = (document.getElementById('reg-secret').value          || '').trim();
  const secretConf  = (document.getElementById('reg-secret-confirm').value  || '').trim();
  const schoolCode  = (document.getElementById('reg-school-code')  ? document.getElementById('reg-school-code').value  : '').replace(/\D/g,'').slice(0,6);
  const errEl = document.getElementById('reg-error');

  function showErr(msg, focusId) {
    errEl.textContent = msg;
    errEl.style.display = 'block';
    if (focusId) document.getElementById(focusId).focus();
  }

  if (!firstName)                              return showErr('Please enter your first name.', 'reg-firstname');
  if (!lastInitial || !/^[A-Za-z]$/.test(lastInitial)) return showErr('Last initial must be a single letter.', 'reg-lastinitial');
  if (secretWord.length < 3)                   return showErr('Secret word must be at least 3 characters.', 'reg-secret');
  if (secretWord !== secretConf)               return showErr('Secret words don\'t match — try again.', 'reg-secret-confirm');

  errEl.style.display = 'none';
  // If a valid school code was entered and the form shows the teacher's school, use that;
  // otherwise fall back to whatever the user typed (or Independent Learner).
  var codeStatusEl = document.getElementById('reg-code-status');
  var codeLinked   = codeStatusEl && codeStatusEl.dataset.linkedSchool;
  var schoolFinal  = codeLinked || school || 'Independent Learner';
  currentUser = { firstName, lastInitial, school: schoolFinal, joinedAt: Date.now() };
  saveUser();
  updateUserBadges();
  showScreen('screen-home');
  renderWordOfDay();
  checkReturningUser();
  _registerWithDb(firstName, lastInitial, schoolFinal, secretWord, schoolCode);
}

async function submitLogin() {
  const firstName  = (document.getElementById('login-firstname').value   || '').trim();
  const lastInitial = (document.getElementById('login-lastinitial').value || '').trim().toUpperCase();
  const school     = (document.getElementById('login-school').value      || '').trim();
  const secretWord = (document.getElementById('login-secret').value      || '').trim();
  const errEl = document.getElementById('login-error');
  const btn   = document.getElementById('login-submit-btn');

  function showErr(msg) {
    errEl.textContent = msg; errEl.style.display = 'block';
  }

  if (!firstName)   return showErr('Please enter your first name.');
  if (!lastInitial || !/^[A-Za-z]$/.test(lastInitial)) return showErr('Last initial must be a single letter.');
  if (!secretWord)  return showErr('Please enter your secret word.');

  errEl.style.display = 'none';
  btn.disabled = true;
  btn.innerHTML = '<span class="ki-loader ki-loader-sm"><span class="ki-letters"><span class="ki-letter">א</span><span class="ki-letter">ב</span><span class="ki-letter">ג</span></span></span>';

  try {
    var r = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName, lastInitial,
        school: school || 'Independent Learner',
        secretWord
      })
    });
    var data = await r.json();

    if (!r.ok) {
      showErr(data.error || 'Login failed. Check your details.');
      btn.disabled = false;
      btn.textContent = 'Log In & Restore Progress';
      return;
    }

    // ── Restore user ──────────────────────────────────────────
    currentUser = {
      firstName:   data.firstName,
      lastInitial: data.lastInitial,
      school:      data.school,
      userId:      data.userId,
      joinedAt:    Date.now()
    };
    saveUser();

    // Restore progress stats
    state.progress.points          = data.points       || 0;
    state.progress.streak          = data.streak       || 0;
    if (data.wordsData && Array.isArray(data.wordsData) && data.wordsData.length > 0) {
      state.progress.wordsLearned  = data.wordsData;
    }
    saveProgress();

    // Restore level/goal into userProfile if available
    if (data.level && state.userProfile) state.userProfile.level = data.level;
    if (data.goal  && state.userProfile) {
      state.userProfile.goal = data.goal.includes(',') ? data.goal.split(',') : data.goal;
    }

    updateUserBadges();
    showScreen('screen-home');
    renderWordOfDay();
    checkReturningUser();
    showToast('Welcome back, ' + data.firstName + '! Your progress has been restored. 🎉', 4000);

  } catch (e) {
    showErr('Connection error — check your internet and try again.');
    btn.disabled = false;
    btn.textContent = 'Log In & Restore Progress';
  }
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

  // Lesson screen badge (hidden compat)
  const lessonBadge = document.getElementById('lesson-user-badge');
  if (lessonBadge) {
    document.getElementById('lub-name').textContent   = displayName;
    document.getElementById('lub-school').textContent = currentUser.school;
    const lvl = state.userProfile ? state.userProfile.level : null;
    const avatarMap = { complete_beginner:'🌱', some_exposure:'🌿', basic:'🌳', intermediate:'⭐', advanced:'🔥' };
    document.getElementById('lub-avatar').textContent = avatarMap[lvl] || '👤';
  }

  // Visible chat user bar
  var cubBar = document.getElementById('chat-user-bar');
  if (cubBar) {
    var cubName   = document.getElementById('cub-name');
    var cubSchool = document.getElementById('cub-school');
    if (cubName)   cubName.textContent   = displayName;
    if (cubSchool) cubSchool.textContent = currentUser.school || '';
    cubBar.style.display = 'flex';
  }
  _dtUpdate();
}

// ─── INIT ─────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════
//  MY CLASS — connect student's teacher curriculum to Morah
// ═══════════════════════════════════════════════════════════
const MC_KEY = 'kesher_myclass';
var myClass  = null;

function loadMyClass() {
  try { myClass = JSON.parse(localStorage.getItem(MC_KEY)) || null; }
  catch(e) { myClass = null; }
  _updateMyClassBadge();
}

function saveMyClass() {
  var data = {
    school:          (document.getElementById('mc-school').value    || '').trim(),
    grade:           (document.getElementById('mc-grade').value     || '').trim(),
    parasha:         (document.getElementById('mc-parasha').value   || '').trim(),
    textbook:        (document.getElementById('mc-textbook').value  || '').trim(),
    chapter:         (document.getElementById('mc-chapter').value   || '').trim(),
    weeklyFocus:     (document.getElementById('mc-weekly').value    || '').trim(),
    assignedVocab:   (document.getElementById('mc-vocab').value     || '').trim(),
    assignedGrammar: (document.getElementById('mc-grammar').value   || '').trim(),
  };
  if (!data.school && !data.textbook && !data.chapter && !data.weeklyFocus && !data.assignedVocab && !data.parasha) {
    showToast('Please fill in at least one field.');
    return;
  }
  myClass = data;
  localStorage.setItem(MC_KEY, JSON.stringify(myClass));
  _updateMyClassBadge();
  hideMyClass();
  showToast('📚 My Class saved! Morah will now focus on your assignment.');
}

function clearMyClass() {
  myClass = null;
  localStorage.removeItem(MC_KEY);
  _updateMyClassBadge();
  ['mc-school','mc-grade','mc-parasha','mc-textbook','mc-chapter','mc-weekly','mc-vocab','mc-grammar']
    .forEach(function(id) { var el = document.getElementById(id); if (el) el.value = ''; });
  showToast('Class profile cleared.');
}

function showMyClass() {
  var overlay = document.getElementById('myclass-overlay');
  if (!overlay) return;
  // Pre-fill form
  if (myClass) {
    var fields = {
      'mc-school': myClass.school, 'mc-grade': myClass.grade,
      'mc-parasha': myClass.parasha,
      'mc-textbook': myClass.textbook, 'mc-chapter': myClass.chapter,
      'mc-weekly': myClass.weeklyFocus, 'mc-vocab': myClass.assignedVocab,
      'mc-grammar': myClass.assignedGrammar
    };
    Object.keys(fields).forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.value = fields[id] || '';
    });
  } else if (currentUser && currentUser.school) {
    var sf = document.getElementById('mc-school');
    if (sf) sf.value = currentUser.school;
  }
  overlay.classList.remove('mc-hidden');
  overlay.classList.add('mc-visible');
  setTimeout(function() {
    var first = document.getElementById('mc-school');
    if (first) first.focus();
  }, 300);
}

function hideMyClass() {
  var overlay = document.getElementById('myclass-overlay');
  if (!overlay) return;
  overlay.classList.remove('mc-visible');
  overlay.classList.add('mc-hidden');
}

function mcOverlayClick(e) {
  if (e.target === document.getElementById('myclass-overlay')) hideMyClass();
}

function _updateMyClassBadge() {
  var badge = document.getElementById('myclass-badge');
  var text  = document.getElementById('myclass-badge-text');
  if (!badge) return;
  var label = myClass && (myClass.parasha || myClass.chapter || myClass.textbook || myClass.weeklyFocus);
  if (label) {
    text.textContent = myClass.parasha || myClass.chapter || myClass.textbook || 'Assignment set';
    badge.style.display = 'inline-flex';
  } else {
    badge.style.display = 'none';
  }
}

// ═══════════════════════════════════════════════════════════
//  BAR/BAT MITZVAH — PARASHA SELECTOR
//  Interactive overlay that fires before the first BM lesson
//  when the student hasn't set their parasha yet.
// ═══════════════════════════════════════════════════════════

const BM_PARASHA_SEFARIM = [
  {
    sefer: 'בְּרֵאשִׁית', label: 'Bereishit · Genesis', color: '#1B4FBA',
    portions: ['Bereishit','Noach','Lech Lecha','Vayera','Chayei Sarah','Toldot',
               'Vayetzei','Vayishlach','Vayeshev','Miketz','Vayigash','Vayechi']
  },
  {
    sefer: 'שְׁמוֹת', label: 'Shemot · Exodus', color: '#065F46',
    portions: ['Shemot','Vaera','Bo','Beshalach','Yitro','Mishpatim',
               'Terumah','Tetzaveh','Ki Tisa','Vayakhel','Pekudei']
  },
  {
    sefer: 'וַיִּקְרָא', label: 'Vayikra · Leviticus', color: '#7C2D12',
    portions: ['Vayikra','Tzav','Shemini','Tazria','Metzora',
               'Acharei Mot','Kedoshim','Emor','Behar','Bechukotai']
  },
  {
    sefer: 'בְּמִדְבַּר', label: 'Bamidbar · Numbers', color: '#4C1D95',
    portions: ["Bamidbar","Nasso","Beha'alotcha","Shelach","Korach",
               "Chukat","Balak","Pinchas","Matot","Masei"]
  },
  {
    sefer: 'דְּבָרִים', label: 'Devarim · Deuteronomy', color: '#92400E',
    portions: ["Devarim","Vaetchanan","Eikev","Re'eh","Shoftim",
               "Ki Teitzei","Ki Tavo","Nitzavim","Vayeilech","Haazinu","Vezot HaBerachah"]
  }
];

function buildParashaOverlay() {
  var body = document.getElementById('bm-po-books');
  if (!body) return;
  var html = '';
  BM_PARASHA_SEFARIM.forEach(function(book) {
    html += '<div class="bm-book">';
    html += '<div class="bm-book-hdr" style="background:' + book.color + '">';
    html += '<span class="bm-book-heb">' + book.sefer + '</span>';
    html += '<span class="bm-book-eng">' + book.label + '</span>';
    html += '</div><div class="bm-book-portions">';
    book.portions.forEach(function(p) {
      var safe = p.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      html += '<button class="bm-pars-btn" onclick="selectParasha(\'' + safe + '\')">' + p + '</button>';
    });
    html += '</div></div>';
  });
  body.innerHTML = html;
}

function showParashaOverlay() {
  buildParashaOverlay();
  var el = document.getElementById('bm-parasha-overlay');
  if (el) el.style.display = 'flex';
  document.getElementById('chat-messages').innerHTML = '';
  setMorahStatus && setMorahStatus('Choose your parasha to begin…');
}

function hideParashaOverlay() {
  var el = document.getElementById('bm-parasha-overlay');
  if (el) el.style.display = 'none';
}

function selectParasha(name) {
  // Persist parasha into myClass
  myClass = myClass || {};
  myClass.parasha = name;
  try { localStorage.setItem(MC_KEY, JSON.stringify(myClass)); } catch(e) {}
  if (typeof _updateMyClassBadge === 'function') _updateMyClassBadge();

  hideParashaOverlay();
  showToast && showToast('📖 Parasha: ' + name + ' — let\'s get you ready for the bimah!', 3500);

  // Fire the first real lesson message with the parasha now set
  var firstMsg = 'My parasha is ' + name + '. Start Phase 1: teach me what "' + name +
    '" means in Hebrew, its root and etymology, and break down the opening verse word by word.';
  state.messages = [];
  state.messages.push({ role: 'user', content: firstMsg });
  appendMessage('user', firstMsg);
  sendToMorah(state.messages);
}

// ═══════════════════════════════════════════════════════════
//  ONBOARDING INTRO — shown once to first-time visitors
// ═══════════════════════════════════════════════════════════
const OB_KEY    = 'kesher_intro_done';
var   _obIdx    = 0;
const _obTotal  = 7;

function _obShow() {
  var el = document.getElementById('ob-overlay');
  if (el) { el.style.display = 'flex'; el.style.opacity = '1'; }
  obGoTo(0);
}

function obGoTo(n) {
  // Determine direction for animation class
  var dir = n > _obIdx ? 'ob-enter-right' : 'ob-enter-left';
  _obIdx = Math.max(0, Math.min(n, _obTotal - 1));

  // Slides
  for (var i = 0; i < _obTotal; i++) {
    var s = document.getElementById('ob-slide-' + i);
    if (!s) continue;
    s.className = 'ob-slide ob-slide-' + (i + 1);
    if (i === _obIdx) s.classList.add('ob-active', dir);
    else if (i < _obIdx) s.classList.add('ob-gone-left');
    else s.classList.add('ob-gone-right');
  }

  // Dots
  document.querySelectorAll('.ob-dot').forEach(function(d, i) {
    d.classList.toggle('ob-dot-active', i === _obIdx);
  });

  // Next button label
  var nb = document.getElementById('ob-next-btn');
  if (nb) nb.textContent = _obIdx === _obTotal - 1 ? '✓ Done' : 'Next →';

  // Skip button — hide on last slide
  var sb = document.getElementById('ob-skip-btn');
  if (sb) sb.style.opacity = _obIdx === _obTotal - 1 ? '0' : '1';
}

function obNext() {
  if (_obIdx < _obTotal - 1) {
    obGoTo(_obIdx + 1);
  } else {
    completeOnboarding();
  }
}

function skipOnboarding() { completeOnboarding(); }

function completeOnboarding() {
  localStorage.setItem(OB_KEY, '1');
  var el = document.getElementById('ob-overlay');
  if (!el) return _afterOnboarding();
  el.style.transition = 'opacity 0.45s ease';
  el.style.opacity = '0';
  setTimeout(function() {
    el.style.display = 'none';
    _afterOnboarding();
  }, 450);
}

function _afterOnboarding() {
  showScreen('screen-register');
  showChoicePanel();
}

document.addEventListener('DOMContentLoaded', async () => {
  loadUser();
  loadMyClass();
  loadProgress();
  renderWordOfDay();

  if (!currentUser) {
    // Show onboarding only to genuine first-time visitors
    if (!localStorage.getItem(OB_KEY)) {
      _obShow();
    } else {
      showScreen('screen-register');
      showChoicePanel();
    }
  } else {
    updateUserBadges();
    checkReturningUser();
    // API key modal is shown only when a real chat request fails (no_api_key error)
    // not proactively on load — avoids false interruptions when key is in .env
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

    // Weekly points snapshot (for teacher progress chart)
    try {
      var now = new Date();
      var jan1 = new Date(now.getFullYear(), 0, 1);
      var wk = String(Math.ceil(((now - jan1) / 86400000 + jan1.getDay() + 1) / 7)).padStart(2, '0');
      var weekKey = now.getFullYear() + '-W' + wk;
      var wpts = JSON.parse(localStorage.getItem('kesher_weekly_pts') || '{}');
      wpts[weekKey] = state.progress.points;
      var wEntries = Object.entries(wpts).sort();
      if (wEntries.length > 52) wpts = Object.fromEntries(wEntries.slice(-52));
      localStorage.setItem('kesher_weekly_pts', JSON.stringify(wpts));
    } catch(e) {}

    // Capture placement result on first sync
    try {
      if (state.userProfile && state.userProfile.level && !localStorage.getItem('kesher_placement')) {
        localStorage.setItem('kesher_placement', JSON.stringify({
          level: state.userProfile.level, date: new Date().toISOString()
        }));
      }
    } catch(e) {}
  } catch (e) {
    console.warn('Could not save progress:', e);
  }
  _syncProgressToDb();
  _dtUpdate();
}

function checkReturningUser() {
  if (!state.userProfile || !state.userProfile.name) return;

  document.getElementById('returning-user-section').style.display = 'block';
  document.getElementById('returning-name').textContent = state.userProfile.name;

  // Vertical stats stack
  const statsEl = document.getElementById('returning-stats');
  if (statsEl) {
    var rows = [];
    if (state.progress.streak > 0)             rows.push('<div class="ret-stat"><span class="ret-stat-val">' + state.progress.streak + '</span><span class="ret-stat-lbl">day streak</span></div>');
    if (state.progress.wordsLearned.length > 0) rows.push('<div class="ret-stat"><span class="ret-stat-val">' + state.progress.wordsLearned.length + '</span><span class="ret-stat-lbl">words learned</span></div>');
    if (state.progress.points > 0)              rows.push('<div class="ret-stat"><span class="ret-stat-val">' + state.progress.points + '</span><span class="ret-stat-lbl">points</span></div>');
    statsEl.innerHTML = rows.join('');
  }

  checkStreak();
  renderDailyLessonCard();
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
  localStorage.removeItem('kesher_mastery');
  localStorage.removeItem('kesher_daily');
  _dailyLessonActive = false;
  _dailyLessonInfo   = null;
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
  showChoicePanel();
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

  if (q.multi) {
    const n = q.maxSelect || 3;
    html += `<div class="quiz-multi-hint">Pick up to ${n}</div>`;
  }

  if (q.type === 'text') {
    const val = state.quizAnswers[q.id] || '';
    html += `<input type="text" class="quiz-name-input" id="quiz-text-input"
      placeholder="${q.placeholder}" value="${escapeHtml(val)}"
      onkeydown="if(event.key==='Enter') quizNext()" />`;
  } else if (q.type === 'choice') {
    html += `<div class="quiz-options">`;
    for (const opt of q.options) {
      var isSelected;
      if (q.multi) {
        var arr = state.quizAnswers[q.id];
        isSelected = Array.isArray(arr) && arr.indexOf(opt.value) !== -1;
      } else {
        isSelected = state.quizAnswers[q.id] === opt.value;
      }
      const selClass = isSelected ? 'selected' : '';
      html += `<div class="quiz-option ${selClass}" onclick="selectOption('${q.id}','${opt.value}',this)">
        <span class="quiz-option-icon">${opt.icon}</span>
        <div class="quiz-option-body">
          <div class="quiz-option-text">${opt.text}</div>
          <div class="quiz-option-sub">${opt.sub}</div>
        </div>
        <span class="quiz-check">✓</span>
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
  const q = QUIZ_QUESTIONS.find(function(x) { return x.id === questionId; });
  if (q && q.multi) {
    var arr = state.quizAnswers[questionId];
    if (!Array.isArray(arr)) arr = [];
    var idx = arr.indexOf(value);
    if (idx !== -1) {
      // Deselect
      arr.splice(idx, 1);
      el.classList.remove('selected');
    } else {
      var max = q.maxSelect || 3;
      if (arr.length >= max) {
        showToast('Pick up to ' + max + ' — tap a selection to deselect it first');
        return;
      }
      arr.push(value);
      el.classList.add('selected');
    }
    state.quizAnswers[questionId] = arr;
  } else {
    // Single-select
    state.quizAnswers[questionId] = value;
    el.closest('.quiz-options').querySelectorAll('.quiz-option').forEach(function(o) { o.classList.remove('selected'); });
    el.classList.add('selected');
  }
}

function quizNext() {
  const q = QUIZ_QUESTIONS[state.currentQuizStep];

  // Validate
  if (q.type === 'text') {
    const val = document.getElementById('quiz-text-input').value.trim();
    if (!val) { showToast('Please enter your name!'); return; }
    state.quizAnswers[q.id] = val;
  } else if (q.type === 'choice') {
    var ans = state.quizAnswers[q.id];
    var hasAnswer = q.multi ? (Array.isArray(ans) && ans.length > 0) : !!ans;
    if (!hasAnswer) { showToast('Please pick at least one option!'); return; }
  }

  // After goal question: launch placement test before level
  if (q.id === 'goal') {
    _showPT();
    return;
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
  showToast('Yalla, ' + state.userProfile.name + '! Let\'s learn!');
  showScreen('screen-lesson');
  setupLessonScreen();
  updateUserBadges();
  startLesson();
}

// ─── MOBILE TAB NAVIGATION ───────────────────────────────
var _mobTab = 'learn';

function switchTab(tab) {
  _mobTab = tab;
  // Sync mobile bottom nav
  document.querySelectorAll('.nav-btn').forEach(function(btn) {
    btn.classList.toggle('active', btn.dataset.panel === tab);
  });
  // Sync desktop left nav
  document.querySelectorAll('.dt-nav-btn').forEach(function(btn) {
    btn.classList.toggle('dt-nav-active', btn.dataset.tab === tab);
  });
  var sl = document.getElementById('screen-lesson');
  sl.className = sl.className.replace(/\bmob-tab-\S+/g, '').trim();
  if (tab !== 'learn') sl.classList.add('mob-tab-' + tab);
  if (tab === 'path')  renderMobilePath();
  if (tab === 'me')    renderMobileProfile();
}

// ── DESKTOP SIDEBARS ──────────────────────────────────────────────────────────
function _isDesktop() { return window.innerWidth >= 769; }

function _dtUpdate() {
  if (!_isDesktop()) return;
  _dtRenderLeft();
  _dtRenderRight();
}

function _dtRenderLeft() {
  var el = document.getElementById('dt-left');
  if (!el) return;

  var avatarMap  = { complete_beginner:'🌱', some_exposure:'🌿', basic:'🌳', intermediate:'⭐', advanced:'🔥' };
  var levelNames = { complete_beginner:'Complete Beginner', some_exposure:'Some Exposure', basic:'Basic', intermediate:'Intermediate', advanced:'Advanced' };
  var lvl    = state.userProfile ? state.userProfile.level : null;
  var name   = currentUser ? (currentUser.firstName + ' ' + currentUser.lastInitial + '.') : (state.userProfile ? state.userProfile.name || '' : '');
  var school = currentUser ? (currentUser.school || '') : '';
  var pts    = state.progress.points;
  var streak = state.progress.streak;
  var words  = state.progress.wordsLearned.length;
  var isDark = document.documentElement.getAttribute('data-theme') === 'dark';

  var navItems = [
    { tab:'learn', icon:'💬', label:'Learn' },
    { tab:'path',  icon:'🗺️', label:'Path'  },
    { tab:'games', icon:'🎮', label:'Games' },
    { tab:'me',    icon:'👤', label:'Me'    },
  ];

  var mcHtml = '';
  if (myClass && (myClass.school || myClass.textbook || myClass.parasha || myClass.grade)) {
    mcHtml = '<div class="dt-section-label">My Class</div><div class="dt-my-class">' +
      (myClass.school    ? '<div class="dt-mc-row">🏫 ' + escapeHtml(myClass.school)    + '</div>' : '') +
      (myClass.grade     ? '<div class="dt-mc-row">🎓 ' + escapeHtml(myClass.grade)     + '</div>' : '') +
      (myClass.textbook  ? '<div class="dt-mc-row">📚 ' + escapeHtml(myClass.textbook)  + '</div>' : '') +
      (myClass.chapter   ? '<div class="dt-mc-row">📖 Ch. ' + escapeHtml(myClass.chapter) + '</div>' : '') +
      (myClass.parasha   ? '<div class="dt-mc-row">📜 ' + escapeHtml(myClass.parasha)   + '</div>' : '') +
    '</div>';
  }

  el.innerHTML =
    '<div class="dt-logo"><div class="dt-logo-heb">קֶשֶׁר עִבְרִית</div><div class="dt-logo-eng">Kesher Ivrit</div></div>' +
    '<nav class="dt-nav">' +
      navItems.map(function(n) {
        return '<button class="dt-nav-btn' + (n.tab === _mobTab ? ' dt-nav-active' : '') + '" data-tab="' + n.tab + '" onclick="switchTab(\'' + n.tab + '\')">' +
          '<span class="dt-nav-icon">' + n.icon + '</span>' +
          '<span class="dt-nav-label">' + n.label + '</span>' +
        '</button>';
      }).join('') +
    '</nav>' +
    '<div class="dt-divider"></div>' +
    (name ? '<div class="dt-user-card">' +
      '<div class="dt-user-avatar">' + (avatarMap[lvl] || '👤') + '</div>' +
      '<div class="dt-user-name">' + escapeHtml(name) + '</div>' +
      (school ? '<div class="dt-user-level">' + escapeHtml(school) + '</div>' : '') +
      '<div class="dt-user-level">' + (levelNames[lvl] || 'Hebrew Learner') + '</div>' +
    '</div>' +
    '<div class="dt-stats-grid">' +
      '<div class="dt-stat"><div class="dt-stat-val">' + streak + '</div><div class="dt-stat-lbl">🔥 Streak</div></div>' +
      '<div class="dt-stat"><div class="dt-stat-val">' + words  + '</div><div class="dt-stat-lbl">📖 Words</div></div>' +
      '<div class="dt-stat"><div class="dt-stat-val">' + pts    + '</div><div class="dt-stat-lbl">⭐ Points</div></div>' +
    '</div>' : '') +
    mcHtml +
    '<div class="dt-sidebar-footer">' +
      '<button class="dt-dark-toggle" onclick="toggleDarkMode()">' +
        (isDark ? '☀️ Light mode' : '🌙 Dark mode') +
      '</button>' +
    '</div>';
}

function _dtRenderRight() {
  var el = document.getElementById('dt-right');
  if (!el) return;

  // ── Today's Lesson card ──
  var lessonHtml = '';
  try {
    var lessonInfo = (typeof computeTodayLesson === 'function') ? computeTodayLesson() : null;
    if (lessonInfo) {
      var daily = loadDailyState ? loadDailyState() : null;
      var isCompleted = daily && daily.status === 'completed' && daily.conceptId === lessonInfo.concept.id;
      var session = lessonInfo.reviewSession || 1;
      var dots = '';
      for (var d = 1; d <= 4; d++) dots += '<div class="dt-daily-dot' + (d < session ? ' done' : d === session ? ' cur' : '') + '"></div>';

      lessonHtml = '<div class="dt-right-section">' +
        '<div class="dt-right-title">📅 Today\'s Lesson</div>' +
        '<div class="dt-daily-card">' +
          '<div class="dt-daily-session-dots">' + dots + '</div>' +
          '<div class="dt-daily-concept">' + escapeHtml(lessonInfo.concept.title) + '</div>' +
          '<div class="dt-daily-sub">Session ' + session + ' of 4</div>' +
          (isCompleted
            ? '<div class="dt-daily-done">✓ Completed today</div>'
            : '<button class="dt-daily-btn" onclick="startDailyLesson()">Start Today\'s Lesson →</button>') +
        '</div>' +
      '</div>';
    }
  } catch(e) {}

  // ── Word of the Day ──
  var wotdHtml = '';
  try {
    var w = WOTD_LIST[new Date().getDate() % WOTD_LIST.length];
    if (w) {
      wotdHtml = '<div class="dt-right-section">' +
        '<div class="dt-right-title">✡ Word of the Day</div>' +
        '<div class="dt-wotd-card">' +
          '<div class="dt-wotd-heb">' + escapeHtml(w.hebrew) + '</div>' +
          '<div class="dt-wotd-trans">' + escapeHtml(w.trans) + '</div>' +
          '<div class="dt-wotd-eng">' + escapeHtml(w.english) + '</div>' +
          (w.example ? '<div class="dt-wotd-example">' + escapeHtml(w.example) + '</div>' : '') +
        '</div>' +
      '</div>';
    }
  } catch(e) {}

  // ── Quick practice ──
  var gamesHtml = '<div class="dt-right-section" style="padding-bottom:20px;">' +
    '<div class="dt-right-title">🎮 Quick Practice</div>' +
    '<div class="dt-games-grid">' +
      '<button class="dt-game-btn" onclick="openQuizMode()"><span class="dt-game-icon">🧠</span> Quiz Me</button>' +
      '<button class="dt-game-btn" onclick="startSpeedRound()"><span class="dt-game-icon">⚡</span> Speed Round</button>' +
      '<button class="dt-game-btn" onclick="showWordleGame()"><span class="dt-game-icon">🔠</span> Hebrew Wordle</button>' +
      '<button class="dt-game-btn" onclick="showUnscrambleGame()"><span class="dt-game-icon">🔀</span> Unscramble</button>' +
    '</div>' +
  '</div>';

  // ── Mini leaderboard ──
  var lbHtml = '';
  try {
    var board = _buildFullBoard(null).slice(0, 5);
    var myId  = currentUser ? (currentUser.userId || _lbId()) : null;
    lbHtml = '<div class="dt-right-section">' +
      '<div class="dt-right-title">🏆 Leaderboard</div>' +
      '<div class="dt-lb-mini">' +
      board.map(function(e, i) {
        var isMe = e.isMe || (myId && e.id === myId);
        return '<div class="dt-lb-row' + (isMe ? ' dt-lb-me' : '') + '">' +
          '<span class="dt-lb-rank">' + ['🥇','🥈','🥉','4','5'][i] + '</span>' +
          '<span class="dt-lb-name">' + escapeHtml(e.name) + '</span>' +
          '<span class="dt-lb-pts">' + e.points + '</span>' +
        '</div>';
      }).join('') +
      '</div></div>';
  } catch(e) {}

  el.innerHTML = lessonHtml + wotdHtml + gamesHtml + lbHtml;
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
    '<button class="mob-progress-btn" onclick="showProgressScreen()">📊 My Progress</button>' +
    '<button class="mob-lb-open-btn" onclick="showLeaderboardScreen()">🏆 Leaderboard</button>' +
    '<button class="share-kesher-btn" onclick="shareKesherIvrit(\'me\')">🇮🇱 Share Kesher Ivrit with Friends</button>' +
    '<div class="mob-action-list">' +
      '<button class="mob-action-btn" onclick="showNotebook()">' +
        '<span class="mob-action-icon">📓</span>' +
        '<div><div class="mob-action-title">My Notebook</div><div class="mob-action-sub">' + state.progress.wordsLearned.length + ' words collected</div></div>' +
      '</button>' +
      '<button class="mob-action-btn" onclick="goHome();switchTab(' + "'learn'" + ')">' +
        '<span class="mob-action-icon">🏠</span>' +
        '<div><div class="mob-action-title">Home</div><div class="mob-action-sub">Return to the home screen</div></div>' +
      '</button>' +
      (function() {
        var dark = document.documentElement.getAttribute('data-theme') === 'dark';
        return '<button class="dm-toggle-btn" onclick="toggleDarkMode()">' +
          '<span class="dm-toggle-icon">' + (dark ? '☀️' : '🌙') + '</span>' +
          '<span class="dm-toggle-text">' +
            '<span class="dm-toggle-title">Dark Mode</span>' +
            '<span class="dm-toggle-sub">' + (dark ? 'On — tap to switch to light' : 'Off — tap to switch to dark') + '</span>' +
          '</span>' +
          '<span class="dm-toggle-pill' + (dark ? ' dm-on' : '') + '">' +
            '<span class="dm-toggle-knob"></span>' +
          '</span>' +
        '</button>';
      })() +
    '</div>' +
    '<div class="mob-me-version">Kesher Ivrit v9.4</div>';
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
    body.innerHTML = '<div class="ki-loader ki-loader-lg"><div class="ki-letters"><span class="ki-letter">א</span><span class="ki-letter">ב</span><span class="ki-letter">ג</span></div><div class="ki-loader-text">Loading leaderboard…</div></div>';
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

// ─── SHARE KESHER IVRIT ───────────────────────────────────────────────────────
// Context: 'me' | 'daily' | 'quiz'
// Uses Web Share API on mobile; clipboard fallback on desktop.
function shareKesherIvrit(context) {
  var base = "I'm learning Hebrew with Kesher Ivrit — a free AI Hebrew tutor that adapts to your level. Try it at kesher-ivrit.vercel.app 🇮🇱";
  var url  = 'https://kesher-ivrit.vercel.app';
  var text;

  if (context === 'daily') {
    var streak = state.progress.streak;
    var words  = state.progress.wordsLearned.length;
    var stats  = [];
    if (streak > 1) stats.push(streak + '-day streak 🔥');
    if (words  > 0) stats.push(words  + ' Hebrew words learned');
    text = '🎓 Just completed a daily Hebrew lesson!' +
           (stats.length ? ' (' + stats.join(' · ') + ')' : '') +
           '\n\n' + base;
  } else if (context === 'quiz') {
    var sc = (_qm && _qm.score)            || 0;
    var tt = (_qm && _qm.questions && _qm.questions.length) || 10;
    text = '🧠 I scored ' + sc + '/' + tt + ' on a Hebrew quiz — can you beat me?\n\n' + base;
  } else {
    var pts = state.progress.points;
    var wds = state.progress.wordsLearned.length;
    var bits = [];
    if (pts > 0) bits.push(pts + ' points');
    if (wds > 0) bits.push(wds + ' words learned');
    text = (bits.length ? '✡️ ' + bits.join(' · ') + ' — and still going!\n\n' : '') + base;
  }

  var payload = { title: 'Kesher Ivrit 🇮🇱', text: text, url: url };

  if (navigator.share) {
    navigator.share(payload).catch(function() { _copyShareText(text + '\n' + url); });
  } else {
    _copyShareText(text + '\n' + url);
  }
}

function _copyShareText(text) {
  function done() { showToast('📋 Copied! Paste into iMessage, WhatsApp, or email to share.', 4500); }
  function fallback() {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); done(); } catch(e) { showToast('Visit kesher-ivrit.vercel.app 🇮🇱'); }
    document.body.removeChild(ta);
  }
  if (navigator.clipboard && navigator.clipboard.writeText)
    navigator.clipboard.writeText(text).then(done).catch(fallback);
  else fallback();
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

  // Daily Concept Mastery
  var masteryData   = loadMastery();
  var allDailyCons  = getDailyConcepts ? getDailyConcepts() : [];
  var masteredIds   = [], practicingIds = [], learningIds = [];
  Object.keys(masteryData).forEach(function(id) {
    var lv = masteryData[id] && masteryData[id].level;
    if      (lv === 'mastered')  masteredIds.push(id);
    else if (lv === 'practicing') practicingIds.push(id);
    else                          learningIds.push(id);
  });
  var totalCons = allDailyCons.length || 1;
  var mastPct   = Math.round((masteredIds.length / totalCons) * 100);

  var todayLesson  = computeTodayLesson ? computeTodayLesson() : null;
  var todayStatus  = '';
  if (todayLesson) {
    var ds = todayLesson.dailyState;
    if (ds && ds.status === 'completed') {
      todayStatus = '<div class="prog-today-row prog-today-done">✓ Today\'s lesson completed' + (ds.score !== null ? ' — ' + ds.score + '%' : '') + '</div>';
    } else {
      todayStatus = '<div class="prog-today-row prog-today-pending">📅 ' + escapeHtml(todayLesson.concept.title) + ' — Session ' + todayLesson.reviewSession + ' of 4 <button class="prog-today-btn" onclick="hideProgressScreen();startDailyLesson()">Start →</button></div>';
    }
  }

  if (Object.keys(masteryData).length > 0 || todayLesson) {
    html.push(
      '<div class="prog-card prog-mastery-card">',
        '<div class="prog-section-hdr">',
          '<span class="prog-section-icon">🎯</span>',
          '<span class="prog-section-title">Daily Concepts</span>',
          '<span class="prog-section-count">' + masteredIds.length + ' mastered</span>',
        '</div>',
        todayStatus,
        '<div class="prog-mastery-pills">',
          '<div class="prog-mastery-pill prog-mp-mastered"><span class="prog-mp-num">' + masteredIds.length + '</span><span class="prog-mp-lbl">Mastered</span></div>',
          '<div class="prog-mastery-pill prog-mp-practicing"><span class="prog-mp-num">' + practicingIds.length + '</span><span class="prog-mp-lbl">Practicing</span></div>',
          '<div class="prog-mastery-pill prog-mp-learning"><span class="prog-mp-num">' + learningIds.length + '</span><span class="prog-mp-lbl">Learning</span></div>',
        '</div>',
        masteredIds.length > 0
          ? '<div class="prog-mastered-list">' +
              masteredIds.slice(0, 5).map(function(id) {
                var c = allDailyCons.find(function(x){ return x.id === id; });
                return '<div class="prog-mastered-item">✓ ' + escapeHtml((c && c.title) || id) + '</div>';
              }).join('') +
              (masteredIds.length > 5 ? '<div class="prog-mastered-more">+' + (masteredIds.length - 5) + ' more</div>' : '') +
            '</div>'
          : '<div class="prog-hint">Complete your first daily lesson to start tracking mastery!</div>',
      '</div>'
    );
  }

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
  _dtUpdate();

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

  // Load quiz wrong-answer review list into session so Morah addresses them
  try {
    var qReview = JSON.parse(localStorage.getItem('kesher_review') || '[]');
    if (qReview.length > 0) {
      state.session.reviewItems = qReview.slice(-5).map(function(w) {
        return w.question + ' (correct: ' + w.correct_answer + ')';
      });
      localStorage.removeItem('kesher_review');
    }
  } catch(e) {}
  document.getElementById('chat-messages').innerHTML = '<div class="ki-loader ki-loader-lg" id="ki-lesson-loader"><div class="ki-letters"><span class="ki-letter">א</span><span class="ki-letter">ב</span><span class="ki-letter">ג</span></div><div class="ki-loader-text">Starting your lesson…</div></div>';
  setMorahStatus('Starting your lesson...');

  var VALID_LEVELS = ['complete_beginner','some_exposure','basic','intermediate','advanced'];
  var level = (state.userProfile && state.userProfile.level) || 'complete_beginner';
  if (!VALID_LEVELS.includes(level)) level = 'complete_beginner';

  var firstMsg;
  var dl    = state.userProfile && state.userProfile.dailyLesson;
  var goals = Array.isArray(state.userProfile.goal) ? state.userProfile.goal
              : state.userProfile.goal ? [state.userProfile.goal] : [];
  var isBM      = goals.includes('bar_mitzvah');
  var isBible   = goals.includes('bible');
  var isPrayer  = goals.includes('prayer');
  var myParasha = myClass && myClass.parasha;

  if (dl) {
    var dlSession = dl.reviewSession || 1;
    if (dlSession === 1) {
      firstMsg = "Today's daily lesson: teach me about \"" + dl.conceptTitle + "\". Introduce it from scratch — I have " + dl.timeMinutes + " minutes.";
    } else if (dlSession === 2) {
      firstMsg = "Review time! I studied \"" + dl.conceptTitle + "\" yesterday. Quickly recap the key points, then add something new.";
    } else if (dlSession === 3) {
      firstMsg = "Quiz me on \"" + dl.conceptTitle + "\"! I want to prove I know it — then teach me something advanced about it.";
    } else {
      firstMsg = "Mastery check for \"" + dl.conceptTitle + "\"! Quiz me hard on everything — I need to show I've mastered it.";
    }
  } else if (isBM) {
    if (!myParasha) {
      // No parasha set — show the interactive selector overlay.
      // selectParasha() will fire the first message after the student picks.
      showParashaOverlay();
      return;
    }
    firstMsg = 'My parasha is ' + myParasha + '. Start Phase 1: teach me what "' + myParasha +
      '" means in Hebrew, its root and etymology, and break down the opening verse word by word.';
  } else if (isBible) {
    firstMsg = "Start my Biblical Hebrew lesson. Focus on Torah vocabulary, vav-consecutive narrative, and construct state. I want to read and understand the actual Torah text.";
  } else if (isPrayer) {
    firstMsg = "Start my prayer Hebrew lesson. Teach me the Siddur word by word — I want to understand every word I pray, not just recite sounds.";
  } else if (level === 'intermediate') {
    firstMsg = "DO NOT say shalom. DO NOT greet me. I am Intermediate. Open your [TEACH] block immediately with הָלַךְ conjugated in all 9 past tense forms. Then [CHALLENGE].";
  } else if (level === 'advanced') {
    firstMsg = "DO NOT say shalom. DO NOT greet me. I am Advanced. Open your [TEACH] block immediately with a binyan or idiom. No introduction.";
  } else {
    firstMsg = "Please start our lesson!";
  }
  console.log('[startLesson] level=' + level + ' daily=' + (dl ? dl.conceptTitle : 'none') + ' msg=' + firstMsg.slice(0, 80));

  await sendToMorah([{ role: 'user', content: firstMsg }]);
}

function newLesson() {
  _dailyLessonActive = false;
  _dailyLessonInfo   = null;
  if (state.userProfile) delete state.userProfile.dailyLesson;
  hideDailyLessonBanner();
  startLesson();
}

// ─── MESSAGE HANDLING ─────────────────────────────────────
var _isSending   = false;
var _lastBody    = null;  // last request body — stored for one-tap retry

// ── Response cache — last 5 successful Morah responses (in-memory) ────────────
var _respCache   = [];
var _CACHE_MAX   = 5;

function _cacheResp(rawContent) {
  _respCache.unshift(rawContent);
  if (_respCache.length > _CACHE_MAX) _respCache.pop();
}

function _cachedFallback() {
  return _respCache.length ? _respCache[Math.floor(Math.random() * _respCache.length)] : null;
}

// ── Fetch with client-side retry + 15-second AbortController timeout ──────────
// Returns parsed JSON data or throws.  Non-retryable errors (no_api_key,
// rate_limit) are re-thrown immediately.
async function _fetchWithRetry(body, maxAttempts, onAttempt) {
  var headers = { 'Content-Type': 'application/json' };

  var lastErr = null;
  for (var attempt = 1; attempt <= maxAttempts; attempt++) {
    if (attempt > 1 && onAttempt) onAttempt(attempt, maxAttempts);
    var controller = new AbortController();
    var tid = null;
    try {
      tid = setTimeout(function() { controller.abort(); }, 15000);
      var response = await fetch('/api/chat', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body),
        signal: controller.signal
      });
      clearTimeout(tid);

      if (!response.ok) {
        var errData = await response.json().catch(function() { return {}; });
        if (errData.error === 'NO_API_KEY') throw new Error('no_api_key');
        if (response.status === 429)        throw new Error('rate_limit');
        // Preserve the actual server error message for debugging
        var detail = errData.message || errData.error || ('HTTP ' + response.status);
        console.error('[Chat] Server error:', response.status, detail);
        var e = new Error('server_error');
        e.serverDetail = detail;
        throw e;
      }

      return await response.json();

    } catch (err) {
      clearTimeout(tid);
      lastErr = err;
      if (err.message === 'no_api_key' || err.message === 'rate_limit') throw err;
      if (attempt < maxAttempts) {
        // Pause before next attempt: 1.2 s, 2.4 s
        await new Promise(function(r) { setTimeout(r, 1200 * attempt); });
      }
    }
  }
  throw lastErr;
}

// ── One-tap retry — re-sends the last failed request ─────────────────────────
function retryLastMessage() {
  // Remove all error messages from the UI
  var chatEl = document.getElementById('chat-messages');
  chatEl.querySelectorAll('.error-message').forEach(function(e) { e.remove(); });
  if (_lastBody) sendToMorah(state.messages);
}

async function sendMessage() {
  if (_isSending) return;
  var input = document.getElementById('user-input');
  var text = input.value.trim();
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
  if (_isSending) return;
  _isSending = true;

  var sendBtn         = document.getElementById('btn-send');
  var typingIndicator = document.getElementById('typing-indicator');

  sendBtn.disabled = true;
  sendBtn.classList.add('is-loading');
  typingIndicator.style.display = 'flex';
  setMorahStatus('Morah is thinking…');
  var _lessonLoader = document.getElementById('ki-lesson-loader');
  if (_lessonLoader) _lessonLoader.remove();

  // After 8 s with no response, update status so user knows we haven't frozen
  var slowTimer = setTimeout(function() {
    if (_isSending) setMorahStatus('Still thinking — Morah is crafting a great answer…');
  }, 8000);

  // Build request body once; keep it for one-tap retry
  _lastBody = {
    messages:    messages,
    userProfile: Object.assign({}, state.userProfile, { currentTopic: state.currentTopic, session: state.session, qaMode: _qaMode }),
    myClass:     myClass || null
  };

  try {
    var data = await _fetchWithRetry(_lastBody, 3, function(attempt) {
      setMorahStatus('Reconnecting to Morah (' + attempt + ' of 3)…');
    });

    clearTimeout(slowTimer);

    var rawContent = data.content;

    // Cache for offline fallback
    _cacheResp(rawContent);

    // Extract metadata
    var wordsData = extractWordsLearned(rawContent);
    var skipMatches = rawContent.matchAll(/\[SKIP:\s*([^\]]+)\]/gi);
    for (var sm of skipMatches) {
      var topic = sm[1].trim();
      if (topic && !state.session.skipList.includes(topic)) state.session.skipList.push(topic);
    }

    var cleanContent = rawContent
      .replace(/📚 WORDS LEARNED:.*$/s, '')
      .replace(/\[SKIP:[^\]]*\]/gi, '')
      .trim();

    state.messages.push({ role: 'assistant', content: rawContent });
    saveProgress();

    appendMessage('morah', cleanContent, wordsData);
    if (wordsData.length > 0) addWordsToProgress(wordsData);

    updateStreak();
    setMorahStatus('Ready to teach! 🇮🇱');

  } catch (error) {
    clearTimeout(slowTimer);
    console.error('[Chat] Failed after retries:', error.message);

    if (error.message === 'no_api_key') {
      appendErrorMessage('no_api_key');
    } else if (error.message === 'rate_limit') {
      appendErrorMessage('rate_limit');
    } else {
      // Try cached fallback before showing error
      var fallback = _cachedFallback();
      if (fallback) {
        var cleanFallback = fallback
          .replace(/📚 WORDS LEARNED:.*$/s, '')
          .replace(/\[SKIP:[^\]]*\]/gi, '')
          .trim();
        appendMessage('morah', cleanFallback, []);
        showToast('📶 Using a saved response — connection hiccup detected', 4500);
        setMorahStatus('Ready to teach! 🇮🇱');
      } else {
        var errType = error.name === 'AbortError' ? 'timeout' : 'server_error';
        appendErrorMessage(errType, error.serverDetail || null);
        setMorahStatus('Tap retry to reconnect 🔄');
      }
    }

  } finally {
    clearTimeout(slowTimer);
    _isSending = false;
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

// ── CLIENT-SIDE NUCLEAR OPTION SCRUBBER ──────────────────────────────────────
// Second line of defence after server rescue. Strips every known text-option
// pattern so they can never reach the DOM regardless of what slips through.
var _OPTION_STRIP_PATTERNS = [
  // "A) text"  "a) text"  "1) text"  with optional bold markers
  /^[ \t]*\*{0,2}[ \t]*[A-Da-d1-4][ \t]*\*{0,2}[ \t]*[.)]\*{0,2}[ \t]+.+$/gm,
  // "A. text"  "1. text"
  /^[ \t]*[A-Da-d1-4]\.[ \t]+.+$/gm,
  // "A: text"  "1: text"
  /^[ \t]*[A-Da-d1-4]:[ \t]+.+$/gm,
  // "(A) text"  "(1) text"
  /^[ \t]*\([A-Da-d1-4]\)[ \t]+.+$/gm,
  // "Option A: text"  "Choice B: text"
  /^[ \t]*(?:option|choice)[ \t]+[A-Da-d1-4][.):\s].+$/gim,
  // "Answer: A"  "Correct answer: B"
  /^[ \t]*(?:answer|correct\s+answer)\s*[:\-]\s*[A-Da-d1-4].*/gim,
  // "Which is correct?" followed by inline options
  /which\s+is\s+correct[^?]*\?[^\n]*/gi,
  // Inline options after question mark: "? a) opt b) opt"
  /\?[ \t]*[a-d][)][ \t]+\S[^\n]*/g,
  // "- A) text"  "• A) text" (bullet + option)
  /^[ \t]*[-•*][ \t]*[A-Da-d1-4][.):][ \t]+.+$/gm,
  // Inline "(a) text (b) text" sequences
  /\([ABCDabcd]\)[ \t]+[^(\n]{2,60}/g,
];

function _scrubOptions(text) {
  var out = text;
  _OPTION_STRIP_PATTERNS.forEach(function(re) {
    out = out.replace(re, '');
  });
  return out.replace(/\n{3,}/g, '\n\n').trim();
}

function parseMorahResponse(raw) {
  var teachMatch     = raw.match(/\[TEACH\]([\s\S]*?)\[\/TEACH\]/);
  var challengeMatch = raw.match(/\[CHALLENGE\]([\s\S]*?)\[\/CHALLENGE\]/);

  // ── Build teach text ────────────────────────────────────────────────────────
  var teach = teachMatch
    ? teachMatch[1].trim()
    : raw.replace(/📚 WORDS LEARNED:.*$/s, '').replace(/\[SKIP:[^\]]*\]/gi, '').trim();

  // Strip any challenge block text from teach (it's rendered separately)
  if (!teachMatch && challengeMatch) {
    teach = teach.replace(/\[CHALLENGE\][\s\S]*?\[\/CHALLENGE\]/g, '').trim();
  }

  // Nuclear scrub — remove all text option patterns
  teach = _scrubOptions(teach);

  // ── Parse challenge ─────────────────────────────────────────────────────────
  var challenge = null;
  if (challengeMatch) {
    var rawC = challengeMatch[1].trim();

    // Attempt 1: direct parse
    try { challenge = JSON.parse(rawC); } catch (_) {}

    // Attempt 2: find JSON object buried in prose
    if (!challenge) {
      var jm = rawC.match(/\{[\s\S]*?"type"[\s\S]*?\}/);
      if (jm) try { challenge = JSON.parse(jm[0]); } catch (_) {}
    }

    // Attempt 3: any JSON object at all
    if (!challenge) {
      var jm2 = rawC.match(/\{[\s\S]*\}/);
      if (jm2) try { challenge = JSON.parse(jm2[0]); } catch (_) {}
    }

    // Attempt 4: AI wrote text options inside [CHALLENGE] — rescue client-side
    if (!challenge) {
      var rescued = _clientRescueOptions(rawC);
      if (rescued) { challenge = rescued; console.warn('[parseMorah] Client rescued text options from [CHALLENGE]'); }
    }

    // Attempt 5: complete fallback — create fill_blank from first question-like line
    if (!challenge) {
      var qLine = rawC.split('\n').find(function(l) { return l.trim().length > 8; }) || 'What did you just learn?';
      challenge = { type: 'fill_blank', question: qLine.replace(/^\*+|\*+$/g,'').trim(), answer: '__any__', explanation: '' };
      console.warn('[parseMorah] Fallback fill_blank — could not parse [CHALLENGE] content');
    }

    // Normalise field aliases (some models write "answer" instead of "correct")
    if (challenge && challenge.answer !== undefined && challenge.correct === undefined) {
      if (typeof challenge.answer === 'number') challenge.correct = challenge.answer;
    }
    // Normalise type alias "mcq" → "multiple_choice"
    if (challenge && challenge.type === 'mcq') challenge.type = 'multiple_choice';
  }

  return { teach: teach, challenge: challenge };
}

// Client-side option extractor (mirrors server _extractOptions for defence-in-depth)
function _clientRescueOptions(text) {
  var lines = text.split('\n');
  var opts = [], blockStart = -1, blockEnd = -1, run = 0;
  var optRe = /^[ \t]*(?:\*{0,2}[ \t]*)?(?:\(?[ \t]*)?([A-Da-d1-4])(?:[ \t]*\)?)?[ \t]*[.):\-][ \t]*\*{0,2}(.+)$/;
  for (var i = 0; i < lines.length; i++) {
    var m = optRe.exec(lines[i]);
    if (m) {
      if (run === 0) blockStart = i;
      run++; blockEnd = i;
      opts.push(m[2].replace(/\*+/g,'').trim());
    } else {
      if (run >= 2) break;
      run = 0; blockStart = -1; blockEnd = -1; opts.length = 0;
    }
  }
  if (opts.length < 2) return null;
  var question = 'Choose the correct answer:';
  for (var j = blockStart - 1; j >= 0; j--) {
    var t = lines[j].replace(/^\*+|\*+$/g,'').trim();
    if (t) { question = t; break; }
  }
  return { type: 'multiple_choice', question: question, options: opts.slice(0,4), correct: 0, explanation: '' };
}

// ─── RENDERING ───────────────────────────────────────────
// Morah's response is split into two visually separate sections:
//   1. teach-bubble  — pure information, no interaction
//   2. challenge-bubble — interactive widget only, contrasting background
// instant=true skips streaming animation (used for history replay on reload)
function appendMessage(role, content, wordBadges, instant) {
  wordBadges = wordBadges || [];
  instant    = instant    || false;

  var container = document.getElementById('chat-messages');
  var el        = document.createElement('div');
  el.className  = 'message ' + role;
  var time      = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (role === 'morah') {
    var parsed    = parseMorahResponse(content);
    var teach     = parsed.teach;
    var challenge = parsed.challenge;
    var cId       = challenge ? ++challengeCounter : null;
    if (cId) challengeStore[cId] = { challenge: challenge, answered: false };

    // ── Section 1: Teach bubble (blue, pure information) ──────────────────
    var teachBubble = document.createElement('div');
    teachBubble.className = 'msg-bubble teach-bubble';

    // ── Section 2: Divider + Challenge bubble (amber, interactive only) ────
    var divider         = null;
    var challengeBubble = null;
    if (cId) {
      divider = document.createElement('div');
      divider.className = 'practice-divider';
      divider.innerHTML =
        '<span class="practice-divider-line"></span>' +
        '<span class="practice-divider-label">✏️ Your turn!</span>' +
        '<span class="practice-divider-line"></span>';
      if (!instant) divider.style.display = 'none';

      challengeBubble = document.createElement('div');
      challengeBubble.className = 'msg-bubble challenge-bubble';
      if (!instant) challengeBubble.style.display = 'none';

      var cDiv = document.createElement('div');
      cDiv.className = 'challenge-widget';
      cDiv.id = 'challenge-' + cId;
      challengeBubble.appendChild(cDiv);
    }

    // ── Footer ────────────────────────────────────────────────────────────
    var footer = document.createElement('div');
    footer.className = 'msg-footer';
    footer.innerHTML = '<span class="msg-time">' + time + '</span>';

    // ── Assemble ──────────────────────────────────────────────────────────
    var inner = document.createElement('div');
    inner.className = 'msg-inner-col';
    inner.appendChild(teachBubble);
    if (divider)         inner.appendChild(divider);
    if (challengeBubble) inner.appendChild(challengeBubble);
    inner.appendChild(footer);

    var avatar = document.createElement('div');
    avatar.className = 'msg-avatar';
    avatar.textContent = '👩‍🏫';

    el.appendChild(avatar);
    el.appendChild(inner);
    container.appendChild(el);

    // ── Reveal extras after teach content finishes ────────────────────────
    function _attachExtras() {
      // Word badges go at the bottom of the teach bubble
      if (wordBadges.length > 0) {
        var badgeWrap = document.createElement('div');
        badgeWrap.className = 'word-badges';
        wordBadges.forEach(function(w, i) {
          var b = document.createElement('div');
          b.className = 'word-badge';
          if (!instant) { b.classList.add('msg-block-in'); b.style.cssText = 'animation-delay:' + (i * 0.07) + 's;--bd:0.35s'; }
          b.innerHTML =
            '<span class="word-badge-heb">'   + escapeHtml(w.hebrew)          + '</span>' +
            '<span class="word-badge-trans">'  + escapeHtml(w.transliteration) + '</span>' +
            '<span class="word-badge-eng">'    + escapeHtml(w.english)         + '</span>';
          badgeWrap.appendChild(b);
        });
        teachBubble.appendChild(badgeWrap);
      }
      // Reveal the challenge section and populate the widget
      if (cId) {
        if (divider)         divider.style.removeProperty('display');
        if (challengeBubble) challengeBubble.style.removeProperty('display');
        renderChallenge(cId);
      }
      autoScroll();
    }

    // ── Final DOM safety check — scan rendered HTML for option patterns ────────
    function _safeTeachHtml(text) {
      var html = formatMessage(text);
      // If rendered HTML contains option-like lines, scrub from source and re-render
      if (/^[A-Da-d1-4][.)]\s+\S/m.test(html) || /\([ABCDabcd]\)\s+\S/.test(html)) {
        console.warn('[DOM-GUARD] Option text detected in rendered HTML — re-scrubbing');
        html = formatMessage(_scrubOptions(text));
      }
      return html;
    }

    if (instant) {
      teachBubble.innerHTML = _safeTeachHtml(teach);
      _attachExtras();
    } else {
      autoScroll();
      _streamBlocks(teachBubble, _safeTeachHtml(teach), _attachExtras);
    }

  } else {
    var userInitial = (state.userProfile && state.userProfile.name) ? state.userProfile.name[0] : '👤';
    el.innerHTML =
      '<div class="msg-avatar">' + escapeHtml(userInitial) + '</div>' +
      '<div style="flex:1;min-width:0;">' +
        '<div class="msg-bubble">' + formatMessage(content) + '</div>' +
        '<div class="msg-footer"><span class="msg-time">' + time + '</span></div>' +
      '</div>';
    container.appendChild(el);
    autoScroll();
  }
}

// ── Progressive block streaming — reveals message content piece by piece ──────
function _streamBlocks(bubble, htmlContent, onDone) {
  var temp = document.createElement('div');
  temp.innerHTML = htmlContent;
  var blocks = Array.from(temp.children);

  if (!blocks.length) {
    bubble.innerHTML = htmlContent;
    if (onDone) setTimeout(onDone, 30);
    return;
  }

  var delay = 10;

  blocks.forEach(function(origBlock) {
    var isTable = origBlock.classList.contains('msg-table-wrap');
    var isPara  = origBlock.tagName === 'P';
    var isList  = origBlock.tagName === 'UL' || origBlock.tagName === 'OL';
    var words   = origBlock.textContent.trim().split(/\s+/).length;
    var dur     = isPara  ? Math.max(0.2, Math.min(words * 0.03, 0.5))
                : isTable ? 0.35 : 0.2;

    setTimeout(function() {
      var block = origBlock.cloneNode(true);
      block.classList.add('msg-block-in');
      block.style.setProperty('--bd', dur + 's');
      bubble.appendChild(block);
      if (isTable) {
        block.querySelectorAll('tr').forEach(function(row, ri) {
          row.classList.add('tbl-row-in');
          row.style.animationDelay = (ri * 0.06 + 0.05) + 's';
        });
      }
      autoScroll();
    }, delay);

    if (isTable)     delay += 200;
    else if (isList) delay += 120;
    else if (isPara) delay += Math.max(70, Math.min(words * 16, 180));
    else             delay += 60;
  });

  // onDone fires after last block is appended — NOT waiting for its animation.
  // This guarantees challenge buttons always appear on time.
  if (onDone) setTimeout(onDone, delay + 20);
}

function appendErrorMessage(errCode, serverDetail) {
  var MSGS = {
    no_api_key:   { emoji: '🛠️', title: 'Service temporarily unavailable', body: 'Morah is having trouble connecting right now. Please try again in a moment.', retry: true },
    rate_limit:   { emoji: '⏳', title: 'Too many messages!',          body: 'Take a breath for a few seconds, then tap Retry.',            retry: true  },
    timeout:      { emoji: '⏱️', title: 'Morah is taking too long',    body: 'The response timed out. Tap Retry — she\'ll be right back!',  retry: true  },
    server_error: { emoji: '🛠️', title: 'Server hiccup',               body: 'Something glitched on our end. Already retried 3×. Tap Retry when ready.', retry: true },
  };
  var offline = !navigator.onLine;
  var m = MSGS[errCode] || (offline
    ? { emoji: '📶', title: 'No internet connection', body: 'Check your Wi-Fi or data, then tap Retry.', retry: true }
    : { emoji: '😅', title: 'Morah had a hiccup',     body: 'Something didn\'t connect. Tap Retry — this usually fixes it!', retry: true });

  var container = document.getElementById('chat-messages');
  var el = document.createElement('div');
  el.className = 'message morah error-message';

  var detailHtml = (serverDetail && m.retry)
    ? '<div class="error-detail">' + escapeHtml(serverDetail) + '</div>'
    : '';
  var retryBtn = m.retry
    ? '<button class="reconnect-btn" onclick="retryLastMessage()">🔄 Retry</button>'
    : '';

  var time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  el.innerHTML =
    '<div class="msg-avatar">' + m.emoji + '</div>' +
    '<div style="flex:1;min-width:0;">' +
      '<div class="msg-bubble error-bubble">' +
        '<div class="error-title">' + escapeHtml(m.title) + '</div>' +
        '<div class="error-body">'  + escapeHtml(m.body)  + '</div>' +
        detailHtml +
        retryBtn +
      '</div>' +
      '<div class="msg-footer"><span class="msg-time">' + time + '</span></div>' +
    '</div>';
  container.appendChild(el);
  autoScroll();
}

function renderAllMessages() {
  var container = document.getElementById('chat-messages');
  container.innerHTML = '';
  // instant=true: no streaming animation for history — prevents timer flood on reload
  for (var i = 0; i < state.messages.length; i++) {
    appendMessage(state.messages[i].role, state.messages[i].content, [], true);
  }
  autoScroll();
}

// ─── CHALLENGE RENDERERS ──────────────────────────────────
function renderChallenge(cId) {
  const { challenge } = challengeStore[cId];
  const container = document.getElementById(`challenge-${cId}`);
  if (!container || !challenge) return;

  // Normalise type aliases so every variant from the AI renders correctly
  var type = (challenge.type || '').toLowerCase().replace(/[-_ ]/g, '');
  if (type === 'mcq' || type === 'multiplechoice' || type === 'mc') type = 'multiple_choice';
  if (type === 'fillblank' || type === 'fillin' || type === 'fill') type = 'fill_blank';
  if (type === 'truefalse' || type === 'tf' || type === 'boolean') type = 'true_false';

  switch (type) {
    case 'multiple_choice': renderMultipleChoice(cId, challenge, container); break;
    case 'fill_blank':      renderFillBlank(cId, challenge, container);      break;
    case 'true_false':      renderTrueFalse(cId, challenge, container);      break;
    case 'match':           renderMatch(cId, challenge, container);          break;
    default:
      // Absolute fallback — always renders something interactive
      console.warn('[renderChallenge] Unknown type "' + challenge.type + '" → fill_blank');
      renderFillBlank(cId, {
        question: challenge.question || challenge.statement || 'What did you just learn?',
        answer:   '__any__',
        explanation: challenge.explanation || ''
      }, container);
      break;
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

// ── Transliteration normalizer ────────────────────────────────────────────────
// Collapses common spelling variants so students aren't penalised for
// valid alternative romanisations of the same Hebrew sound.
//   ch/kh  →  kh   (chet / khaf: "lekhem" = "lechem")
//   tz/ts  →  ts   (tsadi: "tsadik" = "tzaddik")
//   ph     →  f    (feh)
//   oo     →  u    (shuruk: "shuruk" = "shoorook")
//   ee     →  i    (chirik)
//   ay/ai/ei/ey → e  (tsere / segol vowel variants)
//   doubled consonants → single  (shabbat = shabat)
//   trailing h stripped  (todah = toda, halakhah = halakha)
function _translitNormalize(s) {
  if (!s) return '';
  return String(s)
    .toLowerCase()
    .replace(/['’‘ʼ]/g, '') // apostrophes
    .replace(/[\s\-]/g,   '')              // spaces and hyphens
    .replace(/tz/g,       'ts')            // tzadi variants
    .replace(/ch/g,       'kh')            // chet / khaf
    .replace(/ph/g,       'f')             // feh
    .replace(/oo/g,       'u')             // shuruk
    .replace(/ee/g,       'i')             // chirik
    .replace(/ay|ai|ei|ey/g, 'e')          // tsere / segol
    .replace(/(.)\1/g,    '$1')            // doubled consonants
    .replace(/h$/,        '');             // trailing h
}

function _translitMatch(userInput, expected) {
  if (!userInput || !expected) return false;
  return _translitNormalize(userInput) === _translitNormalize(expected);
}

function answerFill(cId) {
  const { challenge, answered } = challengeStore[cId];
  if (answered) return;

  const input    = document.getElementById('fill-' + cId);
  const val      = input.value.trim();
  const expected = challenge.answer;

  // '__any__' = fallback coercion — any non-empty answer is accepted
  const correct = expected === '__any__'
    ? val.length > 0
    : (val.toLowerCase() === expected.toLowerCase() || _translitMatch(val, expected));

  challengeStore[cId].answered = true;
  input.disabled = true;
  input.classList.add(correct ? 'fill-correct' : 'fill-wrong');
  document.querySelector('#challenge-' + cId + ' .fill-submit').disabled = true;

  showChallengeFeedback(cId, correct, challenge.explanation);
  awardChallengePoints(correct, 10);
  setTimeout(function() { sendChallengeResult(correct, challenge, val); }, 800);
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
  var fb = document.getElementById('cf-' + cId);
  if (!fb) return;
  fb.className = 'challenge-feedback ' + (correct ? 'fb-correct' : 'fb-wrong');

  var selfCorrectBtn = (!correct && !challengeStore[cId].selfCorrected)
    ? '<button class="self-correct-btn" onclick="selfCorrect(' + cId + ')">Actually I got it right ✓</button>'
    : '';

  fb.innerHTML = correct
    ? '<span class="fb-icon">🎉</span> <strong>Correct!</strong> ' + escapeHtml(explanation || '')
    : '<span class="fb-icon">❌</span> <strong>Not quite.</strong> ' + escapeHtml(explanation || '') +
      (selfCorrectBtn ? '<div class="self-correct-wrap">' + selfCorrectBtn + '</div>' : '');

  fb.style.display = 'flex';
  autoScroll();
}

// ── Self-correction ────────────────────────────────────────────────────────────
// Student taps "Actually I got it right ✓" after being marked wrong.
// Awards full points and sends a warm acknowledgment to Morah.
function selfCorrect(cId) {
  var entry = challengeStore[cId];
  if (!entry || entry.selfCorrected) return;
  entry.selfCorrected = true;

  // Update the feedback panel to show corrected state
  var fb = document.getElementById('cf-' + cId);
  if (fb) {
    fb.className = 'challenge-feedback fb-correct fb-self-corrected';
    fb.innerHTML =
      '<span class="fb-icon">✓</span> ' +
      '<div><strong>Got it!</strong> Your answer is accepted — multiple ' +
      'transliterations are always valid in Hebrew. Well done!</div>';
    autoScroll();
  }

  // Award the points they would have received
  awardChallengePoints(true, 10);

  // Send a self-correction event so Morah can respond warmly
  if (!_isSending) {
    var challenge = entry.challenge || {};
    var msg = '[RESULT: self-corrected] The student indicated their answer was actually correct — likely a valid alternative transliteration or spelling. Acknowledge warmly in one sentence (e.g. "You\'re right — \'toda\' and \'todah\' are both perfectly valid!"). Then continue teaching.';
    if (challenge.question) msg += ' Question was: ' + challenge.question;
    state.messages.push({ role: 'user', content: msg });
    sendToMorah(state.messages);
  }
}

// After every challenge answer, send a silent result message so Morah always responds
function sendChallengeResult(correct, challenge, chosenLabel) {
  if (_isSending) return; // don't stack on top of an in-flight request
  var msg;
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
  var colors = ['#0038B8','#FFD700','#FFFFFF','#4A90D9','#2E8B57','#FF6B6B'];
  for (var i = 0; i < 20; i++) {
    var c = document.createElement('div');
    c.className = 'confetti-piece';
    c.style.cssText =
      'left:' + (Math.random()*100) + 'vw;' +
      'background:' + colors[Math.floor(Math.random()*colors.length)] + ';' +
      'width:' + (5+Math.random()*7) + 'px;' +
      'height:' + (5+Math.random()*7) + 'px;' +
      'animation-duration:' + (0.7+Math.random()*0.8) + 's;' +
      'animation-delay:' + (Math.random()*0.3) + 's;' +
      'border-radius:' + (Math.random()>0.4?'50%':'3px') + ';' +
      'transform:rotate(' + (Math.random()*360) + 'deg);';
    document.body.appendChild(c);
    setTimeout(function() { c.remove(); }, 2000);
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

    // ── Markdown heading → plain paragraph ───────────────
    const hm = line.match(/^#{1,3}\s+(.+)/);
    if (hm) {
      html += `<p><strong>${_msgInline(hm[1])}</strong></p>`;
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

// Inline formatter: clean and minimal — no mixed font styles
function _msgInline(raw) {
  let h = escapeHtml(raw);
  // **Hebrew word** → Hebrew font span (no pill background)
  h = h.replace(/\*\*([^*]+)\*\*/g, function(_, inner) {
    return /[֐-׿]/.test(inner.trim())
      ? `<span class="heb-word" dir="rtl">${inner}</span>`
      : `<strong>${inner}</strong>`;
  });
  // *text* → italic (no extra color class)
  h = h.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
  // `code` → inline code
  h = h.replace(/`([^`]+)`/g, '<code class="msg-code">$1</code>');
  // Strip any remaining stray * or # characters
  h = h.replace(/\*+/g, '').replace(/^#+\s*/gm, '');
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
  var el = document.getElementById('morah-status');
  if (el) el.textContent = text;
}

function sendTopic(topic) {
  var map = {
    'new-topic':    "Teach me something new in Hebrew today — a word, phrase, or grammar point suited to my level.",
    'verbs':        "Teach me a Hebrew verb at my level — show me the root, all present-tense forms, and one example sentence.",
    'nouns':        "Teach me some Hebrew nouns — include the gender, plural form, and a short example for each.",
    'past-tense':   "Explain the Hebrew past tense clearly. Show me the verb pattern with a common verb and example sentences.",
    'future-tense': "Teach me the Hebrew future tense. Walk me through the pattern with a clear example verb.",
    'binyanim':     "Explain the Hebrew binyan system at my level. Focus on the most important pattern I should know right now.",
    'vocabulary':   "Give me five Hebrew words I should know at my level. For each: the word, pronunciation, and a short example.",
    'grammar':      "Teach me one Hebrew grammar rule that matters at my level — explain it clearly with two or three examples.",
    'quiz':         "Quiz me on what I've learned so far. Mix vocabulary and grammar — whatever is most useful at my level right now.",
  };
  exitQAMode();
  sendQuick(map[topic] || "Teach me something new in Hebrew.");
}

var _teachMenuOpen = false;

function toggleTeachMenu() {
  _teachMenuOpen = !_teachMenuOpen;
  var dd    = document.getElementById('teach-dropdown');
  var arrow = document.getElementById('cab-arrow');
  if (dd)    dd.classList.toggle('teach-dropdown-open', _teachMenuOpen);
  if (arrow) arrow.textContent = _teachMenuOpen ? '▴' : '▾';
}

function pickTopic(topic) {
  _teachMenuOpen = false;
  var dd    = document.getElementById('teach-dropdown');
  var arrow = document.getElementById('cab-arrow');
  if (dd)    dd.classList.remove('teach-dropdown-open');
  if (arrow) arrow.textContent = '▾';
  sendTopic(topic);
}

// Close teach menu when clicking outside
document.addEventListener('click', function(e) {
  if (_teachMenuOpen && !e.target.closest('.cab-teach-wrap')) {
    _teachMenuOpen = false;
    var dd    = document.getElementById('teach-dropdown');
    var arrow = document.getElementById('cab-arrow');
    if (dd)    dd.classList.remove('teach-dropdown-open');
    if (arrow) arrow.textContent = '▾';
  }
});

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

function showStreakModal(emoji, title, message, showShare, closeTxt) {
  document.getElementById('streak-emoji').textContent  = emoji;
  document.getElementById('streak-title').textContent  = title;
  document.getElementById('streak-message').textContent = message;
  var shareBtn  = document.getElementById('streak-share-btn');
  var closeBtn  = document.getElementById('streak-close-btn');
  if (shareBtn) shareBtn.style.display = showShare ? '' : 'none';
  if (closeBtn) closeBtn.textContent   = closeTxt || (showShare ? 'Keep Learning! 🔥' : "OK, I'll do better! 🙏");
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
  if (level === 'advanced')                          return SR_POOL_ADVANCED;
  if (level === 'intermediate' || level === 'basic') return SR_POOL_INTERMEDIATE;
  return SR_POOL_BEGINNER; // complete_beginner, some_exposure
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
// ─── CURRICULUM ──────────────────────────────────────────
// All Hebrew embedded in lesson prompts has been verified for correct
// nikud, transliteration (standard Israeli), and grammar accuracy.
const CURRICULUM = [

  // ══════════════════════════════════════════════════════
  // UNIT 1 — THE ALEPH-BET  (Complete Beginner)
  // ══════════════════════════════════════════════════════
  {
    id: 'unit1',
    title: 'Unit 1: The Aleph-Bet',
    titleHeb: 'הָאָלֶף-בֵּית',
    levelReq: 0,
    color: '#2E8B57',
    lessons: [
      {
        id: 'u1l1', title: 'Letters א–י', icon: '🔤',
        prompt: 'Teach me the first ten Hebrew letters in alphabetical order: א (Alef, silent), בּ/ב (Bet/Vet — "b" with dagesh, "v" without), ג (Gimel, "g"), ד (Dalet, "d"), ה (He, "h"), ו (Vav, "v"), ז (Zayin, "z"), ח (Khet, guttural "kh" like Bach), ט (Tet, "t"), י (Yod, "y"). For each letter give: the name, the sound, an English memory anchor, and one Hebrew word I will learn anyway that uses it.'
      },
      {
        id: 'u1l2', title: 'Letters כ–ת + Finals', icon: '🔡',
        prompt: 'Teach me the remaining twelve Hebrew letters plus the five final forms. Letters: כּ/כ (Kaf/Khaf — "k" with dagesh, "kh" without), ל (Lamed, "l"), מ (Mem, "m"), נ (Nun, "n"), ס (Samekh, "s"), ע (Ayin, guttural or silent), פּ/פ (Pe/Fe — "p" with dagesh, "f" without), צ (Tsadi, "ts"), ק (Kof, "k"), ר (Resh, guttural "r"), שׁ/שׂ (Shin "sh" / Sin "s" — dot on RIGHT = sh, LEFT = s), ת (Tav, "t"). Final forms used ONLY at end of words: ך ם ן ף ץ — same sounds, different shapes.'
      },
      {
        id: 'u1l3', title: 'Nikud — Vowel Marks', icon: '⬡',
        prompt: 'Teach me Hebrew vowel marks (נִקּוּד — nikud). Cover these seven in order: קָמַץ (kamatz) under a letter = "ah" sound. פַּתַּח (patakh) = short "a". צֵרֵה (tsere) = "ey" as in "they". סֶגּוֹל (segol) = "eh". חִירִיק (khirik) = "ee". חוֹלָם (kholam) — dot above = "oh". שׁוּרוּק (shuruk) — dot inside ו = "oo". Also: שְׁוָא (sheva) — two dots = silent OR very brief "uh". Show each mark on the letter בּ so I can see the position clearly.'
      },
      {
        id: 'u1l4', title: 'Greetings & Essentials', icon: '👋',
        prompt: 'Teach me the most essential Hebrew greetings and polite words, one at a time with quiz after each: שָׁלוֹם (shalom) — peace/hello/goodbye. תּוֹדָה (todah) — thank you. בְּבַקָּשָׁה (bevakasha) — please AND you\'re welcome. כֵּן (ken) — yes. לֹא (lo) — no. בֹּקֶר טוֹב (boker tov) — good morning. עֶרֶב טוֹב (erev tov) — good evening. לַיְלָה טוֹב (layla tov) — good night. סְלִיחָה (slikha) — excuse me / sorry. מַה שְּׁלוֹמְךָ? (ma shlomkha? — to a male) / מַה שְּׁלוֹמֵךְ? (ma shlomekh? — to a female) — how are you? לְהִתְרָאוֹת (lehitraot) — see you later. Explain that Hebrew greetings have gender forms — the same word changes when addressing male vs female.'
      },
      {
        id: 'u1l5', title: 'Numbers 1–10', icon: '🔢',
        prompt: 'Teach me Hebrew numbers 1 through 10. CRITICAL: Hebrew numbers have a counterintuitive gender system — the form ending in ה is used with MASCULINE nouns, and the shorter form with FEMININE nouns. Teach both forms: 1 אֶחָד/אַחַת (echad/akhat). 2 שְׁנַיִם/שְׁתַּיִם (shnayim/shtayim). 3 שְׁלוֹשָׁה/שָׁלוֹשׁ (shloshah/shalosh). 4 אַרְבָּעָה/אַרְבַּע (arba\'ah/arba\'). 5 חֲמִישָׁה/חָמֵשׁ (khamisha/khamesh). 6 שִׁשָּׁה/שֵׁשׁ (shishah/shesh). 7 שִׁבְעָה/שֶׁבַע (shiv\'ah/sheva\'). 8 שְׁמוֹנָה/שְׁמוֹנֶה (shmonah/shmoneh). 9 תִּשְׁעָה/תֵּשַׁע (tish\'ah/tesha\'). 10 עֲשָׂרָה/עֶשֶׂר (asarah/eser). When Israelis count aloud they use the feminine forms: אַחַת, שְׁתַּיִם, שָׁלוֹשׁ...'
      },
      {
        id: 'u1l6', title: 'Numbers 11–20', icon: '🔟',
        prompt: 'Teach me Hebrew numbers 11 through 20. The pattern is: unit-number + עָשָׂר (asar, masc) or עֶשְׂרֵה (esreh, fem). 11 אַחַד עָשָׂר/אַחַת עֶשְׂרֵה. 12 שְׁנֵים עָשָׂר/שְׁתֵּים עֶשְׂרֵה. 13 שְׁלוֹשָׁה עָשָׂר/שָׁלוֹשׁ עֶשְׂרֵה. 14 אַרְבָּעָה עָשָׂר/אַרְבַּע עֶשְׂרֵה. 15 חֲמִישָׁה עָשָׂר/חָמֵשׁ עֶשְׂרֵה. 16 שִׁשָּׁה עָשָׂר/שֵׁשׁ עֶשְׂרֵה. 17 שִׁבְעָה עָשָׂר/שֶׁבַע עֶשְׂרֵה. 18 שְׁמוֹנָה עָשָׂר/שְׁמוֹנֶה עֶשְׂרֵה. 19 תִּשְׁעָה עָשָׂר/תְּשַׁע עֶשְׂרֵה. 20 עֶשְׂרִים (esrim) — same for both genders!'
      },
      {
        id: 'u1l7', title: 'Colors', icon: '🎨',
        prompt: 'Teach me Hebrew colors. Each color has four forms — masculine singular, feminine singular, masculine plural, feminine plural. Adjectives FOLLOW the noun in Hebrew. Teach these colors with BOTH genders: אָדֹם/אֲדֻמָּה (adom/aduma) — red. כָּחוֹל/כְּחֻלָּה (kakhol/kkhula) — blue. לָבָן/לְבָנָה (lavan/levana) — white. שָׁחֹר/שְׁחֹרָה (shakhor/shkhora) — black. יָרֹק/יְרֻקָּה (yarok/yeruka) — green. צָהֹב/צְהֻבָּה (tsahov/tsehuba) — yellow. כָּתֹם/כְּתֻמָּה (katom/ketuma) — orange. וָרֹד/וְרֻדָּה (varod/veruda) — pink. אָפוֹר/אֲפוֹרָה (afor/afora) — grey. חוּם (khum) — brown (same for m and f). Practice sentences like: כֶּלֶב שָׁחֹר (kelev shakhor — a black dog) vs. שִׂמְלָה שְׁחֹרָה (simla shkhora — a black dress).'
      },
      {
        id: 'u1l8', title: 'Family Words', icon: '👨‍👩‍👧',
        prompt: 'Teach me Hebrew family vocabulary (מִשְׁפָּחָה — mishpakha). Every noun has a gender — explain this as you teach each word: אַבָּא (aba) — dad [m]. אִמָּא (ima) — mom [f]. בֵּן (ben) — son [m]. בַּת (bat) — daughter [f]. אָח (akh) — brother [m]. אָחוֹת (akhot) — sister [f]. סָבָא (saba) — grandfather [m]. סָבְתָּא (savta) — grandmother [f]. דּוֹד (dod) — uncle [m]. דּוֹדָה (dodah) — aunt [f]. יֶלֶד (yeled) — boy [m]. יַלְדָּה (yalda) — girl [f]. בַּעַל (ba\'al) — husband [m]. אִשָּׁה (isha) — wife [f]. Build example sentences using הוּא/הִיא (hu/hi — he/she): אִמָּא שֶׁלִּי (ima sheli — my mom). אָחִי (akhi — my brother).'
      }
    ]
  },

  // ══════════════════════════════════════════════════════
  // UNIT 2 — PRESENT TENSE & FIRST SENTENCES  (Some Exposure / Basic)
  // ══════════════════════════════════════════════════════
  {
    id: 'unit2',
    title: 'Unit 2: Present Tense',
    titleHeb: 'זְמַן הוֹוֶה',
    levelReq: 1,
    color: '#1B5EE0',
    lessons: [
      {
        id: 'u2l1', title: 'Pronouns & Gender', icon: '👤',
        prompt: 'Teach me all Hebrew personal pronouns and explain the gender system. Hebrew has different forms for masculine and feminine "you" and "they" — this is critical to know before verbs. Pronouns: אֲנִי (ani) — I. אַתָּה (atah) — you [m]. אַתְּ (at) — you [f]. הוּא (hu) — he. הִיא (hi) — she. אֲנַחְנוּ (anakhnu) — we. אַתֶּם (atem) — you all [m/mixed]. אַתֶּן (aten) — you all [f only]. הֵם (hem) — they [m/mixed]. הֵן (hen) — they [f only]. Also teach: Hebrew present tense has exactly FOUR forms per verb — masculine singular, feminine singular, masculine plural, feminine plural. NOT one form per pronoun like English.'
      },
      {
        id: 'u2l2', title: 'Pa\'al Present — Core Verbs', icon: '⚡',
        prompt: 'Teach me present tense Pa\'al (פָּעַל) verbs — the most common verb pattern. Show all FOUR forms for each verb. Start with the root pattern using לָלֶכֶת (to go/walk): הוֹלֵךְ (holekh) — he/I[m]/you[m] go. הוֹלֶכֶת (holekhet) — she/I[f]/you[f] goes. הוֹלְכִים (holkhim) — they[m]/we/you-all[m] go. הוֹלְכוֹת (holkhot) — they[f]/we[f]/you-all[f] go. Then teach these verbs with all four forms: לִכְתֹּב (to write): כּוֹתֵב/כּוֹתֶבֶת/כּוֹתְבִים/כּוֹתְבוֹת (kotev/kotevet/kotvim/kotvot). לֶאֱכֹל (to eat): אוֹכֵל/אוֹכֶלֶת/אוֹכְלִים/אוֹכְלוֹת (okhel/okhelet/okhlim/okhlot). לִשְׁתּוֹת (to drink): שׁוֹתֶה/שׁוֹתָה/שׁוֹתִים/שׁוֹתוֹת (shoteh/shotah/shotim/shotot). לִרְאוֹת (to see): רוֹאֶה/רוֹאָה/רוֹאִים/רוֹאוֹת (ro\'eh/ro\'ah/ro\'im/ro\'ot). לִשְׁמֹעַ (to hear): שׁוֹמֵעַ/שׁוֹמַעַת/שׁוֹמְעִים/שׁוֹמְעוֹת (shome\'a/shoma\'at/shom\'im/shom\'ot).'
      },
      {
        id: 'u2l3', title: 'More Pa\'al Verbs', icon: '🏃',
        prompt: 'Teach me more essential Pa\'al present-tense verbs with all four forms (MS/FS/MP/FP): לָרוּץ (to run): רָץ/רָצָה/רָצִים/רָצוֹת (rats/ratsa/ratsim/ratsot). לַעֲשׂוֹת (to do/make): עוֹשֶׂה/עוֹשָׂה/עוֹשִׂים/עוֹשׂוֹת (oseh/osah/osim/osot) — note שׂ is sin not shin. לָדַעַת (to know): יוֹדֵעַ/יוֹדַעַת/יוֹדְעִים/יוֹדְעוֹת (yode\'a/yoda\'at/yod\'im/yod\'ot). לַחְשֹׁב (to think): חוֹשֵׁב/חוֹשֶׁבֶת/חוֹשְׁבִים/חוֹשְׁבוֹת (khoshev/khoshevet/khoshvim/khoshvot). לִגּוּר (to live/reside): גָּר/גָּרָה/גָּרִים/גָּרוֹת (gar/gara/garim/garot). Then Pi\'el: לְדַבֵּר (to speak): מְדַבֵּר/מְדַבֶּרֶת/מְדַבְּרִים/מְדַבְּרוֹת (medaber/medaberet/medabrim/medabrot) — note the מ prefix signals Pi\'el binyan, not Pa\'al.'
      },
      {
        id: 'u2l4', title: 'Building Sentences', icon: '📝',
        prompt: 'Teach me how Hebrew sentences are built. Key rules: (1) Hebrew sentence order is often Subject-Verb-Object but is flexible. (2) Adjectives come AFTER the noun: בַּיִת גָּדוֹל (bayit gadol — a big house). (3) Hebrew has NO "to be" verb in present tense: אֲנִי תַּלְמִיד (ani talmid — I [am] a student). (4) The definite article is הַ (ha-) attached to the noun: הַבַּיִת (habayit — the house). With a definite adjective BOTH take הַ: הַבַּיִת הַגָּדוֹל (habayit hagadol — the big house). Build simple sentences with me using: אֲנִי אוֹכֵל לֶחֶם (ani okhel lekhem — I eat bread [m]). הִיא שׁוֹתָה מַיִם (hi shotah mayim — she drinks water). הַיֶּלֶד הַקָּטָן רָץ (hayeled hakatan rats — the small boy runs).'
      },
      {
        id: 'u2l5', title: 'Question Words', icon: '❓',
        prompt: 'Teach me Hebrew question words and how to form questions. No inversion needed — just add the question word at the start: מָה (ma) — what? מִי (mi) — who? אֵיפֹה (eifo) — where? מָתַי (matai) — when? לָמָּה (lama) — why? אֵיךְ (ekh) — how? כַּמָּה (kama) — how much/many? אֵיזֶה (eize, m) / אֵיזוֹ (eizo, f) — which? Practice questions: מָה אַתָּה אוֹכֵל? (ma atah okhel? — what are you eating?). אֵיפֹה הַשֵּׁרוּתִים? (eifo hasherutim? — where is the bathroom?). כַּמָּה זֶה עוֹלֶה? (kama ze ole? — how much does this cost?). מִי אַתָּה? (mi atah? — who are you?). לָמָּה? (lama? — why?).'
      },
      {
        id: 'u2l6', title: 'Food & Daily Life', icon: '🥙',
        prompt: 'Teach me Hebrew vocabulary for food and daily objects with their gender. All nouns must be taught with their gender: לֶחֶם (lekhem, m) — bread. מַיִם (mayim, m, always plural!) — water. חָלָב (khalav, m) — milk. בֵּיצָה (beytsa, f) → pl. בֵּיצִים (beytsim, irregular m pl!) — egg. תַּפּוּחַ (tapuakh, m) → pl. תַּפּוּחִים (tapukhim) — apple. עַגְבָנִיָּה (agvaniya, f) → pl. עַגְבָנִיּוֹת (agvaniyot) — tomato. בָּשָׂר (basar, m) — meat. דָּג (dag, m) → pl. דָּגִים (dagim) — fish. גְּבִינָה (gvina, f) — cheese. תֵּה (te, m) — tea. קָפֶה (kafe, m) — coffee. מִסְעָדָה (mis\'ada, f) — restaurant. שׁוּק (shuk, m) — market. Practice ordering: אֲנִי רוֹצֶה קָפֶה בְּבַקָּשָׁה (ani rotse kafe bevakasha — I want coffee please [said by a male]).'
      }
    ]
  },

  // ══════════════════════════════════════════════════════
  // UNIT 3 — PAST & FUTURE TENSE  (Intermediate)
  // ══════════════════════════════════════════════════════
  {
    id: 'unit3',
    title: 'Unit 3: Past & Future',
    titleHeb: 'עָבָר וְעָתִיד',
    levelReq: 3,
    color: '#8B4513',
    lessons: [
      {
        id: 'u3l1', title: 'Pa\'al Past Tense', icon: '⏪',
        prompt: 'Teach me the complete Pa\'al past tense (עָבַר — avar) paradigm. Past tense uses SUFFIXES. Teach the full conjugation using root כ-ת-ב (to write) as the model: אֲנִי כָּתַבְתִּי (ani katavti — I wrote). אַתָּה כָּתַבְתָּ (atah katavta — you wrote, m). אַתְּ כָּתַבְתְּ (at katavt — you wrote, f). הוּא כָּתַב (hu katav — he wrote). הִיא כָּתְבָה (hi katva — she wrote). אֲנַחְנוּ כָּתַבְנוּ (anakhnu katavnu — we wrote). אַתֶּם כְּתַבְתֶּם (atem ktavtem — you all wrote, m). אַתֶּן כְּתַבְתֶּן (aten ktavten — you all wrote, f). הֵם/הֵן כָּתְבוּ (hem/hen katvu — they wrote). Then practice with: אָכַל (to eat): אָכַלְתִּי, אָכַלְתָּ... הָלַךְ (to go): הָלַכְתִּי, הָלַכְתָּ...'
      },
      {
        id: 'u3l2', title: 'Pa\'al Future Tense', icon: '⏩',
        prompt: 'Teach me the complete Pa\'al future tense (עָתִיד — atid) paradigm. Future tense uses PREFIXES (opposite of past tense suffixes). Key prefix letters: א (I), ת (you/she), י (he/they m), נ (we). Teach the full conjugation using root כ-ת-ב: אֲנִי אֶכְתֹּב (ani ekhtov — I will write). אַתָּה תִּכְתֹּב (atah tikhtov — you will write, m). אַתְּ תִּכְתְּבִי (at tikhtevi — you will write, f). הוּא יִכְתֹּב (hu yikhtov — he will write). הִיא תִּכְתֹּב (hi tikhtov — she will write). אֲנַחְנוּ נִכְתֹּב (anakhnu nikhtov — we will write). אַתֶּם תִּכְתְּבוּ (atem tikhtvu — you all will write, m). אַתֶּן תִּכְתֹּבְנָה (aten tikhtovnah — you all will write, f). הֵם יִכְתְּבוּ (hem yikhtvu — they will write, m). הֵן תִּכְתֹּבְנָה (hen tikhtovnah — they will write, f). Also: future tense expresses polite commands — תִּכְתֹּב (tikhtov) = "write" [polite request].'
      },
      {
        id: 'u3l3', title: 'Adjective Agreement', icon: '🌈',
        prompt: 'Teach me the complete Hebrew adjective agreement system — four forms for every adjective (MS, FS, MP, FP). The adjective must agree with its noun in gender AND number AND definiteness. Pattern for גָּדוֹל (big): גָּדוֹל (gadol) — m.sg. גְּדוֹלָה (gdola) — f.sg. גְּדוֹלִים (gdolim) — m.pl. גְּדוֹלוֹת (gdolot) — f.pl. Teach these adjectives with all four forms: טוֹב/טוֹבָה/טוֹבִים/טוֹבוֹת (tov/tova/tovim/tovot) — good. רַע/רָעָה/רָעִים/רָעוֹת (ra/ra\'a/ra\'im/ra\'ot) — bad. יָפֶה/יָפָה/יָפִים/יָפוֹת (yafe/yafa/yafim/yafot) — beautiful. חָדָשׁ/חֲדָשָׁה/חֲדָשִׁים/חֲדָשׁוֹת (khadash/khadasha/khadashim/khadashot) — new. יָשָׁן/יְשָׁנָה/יְשָׁנִים/יְשָׁנוֹת (yashan/yeshana/yeshanim/yeshanot) — old. DEFINITENESS RULE: הַסֵּפֶר הַחָדָשׁ (hasefer hakhadash — THE new book) — BOTH noun and adjective take הַ.'
      },
      {
        id: 'u3l4', title: 'Days, Time & Calendar', icon: '📅',
        prompt: 'Teach me Hebrew days of the week — they are numbered, not named after gods. יוֹם רִאשׁוֹן (yom rishon — Sunday, lit. first day). יוֹם שֵׁנִי (yom sheni — Monday, 2nd day). יוֹם שְׁלִישִׁי (yom shlishi — Tuesday, 3rd day). יוֹם רְבִיעִי (yom revi\'i — Wednesday, 4th day). יוֹם חֲמִישִׁי (yom khamishi — Thursday, 5th day). יוֹם שִׁשִּׁי (yom shishi — Friday, 6th day). שַׁבָּת (Shabbat — Saturday, the Sabbath). Time words: הַיּוֹם (hayom) — today. מָחָר (makhar) — tomorrow. אֶתְמוֹל (etmol) — yesterday. עַכְשָׁו (akhshav) — now. אַחַר כָּךְ (akhar kakh) — later. בְּקָרוֹב (bekarov) — soon. שָׁנָה (shanah, f) — year. חֹדֶשׁ (khodesh, m) — month. שָׁבוּעַ (shavua, m) — week. יוֹם (yom, m) — day. שָׁעָה (sha\'ah, f) — hour.'
      },
      {
        id: 'u3l5', title: 'Negation & Complex Questions', icon: '🚫',
        prompt: 'Teach me the THREE negation words in Hebrew — using the wrong one is a common error: לֹא (lo) — "not" for present and past verbs: אֲנִי לֹא הוֹלֵךְ (ani lo holekh — I\'m not going). אֵין (ein) — "there is no / I don\'t have": אֵין לִי כֶּסֶף (ein li kesef — I have no money / I don\'t have money). אַל (al) — "don\'t!" with future tense ONLY, for negative commands: אַל תֵּלֵךְ (al telekh — don\'t go!). Also teach possession: יֵשׁ לִי (yesh li — I have, lit: there is to me). יֵשׁ לְךָ (yesh lekha — you have, m). אֵין לָהּ (ein lah — she doesn\'t have). Practice: יֵשׁ לִי שְׁאֵלָה (yesh li she\'ela — I have a question). אֵין לִי זְמַן (ein li zman — I don\'t have time). אַל תִּדְאַג (al tidag — don\'t worry! [to a male]).'
      },
      {
        id: 'u3l6', title: 'Work & School', icon: '💼',
        prompt: 'Teach me Hebrew vocabulary for work and school with gender for every noun: בֵּית סֵפֶר (beit sefer, m) — school [construct state: "house of book"]. מוֹרֶה (moreh, m) / מוֹרָה (mora, f) — teacher. תַּלְמִיד (talmid, m) / תַּלְמִידָה (talmida, f) — student. כִּתָּה (kita, f) — classroom/grade. שִׁיעוּר (shi\'ur, m) — lesson. בֵּגֶד עֲבוֹדָה (beted avoda) — literally "work clothes," but: עֲבוֹדָה (avoda, f) — work/job. מִשְׂרָד (misrad, m) — office. מַחְשֵׁב (makhshev, m) — computer. טֶלֶפוֹן (telefon, m) — phone. מַנְהֵל (manhel, m) / מַנְהֶלֶת (manhelet, f) — manager/principal. כֶּסֶף (kesef, m) — money. Practice: אֲנִי עוֹבֵד בְּמִשְׂרָד (ani oved bemisrad — I work in an office [m]). הִיא מוֹרָה טוֹבָה (hi mora tova — she is a good teacher).'
      }
    ]
  },

  // ══════════════════════════════════════════════════════
  // UNIT 4 — THE BINYANIM  (Advanced)
  // ══════════════════════════════════════════════════════
  {
    id: 'unit4',
    title: 'Unit 4: The Binyanim',
    titleHeb: 'הַבִּנְיָנִים',
    levelReq: 4,
    color: '#6B0AC9',
    lessons: [
      {
        id: 'u4l1', title: 'Pa\'al & Nif\'al', icon: '🏗️',
        prompt: 'Teach me Pa\'al and Nif\'al in depth. PA\'AL (פָּעַל) — basic active voice, the default pattern. Root כ-ת-ב: past כָּתַב (katav), present כּוֹתֵב (kotev), future יִכְתֹּב (yikhtov), infinitive לִכְתֹּב (likhtov). NIF\'AL (נִפְעַל) — passive or reflexive, for things that happen TO something or by themselves. Signal: נ prefix in past, נִ + dagesh in present. Root כ-ת-ב in Nif\'al: past נִכְתַּב (nikhtav — was written). Present מִתְכַּתֵּב (mitkhatev — corresponds [reflexive, letters-related]). Root שׁ-ב-ר: נִשְׁבַּר (nishbar — broke by itself / was broken). Diagnostic: ask "did it happen by itself or to itself?" → likely Nif\'al. Contrast: כָּתַב סֵפֶר (katav sefer — he wrote a book) vs. הַסֵּפֶר נִכְתַּב (hasefer nikhtav — the book was written).'
      },
      {
        id: 'u4l2', title: 'Pi\'el & Pu\'al', icon: '⚙️',
        prompt: 'Teach me Pi\'el and Pu\'al in depth. PI\'EL (פִּיעֵל) — intensive or causative. Signal: middle root letter has dagesh forte (doubled) in past; מ prefix in present. Root ל-מ-ד: לִמֵּד (limed — taught [Pi\'el of to-learn root]). Present: מְלַמֵּד/מְלַמֶּדֶת/מְלַמְּדִים/מְלַמְּדוֹת (melamedˈ/melamˈedet/melamˈdim/melamˈdot). Root ד-ב-ר: דִּבֵּר (diber — spoke). Present: מְדַבֵּר/מְדַבֶּרֶת (medaber/medaberet). Root בּ-ק-ר: בִּקֵּר (biker — visited). Root שׂ-ח-ק: שִׂחֵק (sikhek — played) [שׂ = sin, "s" sound, NOT shin "sh"!]. PU\'AL (פֻּעַל) — passive of Pi\'el. Signal: kubutz under first root letter. Root ל-מ-ד: לֻמַּד (lumad — was taught). Root ד-ב-ר: דֻּבַּר (dubar — was spoken/discussed). Pattern contrast: לִמֵּד (active — he taught) → לֻמַּד (passive — was taught).'
      },
      {
        id: 'u4l3', title: 'Hif\'il, Huf\'al & Hitpa\'el', icon: '🔄',
        prompt: 'Teach me the final three binyanim. HIF\'IL (הִפְעִיל) — causative: making something happen or someone do something. Signal: הִ prefix in past, מַ prefix in present. Root כ-ת-ב: הִכְתִּיב (hiktiv — dictated, caused writing). Root ב-י-נ: הֵבִין (hevin — understood). Root ל-מ-ד: הִלְמִיד (hilmid — taught [different nuance from Pi\'el]). HUF\'AL (הֻפְעַל) — passive of Hif\'il. Signal: שׁוּרוּק under first root letter + ה prefix. Root כ-ת-ב: הוּכְתַּב (huktav — was dictated). HITPA\'EL (הִתְפַּעֵל) — reflexive or reciprocal. Signal: הִתְ prefix in past, מִתְ in present. Root ל-ב-שׁ: הִתְלַבֵּשׁ (hitlabesh — got dressed [dressed oneself]). Root ר-ח-צ: הִתְרַחֵץ (hitrakhets — washed oneself). Root פ-ל-ל: הִתְפַּלֵּל (hitpalel — prayed [lit: judged oneself]). Root נ-ה-ג: הִתְנַהֵג (hitnaheg — behaved). Diagnostic: if the action reflects back on the subject → Hitpa\'el.'
      },
      {
        id: 'u4l4', title: 'Construct State — סְמִיכוּת', icon: '🔗',
        prompt: 'Teach me the Hebrew construct state (סְמִיכוּת — smiikhut) — the grammatical chain that links two nouns. The first noun modifies into a special "construct" form. Rules: (1) The first noun loses its definite article and often changes vowels. (2) No word "of" is needed — the two nouns connect directly. (3) Only the SECOND noun can take the definite article הַ. Examples: בֵּית סֵפֶר (beit sefer — school, lit: "house of book"). בֵּית כְּנֶסֶת (beit knesset — synagogue, lit: "house of gathering"). יַד הַמֶּלֶךְ (yad hamelekh — the hand of the king). פָּרָשַׁת הַשָּׁבוּעַ (parashat hashavua — the Torah portion of the week). Masculine construct forms: בַּיִת → בֵּית. סֵפֶר → סִפְרֵי. Feminine construct forms usually drop the ה-: שָׁנָה → שְׁנַת. מִשְׁפָּחָה → מִשְׁפַּחַת. Practice: מִשְׁפַּחַת כֹּהֵן (mishpakhat kohen — the Cohen family). שְׁנַת הַלִּימּוּדִים (shnat halimudim — the school year).'
      },
      {
        id: 'u4l5', title: 'Complex Sentences', icon: '📜',
        prompt: 'Teach me complex Hebrew sentence structures. RELATIVE CLAUSES with שֶׁ-: הָאִישׁ שֶׁדִּבֵּר (ha\'ish shediber — the man who spoke). הַסֵּפֶר שֶׁקָּרִיתִי (hasefer shekkarati — the book that I read). CONDITIONAL with אִם...אָז: אִם תִּלְמַד, אָז תַּצְלִיחַ (im tilmad, az tatsliah — if you study, you will succeed). BECAUSE with כִּי: אֲנִי לוֹמֵד עִבְרִית כִּי אוֹהֵב אֶת יִשְׂרָאֵל (ani lomed ivrit ki ohev et Yisrael — I study Hebrew because I love Israel). PURPOSE with כְּדֵי ל-: אֲנִי לוֹמֵד כְּדֵי לִהְיוֹת שׁוֹטֵף (ani lomed kedei lihyot shote\'f — I study in order to be fluent). ALTHOUGH with אַף עַל פִּי שֶׁ-: אַף עַל פִּי שֶׁקָּשֶׁה, אֲנִי נֶהֱנֶה (af al pi shekashe, ani neheneh — although it is hard, I enjoy it).'
      },
      {
        id: 'u4l6', title: 'Mastery Challenge', icon: '🏆',
        prompt: 'Give me a comprehensive Hebrew mastery challenge. Include: (1) Identify the binyan and translate 5 conjugated verbs I haven\'t seen before. (2) Build 3 sentences using construct state (smiikhut). (3) Conjugate one verb fully in all three tenses (past, present, future) and all persons. (4) Correct the grammar errors in 3 sentences I will give you. (5) Read and explain a short paragraph of real Israeli Hebrew. Make it genuinely challenging — treat me as an advanced student ready for near-fluency.'
      }
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

// API key management removed — keys are server-side only

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

  board.setAttribute('dir', 'rtl');
  for (var row = 0; row < 6; row++) {
    html += '<div class="wl-row" id="wl-row-' + row + '" dir="rtl">';
    var guess = state.guesses[row];
    if (guess) {
      var g      = _wlNorm(guess);
      var colors = _wlEval(g, target);
      for (var col = 0; col < 5; col++) {
        html += '<div class="wl-tile wl-' + colors[col] + ' wl-filled" style="animation-delay:' + (col*0.12) + 's" dir="rtl">' + guess[col] + '</div>';
      }
    } else if (row === state.guesses.length && !state.won && !state.lost) {
      for (var col = 0; col < 5; col++) {
        var letter = _wlCurrent[col] || '';
        html += '<div class="wl-tile' + (letter ? ' wl-active' : '') + '" dir="rtl">' + letter + '</div>';
      }
    } else {
      for (var col = 0; col < 5; col++) {
        html += '<div class="wl-tile" dir="rtl"></div>';
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
  kb.setAttribute('dir', 'rtl');
  var colors = _wlKeyColors();
  var rows = [
    ['א','ב','ג','ד','ה','ו','ז','ח','ט'],
    ['י','כ','ל','מ','נ','ס','ע','פ','צ'],
    ['ק','ר','ש','ת','ך','ם','ן','ף','ץ'],
    ['ENTER','⌫'],
  ];
  var html = '';
  rows.forEach(function(row) {
    html += '<div class="wl-kb-row" dir="rtl">';
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
  // Use onboarding level, not points — so word difficulty matches what was chosen at setup
  var lvl = (state.userProfile && state.userProfile.level) || 'complete_beginner';
  if (lvl === 'advanced')                          return 3;
  if (lvl === 'intermediate' || lvl === 'basic')   return 2;
  return 1; // complete_beginner, some_exposure
}

function _usBuildRound() {
  var level    = _usGetLevel();
  // Never show level-1 (beginner) words to intermediate or advanced students
  var minLevel = level >= 2 ? 2 : 1;

  // Pull from student's learned words — always include these regardless of level
  var learned = (state.progress.wordsLearned || [])
    .filter(function(w) { return w.hebrew && w.english && _usNorm(w.hebrew).length >= 3; })
    .map(function(w) {
      var b = _usNorm(w.hebrew);
      return { base: b, display: w.hebrew, english: w.english, level: b.length <= 4 ? 1 : b.length <= 5 ? 2 : 3 };
    });

  // Pool from curated list — respect both min and max level
  var pool = US_WORDS.filter(function(w) { return w.level >= minLevel && w.level <= level; });

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
//  MATCH IT GAME
// ═══════════════════════════════════════════════════════════════════════════

var mi = {
  pool: [], words: [], cards: [],   // cards = flat shuffled list of {type,wordIdx,rot,sizeClass}
  matched: {}, selectedHeb: -1,
  round: 1, score: 0, totalAwarded: 0,
  startTime: 0, elapsed: 0,
  timerInterval: null, timeLeft: 0, timeLimit: 0,
  pairs: 6, wrongCount: 0
};

// Round config: { pairs, timeLimit (seconds, 0=none) }
var MI_ROUNDS = [
  { pairs: 6,  timeLimit: 0  },
  { pairs: 8,  timeLimit: 90 },
  { pairs: 10, timeLimit: 60 },
  { pairs: 10, timeLimit: 45 }
];

function showMIGame() {
  var el = document.getElementById('matchit-overlay');
  if (!el) return;
  if (mi.pool.length < 4) mi.pool = buildSRPool();
  if (mi.pool.length < 4) {
    showToast('Learn a few words first — then match them! 📖', 3500);
    return;
  }
  mi.round = 1; mi.score = 0; mi.totalAwarded = 0;
  el.classList.remove('mi-gone'); el.classList.add('mi-visible');
  _miStartRound();
}

function hideMIGame() {
  var el = document.getElementById('matchit-overlay');
  if (el) { el.classList.remove('mi-visible'); el.classList.add('mi-gone'); }
  _miClearTimer();
}

function _miCfg() { return MI_ROUNDS[Math.min(mi.round - 1, MI_ROUNDS.length - 1)]; }

function _miStartRound() {
  var cfg = _miCfg();
  mi.pairs     = Math.min(cfg.pairs, mi.pool.length);
  mi.timeLimit = cfg.timeLimit;
  mi.timeLeft  = cfg.timeLimit;
  mi.matched   = {}; mi.selectedHeb = -1; mi.wrongCount = 0;
  mi.startTime = Date.now(); mi.elapsed = 0;

  // Pick words, build a flat shuffled card list (Hebrew + English mixed together)
  var pool = shuffle(mi.pool.slice());
  mi.words = pool.slice(0, mi.pairs);
  mi.cards = _miBuildCards(mi.words);

  // Header
  var rb = document.getElementById('mi-round-badge');
  if (rb) rb.textContent = 'Round ' + mi.round;
  _miUpdateScore();

  // Timer bar
  _miClearTimer();
  var tw = document.getElementById('mi-timer-wrap');
  if (tw) {
    if (mi.timeLimit > 0) {
      tw.style.display = 'flex';
      _miUpdateTimerBar();
      mi.timerInterval = setInterval(_miTick, 1000);
    } else {
      tw.style.display = 'none';
    }
  }

  // Show board, hide results
  var body = document.getElementById('mi-body');
  var res  = document.getElementById('mi-results');
  if (body) body.style.display = '';
  if (res)  res.style.display  = 'none';

  _miRender();
}

function _miClearTimer() {
  if (mi.timerInterval) { clearInterval(mi.timerInterval); mi.timerInterval = null; }
}

function _miTick() {
  mi.timeLeft = Math.max(0, mi.timeLeft - 1);
  _miUpdateTimerBar();
  if (mi.timeLeft <= 0) { _miClearTimer(); _miShowResults(true); }
}

function _miUpdateTimerBar() {
  var numEl = document.getElementById('mi-timer-num');
  var barEl = document.getElementById('mi-timer-bar');
  if (numEl) numEl.textContent = mi.timeLeft;
  if (barEl) {
    var pct = mi.timeLimit > 0 ? (mi.timeLeft / mi.timeLimit) * 100 : 100;
    barEl.style.width = pct + '%';
    barEl.className = 'mi-timer-bar' + (pct <= 20 ? ' mi-danger' : pct <= 40 ? ' mi-warning' : '');
  }
}

function _miUpdateScore() {
  var el = document.getElementById('mi-score-badge');
  if (el) el.textContent = mi.score + ' pts';
}

// ── Card size class based on text length ─────────────────────────────────
function _miSizeClass(text) {
  var n = (text || '').length;
  if (n <= 5)  return 'mi-sz-s';   // short  — big font
  if (n <= 12) return 'mi-sz-m';   // medium — normal
  return 'mi-sz-l';                 // long   — smaller font, wraps
}

// ── Build the flat mixed card list with stable random rotations per round ─
function _miBuildCards(words) {
  var cards = [];
  words.forEach(function(w, idx) {
    var rotH = +(Math.random() * 6 - 3).toFixed(1);  // -3 to +3 deg
    var rotE = +(Math.random() * 6 - 3).toFixed(1);
    cards.push({ type: 'heb', wordIdx: idx, rot: rotH, sz: _miSizeClass(w.hebrew) });
    cards.push({ type: 'eng', wordIdx: idx, rot: rotE, sz: _miSizeClass(w.english) });
  });
  return shuffle(cards);
}

// ── Render all cards into the single mixed grid ───────────────────────────
function _miRender() {
  var grid = document.getElementById('mi-grid');
  if (!grid) return;

  // Update hint text based on selection state
  var hintEl = document.getElementById('mi-hint');
  if (hintEl) {
    hintEl.textContent = mi.selectedHeb === -1
      ? 'Tap a Hebrew word, then tap its English match'
      : 'Now tap the English meaning — or tap another Hebrew word';
  }

  grid.innerHTML = mi.cards.map(function(card) {
    var w        = mi.words[card.wordIdx];
    var matched  = !!mi.matched[card.wordIdx];
    var selected = card.type === 'heb' && mi.selectedHeb === card.wordIdx;
    var cls = 'mi-card mi-card-' + card.type + ' ' + card.sz +
      (matched  ? ' mi-matched'  : '') +
      (selected ? ' mi-selected' : '');

    // Stable visual transform: rotation is fixed per-round (stored in card obj)
    // Matched cards lose the rotation to snap cleanly into place
    var rot = matched ? 0 : card.rot;
    var style = 'transform:rotate(' + rot + 'deg);';

    var click = matched ? '' :
      'onclick="' + (card.type === 'heb' ? 'miSelHeb' : 'miSelEng') + '(' + card.wordIdx + ')"';

    var inner = card.type === 'heb'
      ? '<span class="mi-heb">' + escapeHtml(w.hebrew) + '</span>'
      : '<span class="mi-eng-text">' + escapeHtml(w.english) + '</span>';

    return '<button class="' + cls + '" ' + click +
      ' data-idx="' + card.wordIdx + '" data-type="' + card.type + '"' +
      ' style="' + style + '">' +
      inner + (matched ? '<span class="mi-check">✓</span>' : '') +
      '</button>';
  }).join('');
}

function miSelHeb(wordIdx) {
  if (mi.matched[wordIdx]) return;
  mi.selectedHeb = (mi.selectedHeb === wordIdx) ? -1 : wordIdx;
  _miRender();
}

function miSelEng(wordIdx) {
  if (mi.matched[wordIdx]) return;
  if (mi.selectedHeb === -1) { showToast('Tap a Hebrew word first! 🇮🇱'); return; }
  var hIdx = mi.selectedHeb;
  if (hIdx === wordIdx) { _miCorrect(hIdx); } else { _miWrong(hIdx, wordIdx); }
}

function _miCorrect(idx) {
  mi.matched[idx] = true;
  mi.selectedHeb  = -1;
  var pts = 10 * mi.round;
  mi.score += pts;
  _miUpdateScore();
  _miFlash(idx, 'heb', 'mi-flash-correct');
  _miFlash(idx, 'eng', 'mi-flash-correct');
  showPointsPop(pts);
  setTimeout(function() {
    _miRender();
    if (Object.keys(mi.matched).length >= mi.pairs) setTimeout(_miRoundComplete, 420);
  }, 520);
}

function _miWrong(hIdx, eIdx) {
  mi.wrongCount++;
  mi.score = Math.max(0, mi.score - 2);
  _miUpdateScore();
  _miFlash(hIdx, 'heb', 'mi-flash-wrong');
  _miFlash(eIdx, 'eng', 'mi-flash-wrong');
  setTimeout(function() { mi.selectedHeb = -1; _miRender(); }, 700);
}

function _miFlash(wordIdx, type, cls) {
  var grid = document.getElementById('mi-grid');
  if (!grid) return;
  // Find the card with matching wordIdx AND type in the flat grid
  var card = grid.querySelector('[data-idx="' + wordIdx + '"][data-type="' + type + '"]');
  if (!card) return;
  card.classList.add(cls);
  setTimeout(function() { card.classList.remove(cls); }, 650);
}

function _miRoundComplete() {
  _miClearTimer();
  mi.elapsed = Math.round((Date.now() - mi.startTime) / 1000);

  // Time bonus: up to 50% extra based on time remaining
  var timeBonus = 0;
  if (mi.timeLimit > 0 && mi.timeLeft > 0) {
    timeBonus = Math.round((mi.timeLeft / mi.timeLimit) * mi.pairs * 4);
    mi.score += timeBonus;
  }

  // Award points to progress
  var toAward = mi.score - mi.totalAwarded;
  if (toAward > 0) {
    state.progress.points += toAward;
    mi.totalAwarded = mi.score;
    updateStats(); saveProgress();
    showPointsPop(toAward);
  }

  triggerCelebration();
  _miShowResults(false, timeBonus);
}

function _miShowResults(timedOut, timeBonus) {
  _miClearTimer();
  var body = document.getElementById('mi-body');
  var res  = document.getElementById('mi-results');
  if (body) body.style.display = 'none';
  if (!res) return;

  var matched = Object.keys(mi.matched).length;
  var timeStr  = mi.elapsed > 0
    ? (mi.elapsed < 60 ? mi.elapsed + 's' : Math.floor(mi.elapsed / 60) + 'm ' + (mi.elapsed % 60) + 's')
    : '—';
  var emoji, msg;
  if (timedOut) {
    emoji = '⏰';
    msg = matched >= mi.pairs ? 'Beat the clock!' : matched + '/' + mi.pairs + ' matched — so close!';
  } else if (mi.wrongCount === 0) {
    emoji = '🔥'; msg = 'Perfect round! Zero mistakes — sababa!';
  } else {
    emoji = '⭐'; msg = 'All matched!' + (mi.wrongCount > 0 ? ' ' + mi.wrongCount + ' wrong turn' + (mi.wrongCount > 1 ? 's' : '') + '.' : '');
  }

  // Next round availability
  var nextCfg = MI_ROUNDS[Math.min(mi.round, MI_ROUNDS.length - 1)];
  var canNext  = !timedOut && mi.pool.length >= nextCfg.pairs;

  res.style.display = 'flex';
  res.innerHTML =
    '<div class="mi-res-emoji">' + emoji + '</div>' +
    '<div class="mi-res-msg">' + msg + '</div>' +
    '<div class="mi-res-stats">' +
      '<div class="mi-res-stat"><div class="mi-res-val">' + matched + '/' + mi.pairs + '</div><div class="mi-res-lbl">Matched</div></div>' +
      '<div class="mi-res-stat"><div class="mi-res-val">' + mi.score + '</div><div class="mi-res-lbl">Points</div></div>' +
      '<div class="mi-res-stat"><div class="mi-res-val">' + timeStr + '</div><div class="mi-res-lbl">Time</div></div>' +
      (timeBonus > 0 ? '<div class="mi-res-stat"><div class="mi-res-val">+' + timeBonus + '</div><div class="mi-res-lbl">Speed bonus</div></div>' : '') +
    '</div>' +
    (canNext ?
      '<button class="mi-next-btn" onclick="_miNextRound()">Round ' + (mi.round + 1) + ' →</button>'
      : '') +
    '<button class="mi-again-btn" onclick="_miStartRound()">↩ Play Again</button>' +
    '<button class="mi-done-btn" onclick="hideMIGame()">Done</button>';
}

function _miNextRound() { mi.round++; _miStartRound(); }

// ▲▲▲  END MATCH IT  ▲▲▲

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

// ═══════════════════════════════════════════════════════════════════════════
//  DAILY STRUCTURED LESSON SYSTEM — v6.0
//  Spaced repetition: Session 1 (intro) → Session 2 (+1d review) →
//  Session 3 (+1d quiz) → Session 4 (+4d mastery check → MASTERED)
// ═══════════════════════════════════════════════════════════════════════════

var DAILY_CONCEPTS = {
  complete_beginner: [
    { id:'aleph_bet_1',      title:'Hebrew Alphabet — א to י',       heb:'האלפבית א–י',      tags:['alphabet','reading'] },
    { id:'aleph_bet_2',      title:'Hebrew Alphabet — כ to ת',       heb:'האלפבית כ–ת',      tags:['alphabet','reading'] },
    { id:'greetings_basic',  title:'Essential Greetings',             heb:'ברכות',             tags:['greetings','vocabulary'] },
    { id:'numbers_1_10',     title:'Numbers 1–10',                    heb:'מספרים 1–10',       tags:['numbers'] },
    { id:'colors_basic',     title:'Colors in Hebrew',                heb:'צבעים',             tags:['vocabulary'] },
    { id:'family_members',   title:'Family Members',                  heb:'משפחה',             tags:['vocabulary','nouns'] },
    { id:'basic_verbs',      title:'First Hebrew Verbs',              heb:'פעלים בסיסיים',    tags:['verbs'] },
    { id:'days_week',        title:'Days of the Week',                heb:'ימות השבוע',        tags:['vocabulary','time'] },
    { id:'body_parts',       title:'Body Parts',                      heb:'חלקי הגוף',        tags:['vocabulary'] },
    { id:'food_basics',      title:'Food & Drinks',                   heb:'אוכל ושתייה',       tags:['vocabulary'] },
  ],
  some_exposure: [
    { id:'gender_nouns',     title:'Masculine & Feminine Nouns',     heb:'זכר ונקבה',         tags:['grammar','nouns'] },
    { id:'definite_article', title:'The Definite Article — ה',       heb:'ה הידיעה',          tags:['grammar'] },
    { id:'present_tense',    title:'Present Tense Verbs',             heb:'הווה',              tags:['verbs','grammar'] },
    { id:'adjectives_agree', title:'Adjectives & Agreement',          heb:'שמות תואר',         tags:['grammar'] },
    { id:'plural_nouns',     title:'Plural Nouns',                    heb:'רבים',              tags:['grammar','nouns'] },
    { id:'question_words',   title:'Question Words',                  heb:'מילות שאלה',        tags:['grammar','conversation'] },
    { id:'numbers_11_100',   title:'Numbers 11–100',                  heb:'מספרים 11–100',     tags:['numbers'] },
    { id:'basic_sentences',  title:'Building Basic Sentences',        heb:'משפטים בסיסיים',   tags:['grammar','conversation'] },
    { id:'prepositions_1',   title:'Prepositions — in, on, from',    heb:'מילות יחס',         tags:['grammar'] },
    { id:'daily_phrases',    title:'Everyday Phrases',                heb:'ביטויים יומיומיים',  tags:['conversation'] },
  ],
  basic: [
    { id:'past_tense',       title:'Past Tense — Pa\'al',             heb:'עבר',               tags:['verbs','grammar'] },
    { id:'future_tense',     title:'Future Tense — Pa\'al',           heb:'עתיד',              tags:['verbs','grammar'] },
    { id:'pronouns',         title:'Personal Pronouns',               heb:'כינויי גוף',        tags:['grammar'] },
    { id:'possessives',      title:'Possessive Pronouns',             heb:'כינויי שייכות',     tags:['grammar'] },
    { id:'negation',         title:'Negation — לא, אין, אל',         heb:'שלילה',             tags:['grammar'] },
    { id:'construct_state',  title:'Construct State (Smichut)',       heb:'סמיכות',            tags:['grammar'] },
    { id:'shoresh_intro',    title:'The Hebrew Root System',          heb:'שורש',              tags:['grammar','etymology'] },
    { id:'prayer_vocab_1',   title:'Prayer Vocabulary — Part 1',     heb:'מילות תפילה',       tags:['prayer','vocabulary'] },
    { id:'time_expressions', title:'Time Expressions',                heb:'ביטויי זמן',        tags:['vocabulary'] },
    { id:'conversation_1',   title:'Real Conversation Phrases',       heb:'שיחה',              tags:['conversation'] },
  ],
  intermediate: [
    { id:'binyan_paal',      title:'The Pa\'al Binyan — Deep Dive',  heb:'בניין פעל',         tags:['grammar','binyanim'] },
    { id:'binyan_piel',      title:'The Pi\'el Binyan',               heb:'בניין פיעל',        tags:['grammar','binyanim'] },
    { id:'binyan_hifil',     title:'The Hif\'il Binyan',              heb:'בניין הפעיל',       tags:['grammar','binyanim'] },
    { id:'binyan_nifal',     title:'The Nif\'al (Passive)',           heb:'בניין נפעל',        tags:['grammar','binyanim'] },
    { id:'relative_clauses', title:'Relative Clauses — ש׳, אשר',    heb:'משפטי זיקה',        tags:['grammar'] },
    { id:'idioms_1',         title:'Common Hebrew Idioms',            heb:'ביטויים',           tags:['vocabulary','culture'] },
    { id:'newspaper_hebrew', title:'Reading Israeli News',            heb:'עברית עיתונאית',    tags:['reading','vocabulary'] },
    { id:'complex_sentences',title:'Complex Sentence Structures',     heb:'משפטים מורכבים',    tags:['grammar'] },
    { id:'formal_vs_casual', title:'Formal vs. Casual Register',     heb:'פורמלי וסלנג',      tags:['sociolinguistics'] },
    { id:'advanced_vocab',   title:'Advanced Vocabulary Building',   heb:'אוצר מילים',        tags:['vocabulary'] },
  ],
  advanced: [
    { id:'all_binyanim',     title:'All 7 Binyanim Mastery',          heb:'שבעת הבניינים',     tags:['grammar','binyanim'] },
    { id:'biblical_grammar', title:'Biblical Hebrew Grammar',         heb:'דקדוק מקרא',        tags:['grammar','biblical'] },
    { id:'poetry_analysis',  title:'Modern Hebrew Poetry',            heb:'שירה עברית',        tags:['literature'] },
    { id:'literature_modern',title:'Israeli Literature Excerpts',     heb:'ספרות ישראלית',     tags:['reading','culture'] },
    { id:'slang_modern',     title:'Modern Israeli Slang & Culture',  heb:'סלנג ישראלי',       tags:['sociolinguistics'] },
    { id:'formal_writing',   title:'Formal Written Hebrew',           heb:'כתיבה פורמלית',     tags:['writing'] },
    { id:'talmud_phrases',   title:'Talmudic Hebrew & Aramaic',      heb:'ארמית ועברית',      tags:['religious','language'] },
    { id:'roots_advanced',   title:'Advanced Root Analysis',          heb:'ניתוח שורשים',      tags:['etymology','grammar'] },
    { id:'debate_idioms',    title:'Debate & Advanced Idioms',        heb:'ויכוח וביטויים',    tags:['conversation'] },
    { id:'fluency_review',   title:'Full Fluency Review',             heb:'סיכום כולל',        tags:['review'] },
  ]
};

var DAILY_REVIEW_TYPES = {
  1: { label:'New Concept',   color:'#003399', instruction:'first introduction — teach thoroughly from scratch' },
  2: { label:'First Review',  color:'#1B5EE0', instruction:'review yesterday\'s concept and add one new dimension' },
  3: { label:'Quiz Session',  color:'#E67E00', instruction:'quiz heavily on Sessions 1–2, then teach one advanced extension' },
  4: { label:'Mastery Check', color:'#2E8B57', instruction:'full mastery evaluation — test everything from all prior sessions' },
};

// ── State & persistence ────────────────────────────────────
var _dailyLessonActive = false;
var _dailyLessonInfo   = null;

function loadMastery() {
  try { return JSON.parse(localStorage.getItem('kesher_mastery') || '{}'); } catch(e) { return {}; }
}
function saveMastery(m) {
  try { localStorage.setItem('kesher_mastery', JSON.stringify(m)); } catch(e) {}
}
function loadDailyState() {
  try { return JSON.parse(localStorage.getItem('kesher_daily') || 'null'); } catch(e) { return null; }
}
function saveDailyState(d) {
  try { localStorage.setItem('kesher_daily', JSON.stringify(d)); } catch(e) {}
}

// ── Concept list (My Class overrides first) ────────────────
function getDailyConcepts() {
  var level    = (state.userProfile && state.userProfile.level) || 'complete_beginner';
  var base     = DAILY_CONCEPTS[level] || DAILY_CONCEPTS.complete_beginner;
  var myClass  = null;
  try { myClass = JSON.parse(localStorage.getItem('kesher_myclass') || 'null'); } catch(e) {}
  if (!myClass) return base;

  var extras = [];
  if (myClass.parasha) {
    extras.push({ id:'myclass_parasha_' + myClass.parasha.replace(/\W/g,'_'),
      title:'Parasha: ' + myClass.parasha, heb:'פרשת ' + myClass.parasha, tags:['parasha','biblical'], isMyClass:true });
  }
  if (myClass.weeklyFocus) {
    extras.push({ id:'myclass_focus_' + myClass.weeklyFocus.slice(0,20).replace(/\W/g,'_'),
      title:'Class Focus: ' + myClass.weeklyFocus, heb:'מוקד השבוע', tags:['myclass'], isMyClass:true });
  }
  if (myClass.assignedVocab) {
    extras.push({ id:'myclass_vocab_' + myClass.assignedVocab.slice(0,20).replace(/\W/g,'_'),
      title:'Assigned Vocabulary', heb:'מילות שיעור', tags:['vocabulary','myclass'], isMyClass:true });
  }
  return extras.concat(base);
}

// ── Spaced repetition: pick today's concept ────────────────
function computeTodayLesson() {
  if (!state.userProfile) return null;

  var today   = new Date().toDateString();
  var todayMs = new Date().setHours(0,0,0,0);
  var mastery  = loadMastery();
  var concepts = getDailyConcepts();

  // Return existing daily state if already set for today
  var existing = loadDailyState();
  if (existing && existing.date === today) {
    var concept = concepts.find(function(c) { return c.id === existing.conceptId; })
      || { id:existing.conceptId, title:existing.conceptTitle||existing.conceptId, heb:'', tags:[] };
    return { concept:concept, reviewSession:existing.reviewSession||1, dailyState:existing };
  }

  // Find concept due for spaced repetition review
  var todayConcept = null, reviewSession = 1;
  for (var i = 0; i < concepts.length; i++) {
    var m = mastery[concepts[i].id];
    if (!m || m.level === 'mastered') continue;
    if (m.nextReviewDate) {
      var dueMs = new Date(m.nextReviewDate).setHours(0,0,0,0);
      if (dueMs <= todayMs) { todayConcept = concepts[i]; reviewSession = (m.sessionCount || 0) + 1; break; }
    }
  }

  // If no review pending, find the next un-introduced concept
  if (!todayConcept) {
    for (var j = 0; j < concepts.length; j++) {
      if (!mastery[concepts[j].id]) { todayConcept = concepts[j]; reviewSession = 1; break; }
    }
  }

  // Fallback: all concepts started but none due — pick first non-mastered
  if (!todayConcept) {
    for (var k = 0; k < concepts.length; k++) {
      var mk = mastery[concepts[k].id];
      if (!mk || mk.level !== 'mastered') {
        todayConcept = concepts[k]; reviewSession = (mk && mk.sessionCount || 0) + 1; break;
      }
    }
  }

  if (!todayConcept) return null;

  var newDaily = {
    date: today, conceptId: todayConcept.id, conceptTitle: todayConcept.title,
    reviewSession: Math.min(reviewSession, 4), status:'pending',
    startedAt:null, completedAt:null, score:null
  };
  saveDailyState(newDaily);
  return { concept:todayConcept, reviewSession:newDaily.reviewSession, dailyState:newDaily };
}

// ── Time available from onboarding ────────────────────────
function getDailyTimeMinutes() {
  var t = state.userProfile && state.userProfile.timeAvailable;
  if (!t) return 15;
  if (t.indexOf('5') === 0 || t === '5 minutes') return 5;
  if (t.indexOf('10') >= 0 || t.indexOf('15') >= 0) return 12;
  if (t.indexOf('20') >= 0 || t.indexOf('30') >= 0) return 25;
  if (t.indexOf('45') >= 0 || t.indexOf('60') >= 0) return 45;
  return 20;
}

// ── Home screen card ──────────────────────────────────────
function renderDailyLessonCard() {
  var card = document.getElementById('daily-lesson-card');
  if (!card) return;

  // New user: has account but hasn't done placement test yet
  if (!state.userProfile) {
    if (currentUser) {
      card.style.display = 'block';
      var titleEl2 = document.getElementById('dlc-title');
      var hebEl2   = document.getElementById('dlc-heb');
      var badgeEl2 = document.getElementById('dlc-badge');
      var sessionEl2 = document.getElementById('dlc-session');
      var timeEl2  = document.getElementById('dlc-time');
      var mastEl2  = document.getElementById('dlc-mastery');
      var startBtn2 = document.getElementById('dlc-start-btn');
      var doneMsg2  = document.getElementById('dlc-done-msg');
      if (badgeEl2)  { badgeEl2.textContent = 'Welcome'; badgeEl2.style.background = '#7C3AED'; }
      if (sessionEl2) sessionEl2.innerHTML = '';
      if (titleEl2)  titleEl2.textContent = 'Start your Hebrew journey with Morah!';
      if (hebEl2)    hebEl2.textContent = 'יַאַלָּה נִלְמַד!';
      if (timeEl2)   timeEl2.textContent = '~5 min';
      if (mastEl2)   mastEl2.textContent = 'Placement test included';
      if (startBtn2) { startBtn2.style.display = 'block'; startBtn2.textContent = 'Start My First Lesson →'; startBtn2.onclick = function() { startOnboarding(); }; }
      if (doneMsg2)  doneMsg2.style.display = 'none';
    } else {
      card.style.display = 'none';
    }
    return;
  }

  var lessonInfo = computeTodayLesson();
  if (!lessonInfo) {
    // Fallback: all concepts mastered — show encouragement
    card.style.display = 'block';
    var tf = document.getElementById('dlc-title');
    var bf = document.getElementById('dlc-badge');
    var sf = document.getElementById('dlc-start-btn');
    var df = document.getElementById('dlc-done-msg');
    if (bf)  { bf.textContent = 'All done!'; bf.style.background = '#059669'; }
    if (tf)  tf.textContent = 'Incredible — you\'ve mastered all concepts at your level!';
    if (sf)  { sf.style.display = 'block'; sf.textContent = 'Keep practicing →'; sf.onclick = function() { continueLearning(); }; }
    if (df)  df.style.display = 'none';
    return;
  }

  var concept     = lessonInfo.concept;
  var session     = lessonInfo.reviewSession;
  var dailyState  = lessonInfo.dailyState;
  var reviewType  = DAILY_REVIEW_TYPES[Math.min(session, 4)] || DAILY_REVIEW_TYPES[1];
  var mastery     = loadMastery();
  var m           = mastery[concept.id];
  var masteryLabel = !m ? 'New concept' : m.level === 'mastered' ? 'Mastered' : m.level === 'practicing' ? 'Practicing' : 'Learning';
  var timeMin     = getDailyTimeMinutes();
  var isCompleted = dailyState && dailyState.status === 'completed';

  var badgeEl   = document.getElementById('dlc-badge');
  var sessionEl = document.getElementById('dlc-session');
  var titleEl   = document.getElementById('dlc-title');
  var hebEl     = document.getElementById('dlc-heb');
  var timeEl    = document.getElementById('dlc-time');
  var mastEl    = document.getElementById('dlc-mastery');
  var startBtn  = document.getElementById('dlc-start-btn');
  var doneMsg   = document.getElementById('dlc-done-msg');

  if (badgeEl)   { badgeEl.textContent = reviewType.label; badgeEl.style.background = reviewType.color; }
  if (sessionEl) {
    var dots = '';
    for (var si = 1; si <= 4; si++) {
      dots += '<span class="dlc-dot' + (si < session ? ' dlc-dot-done' : si === session ? ' dlc-dot-cur' : '') + '"></span>';
    }
    sessionEl.innerHTML = dots + '<span class="dlc-session-txt">Session ' + session + ' of 4</span>';
  }
  if (titleEl)   titleEl.textContent = concept.title;
  if (hebEl)     hebEl.textContent = concept.heb || '';
  if (timeEl)    timeEl.textContent = '~' + timeMin + ' min';
  if (mastEl) {
    mastEl.textContent = masteryLabel;
    var mastColors = { 'New concept':'#6B7280', 'Learning':'#D97706', 'Practicing':'#2563EB', 'Mastered':'#059669' };
    mastEl.style.color = mastColors[masteryLabel] || '#6B7280';
  }

  if (isCompleted) {
    if (startBtn) startBtn.style.display = 'none';
    if (doneMsg) {
      var scoreText = dailyState.score !== null ? ' · ' + dailyState.score + '% score' : '';
      doneMsg.style.display = 'flex';
      doneMsg.innerHTML = '<span class="dlc-done-check">✓</span>Completed today' + scoreText;
    }
  } else {
    if (startBtn) {
      startBtn.style.display = 'block';
      startBtn.textContent = session === 1 ? 'Start Today\'s Lesson →' :
                             session <= 2  ? 'Start Review →' :
                             session === 3 ? 'Start Quiz Session →' :
                                            'Start Mastery Check →';
    }
    if (doneMsg) doneMsg.style.display = 'none';
  }

  card.style.display = 'block';
}

// ── Start daily lesson ────────────────────────────────────
function startDailyLesson() {
  var lessonInfo = computeTodayLesson();
  if (!lessonInfo) { continueLearning(); return; }

  _dailyLessonActive = true;
  _dailyLessonInfo   = lessonInfo;

  var daily = loadDailyState();
  if (daily) { daily.status = 'active'; daily.startedAt = Date.now(); saveDailyState(daily); }

  // Pass daily lesson context to Morah via userProfile
  state.userProfile.dailyLesson = {
    conceptId:     lessonInfo.concept.id,
    conceptTitle:  lessonInfo.concept.title,
    reviewSession: lessonInfo.reviewSession,
    reviewType:    (DAILY_REVIEW_TYPES[Math.min(lessonInfo.reviewSession, 4)] || DAILY_REVIEW_TYPES[1]).instruction,
    timeMinutes:   getDailyTimeMinutes(),
    tags:          lessonInfo.concept.tags || []
  };

  showScreen('screen-lesson');
  setupLessonScreen();
  updateUserBadges();
  showDailyLessonBanner(lessonInfo);
  startLesson();
}

// ── Daily lesson banner in chat ───────────────────────────
function showDailyLessonBanner(lessonInfo) {
  var banner  = document.getElementById('daily-lesson-banner');
  if (!banner) return;
  var rt = DAILY_REVIEW_TYPES[Math.min(lessonInfo.reviewSession, 4)] || DAILY_REVIEW_TYPES[1];
  var lbl = document.getElementById('dlb-label');
  var cpt = document.getElementById('dlb-concept');
  var ses = document.getElementById('dlb-session');
  if (lbl) { lbl.textContent = rt.label; lbl.style.background = rt.color; }
  if (cpt) cpt.textContent = lessonInfo.concept.title;
  if (ses) ses.textContent = 'Session ' + lessonInfo.reviewSession + ' of 4';
  banner.style.display = 'flex';
}

function hideDailyLessonBanner() {
  var banner = document.getElementById('daily-lesson-banner');
  if (banner) banner.style.display = 'none';
}

// ── Complete daily lesson ─────────────────────────────────
function completeDailyLesson() {
  if (!_dailyLessonActive) return;

  var total = state.session.totalCorrect + state.session.totalWrong;
  var score = total > 0 ? Math.round((state.session.totalCorrect / total) * 100) : 0;

  var daily = loadDailyState();
  if (daily) { daily.status = 'completed'; daily.completedAt = Date.now(); daily.score = score; saveDailyState(daily); }

  var conceptId = _dailyLessonInfo && _dailyLessonInfo.concept.id;
  var session   = _dailyLessonInfo && _dailyLessonInfo.reviewSession;
  var title     = _dailyLessonInfo && _dailyLessonInfo.concept.title;

  if (conceptId) updateMasteryForConcept(conceptId, score, session);

  // Track daily lesson history for teacher dashboard calendar
  try {
    var dhist = JSON.parse(localStorage.getItem('kesher_daily_history') || '[]');
    dhist.push({ date: new Date().toDateString(), isoDate: new Date().toISOString(), conceptId: conceptId || '', title: title || '', score: score, session: session || 1 });
    localStorage.setItem('kesher_daily_history', JSON.stringify(dhist.slice(-200)));
  } catch(e) {}

  _dailyLessonActive = false;
  _dailyLessonInfo   = null;
  if (state.userProfile) delete state.userProfile.dailyLesson;
  hideDailyLessonBanner();

  // Score-based bonus points (daily lesson completion reward)
  var dlBonus = score >= 80 ? 25 : score >= 60 ? 15 : 5;
  state.progress.points += dlBonus;

  updateStreak();
  saveProgress();

  var mastery = loadMastery();
  var m = conceptId && mastery[conceptId];
  var justMastered = m && m.level === 'mastered';

  triggerCelebration();

  if (justMastered) {
    showStreakModal('🏆', 'Concept Mastered!',
      '"' + (title || 'This concept') + '" mastered! Score: ' + score + '%. Tomorrow: something new!',
      true);
  } else {
    var celebEmoji = score >= 80 ? '🎉' : score >= 60 ? '⭐' : '💪';
    var celebMsg   = score >= 80
      ? 'Sababa! ' + score + '% — great work! Review in a few days.'
      : score >= 60
      ? "B'seder! " + score + "% — we'll practice more tomorrow."
      : 'Keep going! ' + score + '% — Morah will help you nail this.';
    showStreakModal(celebEmoji, 'Lesson Complete!', celebMsg, true);
  }
}

// ── Mastery update (spaced repetition logic) ──────────────
function updateMasteryForConcept(conceptId, score, reviewSession) {
  var mastery = loadMastery();
  var today   = new Date().toDateString();
  var pass    = score >= 80;

  if (!mastery[conceptId]) {
    mastery[conceptId] = { level:'learning', sessionCount:0, sessions:[], nextReviewDate:null };
  }
  var m = mastery[conceptId];
  m.sessions.push({ date:today, score:score, session:reviewSession });
  m.sessionCount = Math.max(m.sessionCount || 0, reviewSession);

  if (reviewSession === 1) {
    m.level = 'learning';
    m.nextReviewDate = _dlAddDays(today, 1);
  } else if (reviewSession === 2) {
    m.level = 'learning';
    if (pass) {
      m.nextReviewDate = _dlAddDays(today, 3); // Passed session 2 — wait 3 days before quiz session
    } else {
      m.sessionCount   = 1;                    // Failed — redo session 2 tomorrow
      m.nextReviewDate = _dlAddDays(today, 1);
    }
  } else if (reviewSession === 3) {
    if (pass) {
      m.level          = 'practicing';
      m.nextReviewDate = _dlAddDays(today, 4);
    } else {
      m.sessionCount   = 2;
      m.nextReviewDate = _dlAddDays(today, 1);
    }
  } else {
    if (pass) {
      m.level          = 'mastered';
      m.nextReviewDate = null;
    } else {
      m.level          = 'practicing';
      m.sessionCount   = 3;
      m.nextReviewDate = _dlAddDays(today, 2);
    }
  }

  saveMastery(mastery);
}

function _dlAddDays(dateStr, days) {
  var d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toDateString();
}

// ── Version check — forces reload if server has a newer build ─────────────
(function checkAppVersion() {
  var CURRENT_VERSION = 'v9.4';
  if (sessionStorage.getItem('_kv_checked')) return;
  fetch('/api/version')
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data && data.version && data.version !== CURRENT_VERSION) {
        console.log('[Version] Server=' + data.version + ' Client=' + CURRENT_VERSION + ' — refreshing');
        sessionStorage.setItem('_kv_checked', '1');
        window.location.reload(true);
      }
    })
    .catch(function() {});
})();

// ═══════════════════════════════════════════════════════════════════════════
//  QUIZ MODE — standalone 10-question exam with interactive challenges
// ═══════════════════════════════════════════════════════════════════════════

var _QM_TOPICS = [
  { id:'vocabulary',   label:'Vocabulary',   icon:'📖', desc:'Word meanings & translation' },
  { id:'verbs',        label:'Verbs',         icon:'⚡', desc:'Present tense all 4 forms' },
  { id:'past_tense',   label:'Past Tense',    icon:'⏪', desc:'עָבָר — Pa\'al paradigm' },
  { id:'future_tense', label:'Future Tense',  icon:'⏩', desc:'עָתִיד — prefix system' },
  { id:'binyanim',     label:'Binyanim',      icon:'🏗️', desc:'All 7 verb patterns' },
  { id:'random',       label:'Random Mix',    icon:'🎲', desc:'Surprise me!' },
];

var _qm = {
  active:false, topic:null, questions:[], idx:0,
  answers:[], score:0, startTime:null, timerInterval:null, wrongAnswers:[]
};
var _qmMatchSelH = null, _qmMatchSelE = null;

// ── Open / Close ──────────────────────────────────────────────────────────────
function openQuizMode() {
  var overlay = document.getElementById('quiz-mode-overlay');
  if (!overlay) return;
  _qm = { active:true, topic:null, questions:[], idx:0, answers:[], score:0, startTime:null, timerInterval:null, wrongAnswers:[] };
  _qmMatchSelH = null; _qmMatchSelE = null;

  var grid = document.getElementById('qm-topic-grid');
  if (grid) {
    grid.innerHTML = _QM_TOPICS.map(function(t) {
      return '<button class="qm-topic-btn" onclick="startQuizMode(\'' + t.id + '\')">' +
        '<span class="qm-topic-icon">' + t.icon + '</span>' +
        '<span class="qm-topic-label">' + t.label + '</span>' +
        '<span class="qm-topic-desc">' + t.desc + '</span>' +
      '</button>';
    }).join('');
  }

  _qmShow('qm-topic-select');
  overlay.style.display = 'flex';
}

function closeQuizMode() {
  _qmFlushWrong();
  _qm.active = false;
  if (_qm.timerInterval) { clearInterval(_qm.timerInterval); _qm.timerInterval = null; }
  var overlay = document.getElementById('quiz-mode-overlay');
  if (overlay) overlay.style.display = 'none';
}

function _qmShow(paneId) {
  ['qm-loading','qm-topic-select','qm-quiz-screen','qm-results-screen'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.style.display = id === paneId ? 'flex' : 'none';
  });
}

// ── Fetch & Start ─────────────────────────────────────────────────────────────
async function startQuizMode(topicId) {
  _qm.topic = topicId; _qm.questions = []; _qm.idx = 0;
  _qm.answers = []; _qm.score = 0; _qm.wrongAnswers = [];
  _qmMatchSelH = null; _qmMatchSelE = null;
  _qmShow('qm-loading');

  try {
    var level = (state.userProfile && state.userProfile.level) || 'basic';
    var words = (state.progress.wordsLearned || []).slice(-25).map(function(w) {
      return w.hebrew + ' (' + w.english + ')';
    });

    var resp = await fetch('/api/quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: topicId, level: level, wordsLearned: words })
    });
    if (!resp.ok) throw new Error('server ' + resp.status);
    var data = await resp.json();
    if (!data.questions || !data.questions.length) throw new Error('empty');

    _qm.questions = data.questions;
    _qm.startTime = Date.now();
    _qm.timerInterval = setInterval(_qmTick, 1000);

    _qmShow('qm-quiz-screen');
    _qmRenderQ(0);
  } catch(e) {
    console.error('[Quiz]', e.message);
    _qmShow('qm-topic-select');
    showToast('Could not generate quiz — please try again!');
  }
}

function _qmTick() {
  if (!_qm.startTime) return;
  var s = Math.floor((Date.now() - _qm.startTime) / 1000);
  var el = document.getElementById('qm-timer');
  if (el) el.textContent = Math.floor(s/60) + ':' + (s%60 < 10 ? '0' : '') + (s%60);
}

// ── Render a question ─────────────────────────────────────────────────────────
function _qmRenderQ(idx) {
  var total = _qm.questions.length;
  var q = _qm.questions[idx];
  if (!q) { _qmShowResults(); return; }

  // Progress bar + dots
  var pct = (idx / total) * 100;
  var pb = document.getElementById('qm-progress-bar');
  if (pb) pb.style.width = pct + '%';

  var dotsEl = document.getElementById('qm-dots');
  if (dotsEl) {
    dotsEl.innerHTML = _qm.questions.map(function(_, i) {
      var cls = 'qm-dot';
      if      (i === idx)                                cls += ' qm-dot-cur';
      else if (_qm.answers[i] && _qm.answers[i].correct) cls += ' qm-dot-ok';
      else if (_qm.answers[i])                            cls += ' qm-dot-bad';
      return '<span class="' + cls + '"></span>';
    }).join('');
  }

  var qEl = document.getElementById('qm-q-count');
  if (qEl) qEl.textContent = 'Q ' + (idx+1) + ' / ' + total;
  var sEl = document.getElementById('qm-score-display');
  if (sEl) sEl.textContent = _qm.score + ' correct';

  // Render question widget
  var area = document.getElementById('qm-question-area');
  if (!area) return;
  var wrap = document.createElement('div');
  wrap.className = 'qm-card';
  wrap.id = 'qm-card-' + idx;
  area.innerHTML = '';
  area.appendChild(wrap);

  switch (q.type) {
    case 'fill_blank':  _qmMakeFill(q, idx, wrap);  break;
    case 'match':       _qmMakeMatch(q, idx, wrap);  break;
    default:            _qmMakeMC(q, idx, wrap);     break;
  }
  area.scrollTop = 0;
}

// ── Multiple Choice ───────────────────────────────────────────────────────────
function _qmMakeMC(q, idx, wrap) {
  var heb = (q.question || '').match(/[א-תיִ-פֿ][א-תיִ-פְֿ-ׇ ]*/);
  wrap.innerHTML =
    (heb ? '<div class="qm-heb-word">' + escapeHtml(heb[0].trim()) + '</div>' : '') +
    '<div class="qm-q-text">' + escapeHtml(q.question || '') + '</div>' +
    '<div class="qm-mc-grid">' +
      (q.options || []).map(function(opt, i) {
        return '<button class="qm-mc-btn" onclick="_qmAnswerMC(' + idx + ',' + i + ')">' + escapeHtml(opt) + '</button>';
      }).join('') +
    '</div>' +
    '<div class="qm-fb" id="qm-fb-' + idx + '"></div>';
}

function _qmAnswerMC(idx, sel) {
  if (_qm.answers[idx]) return;
  var q = _qm.questions[idx];
  var correct = sel === q.correct;
  document.querySelectorAll('#qm-card-' + idx + ' .qm-mc-btn').forEach(function(b, i) {
    b.disabled = true;
    if (i === q.correct) b.classList.add('qm-mc-correct');
    else if (i === sel && !correct) b.classList.add('qm-mc-wrong');
  });
  _qmRecord(correct, idx, q.options ? q.options[sel] : '', q);
}

// ── Fill in Blank ─────────────────────────────────────────────────────────────
function _qmMakeFill(q, idx, wrap) {
  wrap.innerHTML =
    '<div class="qm-q-text">' + escapeHtml(q.question || '') + '</div>' +
    (q.hint ? '<div class="qm-hint">💡 ' + escapeHtml(q.hint) + '</div>' : '') +
    '<div class="fill-row">' +
      '<input class="fill-input" id="qm-inp-' + idx + '" placeholder="Type your answer…" autocomplete="off" ' +
        'onkeydown="if(event.key===\'Enter\')_qmAnswerFill(' + idx + ')" />' +
      '<button class="fill-submit" onclick="_qmAnswerFill(' + idx + ')">Check →</button>' +
    '</div>' +
    '<div class="qm-fb" id="qm-fb-' + idx + '"></div>';
  setTimeout(function() { var i = document.getElementById('qm-inp-'+idx); if(i) i.focus(); }, 120);
}

function _qmAnswerFill(idx) {
  if (_qm.answers[idx]) return;
  var inp = document.getElementById('qm-inp-' + idx);
  if (!inp) return;
  var val = inp.value.trim();
  if (!val) return;
  var q = _qm.questions[idx];
  var correct = q.answer && (val.toLowerCase() === q.answer.toLowerCase() || _translitMatch(val, q.answer));
  inp.disabled = true;
  inp.classList.add(correct ? 'fill-correct' : 'fill-wrong');
  document.querySelector('#qm-card-' + idx + ' .fill-submit').disabled = true;
  _qmRecord(correct, idx, val, q);
}

// ── Match ─────────────────────────────────────────────────────────────────────
function _qmMakeMatch(q, idx, wrap) {
  var pairs = q.pairs || [];
  var engShuf = pairs.slice().sort(function() { return Math.random() - 0.5; });
  wrap.dataset.matched = '0';
  wrap.dataset.total   = pairs.length;
  wrap.innerHTML =
    '<div class="qm-q-text">' + escapeHtml(q.instruction || 'Match the Hebrew to its meaning') + '</div>' +
    '<div class="match-grid">' +
      '<div class="match-col">' +
        pairs.map(function(p, i) {
          return '<button class="match-btn" id="qm-mh-' + idx + '-' + i + '" onclick="_qmMatchTap(' + idx + ',\'h\',' + i + ')">' +
            '<span class="match-heb-word">' + escapeHtml(p.heb) + '</span></button>';
        }).join('') +
      '</div>' +
      '<div class="match-col">' +
        engShuf.map(function(p, i) {
          var orig = pairs.indexOf(p);
          return '<button class="match-btn" id="qm-me-' + idx + '-' + i + '" data-orig="' + orig + '" onclick="_qmMatchTap(' + idx + ',\'e\',' + i + ')">' +
            escapeHtml(p.eng) + '</button>';
        }).join('') +
      '</div>' +
    '</div>' +
    '<div class="qm-fb" id="qm-fb-' + idx + '"></div>';
}

function _qmMatchTap(idx, side, i) {
  if (_qm.answers[idx]) return;
  if (side === 'h') {
    if (_qmMatchSelH !== null) document.getElementById('qm-mh-'+idx+'-'+_qmMatchSelH).classList.remove('match-selected');
    _qmMatchSelH = i;
    document.getElementById('qm-mh-'+idx+'-'+i).classList.add('match-selected');
  } else {
    _qmMatchSelE = i;
  }
  if (_qmMatchSelH === null || _qmMatchSelE === null) return;

  var hIdx = _qmMatchSelH, eIdx = _qmMatchSelE;
  _qmMatchSelH = null; _qmMatchSelE = null;

  var hBtn = document.getElementById('qm-mh-'+idx+'-'+hIdx);
  var eBtn = document.getElementById('qm-me-'+idx+'-'+eIdx);
  var origE = parseInt(eBtn.dataset.orig);
  var hit = hIdx === origE;

  hBtn.classList.remove('match-selected');
  if (hit) {
    hBtn.classList.add('match-done-correct'); hBtn.disabled = true;
    eBtn.classList.add('match-done-correct'); eBtn.disabled = true;
    var wrap = document.getElementById('qm-card-' + idx);
    var done = parseInt(wrap.dataset.matched || '0') + 1;
    wrap.dataset.matched = done;
    if (done >= parseInt(wrap.dataset.total || '0')) {
      _qmRecord(true, idx, 'all matched', _qm.questions[idx]);
    }
  } else {
    hBtn.classList.add('match-flash-wrong'); eBtn.classList.add('match-flash-wrong');
    setTimeout(function() {
      hBtn.classList.remove('match-flash-wrong', 'match-selected');
      eBtn.classList.remove('match-flash-wrong');
    }, 600);
  }
}

// ── Record answer + feedback + advance ────────────────────────────────────────
function _qmRecord(correct, idx, chosen, q) {
  if (_qm.answers[idx]) return;
  _qm.answers[idx] = { correct:correct, chosen:chosen };
  if (correct) _qm.score++;

  var correctAns = q.answer || (q.options && q.options[q.correct]) || '';
  if (!correct) {
    _qm.wrongAnswers.push({
      question:       q.question || q.instruction || '',
      correct_answer: correctAns,
      student_answer: chosen,
      topic:          _qm.topic
    });
  }

  // Feedback banner
  var fb = document.getElementById('qm-fb-' + idx);
  if (fb) {
    fb.className = 'qm-fb ' + (correct ? 'qm-fb-ok' : 'qm-fb-bad');
    fb.innerHTML = correct
      ? '<span>✅</span> ' + escapeHtml(q.explanation || 'Correct!')
      : '<span>❌</span> ' + escapeHtml(q.explanation || ('Correct: ' + correctAns));
    fb.style.display = 'flex';
  }

  // Update dot
  var dots = document.querySelectorAll('.qm-dot');
  if (dots[idx]) {
    dots[idx].className = 'qm-dot ' + (correct ? 'qm-dot-ok' : 'qm-dot-bad');
  }

  var sEl = document.getElementById('qm-score-display');
  if (sEl) sEl.textContent = _qm.score + ' correct';

  setTimeout(function() {
    if (idx + 1 < _qm.questions.length) _qmRenderQ(idx + 1);
    else _qmShowResults();
  }, 1600);
}

// ── Results Screen ────────────────────────────────────────────────────────────
function _qmShowResults() {
  if (_qm.timerInterval) { clearInterval(_qm.timerInterval); _qm.timerInterval = null; }

  var elapsed = Math.floor((Date.now() - (_qm.startTime || Date.now())) / 1000);
  var m = Math.floor(elapsed/60), s = elapsed%60;
  var timeStr = m + ':' + (s < 10 ? '0' : '') + s;

  var total = _qm.questions.length, score = _qm.score;
  var pct   = total ? Math.round((score/total)*100) : 0;
  var pts   = score * 10;

  state.progress.points += pts;
  // Track quiz history for teacher dashboard
  try {
    var qhist = JSON.parse(localStorage.getItem('kesher_quiz_history') || '[]');
    qhist.push({ topic: _qm.topic, score: score, total: total, pct: pct, date: new Date().toISOString() });
    localStorage.setItem('kesher_quiz_history', JSON.stringify(qhist.slice(-50)));
  } catch(e) {}
  saveProgress();
  _qmFlushWrong();

  var emoji = pct >= 90 ? '🏆' : pct >= 70 ? '⭐' : pct >= 50 ? '👍' : '💪';
  var msg   = pct >= 90 ? 'Metzuyan! Near-perfect — incredible!' :
              pct >= 70 ? 'Great work! A few things to review.' :
              pct >= 50 ? 'Good effort! Morah will focus on the mistakes.' :
                          'Keep going — Morah will drill these in your next lesson!';

  var wrongHtml = '';
  if (_qm.wrongAnswers.length) {
    wrongHtml = '<div class="qm-wrong-box">' +
      '<div class="qm-wrong-hdr">❌ Review These</div>' +
      _qm.wrongAnswers.map(function(w) {
        return '<div class="qm-wrong-row">' +
          '<div class="qm-wrong-q">' + escapeHtml((w.question || '').slice(0, 70)) + '</div>' +
          '<div class="qm-wrong-a">✓ ' + escapeHtml(w.correct_answer || '') + '</div>' +
        '</div>';
      }).join('') +
    '</div>';
  }

  var res = document.getElementById('qm-results-screen');
  if (!res) return;
  res.innerHTML =
    '<div class="qm-res-wrap">' +
      '<div class="qm-res-emoji">' + emoji + '</div>' +
      '<div class="qm-res-title">Quiz Complete!</div>' +
      '<div class="qm-res-msg">' + escapeHtml(msg) + '</div>' +
      '<div class="qm-res-stats">' +
        '<div class="qm-res-stat"><div class="qm-rs-val">' + score + '/' + total + '</div><div class="qm-rs-lbl">Score</div></div>' +
        '<div class="qm-res-stat"><div class="qm-rs-val">' + timeStr + '</div><div class="qm-rs-lbl">Time</div></div>' +
        '<div class="qm-res-stat"><div class="qm-rs-val">+' + pts + '</div><div class="qm-rs-lbl">Points</div></div>' +
      '</div>' +
      '<div class="qm-res-bar-bg"><div class="qm-res-bar" data-pct="' + pct + '" style="width:0%"></div></div>' +
      wrongHtml +
      '<div class="qm-res-actions">' +
        '<button class="qm-share-btn" onclick="shareKesherIvrit(\'quiz\')">🇮🇱 Challenge Your Friends!</button>' +
        '<button class="qm-btn-primary" onclick="startQuizMode(\'' + _qm.topic + '\')">Try Again →</button>' +
        (_qm.wrongAnswers.length ? '<button class="qm-btn-secondary" onclick="_qmReviewMorah()">Review Mistakes with Morah</button>' : '') +
        '<button class="qm-btn-ghost" onclick="closeQuizMode()">Done</button>' +
      '</div>' +
    '</div>';

  _qmShow('qm-results-screen');

  requestAnimationFrame(function() {
    requestAnimationFrame(function() {
      var bar = res.querySelector('.qm-res-bar');
      if (bar) bar.style.width = bar.dataset.pct + '%';
    });
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function _qmFlushWrong() {
  if (!_qm.wrongAnswers || !_qm.wrongAnswers.length) return;
  // Save to localStorage so next lesson injects them
  try {
    var stored = JSON.parse(localStorage.getItem('kesher_review') || '[]');
    _qm.wrongAnswers.forEach(function(w) { stored.push(w); });
    localStorage.setItem('kesher_review', JSON.stringify(stored.slice(-20)));
  } catch(e) {}
  // Inject into current session for immediate use
  if (state.session) {
    state.session.reviewItems = _qm.wrongAnswers.slice(0, 5).map(function(w) {
      return w.question + ' (correct: ' + w.correct_answer + ')';
    });
  }
}

function _qmReviewMorah() {
  _qmFlushWrong();
  closeQuizMode();
  showToast('Morah will focus on your quiz mistakes this lesson!');
  continueLearning();
}
