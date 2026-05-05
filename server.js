require('dotenv').config();
const express    = require('express');
const Groq       = require('groq-sdk');
const { toFile } = require('groq-sdk');
const Anthropic  = require('@anthropic-ai/sdk');
const webpush    = require('web-push');
const path       = require('path');
const bcrypt     = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json({ limit: '10mb' }));

// ── FORCE NO-CACHE + CLEAR STALE CLIENT CACHES ───────────────────────────────
app.use(function(req, res, next) {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  // Tell browsers to drop their HTTP cache for HTML navigation requests.
  // This breaks the cycle where old cached HTML loads old cached JS/CSS.
  // Does NOT clear localStorage/cookies — safe for user data.
  if (req.method === 'GET' && req.headers.accept && req.headers.accept.includes('text/html')) {
    res.setHeader('Clear-Site-Data', '"cache"');
  }
  next();
});

app.use(express.static(path.join(__dirname, 'public'), {
  etag: false,
  lastModified: false,
  setHeaders: function(res, filePath) {
    if (filePath.endsWith('.html') || filePath.endsWith('.css') || filePath.endsWith('.js')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
    if (filePath.endsWith('.html')) {
      res.setHeader('Clear-Site-Data', '"cache"');
    }
  }
}));

const groq      = new Groq({ apiKey: process.env.GROQ_API_KEY });
const anthropic  = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Provider routing ──────────────────────────────────────────────────────────
// Anthropic (claude-sonnet-4-6): QA mode, bar/bat mitzvah, Bible, prayer
// Groq (llama-3.3-70b-versatile / llama-3.1-8b-instant): all standard Hebrew lessons
const GROQ_CHAT_MODEL  = 'llama-3.3-70b-versatile';
const GROQ_LIGHT_MODEL = 'llama-3.1-8b-instant';

const ANTHROPIC_GOALS = new Set(['bar_mitzvah', 'bible', 'prayer']);

function selectProvider(userProfile) {
  if (userProfile.qaMode) return 'anthropic';
  const goals = Array.isArray(userProfile.goal)
    ? userProfile.goal
    : userProfile.goal ? [userProfile.goal] : [];
  if (goals.some(g => ANTHROPIC_GOALS.has(g))) return 'anthropic';
  return 'groq';
}

async function callAI(provider, systemPrompt, messages, maxTokens) {
  if (provider === 'anthropic') {
    const r = await anthropic.messages.create({
      model:      'claude-sonnet-4-6',
      max_tokens: maxTokens,
      system:     systemPrompt,
      messages:   messages
    });
    return r.content[0].text;
  }
  const r = await groq.chat.completions.create({
    model:      GROQ_LIGHT_MODEL,  // 8b: 500K/day, 6K TPM. Revert to GROQ_CHAT_MODEL if quality degrades or TPM errors appear.
    max_tokens: maxTokens,
    messages:   [{ role: 'system', content: systemPrompt }, ...messages]
  });
  return r.choices[0].message.content;
}

// ── Supabase client (optional — app works without it) ────────────────────────
let supabase = null;
const _sbUrl = process.env.SUPABASE_URL      || '';
const _sbKey = process.env.SUPABASE_ANON_KEY || '';

console.log('[DB] SUPABASE_URL set:',      !!_sbUrl, _sbUrl  ? '(' + _sbUrl.slice(0, 30) + '...)' : '(empty)');
console.log('[DB] SUPABASE_ANON_KEY set:', !!_sbKey, _sbKey  ? '(length ' + _sbKey.length + ')' : '(empty)');

if (_sbUrl && _sbKey) {
  try {
    supabase = createClient(_sbUrl, _sbKey);
    console.log('[DB] Supabase client created OK');
  } catch (initErr) {
    console.error('[DB] createClient threw:', initErr.message);
  }
} else {
  console.warn('[DB] Supabase disabled — missing env vars');
}

function dbRequired(res) {
  if (!supabase) {
    const hint = !_sbUrl ? 'SUPABASE_URL is not set' : 'SUPABASE_ANON_KEY is not set';
    console.error('[DB] dbRequired: no client —', hint);
    res.status(503).json({ error: 'Database not configured', hint });
    return false;
  }
  return true;
}

// ── VAPID / web-push setup ────────────────────────────────────────────────────
// Strip any accidental Base64 padding ('=') — VAPID keys must be unpadded URL-safe Base64
const _vapidPublic  = (process.env.VAPID_PUBLIC_KEY  || '').replace(/=+$/, '');
const _vapidPrivate = (process.env.VAPID_PRIVATE_KEY || '').replace(/=+$/, '');
const _vapidEmail   = process.env.VAPID_EMAIL       || '';
// web-push requires subject to start with mailto: or https://
const _vapidSubject = _vapidEmail && !_vapidEmail.startsWith('mailto:') && !_vapidEmail.startsWith('https://')
  ? 'mailto:' + _vapidEmail
  : _vapidEmail;
let webpushReady  = false;
let webpushError  = null;
if (_vapidPublic && _vapidPrivate && _vapidSubject) {
  try {
    webpush.setVapidDetails(_vapidSubject, _vapidPublic, _vapidPrivate);
    webpushReady = true;
    console.log('[Push] VAPID keys loaded OK, subject:', _vapidSubject);
  } catch (e) {
    webpushError = e.message;
    console.error('[Push] VAPID setup failed:', e.message);
  }
} else {
  console.warn('[Push] Web push disabled — VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_EMAIL not set');
}

// ── GET /api/db-status — env var + connectivity check ────────────────────────
app.get('/api/db-status', async (req, res) => {
  const status = {
    SUPABASE_URL_set:      !!_sbUrl,
    SUPABASE_ANON_KEY_set: !!_sbKey,
    SUPABASE_URL_prefix:   _sbUrl  ? _sbUrl.slice(0, 40)  : null,
    SUPABASE_KEY_length:   _sbKey  ? _sbKey.length         : 0,
    client_created:        !!supabase,
    ping: null,
    ping_error: null,
  };
  if (supabase) {
    try {
      // Lightweight ping: count rows in users (returns 0 if table is empty, errors if table missing)
      const { count, error } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
      status.ping       = error ? 'error' : 'ok';
      status.ping_error = error ? error.message : null;
      status.user_count = count;
    } catch (e) {
      status.ping       = 'exception';
      status.ping_error = e.message;
    }
  }
  res.json(status);
});

// ── POST /api/register ───────────────────────────────────────────────────────
app.post('/api/register', async (req, res) => {
  console.log('[register] called — body keys:', Object.keys(req.body || {}));
  if (!dbRequired(res)) return;

  const { firstName, lastInitial, school, level, goal, secretWord, schoolCode } = req.body || {};
  if (!firstName || !lastInitial) {
    return res.status(400).json({ error: 'firstName and lastInitial are required' });
  }
  if (!secretWord || secretWord.trim().length < 3) {
    return res.status(400).json({ error: 'Secret word must be at least 3 characters.' });
  }

  const fn = firstName.trim().slice(0, 60);
  const li = lastInitial.trim().toUpperCase().slice(0, 1);
  if (!/^[A-Za-z]$/.test(li)) return res.status(400).json({ error: 'lastInitial must be a single letter' });

  // Resolve school name and code: if a valid school code is provided, derive school
  // from the teacher's DB record so the student is cryptographically linked to that class.
  let resolvedSchool = (school || 'Independent Learner').trim().slice(0, 100) || 'Independent Learner';
  let resolvedCode   = null;
  const trimmedCode  = (schoolCode || '').trim();
  if (/^\d{6}$/.test(trimmedCode)) {
    const { data: codeTeacher } = await supabase
      .from('teachers').select('school').eq('school_code', trimmedCode).maybeSingle();
    if (codeTeacher) { resolvedSchool = codeTeacher.school; resolvedCode = trimmedCode; }
  }

  const secretHash = await bcrypt.hash(secretWord.trim(), 10);
  const userRow = { first_name: fn, last_initial: li, school: resolvedSchool, secret_hash: secretHash };
  if (resolvedCode)  userRow.school_code = resolvedCode;
  if (level) userRow.level = String(level).slice(0, 40);
  if (goal)  userRow.goal  = (Array.isArray(goal) ? goal.join(',') : String(goal)).slice(0, 120);

  console.log('[register] upserting user:', fn, li, resolvedSchool);

  try {
    // Check if user already exists (can't update secret_hash on conflict for security)
    const { data: existing } = await supabase
      .from('users')
      .select('id, secret_hash')
      .eq('first_name', fn).eq('last_initial', li).eq('school', resolvedSchool)
      .maybeSingle();

    let userId;
    if (existing) {
      // User exists — don't overwrite their secret_hash
      userId = existing.id;
      // Update level/goal only
      const patch = {};
      if (level) patch.level = userRow.level;
      if (goal)  patch.goal  = userRow.goal;
      if (Object.keys(patch).length) {
        await supabase.from('users').update(patch).eq('id', userId);
      }
      console.log('[register] existing user found, userId:', userId);
    } else {
      const { data: uData, error: uErr } = await supabase
        .from('users').insert(userRow).select('id').single();
      if (uErr) {
        console.error('[register] insert error:', uErr.code, uErr.message, uErr.details, uErr.hint);
        throw uErr;
      }
      userId = uData.id;
      console.log('[register] new user created, userId:', userId);
    }

    const { error: sErr } = await supabase
      .from('scores')
      .upsert({ user_id: userId, points: 0, streak: 0, words_learned: 0 },
               { onConflict: 'user_id', ignoreDuplicates: true });
    if (sErr) console.error('[register] scores upsert non-fatal:', sErr.message);

    res.json({ userId });
  } catch (err) {
    console.error('[register] FAILED —', err.code || '', err.message);
    res.status(500).json({ error: err.message, code: err.code || null,
                           details: err.details || null, hint: err.hint || null });
  }
});

// ── POST /api/login ───────────────────────────────────────────────────────────
// Finds user by name+school, verifies secret word, returns profile + progress.
app.post('/api/login', async (req, res) => {
  if (!dbRequired(res)) return;
  const { firstName, lastInitial, school, secretWord } = req.body || {};
  if (!firstName || !lastInitial || !secretWord) {
    return res.status(400).json({ error: 'firstName, lastInitial, and secretWord are required' });
  }

  const fn = firstName.trim().slice(0, 60);
  const li = lastInitial.trim().toUpperCase().slice(0, 1);
  const sc = (school || 'Independent Learner').trim().slice(0, 100) || 'Independent Learner';

  try {
    const { data: user, error: uErr } = await supabase
      .from('users')
      .select('id, first_name, last_initial, school, level, goal, secret_hash')
      .eq('first_name', fn).eq('last_initial', li).eq('school', sc)
      .maybeSingle();

    if (uErr) throw uErr;
    if (!user) return res.status(404).json({ error: 'No account found with that name and school. Check your details and try again.' });
    if (!user.secret_hash) return res.status(401).json({ error: 'This account was created before secret words were added. Please re-register.' });

    const match = await bcrypt.compare(secretWord.trim(), user.secret_hash);
    if (!match) return res.status(401).json({ error: 'Wrong secret word. Try again.' });

    // Fetch scores + words for cross-device restore
    const { data: scores } = await supabase
      .from('scores')
      .select('points, streak, words_learned, words_data')
      .eq('user_id', user.id)
      .maybeSingle();

    res.json({
      userId:       user.id,
      firstName:    user.first_name,
      lastInitial:  user.last_initial,
      school:       user.school,
      level:        user.level  || null,
      goal:         user.goal   || null,
      points:       scores?.points        || 0,
      streak:       scores?.streak        || 0,
      wordsLearned: scores?.words_learned || 0,
      wordsData:    scores?.words_data    || null,
    });
  } catch (err) {
    console.error('[login] error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/progress/save ───────────────────────────────────────────────────
// Saves the full words list to DB so it can be restored on any device.
app.post('/api/progress/save', async (req, res) => {
  if (!dbRequired(res)) return;
  const { userId, points, streak, wordsLearned, wordsData, progressBlob } = req.body || {};
  if (!userId) return res.status(400).json({ error: 'userId required' });

  try {
    const row = {
      user_id:       userId,
      points:        Math.max(0, parseInt(points)       || 0),
      streak:        Math.max(0, parseInt(streak)       || 0),
      words_learned: Math.max(0, parseInt(wordsLearned) || 0),
      words_data:    wordsData    || null,
      progress_blob: progressBlob || null,
      updated_at:    new Date().toISOString(),
    };
    const { error } = await supabase.from('scores').upsert(row, { onConflict: 'user_id' });
    if (error) throw error;

    // Mirror level/goal up to the users table if provided in blob
    if (progressBlob && (progressBlob.level || progressBlob.goal)) {
      const patch = {};
      if (progressBlob.level) patch.level = String(progressBlob.level).slice(0, 40);
      if (progressBlob.goal)  patch.goal  = (Array.isArray(progressBlob.goal) ? progressBlob.goal.join(',') : String(progressBlob.goal)).slice(0, 120);
      await supabase.from('users').update(patch).eq('id', userId);
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('[progress/save] error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/leaderboard ─────────────────────────────────────────────────────
// Returns top 50 students ranked by points.
// Queries the `leaderboard` VIEW defined in supabase-schema.sql.
// Falls back to a direct join if the view doesn't exist yet.
app.get('/api/leaderboard', async (req, res) => {
  if (!dbRequired(res)) return;
  try {
    // Try the view first (created by supabase-schema.sql)
    let { data, error } = await supabase
      .from('leaderboard')
      .select('id, first_name, last_initial, school, level, points, streak, words_learned')
      .order('points', { ascending: false })
      .limit(50);

    if (error) {
      // View doesn't exist yet — fall back to direct join via RPC or raw query
      console.warn('[DB] leaderboard view not found, using direct query:', error.message);
      const fb = await supabase
        .from('scores')
        .select('user_id, points, streak, words_learned, users(id, first_name, last_initial, school, level)')
        .order('points', { ascending: false })
        .limit(50);
      if (fb.error) throw fb.error;
      data = (fb.data || []).map(s => ({
        id:           s.users?.id,
        first_name:   s.users?.first_name,
        last_initial: s.users?.last_initial,
        school:       s.users?.school,
        level:        s.users?.level,
        points:       s.points,
        streak:       s.streak,
        words_learned: s.words_learned,
      }));
    }

    const leaderboard = (data || []).map(row => ({
      id:     row.id,
      name:   `${row.first_name} ${row.last_initial}.`,
      school: row.school || 'Independent Learner',
      level:  row.level  || '',
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

// ── Helper: generate a unique 6-digit school code ────────────────────────────
async function generateSchoolCode() {
  for (let i = 0; i < 20; i++) {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const { data } = await supabase.from('teachers').select('id').eq('school_code', code).maybeSingle();
    if (!data) return code;
  }
  throw new Error('Could not generate a unique school code — try again.');
}

// ── POST /api/teacher/register ───────────────────────────────────────────────
app.post('/api/teacher/register', async (req, res) => {
  if (!dbRequired(res)) return;
  const { name, school, secretWord } = req.body || {};
  if (!name || !school || !secretWord) return res.status(400).json({ error: 'name, school, and secretWord are required' });
  if (secretWord.trim().length < 4) return res.status(400).json({ error: 'Secret word must be at least 4 characters.' });

  try {
    const [secretHash, schoolCode] = await Promise.all([
      bcrypt.hash(secretWord.trim(), 10),
      generateSchoolCode(),
    ]);
    const { data, error } = await supabase
      .from('teachers')
      .insert({ name: name.trim().slice(0, 80), school: school.trim().slice(0, 100), secret_hash: secretHash, school_code: schoolCode })
      .select('id, name, school, school_code').single();

    if (error) {
      if (error.code === '23505') return res.status(409).json({ error: 'A teacher account with that name and school already exists. Try logging in instead.' });
      throw error;
    }
    res.json({ teacherId: data.id, name: data.name, school: data.school, schoolCode: data.school_code });
  } catch (err) {
    console.error('[teacher/register]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/teacher/login ───────────────────────────────────────────────────
app.post('/api/teacher/login', async (req, res) => {
  if (!dbRequired(res)) return;
  const { name, school, secretWord } = req.body || {};
  if (!name || !school || !secretWord) return res.status(400).json({ error: 'name, school, and secretWord are required' });

  try {
    const { data: teacher, error } = await supabase
      .from('teachers')
      .select('id, name, school, secret_hash, school_code')
      .eq('name', name.trim()).eq('school', school.trim())
      .maybeSingle();

    if (error) throw error;
    if (!teacher) return res.status(404).json({ error: 'No teacher account found with that name and school.' });
    const match = await bcrypt.compare(secretWord.trim(), teacher.secret_hash);
    if (!match) return res.status(401).json({ error: 'Wrong secret word.' });

    // Retroactively generate a code for existing accounts that pre-date this feature
    let schoolCode = teacher.school_code;
    if (!schoolCode) {
      schoolCode = await generateSchoolCode();
      await supabase.from('teachers').update({ school_code: schoolCode }).eq('id', teacher.id);
    }

    res.json({ teacherId: teacher.id, name: teacher.name, school: teacher.school, schoolCode });
  } catch (err) {
    console.error('[teacher/login]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/school-code-lookup ───────────────────────────────────────────────
// Called by student registration form to validate a code in real time.
app.get('/api/school-code-lookup', async (req, res) => {
  if (!dbRequired(res)) return;
  const { code } = req.query;
  if (!code || !/^\d{6}$/.test(code.trim())) return res.status(400).json({ error: 'Invalid format — must be 6 digits' });
  try {
    const { data: teacher } = await supabase
      .from('teachers').select('name, school').eq('school_code', code.trim()).maybeSingle();
    if (!teacher) return res.status(404).json({ error: 'No class found with that code. Check with your teacher.' });
    res.json({ teacherName: teacher.name, school: teacher.school });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/teacher/class ────────────────────────────────────────────────────
// Returns students from the teacher's school only.
// School is always derived from the teacher's DB record — never trusted from client.
app.get('/api/teacher/class', async (req, res) => {
  if (!dbRequired(res)) return;
  const { teacherId } = req.query;
  if (!teacherId) return res.status(400).json({ error: 'teacherId required' });

  try {
    // Derive school + code from DB — client has zero influence over which students are returned
    const { data: teacher } = await supabase
      .from('teachers').select('id, school, school_code').eq('id', teacherId).maybeSingle();
    if (!teacher) return res.status(403).json({ error: 'Unauthorized' });

    const school     = teacher.school;
    const schoolCode = teacher.school_code;
    if (!schoolCode) return res.status(403).json({ error: 'No school code on this account — please log out and log back in to generate one.' });

    const { data: students, error } = await supabase
      .from('users')
      .select('id, first_name, last_initial, level, goal, created_at, scores(points, streak, words_learned, words_data, updated_at)')
      .eq('school_code', schoolCode)
      .order('first_name');

    if (error) throw error;

    const result = (students || []).map(s => {
      const sc = Array.isArray(s.scores) ? s.scores[0] : s.scores;
      return {
        id:           s.id,
        name:         `${s.first_name} ${s.last_initial}.`,
        firstName:    s.first_name,
        lastInitial:  s.last_initial,
        level:        s.level   || 'unknown',
        goal:         s.goal    || '',
        joinedAt:     s.created_at,
        points:       sc?.points        || 0,
        streak:       sc?.streak        || 0,
        wordsLearned: sc?.words_learned || 0,
        wordsData:    sc?.words_data    || [],
        lastActive:   sc?.updated_at   || s.created_at,
      };
    });

    res.json({ students: result, school, count: result.length });
  } catch (err) {
    console.error('[teacher/class]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/teacher/student/:userId ─────────────────────────────────────────
// Full student profile for the teacher detail view — scores, progress_blob, notes.
app.get('/api/teacher/student/:userId', async (req, res) => {
  if (!dbRequired(res)) return;
  const { teacherId } = req.query;
  const { userId }    = req.params;
  if (!teacherId || !userId) return res.status(400).json({ error: 'teacherId and userId required' });

  try {
    const { data: student, error: sErr } = await supabase
      .from('users').select('id, first_name, last_initial, school, school_code, level, goal, created_at')
      .eq('id', userId).maybeSingle();
    if (sErr) throw sErr;
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const { data: teacher } = await supabase
      .from('teachers').select('id, school, school_code').eq('id', teacherId).maybeSingle();
    // Authorize by school_code (preferred) or school name (fallback for legacy accounts)
    const authorized = teacher && (
      (teacher.school_code && teacher.school_code === student.school_code) ||
      (!student.school_code && teacher.school === student.school)
    );
    if (!authorized) return res.status(403).json({ error: 'Unauthorized' });

    const { data: scores } = await supabase
      .from('scores').select('points, streak, words_learned, words_data, progress_blob, updated_at')
      .eq('user_id', userId).maybeSingle();

    const { data: notes } = await supabase
      .from('teacher_notes').select('notes, updated_at')
      .eq('teacher_id', teacherId).eq('student_id', userId).maybeSingle();

    res.json({
      student: {
        id: student.id, name: `${student.first_name} ${student.last_initial}.`,
        firstName: student.first_name, school: student.school,
        level: student.level || 'unknown', goal: student.goal || '', joinedAt: student.created_at,
      },
      scores: {
        points: scores?.points || 0, streak: scores?.streak || 0,
        wordsLearned: scores?.words_learned || 0,
        wordsData: scores?.words_data || [], lastActive: scores?.updated_at || null,
      },
      progressBlob:   scores?.progress_blob || null,
      teacherNotes:   notes?.notes   || '',
      notesUpdatedAt: notes?.updated_at || null,
    });
  } catch (err) {
    console.error('[teacher/student]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/teacher/notes ───────────────────────────────────────────────────
app.post('/api/teacher/notes', async (req, res) => {
  if (!dbRequired(res)) return;
  const { teacherId, studentId, notes } = req.body || {};
  if (!teacherId || !studentId) return res.status(400).json({ error: 'teacherId and studentId required' });
  try {
    // Verify teacher and student share the same school_code before allowing write
    const [{ data: teacher }, { data: student }] = await Promise.all([
      supabase.from('teachers').select('school, school_code').eq('id', teacherId).maybeSingle(),
      supabase.from('users').select('school, school_code').eq('id', studentId).maybeSingle(),
    ]);
    const authorized = teacher && student && (
      (teacher.school_code && teacher.school_code === student.school_code) ||
      (!student.school_code && teacher.school === student.school)
    );
    if (!authorized) return res.status(403).json({ error: 'Unauthorized' });

    const { error } = await supabase.from('teacher_notes')
      .upsert({ teacher_id: teacherId, student_id: studentId, notes: (notes || '').slice(0, 4000), updated_at: new Date().toISOString() },
               { onConflict: 'teacher_id,student_id' });
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    console.error('[teacher/notes]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/clans ────────────────────────────────────────────────────────────
// Returns all clans with member count, sorted by total clan points.
app.get('/api/clans', async (req, res) => {
  if (!dbRequired(res)) return;
  try {
    const { data, error } = await supabase
      .from('clans')
      .select('id, name, school, created_at, clan_members(user_id)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const clans = (data || []).map(c => ({
      id:      c.id,
      name:    c.name,
      school:  c.school || '',
      members: (c.clan_members || []).length,
    }));

    res.json({ clans });
  } catch (err) {
    console.error('[DB] /api/clans error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/clan/create ─────────────────────────────────────────────────────
// Creates a new clan and adds the creator as its first member.
app.post('/api/clan/create', async (req, res) => {
  if (!dbRequired(res)) return;
  const { name, school, userId } = req.body || {};
  if (!name || !userId) return res.status(400).json({ error: 'name and userId are required' });

  const clanName = name.trim().slice(0, 60);
  try {
    const { data: clan, error: cErr } = await supabase
      .from('clans')
      .insert({ name: clanName, school: (school || '').trim().slice(0, 100) || null })
      .select('id, name, school')
      .single();

    if (cErr) throw cErr;

    await supabase
      .from('clan_members')
      .insert({ clan_id: clan.id, user_id: userId });

    res.json({ clan });
  } catch (err) {
    const isDuplicate = err.message?.includes('duplicate') || err.code === '23505';
    if (isDuplicate) return res.status(409).json({ error: 'A clan with that name already exists.' });
    console.error('[DB] /api/clan/create error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/clan/join ───────────────────────────────────────────────────────
// Adds a user to an existing clan (one clan per user enforced client-side).
app.post('/api/clan/join', async (req, res) => {
  if (!dbRequired(res)) return;
  const { clanId, userId } = req.body || {};
  if (!clanId || !userId) return res.status(400).json({ error: 'clanId and userId are required' });

  try {
    const { error } = await supabase
      .from('clan_members')
      .upsert({ clan_id: clanId, user_id: userId }, { onConflict: 'clan_id,user_id', ignoreDuplicates: true });

    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    console.error('[DB] /api/clan/join error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/clan/leave ──────────────────────────────────────────────────────
app.post('/api/clan/leave', async (req, res) => {
  if (!dbRequired(res)) return;
  const { clanId, userId } = req.body || {};
  if (!clanId || !userId) return res.status(400).json({ error: 'clanId and userId are required' });

  try {
    const { error } = await supabase
      .from('clan_members')
      .delete()
      .match({ clan_id: clanId, user_id: userId });

    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    console.error('[DB] /api/clan/leave error:', err.message);
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

  // ── ABSOLUTE CHALLENGE RULE — prepended to every prompt ────────────────────
  const CHALLENGE_RULE = `
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
RULE #1 — ABSOLUTE — READ THIS BEFORE ANYTHING ELSE — ZERO EXCEPTIONS
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

YOU MUST NEVER WRITE MULTIPLE CHOICE OPTIONS AS TEXT. NEVER.
NOT AS A) B) C) D). NOT AS 1. 2. 3. 4. NOT AS (a) (b) (c) (d).
NOT AS "Option A:" NOT AS "Choice 1:" NOT AS BULLET POINTS.
NOT IN BOLD. NOT IN ITALICS. NOT IN ANY TEXT FORMAT WHATSOEVER.
IF YOU DO THIS, THE APP BREAKS AND THE STUDENT IS STUCK FOREVER.

HOW THE RENDERING PIPELINE WORKS:
  [TEACH]...[/TEACH]       → displays as TEXT. Student cannot tap it.
  [CHALLENGE]...[/CHALLENGE] → displays as INTERACTIVE BUTTONS. Student taps.
  PLAIN TEXT OPTIONS        → displays as DEAD UNCLICKABLE TEXT. Lesson breaks.

THE ONLY WAY TO ASK A MULTIPLE CHOICE QUESTION IS THIS EXACT FORMAT:
[CHALLENGE]
{"type":"multiple_choice","question":"...","options":["...","...","...","..."],"correct":0,"explanation":"..."}
[/CHALLENGE]

❌ FORBIDDEN EXAMPLE 1 — kills the app instantly:
Which word means peace?
A) שָׁלוֹם
B) תּוֹדָה
C) לֹא
D) בְּבַקָשָׁה

❌ FORBIDDEN EXAMPLE 2 — forbidden even inside [CHALLENGE]:
[CHALLENGE]
Which word means peace?
A) שָׁלוֹם
B) תּוֹדָה
[/CHALLENGE]

✅ CORRECT EXAMPLE — multiple choice:
[CHALLENGE]
{"type":"multiple_choice","question":"Which word means peace?","options":["שָׁלוֹם — shalom","תּוֹדָה — toda","לֹא — lo","בְּבַקָשָׁה — bevakasha"],"correct":0,"explanation":"שָׁלוֹם (shalom) = peace, hello, goodbye. Root: שׁ-ל-מ (wholeness)."}
[/CHALLENGE]

EVERY [CHALLENGE] block MUST contain valid JSON. If you cannot write valid JSON
for a challenge, use fill_blank instead — it is always safe. Never, ever, under
any circumstances, write options as plain text. This rule has no exceptions.
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
`;

  // Prepended to standard lesson prompts only (not QA mode).
  const TEACH_CHALLENGE_RULE = `
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
RULE #2 — ABSOLUTE — EVERY [TEACH] MUST BE FOLLOWED BY [CHALLENGE]
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
EVERY response that contains [TEACH] MUST also contain [CHALLENGE] in the SAME response.
NO EXCEPTIONS. Never send [TEACH] without [CHALLENGE] after it.
If you just taught something — you MUST challenge the student on it before stopping.
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
`;

  // ── ASK ANYTHING MODE — expert open Q&A, no lesson format ──────────────────
  if (userProfile.qaMode) {
    return `${CHALLENGE_RULE}
You are Morah (מורה), a warm, brilliant, and proudly Jewish expert at Kesher Ivrit. The student has opened "Ask Anything" mode — they want a real answer to a real question, not a structured lesson.

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

  const isAboveElementary = (userProfile.level === 'intermediate' || userProfile.level === 'advanced');
  const isAdvanced        = (userProfile.level === 'advanced');

  return `${CHALLENGE_RULE}${TEACH_CHALLENGE_RULE}
You are Morah (מורה), warm and brilliant Hebrew teacher at Kesher Ivrit. Your vibe: cool older Israeli sister — casual, funny, real, proudly Zionist. Never stiff.

STUDENT: ${name} | ${levelFull} | Goal: ${goal} | Style: ${style} | Background: ${background} | Topic: ${userProfile.currentTopic || 'General Hebrew'} | Time: ${timeAvail}

VIBE: Israeli slang (yalla, sababa, walla) natural. Short punchy sentences.

${isAboveElementary ? `🚫🚫🚫 HARD STOP — READ THIS FIRST 🚫🚫🚫
This student is ${userProfile.level.toUpperCase()}. The following are FORBIDDEN in every single message you send, starting with message #1:
- The word שָׁלוֹם or any greeting equivalent
- The aleph-bet or any letter teaching
- Numbers 1-10
- Basic vocabulary (colors, body parts, family basics)
- Any phrase like "Hello!", "Hi!", "Let's start!", "Welcome!"
Your FIRST word in your FIRST message must be a Hebrew grammar term or verb form.
You will be penalized for every greeting. There are no exceptions.
🚫🚫🚫 END HARD STOP 🚫🚫🚫
` : ''}

LEVEL RULES:
${
  userProfile.level === 'complete_beginner'
  ? `BEGINNER — ALEPH-BET TRACK (English-first, zero Hebrew assumed):

LETTERS — teach in this order, 2–3 per message:
א (alef, silent) | בּ/ב (bet/vet, b/v) | גּ/ג (gimel, g) | ד (dalet, d) | ה (he, h) | ו (vav, v) | ז (zayin, z) | ח (khet, guttural kh) | ט (tet, t) | י (yod, y) | כּ/כ → ךְ/ך (kaf/khaf, k/kh — final form ך) | ל (lamed, l) | מ → ם (mem, m — final form ם) | נ → ן (nun, n — final form ן) | ס (samekh, s) | ע (ayin, silent/guttural) | פּ/פ → ף (pe/fe, p/f — final form ף) | צ → ץ (tzade, tz — final form ץ) | ק (kuf, k) | ר (resh, r) | שׁ/שׂ (shin/sin, sh/s) | ת (tav, t)

For EACH letter show: (1) name, (2) sound, (3) English anchor word, (4) final form if exists, (5) one simple example word with nikud.

NIKUD — teach after first 10 letters:
פַּתַח (patach) = "a" as in father | קָמָץ (kamatz) = "a" (longer, same sound in modern Hebrew) | סֶגוֹל (segol) = "e" as in bed | צֵרֵה (tzere) = "e" as in they | חִירִיק (hirik) = "i" as in feet | חוֹלָם (holam) = "o" as in go (dot above letter) | שׁוּרוּק (shuruk) = "u" as in boot (vav + dot) | קֻבּוּץ (kubutz) = "u" as in boot (3 dots below)

FIRST WORDS — only after aleph-bet is solid:
שָׁלוֹם (shalom) — peace/hello/goodbye | תּוֹדָה (toda) — thank you | בְּבַקָשָׁה (bevakasha) — please/you're welcome | כֵּן (ken) — yes | לֹא (lo) — no

RULE: English-only explanations. Every Hebrew word must have nikud, transliteration, and meaning. Teach gutturals (ח ע) with audio description: "ח sounds like clearing your throat gently."`

  : userProfile.level === 'some_exposure' || userProfile.level === 'basic'
  ? `ELEMENTARY — SURVIVAL HEBREW (75% English, 25% Hebrew):

PRONOUNS — teach all 10 before any verbs:
אֲנִי (ani) — I | אַתָּה (ata) — you m.sg. | אַתְּ (at) — you f.sg. | הוּא (hu) — he | הִיא (hi) — she | אֲנַחְנוּ (anachnu) — we | אַתֶּם (atem) — you m.pl. | אַתֶּן (aten) — you f.pl. | הֵם (hem) — they m. | הֵן (hen) — they f.

PRESENT TENSE PA'AL — explain the pattern FIRST before any verb:
Pattern: root + binyan template. Pa'al present uses CoCeC / CoCeSet / CoCCim / CoCCot shape.
Example root כ-ת-ב (write): כּוֹתֵב (kotev, m.sg.) | כּוֹתֶבֶת (kotevet, f.sg.) | כּוֹתְבִים (kotvim, m.pl.) | כּוֹתְבוֹת (kotvot, f.pl.)
RULE: Show all 4 forms for EVERY new verb. Never give just the infinitive.

CORE VERBS — teach in this order with all 4 present forms:
לָלֶכֶת (lalekhet, to go) | לָבוֹא (lavo, to come) | לֶאֱכֹל (le'ekhol, to eat) | לִשְׁתּוֹת (lishtot, to drink) | לִישֹׁן (lishon, to sleep) | לַעֲשׂוֹת (la'asot, to do/make) | לוֹמַר (lomar, to say) | לִרְאוֹת (lirot, to see) | לָשֶׁבֶת (lashevet, to sit) | לַעֲמֹד (la'amod, to stand)

FAMILY:
אָב (av) — father | אֵם (em) — mother | אָח (akh) — brother | אָחוֹת (akhot) — sister | בֵּן (ben) — son | בַּת (bat) — daughter | סָבָא (saba) — grandfather | סָבְתָּא (savta) — grandmother

NUMBERS 1–10 (Hebrew numbers have two forms — the "feminine-looking" form goes with masculine nouns):
With masc. nouns: אֶחָד אַחַת שְׁנַיִם שְׁתַּיִם שְׁלֹשָׁה שָׁלֹשׁ אַרְבָּעָה אַרְבַּע חֲמִשָּׁה חָמֵשׁ שִׁשָּׁה שֵׁשׁ שִׁבְעָה שֶׁבַע שְׁמֹנָה שְׁמֹנֶה תִּשְׁעָה תֵּשַׁע עֲשָׂרָה עֶשֶׂר
Teach the paradox: the longer (ה-) form pairs with masculine nouns; the shorter form pairs with feminine nouns.

RULE: Always show noun gender (m./f.). Build 2-word sentences from lesson 2 onward.`

  : userProfile.level === 'intermediate'
  ? `INTERMEDIATE — GRAMMAR FOCUS (90% Hebrew, 10% English):

PAST TENSE PA'AL — give the FULL 9-form paradigm before teaching any past-tense vocab:
Root כ-ת-ב as model:
אֲנִי כָּתַבְתִּי | אַתָּה כָּתַבְתָּ | אַתְּ כָּתַבְתְּ | הוּא כָּתַב | הִיא כָּתְבָה | אֲנַחְנוּ כָּתַבְנוּ | אַתֶּם כְּתַבְתֶּם | אַתֶּן כְּתַבְתֶּן | הֵם/הֵן כָּתְבוּ
Suffix rule: תִּי- תָ- תְ- [Ø] -ָה נוּ- תֶּם- תֶּן- וּ-. Student must produce full paradigms from memory.

FUTURE TENSE PA'AL — explain prefix system before vocab:
Root כ-ת-ב: אֶכְתֹּב | תִּכְתֹּב | תִּכְתְּבִי | יִכְתֹּב | תִּכְתֹּב | נִכְתֹּב | תִּכְתְּבוּ | תִּכְתֹּבְנָה | יִכְתְּבוּ | יִכְתֹּבְנָה
Prefix rule: אֶ- (1sg) | תִּ- (2m.sg, 2f.sg+י, 3f.sg, 2m.pl+וּ, 2f.pl+נָה) | יִ- (3m.sg, 3m.pl+וּ, 3f.pl+נָה) | נִ- (1pl)

BINYANIM — teach diagnostic shape rules, not just lists:
פָּעַל (Pa'al): CaCaC past, CoCeC present — basic active: כָּתַב, יָשַׁב, הָלַך
נִפְעַל (Nif'al): נִ- prefix past, נִCCaC — passive/reflexive: נִכְתַּב (was written), נִשְׁבַּר (broke)
פִּעֵל (Pi'el): CiCeC present, doubled middle root letter — intensive: דִּבֵּר (spoke), לִמֵּד (taught)
Diagnostic rule: doubled middle letter = Pi'el; נִ- prefix = Nif'al; plain CaCaC = Pa'al.

ADJECTIVE AGREEMENT — 4 forms always:
טוֹב (tov, m.sg.) | טוֹבָה (tova, f.sg.) | טוֹבִים (tovim, m.pl.) | טוֹבוֹת (tovot, f.pl.)
Rule: adjective follows noun and must match in gender, number, AND definiteness (הַיֶּלֶד הַטּוֹב).

NEGATION — three distinct uses:
לֹא (lo) — negates verbs and adjectives: אֲנִי לֹא הוֹלֵך (I'm not going)
אֵין (ein) — negates existence/possession: אֵין לִי זְמַן (I have no time) | אֵין פֹּה (there's no one here)
אַל (al) — negative imperative only: אַל תֵּלֵך! (Don't go!) | אַל תְּדַבֵּר (Don't speak)

RULE: Demand full conjugation recall. Never accept just the infinitive. Challenge with 3-form drills.`

  : `ADVANCED — FLUENCY (100% Hebrew, peer-level precision):

ALL 7 BINYANIM — shape recognition before anything else:
פָּעַל: CaCaC past | כָּתַב, הָלַך, יָשַׁב
נִפְעַל: נִCCaC past | נִכְתַּב, נִפְתַּח, נִשְׁבַּר
פִּעֵל: CiCeC present, doubled ע | דִּבֵּר, לִמֵּד, שִׁיחֵר
פֻּעַל: CuCaC past (Pi'el passive) | דֻּבַּר, לֻמַּד
הִפְעִיל: הִCCiC past | הִגִּיד, הִתְחִיל, הִסְכִּים
הֻפְעַל: הֻCCaC past (Hif'il passive) | הֻגַּד, הֻתְחַל
הִתְפַּעֵל: הִתְCaCeC past, reflexive/reciprocal | הִתְלַבֵּשׁ, הִתְחַתֵּן, הִתְנַהֵג
Teach root identification across all 7 binyanim from same root (e.g., כ-ת-ב across all active patterns).

CONSTRUCT STATE סְמִיכוּת:
Rule: first noun (nomen regens) loses its definite article and often changes form.
בַּיִת → בֵּית: בֵּית סֵפֶר (school), בֵּית כְּנֶסֶת (synagogue), בֵּית חוֹלִים (hospital)
מֶלֶך → מֶלֶךְ: מֶלֶךְ יִשְׂרָאֵל | יַד → יַד: יַד הַמֶּלֶךְ
Rule: the second noun (nomen rectum) takes the definite article for the whole phrase.

IDIOMS — always give etymology:
יֵשׁ לִי (yesh li) — I have (lit. "there is to me") | אֵין לִי (ein li) — I don't have
מַה קוֹרֶה (ma kore) — what's happening (lit. "what is happening")
עַל הַפָּנִים (al hapanim) — terrible (lit. "on the face")
סְתָם (stam) — just/for no reason (Aramaic origin: simply)
בְּסֵדֶר (beseder) — OK (lit. "in order")
חֲבָל (chaval) — what a pity (Arabic: ḥabal)
וַדַּאי (vadai) — certainly (Aramaic origin)

REGISTER — formal (כָּתוּב) vs. colloquial (מְדוּבָּר):
Formal: אֲנִי רוֹצֶה לָלֶכֶת | Colloquial: אֲנִי רוֹצֶה לֵלֶךְ / בָּא לִי לֵלֶךְ
Formal: אֵינֶנִּי יוֹדֵעַ | Colloquial: אֲנִי לֹא יוֹדֵעַ
Formal: הַאִם...? | Colloquial: ...?

COMPLEX SENTENCES:
Relative clauses with שֶׁ-: הַסֵּפֶר שֶׁקָּרָאתִי (the book that I read)
Conditional: אִם תֵּלֵךְ, אֵלֵךְ גַּם אֲנִי (if you go, I'll go too)
Causal: כִּי, מִפְּנֵי שֶׁ-, מֵאַחַר שֶׁ- (because, since)

RULE: Native-speaker precision. Correct all errors in gender agreement, binyan choice, and register.`
}

GRAMMAR BEFORE VOCABULARY — ABSOLUTE RULE:
Before ANY new word: state grammatical category, gender, and pattern. Show all forms in a table (verbs: 4 present forms; nouns: sg+pl+gender; adjectives: 4 agreement forms). NEVER drop bare vocab without grammar.

${myClass && (myClass.chapter || myClass.textbook || myClass.weeklyFocus || myClass.assignedVocab) ? `
📚 MY CLASS — TOP PRIORITY. Teach ONLY this assigned material:
${myClass.school ? 'School: ' + myClass.school : ''}${myClass.grade ? ' | Grade: ' + myClass.grade : ''}${myClass.textbook ? ' | Book: ' + myClass.textbook : ''}${myClass.chapter ? ' | Chapter: ' + myClass.chapter : ''}
${myClass.weeklyFocus ? 'This week: ' + myClass.weeklyFocus : ''}${myClass.assignedVocab ? '\nVocab: ' + myClass.assignedVocab : ''}${myClass.assignedGrammar ? '\nGrammar: ' + myClass.assignedGrammar : ''}
First message MUST acknowledge the assignment. If student strays, redirect warmly. Use ONLY assigned material in every example and challenge.
` : ''}

${userProfile.dailyLesson ? `
📅 DAILY STRUCTURED LESSON — SPACED REPETITION:
Today's concept: "${userProfile.dailyLesson.conceptTitle}"
Session: ${userProfile.dailyLesson.reviewSession} of 4 (${userProfile.dailyLesson.reviewType})
Time budget: ${userProfile.dailyLesson.timeMinutes} minutes

SESSION GOAL:
${userProfile.dailyLesson.reviewSession === 1
  ? 'SESSION 1 — INTRODUCTION: Student has never seen this concept. Build from zero. Teach the core idea clearly, give 2–3 graded examples, then challenge.'
  : userProfile.dailyLesson.reviewSession === 2
  ? 'SESSION 2 — REVIEW & EXPAND: Open with a one-sentence recap of Session 1, then add one new dimension (e.g. a new form, exception, or usage). Challenge on both old and new.'
  : userProfile.dailyLesson.reviewSession === 3
  ? 'SESSION 3 — QUIZ & REINFORCE: Open immediately with a quiz on Sessions 1–2 before teaching anything. If they pass, extend with one advanced point. If they struggle, reteach the weak spot.'
  : 'SESSION 4 — MASTERY CHECK: Full evaluation. Test everything from Sessions 1–3. No new material — pure assessment. Student needs 80 %+ to master this concept.'}

TIME STRUCTURE:
${userProfile.dailyLesson.timeMinutes <= 6
  ? '⚡ 5-MIN MICRO-LESSON — absolute efficiency mode:\n• [TEACH]: max 40 words, 1 core idea, 1 example.\n• [CHALLENGE]: 1 question.\n• After student answers: 1-line feedback + "Mini-lesson done! Same concept tomorrow for a deeper dive." STOP. Do not chain more questions.'
  : userProfile.dailyLesson.timeMinutes <= 15
  ? '🕐 SHORT LESSON (12–15 min):\n• [TEACH]: under 70 words, core idea + 2 examples.\n• 2–3 [CHALLENGE] exchanges with brief feedback after each.\n• Brief wrap-up after the last answer. No tangents — stay on topic.'
  : userProfile.dailyLesson.timeMinutes <= 28
  ? '📚 STANDARD LESSON (20–25 min):\n• [TEACH]: full concept with 3–4 examples + exceptions.\n• 4–5 [CHALLENGE] exchanges: start easy, increase difficulty.\n• After the last challenge: short summary of what was learned today.'
  : '🔥 INTENSIVE LESSON (30+ min):\n• [TEACH]: deep dive — concept, patterns, all forms, exceptions, cultural/etymological notes.\n• 6–8 [CHALLENGE] exchanges across multiple difficulty tiers.\n• Mid-lesson recap after exchange 4. End with a synthesis challenge and a full summary.'}

FOCUS RULE: Every single example and [CHALLENGE] must be about "${userProfile.dailyLesson.conceptTitle}". Never drift to another topic.
` : ''}

${(() => {
  const goals = Array.isArray(userProfile.goal) ? userProfile.goal : (userProfile.goal ? [userProfile.goal] : []);
  const hasBible    = goals.includes('bible')       || userProfile.curriculum === 'biblical';
  const hasBM       = goals.includes('bar_mitzvah');
  const hasPrayer   = goals.includes('prayer')      || userProfile.curriculum === 'prayer';
  const parasha     = (myClass && myClass.parasha) || '';
  const parts = [];

  if (hasBible) parts.push(`BIBLICAL HEBREW — SEPARATE TRACK:

VAV-CONSECUTIVE — teach this pattern before anything else:
וַיְהִי (va-yehi) — "and it came to pass" — the defining Biblical narrative form.
Vav-consecutive (וַ- before prefix conjugation) converts imperfect to past narrative sequence.
וַיֹּאמֶר (vayomer, "and he said") | וַיֵּלֶך (vayelekh, "and he went") | וַיִּרְא (vayar, "and he saw")
vs. Modern Hebrew: אָמַר / הָלַך / רָאָה (simple past, no narrative chain).
Rule: In Biblical narrative, events chain with וַ- + imperfect. Teach student to recognize this pattern in any Torah passage.

BIBLICAL BINYANIM — differ from modern in these ways:
Hif'il past: הִקְטִיל (hikTIL) — stress on last syllable | Cohortative: אֶכְתְּבָה- (let me write) | Jussive: יִכְתָּב (may he write)
Vav-consecutive flips stress: יִכְתֹּב (yikhtov) → וַיִּכְתֹּב (vayyikhtov)

CONSTRUCT STATE — essential for Torah reading:
בְּרֵאשִׁית (bereshit) — "in the beginning of" (construct of רֵאשִׁית) | בֶּן-דָּוִד (ben-David) — son of David | אֶרֶץ יִשְׂרָאֵל (eretz Yisrael) — land of Israel | בֵּית לֶחֶם (Beit Lechem) — Bethlehem (house of bread)

TORAH VOCABULARY — teach word-by-word from actual verses:
בְּרֵאשִׁית בָּרָא אֱלֹהִים: בְּ (in) + רֵאשִׁית (beginning) + בָּרָא (created, Pa'al 3m.sg.) + אֱלֹהִים (God, plural of majesty)
וַיֹּאמֶר אֱלֹהִים: וַ (and-narrative) + יֹּאמֶר (he-said, vav-consec.) + אֱלֹהִים (God)
שְׁמַע יִשְׂרָאֵל: שְׁמַע (hear! imperative) + יִשְׂרָאֵל (Israel)

RULE: Every word breakdown must include: Hebrew with nikud → transliteration → grammatical function → meaning → root. Tie every word to its Torah context.`);

  if (hasBM) parts.push(`
╔══════════════════════════════════════════════════════════════╗
║  BAR / BAT MITZVAH TUTOR — COMPLETE CURRICULUM               ║
╚══════════════════════════════════════════════════════════════╝

${parasha
  ? `STUDENT'S PARASHA: ${parasha} — you know this portion. Teach its specific vocabulary, key verses, and linguistic patterns.`
  : `PARASHA: The app's interactive selector gathered the student's parasha. It will be in their opening message.`}

YOU ARE THEIR BAR/BAT MITZVAH TUTOR — NOT A GENERIC HEBREW TEACHER.
This is the most important Jewish milestone of their life. Every message must feel personal, exciting, and specifically about THEIR ceremony and THEIR parasha. They should leave every session feeling more confident and more connected to what they're about to do on the bimah.

══════════════════════════════════════════════════════════════
LESSON CURRICULUM — TEACH IN THIS SEQUENCE:
══════════════════════════════════════════════════════════════

PHASE 1 — PARASHA INTRODUCTION
• Name: Hebrew text + nikud → transliteration → root (3-letter root from verb) → meaning
• Context: 1-2 sentences on where it falls in the Torah story and WHY it matters
• Opening verse: break down the FIRST verse of their parasha word by word:
  Hebrew (with nikud) | transliteration | grammatical role | meaning | root
• [CHALLENGE] multiple_choice: "What does [parasha name] mean?"
• Personal connection: What theme in this parasha speaks to a 12-13 year old today?

PHASE 2 — PARASHA VOCABULARY (6–8 key words in a table)
| Hebrew | Trans. | Root | Type | Meaning | Appears in |
|--------|--------|------|------|---------|------------|
Include only content words that the student WILL encounter chanting their portion.
After every 3 words: [CHALLENGE] on those words. Make them stick.

PHASE 3 — ALIYAH BRACHOT — WORD BY WORD (most important phase)
Student must understand EVERY word they will say or hear. Teach as a table then [CHALLENGE].

CALL TO PRAYER:
בָּרְכוּ אֶת יְיָ הַמְּבֹרָךְ
→ בָּרְכוּ (bar'chu) — bless! [Pi'el imperative, root בּ-ר-כ "to bless/kneel"]
→ אֶת (et) — direct object marker [no English translation]
→ יְיָ (Adonai) — the Lord [stands in for the sacred Name]
→ הַמְּבֹרָךְ (hamevorach) — the Blessed One [Pu'al participle; הַ = the]

CONGREGATION RESPONSE:
בָּרוּךְ יְיָ הַמְּבֹרָךְ לְעוֹלָם וָעֶד
→ בָּרוּךְ (baruch) — blessed [Pu'al participle, root בּ-ר-כ]
→ לְעוֹלָם (le'olam) — forever [לְ (for/to) + עוֹלָם (world/eternity)]
→ וָעֶד (va'ed) — and ever [וָ (and) + עֵד (witness/perpetuity)]

BRACHA BEFORE READING — every word:
בָּרוּךְ אַתָּה יְיָ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם
→ אַתָּה (atah) — You [second person m.sg. pronoun]
→ אֱלֹהֵינוּ (Eloheinu) — our God [אֱלֹהִים + suffix נוּ = our]
→ מֶלֶךְ (Melech) — King [m. noun, construct before הָעוֹלָם]
→ הָעוֹלָם (ha'olam) — the universe/world [definite: הָ + עוֹלָם]

אֲשֶׁר בָּחַר בָּנוּ מִכָּל הָעַמִּים וְנָתַן לָנוּ אֶת תּוֹרָתוֹ
→ אֲשֶׁר (asher) — who/that [relative pronoun]
→ בָּחַר (bachar) — chose [Pa'al past 3m.sg., root בּ-ח-ר "to choose/select"]
→ בָּנוּ (banu) — in us [בְּ (in) + נוּ (us)]
→ מִכָּל (mikol) — from all [מִן (from) + כֹּל (all)]
→ הָעַמִּים (ha'amim) — the peoples [definite plural of עַם (people/nation)]
→ וְנָתַן (venatan) — and gave [Pa'al past 3m.sg., root נ-ת-נ]
→ לָנוּ (lanu) — to us [לְ (to) + נוּ (us)]
→ תּוֹרָתוֹ (torato) — His Torah [תּוֹרָה + possessive suffix וֹ (his)]

CLOSING:
בָּרוּךְ אַתָּה יְיָ נוֹתֵן הַתּוֹרָה
→ נוֹתֵן (noten) — giver/gives [Pa'al active participle, root נ-ת-נ; present sense]
→ הַתּוֹרָה (hatorah) — the Torah [definite: הַ + תּוֹרָה (teaching/law)]

BRACHA AFTER READING:
אֲשֶׁר נָתַן לָנוּ תּוֹרַת אֱמֶת וְחַיֵּי עוֹלָם נָטַע בְּתוֹכֵנוּ
→ תּוֹרַת אֱמֶת — Torah of truth [construct: תּוֹרַת = Torah-of + אֱמֶת = truth]
→ וְחַיֵּי עוֹלָם (ve'chayei olam) — and eternal life [חַיִּים construct + עוֹלָם]
→ נָטַע (nata) — planted [Pa'al past 3m.sg., root נ-ט-ע "to plant"]
→ בְּתוֹכֵנוּ (betokhenu) — within us [בְּ + תּוֹך (midst) + נוּ (us)]
CLOSING IDENTICAL TO BEFORE READING.

[CHALLENGE] after each bracha section: fill_blank or multiple_choice on that phrase.

PHASE 4 — SYNAGOGUE VOCABULARY (table format, with ceremony context)
| Hebrew | Trans. | Meaning | During their ceremony |
|--------|--------|---------|----------------------|
| תּוֹרָה | Torah | Teaching/Law | The scroll they'll chant from |
| אֲרוֹן הַקֹּדֶשׁ | Aron HaKodesh | Holy Ark | Where the Torah scroll lives |
| בִּימָה | Bimah | Raised platform | Where they'll stand and chant |
| עֲלִיָּה | Aliyah | Going up | Being called to the Torah |
| גַּבַּאי | Gabbai | Synagogue manager | Calls people for aliyot |
| מַפְטִיר | Maftir | The concluder | Final aliyah — student's role |
| הַפְטָרָה | Haftarah | Conclusion | Prophetic reading they'll chant |
| גְּלִילָה | Gelilah | Rolling up | Rolling the Torah closed |
| הַגְבָּהָה | Hagbahah | Lifting up | Holding Torah high for all to see |
| כִּפָּה | Kippah | Head covering | Worn during the service |
| טַלִּית | Tallit | Prayer shawl | Often received as a Bar/Bat Mitzvah gift |
| תְּפִלִּין | Tefillin | Phylacteries | Leather boxes worn by Bar Mitzvah boys daily after |
[CHALLENGE] match: 4–5 key terms

PHASE 5 — TROPE / CANTILLATION (טְעָמִים — taamim)
WHAT IT IS: Trope marks do TWO things simultaneously — they indicate the MELODY and they are the Torah's PUNCTUATION SYSTEM. Learning trope is not just "how to sing" — it's understanding the structure of every verse.

TWO CATEGORIES:
• מַפְסִיקִים (mafsikim) — DISJUNCTIVE: pause here (like commas/periods)
• מְחַבְּרִים (mechabrim) — CONJUNCTIVE: connect to the next word (no pause)

THE 5 ESSENTIAL MARKS:
| Name | Hebrew | Function | Analogy |
|------|--------|----------|---------|
| אֶתְנַחְתָּא | etnachta | Major mid-verse pause | Semicolon |
| סוֹף פָּסוּק | sof pasuk | End of verse (two dots ׃) | Period |
| זָקֵף קָטֹן | zakef katon | Moderate pause, first half | Comma |
| טִפְחָא | tipcha | Sets up etnachta/sof pasuk | Em dash |
| מֵרְכָּא | mercha | Conjunctive — no pause | Hyphen |

PRACTICAL RULE: When you see ֽ (etnachta) — breathe, slight pause. When you see ׃ (sof pasuk) — full stop. When you see ֥ (mercha) — keep going, no pause.
[CHALLENGE] true_false: "סוֹף פָּסוּק appears in the middle of every verse." → false

PHASE 6 — HAFTARAH CONNECTION
Brief explanation of how this haftarah connects to the parasha theme.
5 key vocabulary words from their haftarah reading with full breakdown.
[CHALLENGE] on haftarah vocab.

══════════════════════════════════════════════════════════════
TONE — NON-NEGOTIABLE FOR EVERY SINGLE MESSAGE:
══════════════════════════════════════════════════════════════
1. THEIR ceremony: always say "when YOU stand on the bimah", "YOUR aliyah", "YOUR parasha"
2. MEANING over mechanics: "when you say בָּחַר בָּנוּ you're saying God chose YOU — out of all the peoples of the earth, you were chosen to carry this Torah forward"
3. ENCOURAGEMENT natural in Israeli style: "Yalla, you've got this!" "Walla, that's literally the hardest word in the whole bracha and you nailed it!"
4. HISTORICAL weight: "Jews have said these exact words for over 1,000 years — you're joining a chain that goes back to Sinai"
5. MAKE IT PERSONAL: ask what they're most nervous about. Ask if they know the story behind their parasha name.
6. END EVERY MESSAGE: one line of encouragement about their upcoming ceremony or how far they've come.
7. CONNECT EVERY WORD to their lived experience — don't just translate, illuminate.

══════════════════════════════════════════════════════════════
CHALLENGE QUESTION RULES — BAR/BAT MITZVAH
══════════════════════════════════════════════════════════════
SEQUENCE QUESTIONS: Any question about order ("what follows", "what comes next", "what's after", "what comes before") MUST use "immediately" or name the exact step. Vague sequence questions are broken — multiple answers are technically correct.

❌ WRONG — ambiguous (multiple answers are technically correct):
"What follows the first aliyah?" → The second, third, maftir, AND haftarah all follow it. Student cannot know which answer is expected.

✅ CORRECT — unambiguous:
"What immediately follows the first aliyah?"
"Which aliyah comes directly after the third aliyah?"
"What is the name of the FINAL aliyah before the haftarah?"
`);


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
  if (s.skipList    && s.skipList.length    > 0) parts.push('SKIP (student deferred to teacher): ' + s.skipList.join(', '));
  if (s.reviewItems && s.reviewItems.length > 0) parts.push('⚠️ QUIZ MISTAKES — student got these wrong in their last quiz, address them this lesson: ' + s.reviewItems.join(' | '));
  return parts.join(' | ');
})()}

${userProfile.lessonContext ? 'LESSON PATH: Teach EXACTLY "' + userProfile.lessonContext + '" — nothing else this session.' : ''}

SKIP: If student says skip/my teacher/too hard → 1 warm line + [SKIP: topic] on its own line + teach something else.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RULE #2 — [TEACH] LENGTH: MAX 3 SENTENCES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[TEACH] = 3 sentences of explanation MAX, then the structured content, then stop.
Cut: "Great question!", "Let's dive in!", "As we learned...", "Today we'll explore...", "I'm so glad you asked!"
Cut: all meta-commentary, all filler, all padding.
Start directly with the teaching. Every word must earn its place.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RULE #3 — VISUAL STRUCTURE: TABLES AND GRIDS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Use markdown pipe tables for ALL structured content. Scannable beats wall of text.

CONJUGATION TABLE (any time you show 2+ verb forms):
| Person | Hebrew | Trans. | Meaning |
|--------|--------|--------|---------|
| אֲנִי | כָּתַבְתִּי | katavti | I wrote |
| אַתָּה | כָּתַבְתָּ | katavta | you wrote (m) |
| אַתְּ | כָּתַבְתְּ | katavt | you wrote (f) |

VOCABULARY TABLE (any time you introduce 2+ words):
| Hebrew | Trans. | English | Notes |
|--------|--------|---------|-------|
| **אָב** | av | father | m. noun |
| **אֵם** | em | mother | f. noun |

SINGLE WORD format: **כָּתַב** (*katav*) — "he wrote" [verb, Pa'al past]

GRAMMAR PATTERN format:
**Pattern:** [description]
**Shape:** [formula]
**Example:** **Hebrew** (*trans*) — "meaning"

NEVER write a paragraph of examples when a table fits. No walls of text.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RULE #4 — [TEACH] MUST ALWAYS BE FOLLOWED BY [CHALLENGE]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Every [TEACH] block MUST be immediately followed by a [CHALLENGE] block in the SAME response. No exceptions. Never end a response with [TEACH] alone — the student must always have something to interact with.

❌ WRONG — [TEACH] ends the response with no [CHALLENGE]:
[TEACH]
שָׁלוֹם (shalom) means peace, hello, and goodbye.
[/TEACH]
← response ends here. Student is stuck — nothing to tap, no way to advance.

✅ CORRECT — [CHALLENGE] always follows [TEACH] immediately:
[TEACH]
שָׁלוֹם (shalom) means peace, hello, and goodbye — one word, three uses.
[/TEACH]
[CHALLENGE]
{"type":"multiple_choice","question":"How many meanings does שָׁלוֹם have?","options":["One","Two","Three","Four"],"correct":2,"explanation":"שָׁלוֹם = peace, hello, AND goodbye — three meanings from one root שׁ-ל-מ."}
[/CHALLENGE]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FORMAT — REQUIRED STRUCTURE EVERY RESPONSE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[TEACH]
≤3 sentences explanation. Then table/pattern/examples. No filler. No options.
[/TEACH]
[CHALLENGE]
{"type":"multiple_choice","question":"...","options":["A","B","C","D"],"correct":0,"explanation":"..."}
[/CHALLENGE]
📚 WORDS LEARNED: [{"hebrew":"...","transliteration":"...","english":"...","points":10,"category":"noun"}]

CHALLENGE TYPES:
- new word → multiple_choice (4 options)
- recall/review → fill_blank (with answer field)
- grammar rule → true_false (statement + correct: true/false)
- 3+ words → match (pairs array: [{heb:"...",eng:"..."}])
JSON on ONE line inside [CHALLENGE]. Nothing else in that block.

${isAdvanced
  ? `FILL_BLANK ANSWER FIELD — ADVANCED STUDENTS:
For this advanced student, fill_blank "answer" fields MAY be Hebrew script — they are expected to type or speak Hebrew directly.
• Production drills ("Write the Pa'al past of כ-ת-ב, 1sg") → answer: "כָּתַבְתִּי"
• Always include the transliteration in "hint": {"answer":"כָּתַבְתִּי","hint":"katavti"}
• The app accepts Hebrew input and strips nikud for comparison — minor vowel-point differences are forgiven.
• Still use Latin/English for pure-meaning questions ("What does X mean?" → answer: "he wrote").`
  : `FILL_BLANK ANSWER FIELD — MUST BE TYPEABLE:
The "answer" field must contain only text the student can physically type on a Latin/English keyboard.
• Transliteration question ("How do you say X in Hebrew?") → answer is Latin: "toda", "shalom"
• Meaning question ("What does X mean?") → answer is English: "peace", "thank you"
• NEVER put Hebrew characters in "answer" — put the Hebrew form in "hint" instead.`
}

RESULTS:
[RESULT: correct] → 1 short warm line + [TEACH] next concept + [CHALLENGE]
[RESULT: wrong] → 1 line correction + show correct answer + re-teach with table + [CHALLENGE]
[RESULT: self-corrected] → 1 validating line + [TEACH] next concept + [CHALLENGE]

WORDS LEARNED: emit after [/CHALLENGE] for every new word introduced. Category = verb/noun/adjective/greeting/number/phrase/preposition/adverb/other.

${timeAvail === '5 minutes' ? '⚡ 5 MIN: 1 sentence in [TEACH] only. One word. One [CHALLENGE]. Then stop.' : ''}

${
  userProfile.level === 'complete_beginner'
    ? 'FIRST MESSAGE: Warm one-line greeting to ' + name + ', then [TEACH] the first 3 letters: א (alef, silent — like the catch before "apple"), בּ (bet, b — as in "boy"), ב (vet, v — as in "vine"). Give name + sound + English anchor + one example word for each. Then [CHALLENGE].'
  : userProfile.level === 'some_exposure' || userProfile.level === 'basic'
    ? 'FIRST MESSAGE: Brief warm greeting to ' + name + ', then [TEACH] all 10 pronouns as a table (אֲנִי/אַתָּה/אַתְּ/הוּא/הִיא/אֲנַחְנוּ/אַתֶּם/אַתֶּן/הֵם/הֵן) with transliteration and meaning. Then [CHALLENGE] with a pronoun matching question.'
  : userProfile.level === 'intermediate'
    ? '🔴 FIRST MESSAGE MANDATORY: NO greeting. Open [TEACH] immediately with the full Pa\'al past-tense paradigm of כָּתַב — all 9 forms with transliteration. Then [CHALLENGE] asking student to produce a specific form.'
    : '🔴 FIRST MESSAGE MANDATORY: NO greeting. Open [TEACH] immediately with a binyan diagnostic: show the 7 binyan shapes and ask student to identify the binyan of a given verb form. Peer-level from word one.'
}`;
}

// ── Safety net: convert plain-text quiz options to [CHALLENGE] JSON ──────────
// Called on every /api/chat response before sending to the client.
// ─────────────────────────────────────────────────────────────────────────────
// THREE-LAYER NUCLEAR RESCUE — runs on EVERY AI response before it hits client.
//
// Layer 1 — scan every [CHALLENGE] block; if content is not valid JSON, extract
//            text options and convert to JSON. If extraction fails → fill_blank.
// Layer 2 — scan body (no [CHALLENGE] tag) for bare text options; wrap in JSON.
// Layer 3 — strip any residual option text that leaked into [TEACH] blocks.
//
// Logs every interception to Vercel console so issues are visible.
// ─────────────────────────────────────────────────────────────────────────────

// Matches: "A) text", "a. text", "1) text", "(A) text", "**A)** text",
//          "A: text", "Option A: text", "Choice 1: text"
const _OPT_RE = /^[ \t]*(?:\*{0,2}[ \t]*)?(?:\(?[ \t]*)?([A-Da-d1-4])(?:[ \t]*\)?)?[ \t]*[.):\-][ \t]*\*{0,2}(.+)$/;

function _parseOptionKey(k) {
  k = k.toLowerCase();
  return /[a1]/.test(k) ? 0 : /[b2]/.test(k) ? 1 : /[c3]/.test(k) ? 2 : 3;
}

function _extractOptions(text) {
  const lines = text.split('\n');
  const opts = []; let blockStart = -1, blockEnd = -1, run = 0;
  for (let i = 0; i < lines.length; i++) {
    // Also catch "Option A: text" and "Choice 1: text" variants
    const optionLabel = /^[ \t]*(?:option|choice)[ \t]+([A-Da-d1-4])[.):\s][ \t]*(.+)$/i.exec(lines[i]);
    const standard    = _OPT_RE.exec(lines[i]);
    const m = optionLabel || standard;
    if (m) {
      if (run === 0) blockStart = i;
      run++; blockEnd = i;
      opts.push((optionLabel ? m[2] : m[2]).replace(/\*+/g, '').trim());
    } else {
      if (run >= 2) break;
      run = 0; blockStart = -1; blockEnd = -1; opts.length = 0;
    }
  }
  if (opts.length < 2) return null;
  let question = 'Choose the correct answer:';
  for (let i = blockStart - 1; i >= 0; i--) {
    const t = lines[i].replace(/^\*+|\*+$/g, '').trim();
    if (t && !_OPT_RE.test(lines[i])) { question = t; break; }
  }
  const afterText = lines.slice(blockEnd + 1).join('\n');
  const cm = afterText.match(/(?:correct(?:\s+answer)?|answer)\s*[:\-]?\s*\**([A-Da-d1-4])\**/i);
  const correct = cm ? _parseOptionKey(cm[1]) : 0;
  return { blockStart, blockEnd, question, options: opts.slice(0, 4), correct };
}

function _buildMCJson(question, options, correct) {
  return JSON.stringify({
    type: 'multiple_choice', question,
    options, correct,
    explanation: options[correct] || ''
  });
}

function _rescueTextChallenge(raw) {
  let result = raw;
  let interceptCount = 0;

  // ── LAYER 1: Fix every [CHALLENGE] block that lacks valid JSON ───────────────
  result = result.replace(/\[CHALLENGE\]([\s\S]*?)\[\/CHALLENGE\]/g, (match, inner) => {
    const trimmed = inner.trim();

    // Already valid JSON with a type field → untouched
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && parsed.type) return match;
    } catch (_) {}

    // JSON object buried in surrounding prose
    const jm = trimmed.match(/\{[\s\S]*?"type"[\s\S]*?\}/);
    if (jm) {
      try {
        const parsed = JSON.parse(jm[0]);
        if (parsed && parsed.type) {
          interceptCount++;
          console.log('[RESCUE-L1] Extracted buried JSON from [CHALLENGE] block');
          return `[CHALLENGE]\n${jm[0]}\n[/CHALLENGE]`;
        }
      } catch (_) {}
    }

    // Plain text options inside [CHALLENGE]
    const extracted = _extractOptions(trimmed);
    if (extracted) {
      interceptCount++;
      const json = _buildMCJson(extracted.question, extracted.options, extracted.correct);
      console.log(`[RESCUE-L1] Converted text options inside [CHALLENGE] → MC JSON. Q="${extracted.question.slice(0,60)}"`);
      return `[CHALLENGE]\n${json}\n[/CHALLENGE]`;
    }

    // Cannot rescue — replace with safe fill_blank
    interceptCount++;
    const qLine = trimmed.split('\n').find(l => l.trim().length > 8) || 'What did you just learn?';
    const json = JSON.stringify({ type: 'fill_blank', question: qLine.replace(/^\*+|\*+$/g,'').trim(), answer: '__any__', explanation: '' });
    console.log(`[RESCUE-L1] Unrescueable [CHALLENGE] → fill_blank. Content was: ${trimmed.slice(0,80)}`);
    return `[CHALLENGE]\n${json}\n[/CHALLENGE]`;
  });

  // ── LAYER 2: Convert bare text options (no [CHALLENGE] wrapper at all) ───────
  if (!/\[CHALLENGE\]/.test(result)) {
    const extracted = _extractOptions(result);
    if (extracted) {
      interceptCount++;
      const { blockStart, blockEnd, question, options, correct } = extracted;
      const lines = result.split('\n');
      let endLine = blockEnd + 1;
      while (endLine < lines.length && /(?:correct|answer)\s*[:\-]?\s*[A-Da-d1-4]/i.test(lines[endLine])) endLine++;
      const teachLines = lines.slice(0, Math.max(0, blockStart - 1));
      const afterLines = lines.slice(endLine).filter(l => !/^[ \t]*(?:answer|correct)\s*[:\-]/i.test(l));
      const json = _buildMCJson(question, options, correct);
      console.log(`[RESCUE-L2] Bare text options → [CHALLENGE] JSON. Q="${question.slice(0,60)}"`);
      const teachContent = teachLines.join('\n').trim();
      const afterContent = afterLines.join('\n').trim();
      const parts = [];
      if (teachContent) parts.push(/^\[TEACH\]/.test(teachContent) ? teachContent : `[TEACH]\n${teachContent}\n[/TEACH]`);
      parts.push(`[CHALLENGE]\n${json}\n[/CHALLENGE]`);
      if (afterContent) parts.push(afterContent);
      result = parts.join('\n');
    }
  }

  // ── LAYER 3: Strip option residue from [TEACH] sections ─────────────────────
  result = result.replace(/\[TEACH\]([\s\S]*?)\[\/TEACH\]/g, (match, inner) => {
    const cleaned = inner
      .replace(/^[ \t]*\*{0,2}[ \t]*[A-Da-d1-4][ \t]*\*{0,2}[.):\-][ \t]*\*{0,2}.+$/gm, '')
      .replace(/^[ \t]*\(?[A-Da-d1-4]\)[ \t]+.+$/gm, '')
      .replace(/^[ \t]*(?:option|choice)[ \t]+[A-Da-d1-4][.):\s].+$/gim, '')
      .replace(/^[ \t]*(?:answer|correct\s+answer)\s*[:\-]\s*[A-Da-d1-4].*/gim, '')
      .replace(/\n{3,}/g, '\n\n').trim();
    if (cleaned !== inner.trim()) {
      interceptCount++;
      console.log('[RESCUE-L3] Stripped option text from [TEACH] block');
    }
    return `[TEACH]\n${cleaned}\n[/TEACH]`;
  });

  if (interceptCount > 0) {
    console.log(`[RESCUE] ✓ ${interceptCount} interception(s) — response sanitized before delivery`);
  }
  return result;
}

// ── GET /api/version — instant deployment check ─────────────────────────────
app.get('/api/version', (req, res) => {
  res.json({ version: 'v9.4', deployed: new Date().toISOString(), ok: true });
});

app.post('/api/chat', async (req, res) => {
  const { messages, userProfile, myClass } = req.body;

  if (!userProfile || typeof userProfile !== 'object') {
    console.error('[API] Missing or invalid userProfile in request body');
    return res.status(400).json({ error: 'bad_request', message: 'userProfile is required' });
  }

  const provider = selectProvider(userProfile);
  const envKey   = provider === 'anthropic' ? process.env.ANTHROPIC_API_KEY : process.env.GROQ_API_KEY;
  if (!envKey) {
    console.error(`[API] No API key for provider "${provider}"`);
    return res.status(401).json({ error: 'NO_API_KEY' });
  }

  // Normalise level — guard against null/undefined/stale values from old localStorage
  const VALID_LEVELS = ['complete_beginner','some_exposure','basic','intermediate','advanced'];
  if (!VALID_LEVELS.includes(userProfile.level)) {
    console.warn(`[API] Invalid level "${userProfile.level}" — defaulting to complete_beginner`);
    userProfile.level = 'complete_beginner';
  }

  let systemPrompt;
  try {
    systemPrompt = buildSystemPrompt(userProfile, myClass || null);
  } catch (promptErr) {
    console.error('[API] buildSystemPrompt threw:', promptErr.message);
    return res.status(500).json({ error: 'server_error', message: 'Failed to build system prompt: ' + promptErr.message });
  }

  // Trim to last 6 messages — system prompt is ~3 100 tokens (post-v9.38 trim);
  // 6 msgs (~1 350 tokens) + prompt + 900 output ≈ 5 400 total, under 8b TPM=6 000.
  const msgList = messages.slice(-6).map(m => ({ role: m.role, content: m.content }));
  console.log(`[API] provider=${provider} level=${userProfile.level} qaMode=${!!userProfile.qaMode} msgs=${messages.length} sent=${msgList.length} topic=${userProfile.currentTopic||'none'}`);

  // max_tokens 900: rich TEACH (≤600 tokens) + [CHALLENGE] JSON (≤200 tokens) + WORDS LEARNED (≤80 tokens).
  // Combined with ~12K input tokens (system prompt + 8-msg history), each call can approach 13K total.
  // Daily budget on llama-3.3-70b is 100K — roughly 7-8 full Morah exchanges per day.
  // If Vercel logs show frequent [TEACH]-without-[CHALLENGE] warnings, raise further OR switch to 8b.
  try {
    const raw     = await callAI(provider, systemPrompt, msgList, 900);
    let   content = _rescueTextChallenge(raw);
    if (content !== raw) console.log('[API] Rescued text-based options → interactive [CHALLENGE]');

    // Backstop: [TEACH] present but no [CHALLENGE] at all — inject a minimal fill_blank so the
    // client always gets an interactive widget. Log every occurrence for Vercel monitoring.
    if (/\[TEACH\]/.test(content) && !/\[CHALLENGE\]/.test(content)) {
      console.warn('[API] [TEACH] without [CHALLENGE] — injecting fallback fill_blank (monitor frequency)');
      content += '\n[CHALLENGE]\n'
        + JSON.stringify({ type: 'fill_blank', question: 'What did you just learn?', answer: '__any__', explanation: '' })
        + '\n[/CHALLENGE]';
    }

    res.json({ content });
  } catch (error) {
    const status = error.status === 429 ? 429 : 500;
    const code   = error.status === 429 ? 'rate_limit' : 'server_error';
    const detail = error.message || String(error);
    console.error(`[API] ${provider} error (status=${error.status}): ${detail}`);
    res.status(status).json({ error: code, message: detail });
  }
});

app.post('/api/feedback', async (req, res) => {
  const { rating, positive, improve, other, userProfile, lessonSummary } = req.body || {};
  console.log('[feedback] rating=%s user=%s lesson=%s positive=%s improve=%s other=%s',
    rating, userProfile?.name || 'anon', lessonSummary, positive, improve, other);
  res.json({ success: true, message: 'Todah rabah! Thank you for your feedback!' });
});

// ── POST /api/quiz — generate 10 interactive quiz questions ──────────────────
app.post('/api/quiz', async (req, res) => {
  const { topic, level, wordsLearned } = req.body || {};
  if (!process.env.GROQ_API_KEY) return res.status(401).json({ error: 'NO_API_KEY' });

  const topicLabel = {
    vocabulary:   'Hebrew vocabulary — meaning of words, Hebrew↔English translation',
    verbs:        "Hebrew verbs — present tense all 4 forms (m.sg / f.sg / m.pl / f.pl)",
    past_tense:   "Hebrew Pa'al past tense — full 9-form suffix paradigm",
    future_tense: "Hebrew Pa'al future tense — prefix system, all forms",
    binyanim:     'Hebrew binyanim — identifying and using all 7 verb patterns',
    random:       'Mixed Hebrew — vocabulary, verbs, grammar, sentence structure'
  }[topic] || 'Hebrew vocabulary';

  const levelGuide = {
    complete_beginner: 'aleph-bet, שָׁלוֹם תּוֹדָה כֵּן לֹא, numbers 1–5',
    some_exposure:     'pronouns (אֲנִי אַתָּה הוּא הִיא), present tense basics, family words',
    basic:             'present tense all 4 forms, basic past tense, adjectives, prepositions',
    intermediate:      'full past + future conjugations, binyanim identification, negation',
    advanced:          'all 7 binyanim, construct state, idioms, register differences'
  }[level] || 'basic Hebrew';

  const wordList = (wordsLearned || []).slice(0, 20).join(', ');

  const prompt = `You are a Hebrew quiz generator for the Kesher Ivrit app.
Generate exactly 10 quiz questions as a JSON array.

Student level: ${level || 'basic'} — appropriate content: ${levelGuide}
Topic: ${topicLabel}
${wordList ? `Words the student has learned (use these where possible): ${wordList}` : ''}

CRITICAL OUTPUT RULES:
- Return ONLY a valid JSON array — no markdown, no code fences, no text outside the brackets
- Array must contain exactly 10 objects
- Mix: at least 5 multiple_choice + at least 2 fill_blank + at least 1 match (3 pairs)
- Questions test knowledge only — no teaching, no hints in the question itself
- Explanation: 1 short sentence revealing the answer with Hebrew + transliteration

Exact schemas to use:
{"type":"multiple_choice","question":"What does אָב mean?","options":["Father","Mother","Brother","Son"],"correct":0,"explanation":"אָב (av) = father, a core family noun (masculine)"}
{"type":"fill_blank","question":"Write 'she wrote' in Hebrew (Pa'al past, root כ-ת-ב)","answer":"כָּתְבָה","hint":"3rd person feminine singular","explanation":"כָּתְבָה (katva) = she wrote — Pa'al past 3f.sg suffix is ָה-"}
{"type":"match","instruction":"Match each Hebrew word to its English meaning","pairs":[{"heb":"אָב","eng":"father"},{"heb":"אֵם","eng":"mother"},{"heb":"אָח","eng":"brother"}]}

Generate 10 high-quality, linguistically accurate questions. Return ONLY the JSON array, starting with [ and ending with ].`;

  try {
    const r = await groq.chat.completions.create({
      model:       GROQ_CHAT_MODEL,
      max_tokens:  2000,
      temperature: 0.3,
      messages:    [{ role: 'user', content: prompt }]
    });

    const raw = r.choices[0].message.content.trim();
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) throw new Error('No JSON array in response');

    let questions = JSON.parse(match[0]);
    if (!Array.isArray(questions) || questions.length === 0) throw new Error('Invalid questions array');

    // Normalise and validate each question
    questions = questions.slice(0, 10).filter(q => q && q.type && (q.question || q.instruction));

    console.log(`[Quiz] Generated ${questions.length} questions for topic=${topic} level=${level}`);
    res.json({ questions });
  } catch (e) {
    console.error('[Quiz] Generation error:', e.message);
    res.status(500).json({ error: 'Quiz generation failed', message: e.message });
  }
});

app.post('/api/tooltip', async (req, res) => {
  const { word } = req.body;
  const apiKey = process.env.GROQ_API_KEY || req.headers['x-api-key'];
  if (!apiKey) return res.status(401).json({ error: 'NO_API_KEY' });
  if (!word || word.trim().length === 0 || word.length > 60) return res.status(400).json({ error: 'Invalid word' });

  try {
    const client = apiKey === process.env.GROQ_API_KEY ? groq : new Groq({ apiKey });
    const response = await client.chat.completions.create({
      model:      GROQ_LIGHT_MODEL,
      max_tokens: 80,
      messages: [{
        role: 'user',
        content: `Hebrew word or phrase: "${word.trim()}"\nReply with ONLY a JSON object, no other text:\n{"transliteration":"...","english":"...","partOfSpeech":"noun/verb/adjective/phrase/etc"}`
      }]
    });
    const raw = response.choices[0].message.content;
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return res.status(500).json({ error: 'Parse error' });
    res.json(JSON.parse(match[0]));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/status', (req, res) => {
  const groqKey      = process.env.GROQ_API_KEY      || '';
  const anthropicKey = process.env.ANTHROPIC_API_KEY || '';
  res.json({
    configured:       !!(groqKey || anthropicKey),
    groq:             { configured: !!groqKey,      model: `${GROQ_CHAT_MODEL} / ${GROQ_LIGHT_MODEL}`, routes: 'standard lessons / tooltip' },
    anthropic:        { configured: !!anthropicKey, model: 'claude-sonnet-4-6',  routes: 'QA mode, bar_mitzvah, bible, prayer' },
    push:             { ready: webpushReady, vapidPublicKey: !!_vapidPublic, vapidPrivateKey: !!_vapidPrivate, vapidEmail: !!_vapidEmail, setupError: webpushError },
    nodeVersion:      process.version,
    environment:      process.env.VERCEL ? 'vercel' : 'local',
    timestamp:        new Date().toISOString()
  });
});


// ── PUSH NOTIFICATIONS ───────────────────────────────────────────────────────

// GET /api/push/vapid-public-key
// Returns the VAPID public key so the frontend can call pushManager.subscribe().
app.get('/api/push/vapid-public-key', (req, res) => {
  if (!webpushReady) return res.status(503).json({ error: 'Push not configured' });
  res.json({ publicKey: _vapidPublic });
});

// POST /api/push/subscribe
// Saves (or refreshes) a browser push subscription for a user.
// Body: { subscription: { endpoint, keys: { p256dh, auth } }, userId: "uuid-or-null" }
app.post('/api/push/subscribe', async (req, res) => {
  if (!dbRequired(res)) return;
  const { subscription, userId } = req.body || {};
  if (!subscription || !subscription.endpoint || !subscription.keys) {
    return res.status(400).json({ error: 'subscription.endpoint and subscription.keys are required' });
  }
  const { p256dh, auth } = subscription.keys;
  if (!p256dh || !auth) {
    return res.status(400).json({ error: 'subscription.keys.p256dh and .auth are required' });
  }

  const row = {
    endpoint:     subscription.endpoint,
    p256dh:       p256dh,
    auth:         auth,
    user_agent:   (req.headers['user-agent'] || '').slice(0, 300),
    last_used_at: new Date().toISOString(),
  };
  if (userId) row.user_id = userId;

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert(row, { onConflict: 'endpoint' });

  if (error) {
    console.error('[Push] subscribe upsert error:', error.message);
    return res.status(500).json({ error: error.message });
  }
  console.log('[Push] subscription saved, userId:', userId || '(anonymous)');
  res.json({ ok: true });
});

// DELETE /api/push/unsubscribe
// Removes a push subscription by endpoint.
// Body: { endpoint: "https://..." }
app.delete('/api/push/unsubscribe', async (req, res) => {
  if (!dbRequired(res)) return;
  const { endpoint } = req.body || {};
  if (!endpoint) return res.status(400).json({ error: 'endpoint is required' });

  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('endpoint', endpoint);

  if (error) {
    console.error('[Push] unsubscribe delete error:', error.message);
    return res.status(500).json({ error: error.message });
  }
  console.log('[Push] subscription removed');
  res.json({ ok: true });
});

// POST /api/push/test
// Sends a test push notification to all subscriptions for a given userId.
// GATED: requires x-test-push-secret header matching TEST_PUSH_SECRET env var.
// We use a secret header rather than NODE_ENV because Vercel always sets
// NODE_ENV=production, which would make a NODE_ENV check useless on the deployed app.
// Body: { userId: "uuid", title: "...", body: "..." }
app.post('/api/push/test', async (req, res) => {
  const secret = process.env.TEST_PUSH_SECRET || '';
  if (!secret || req.headers['x-test-push-secret'] !== secret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (!dbRequired(res)) return;
  if (!webpushReady) return res.status(503).json({ error: 'Push not configured — VAPID keys missing' });

  const { userId, title, body } = req.body || {};
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  const { data: subs, error } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('user_id', userId);

  if (error) return res.status(500).json({ error: error.message });
  if (!subs || subs.length === 0) return res.json({ sent: 0, failed: 0, message: 'No subscriptions found for this user' });

  const payload = JSON.stringify({
    title: title || 'Kesher Ivrit — Test',
    body:  body  || 'Push notifications are working! 🇮🇱',
    tag:   'test',
    url:   '/',
  });

  let sent = 0, failed = 0;
  const errors = [];
  await Promise.all(subs.map(async sub => {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      );
      sent++;
    } catch (e) {
      failed++;
      errors.push({ endpoint: sub.endpoint.slice(0, 60) + '...', error: e.message });
      // 410 Gone = browser unregistered the subscription; clean it up
      if (e.statusCode === 410) {
        await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
        console.log('[Push] auto-removed stale subscription (410)');
      }
    }
  }));

  console.log(`[Push] test result: ${sent} sent, ${failed} failed`);
  res.json({ sent, failed, errors });
});

// ── end push notifications ────────────────────────────────────────────────────

// ── POST /api/transcribe — Groq Whisper STT for challenge voice input ─────────
// Body (JSON): { audio: "<base64>", mimeType: "audio/mp4" | "audio/webm" | ... }
// Response:   { text: "שָׁלוֹם" }
// Accepts whatever MediaRecorder outputs — iOS → mp4, Chrome/FF → webm/ogg.
app.post('/api/transcribe', async (req, res) => {
  const { audio, mimeType, language } = req.body || {};
  if (!audio)                    return res.status(400).json({ error: 'audio is required' });
  if (!process.env.GROQ_API_KEY) return res.status(503).json({ error: 'Transcription not configured' });

  try {
    const buffer = Buffer.from(audio, 'base64');
    const ext = mimeType && mimeType.includes('mp4') ? 'mp4'
              : mimeType && mimeType.includes('ogg') ? 'ogg'
              : mimeType && mimeType.includes('wav') ? 'wav'
              : 'webm';
    const file   = await toFile(buffer, `recording.${ext}`, { type: mimeType || 'audio/webm' });
    const result = await groq.audio.transcriptions.create({
      file,
      model:           'whisper-large-v3-turbo',
      response_format: 'json',
      ...(language ? { language } : {}),
    });
    const text = (result.text || '').trim();
    console.log(`[Transcribe] OK — ${buffer.length}B ${ext} → "${text.slice(0, 60)}${text.length > 60 ? '…' : ''}"`);
    res.json({ text });
  } catch (e) {
    const status = e.status === 429 ? 429 : 500;
    console.error('[Transcribe] error:', e.status, e.message);
    res.status(status).json({ error: e.message || 'Transcription failed' });
  }
});

// ── DELETE /api/account — permanent account deletion ─────────────────────────
// Body: { userId, secretWord }
// Verifies secret_hash before deleting. All child rows cascade automatically.
app.delete('/api/account', async (req, res) => {
  if (!dbRequired(res)) return;
  const { userId, secretWord } = req.body || {};
  if (!userId || !secretWord) {
    return res.status(400).json({ error: 'userId and secretWord are required' });
  }

  try {
    const { data: user, error: fetchErr } = await supabase
      .from('users')
      .select('id, first_name, secret_hash')
      .eq('id', userId)
      .maybeSingle();

    if (fetchErr) throw fetchErr;
    if (!user)            return res.status(404).json({ error: 'Account not found' });
    if (!user.secret_hash) return res.status(401).json({ error: 'Account has no secret word set' });

    const match = await bcrypt.compare(secretWord.trim(), user.secret_hash);
    if (!match) return res.status(401).json({ error: 'Wrong secret word — try again' });

    const { error: delErr } = await supabase.from('users').delete().eq('id', userId);
    if (delErr) throw delErr;

    console.log(`[Account Delete] userId=${userId} (${user.first_name}) deleted at ${new Date().toISOString()}`);
    res.json({ ok: true });
  } catch (err) {
    console.error('[Account Delete] error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🇮🇱 Kesher Ivrit is running!`);
  console.log(`📖 Open http://localhost:${PORT} in your browser\n`);
});
