/* Authentication: mobile + password or OTP, registration for every portal, sessions, rate limits, audit logs. */
const crypto = require('crypto');
const STATES = ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Andaman and Nicobar Islands','Chandigarh','Dadra and Nagar Haveli and Daman and Diu','Delhi','Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry'];
const ROLES = ['farmer', 'buyer', 'consumer', 'logistics', 'admin'];
const BIZ = ['Hotel', 'Restaurant', 'Retailer', 'Institution', 'Processor', 'Wholesaler', 'Other'];
const VEHICLES = ['Bike', 'Auto', 'Mini truck', 'Truck'];
const SESSION_DAYS = +process.env.SESSION_DAYS || 7;
const TERMS_VERSION = '2026-10';
const COOL = Math.max(1, +process.env.OTP_COOLDOWN_SEC || 30);

const normMobile = (m) => { let s = String(m || '').replace(/[\s\-()]/g, ''); s = s.replace(/^\+?91/, '').replace(/^0/, ''); return /^[6-9]\d{9}$/.test(s) ? s : null; };
const clean = (v, max = 120) => String(v == null ? '' : v).replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, max);
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');

function hashPassword(pw) { const salt = crypto.randomBytes(16).toString('hex'); return `scrypt$${salt}$${crypto.scryptSync(pw, salt, 64).toString('hex')}`; }
function checkPassword(pw, stored) { const [, salt, h] = String(stored || '').split('$'); if (!salt) return false; const a = Buffer.from(crypto.scryptSync(pw, salt, 64).toString('hex')), b = Buffer.from(h); return a.length === b.length && crypto.timingSafeEqual(a, b); }
function passwordProblem(pw, role) {
  const min = role === 'admin' ? 10 : 8;
  if (typeof pw !== 'string' || pw.length < min) return `Password must be at least ${min} characters`;
  if (pw.length > 100) return 'Password is too long';
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return 'Password must contain letters and numbers';
  if (/^(password|12345678|qwerty)/i.test(pw)) return 'Password is too common';
  return null;
}

/* ---- per-role registration rules (the browser mirrors these for instant feedback) ---- */
function validateProfile(role, b) {
  const e = {}; const p = {};
  const need = (k, label, min = 2, max = 120) => { p[k] = clean(b[k], max); if (p[k].length < min) e[k] = `${label} is required`; };
  const pin = () => { p.pincode = clean(b.pincode, 6); if (!/^[1-9]\d{5}$/.test(p.pincode)) e.pincode = 'Enter a valid 6-digit PIN code'; };
  const state = () => { p.state = clean(b.state, 60); if (!STATES.includes(p.state)) e.state = 'Choose your state'; };
  if (role === 'farmer') {
    state(); need('district', 'District'); p.village = clean(b.village, 80); pin();
    if (b.acres !== undefined && b.acres !== '') { const a = Number(b.acres); if (!(a >= 0 && a <= 10000)) e.acres = 'Land size must be between 0 and 10000 acres'; else p.acres = a; }
    p.crops = (Array.isArray(b.crops) ? b.crops : []).map((c) => clean(c, 30)).filter(Boolean).slice(0, 13);
  } else if (role === 'buyer') {
    need('businessName', 'Business name', 2, 100); p.businessType = BIZ.includes(b.businessType) ? b.businessType : (e.businessType = 'Choose business type', '');
    need('contactName', 'Contact person'); need('designation', 'Designation', 2, 60); need('address', 'Address', 5, 200); need('city', 'City'); state(); pin();
    p.email = clean(b.email, 100); if (p.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(p.email)) e.email = 'Enter a valid email';
    p.gstin = clean(b.gstin, 15).toUpperCase(); if (p.gstin && !/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(p.gstin)) e.gstin = 'Enter a valid 15-character GSTIN';
    p.deliveryWindow = clean(b.deliveryWindow, 30) || '6-9 AM';
  } else if (role === 'consumer') {
    need('address', 'Address', 5, 200); need('city', 'City'); state(); pin();
  } else if (role === 'logistics') {
    p.vehicleType = VEHICLES.includes(b.vehicleType) ? b.vehicleType : (e.vehicleType = 'Choose vehicle type', '');
    p.vehicleNumber = clean(b.vehicleNumber, 15).toUpperCase().replace(/\s+/g, ' ');
    if (!/^[A-Z]{2}\s?\d{1,2}\s?[A-Z]{0,3}\s?\d{4}$/.test(p.vehicleNumber)) e.vehicleNumber = 'Enter a valid vehicle number, e.g. DL 01 AB 1234';
    p.licenseNumber = clean(b.licenseNumber, 20).toUpperCase(); if (!/^[A-Z0-9][A-Z0-9 \-]{7,19}$/.test(p.licenseNumber)) e.licenseNumber = 'Enter your driving licence number';
    need('city', 'City / operating area'); state();
  }
  return { errors: e, profile: p };
}

const publicUser = (u) => ({ id: u._id, role: u.role, name: u.name, mobile: u.mobile, lang: u.lang || 'en', profile: u.profile || {}, adminRole: u.adminRole || null, status: u.status, createdAt: u.createdAt });

function createAuth({ db, sms, env, send, readBody }) {
  const isProd = env.NODE_ENV === 'production';
  const pepper = env.OTP_SECRET || crypto.randomBytes(16).toString('hex');
  const ipOf = (req) => (env.TRUST_PROXY === '1' && req.headers['x-forwarded-for'] ? String(req.headers['x-forwarded-for']).split(',')[0].trim() : req.socket.remoteAddress) || 'unknown';

  async function log(event, ctx = {}, meta = {}, level = 'info') {
    const e = { ts: new Date(), level, event, userId: ctx.userId || null, role: ctx.role || null, ip: ctx.ip || null, meta };
    try { await db.logs.insert({ ...e }); } catch (err) { console.error('[log]', err.message); }
    try { await db.kv.lpush('logs:recent', { ...e, ts: e.ts.toISOString() }, 500); } catch (err) {}
    if (env.LOG_STDOUT !== '0') console.log(JSON.stringify({ ...e, ts: e.ts.toISOString() }));
  }
  async function rateLimit(name, id, max, windowSec) { const n = await db.kv.incr(`rl:${name}:${id}`, windowSec); return n <= max; }

  async function sendOtp(req, res, { mobile, role, purpose }) {
    const ip = ipOf(req);
    if (await db.kv.get(`otpcd:${mobile}`)) return send(res, 429, { ok: false, error: 'Please wait before requesting another OTP', resendIn: await db.kv.ttl(`otpcd:${mobile}`) });
    if (!(await rateLimit('otp-mobile', mobile, 5, 3600)) || !(await rateLimit('otp-ip', ip, 20, 3600))) { await log('otp.rate_limited', { ip }, { mobile }, 'warn'); return send(res, 429, { ok: false, error: 'Too many OTP requests. Try again in an hour.' }); }
    const otp = String(crypto.randomInt(100000, 1000000));
    await db.kv.set(`otp:${purpose}:${role}:${mobile}`, { h: sha(`${otp}:${mobile}:${pepper}`), tries: 0 }, 300);
    await db.kv.set(`otpcd:${mobile}`, 1, COOL);
    let r = {};
    try { r = await sms.send(mobile, otp, purpose); } catch (err) { await log('otp.send_failed', { ip }, { mobile, error: err.message }, 'error'); return send(res, 502, { ok: false, error: 'Could not send the OTP. Try again.' }); }
    await log('otp.sent', { ip, role }, { mobile, purpose });
    return send(res, 200, { ok: true, expiresIn: 300, resendIn: COOL, ...(r.dev && !isProd ? { devOtp: otp } : {}) });
  }
  async function checkOtp(role, mobile, purpose, otp, ip) {
    const key = `otp:${purpose}:${role}:${mobile}`; const rec = await db.kv.get(key);
    if (!rec) return { ok: false, error: 'OTP expired or not requested. Request a new one.' };
    if (rec.tries >= 5) { await db.kv.del(key); return { ok: false, error: 'Too many wrong attempts. Request a new OTP.' }; }
    if (rec.h !== sha(`${String(otp || '').trim()}:${mobile}:${pepper}`)) { rec.tries++; await db.kv.set(key, rec, Math.max(1, await db.kv.ttl(key))); await log('otp.wrong', { ip, role }, { mobile, purpose }, 'warn'); return { ok: false, error: 'Incorrect OTP' }; }
    await db.kv.del(key); return { ok: true };
  }
  async function newSession(user, req) {
    const token = crypto.randomBytes(32).toString('hex');
    await db.kv.set(`sess:${sha(token)}`, { userId: user._id, role: user.role }, SESSION_DAYS * 86400);
    await db.users.update(user._id, { lastLoginAt: new Date() });
    return token;
  }
  async function userFromReq(req) {
    const m = /^Bearer ([a-f0-9]{64})$/.exec(req.headers.authorization || ''); if (!m) return null;
    const s = await db.kv.get(`sess:${sha(m[1])}`); if (!s) return null;
    const u = await db.users.findOne({ _id: s.userId }); return u && u.status === 'active' ? u : null;
  }
  const noEnum = { ok: true, expiresIn: 300, resendIn: 30 };     // same answer whether or not the number is registered

  async function handle(req, res, u) {
    const ip = ipOf(req); const M = req.method;
    const body = M === 'POST' ? JSON.parse((await readBody(req)) || '{}') : {};
    const role = ROLES.includes(body.role) ? body.role : null;

    if (u === '/api/auth/otp/send' && M === 'POST') {
      const mobile = normMobile(body.mobile); const purpose = ['register', 'login', 'reset'].includes(body.purpose) ? body.purpose : null;
      if (!mobile) return send(res, 400, { ok: false, error: 'Enter a valid 10-digit mobile number', field: 'mobile' }), true;
      if (!role || !purpose || (role === 'admin' && purpose === 'register')) return send(res, 400, { ok: false, error: 'Invalid request' }), true;
      const exists = await db.users.findOne({ mobile, role });
      if (purpose === 'register') { if (exists) return send(res, 409, { ok: false, error: 'This mobile number is already registered. Please log in.', field: 'mobile' }), true; return await sendOtp(req, res, { mobile, role, purpose }), true; }
      if (!exists || exists.status !== 'active') { await log('otp.unknown_number', { ip, role }, { mobile, purpose }, 'warn'); return send(res, 200, noEnum), true; }
      return await sendOtp(req, res, { mobile, role, purpose }), true;
    }

    if (u === '/api/auth/register' && M === 'POST') {
      if (!role || role === 'admin') return send(res, 400, { ok: false, error: 'Invalid role' }), true;
      const errors = {}; const mobile = normMobile(body.mobile); if (!mobile) errors.mobile = 'Enter a valid 10-digit mobile number';
      const name = clean(body.name, 80); if (name.length < 2) errors.name = 'Full name is required';
      const pw = passwordProblem(body.password, role); if (pw) errors.password = pw;
      if (body.consent !== true) errors.consent = 'Please accept the Terms and Privacy Policy';
      const v = validateProfile(role, body.profile || {}); Object.assign(errors, v.errors);
      if (Object.keys(errors).length) return send(res, 422, { ok: false, error: 'Please correct the highlighted fields', errors }), true;
      const o = await checkOtp(role, mobile, 'register', body.otp, ip); if (!o.ok) return send(res, 400, { ok: false, error: o.error, field: 'otp' }), true;
      const id = 'u_' + crypto.randomBytes(8).toString('hex');
      const user = { _id: id, role, mobile, name, passwordHash: hashPassword(body.password), profile: v.profile, lang: clean(body.lang, 5) || 'en', status: 'active', createdAt: new Date(), lastLoginAt: null, consent: { acceptedAt: new Date(), version: TERMS_VERSION } };
      try { await db.users.insert(user); } catch (err) { if (err.code === 11000) return send(res, 409, { ok: false, error: 'This mobile number is already registered. Please log in.', field: 'mobile' }), true; throw err; }
      await log('user.registered', { userId: id, role, ip }, { mobile });
      return send(res, 201, { ok: true, token: await newSession(user, req), user: publicUser(user) }), true;
    }

    if (u === '/api/auth/login' && M === 'POST') {          // mobile + password
      const mobile = normMobile(body.mobile); if (!mobile || !role) return send(res, 400, { ok: false, error: 'Enter a valid mobile number' }), true;
      const lockKey = `lf:${role}:${mobile}`; if ((await db.kv.get(lockKey)) >= 5) { await log('login.locked', { ip, role }, { mobile }, 'warn'); return send(res, 429, { ok: false, error: 'Too many failed attempts. Try again in 15 minutes or log in with an OTP.' }), true; }
      if (!(await rateLimit('login-ip', ip, 40, 900))) return send(res, 429, { ok: false, error: 'Too many requests. Slow down.' }), true;
      const user = await db.users.findOne({ mobile, role });
      if (!user || user.status !== 'active' || !checkPassword(String(body.password || ''), user.passwordHash)) { await db.kv.incr(lockKey, 900); await log('login.failed', { ip, role, userId: user && user._id }, { mobile, method: 'password' }, 'warn'); return send(res, 401, { ok: false, error: 'Incorrect mobile number or password' }), true; }
      await db.kv.del(lockKey);
      if (role === 'admin') { await db.kv.set(`adminpw:${mobile}`, 1, 300); await sendOtp(req, res, { mobile, role, purpose: 'login' }); return true; }   // 2-step for admins
      await log('login.success', { userId: user._id, role, ip }, { method: 'password' });
      return send(res, 200, { ok: true, token: await newSession(user, req), user: publicUser(user) }), true;
    }

    if (u === '/api/auth/login/otp' && M === 'POST') {      // OTP login (admin: second step after password)
      const mobile = normMobile(body.mobile); if (!mobile || !role) return send(res, 400, { ok: false, error: 'Invalid request' }), true;
      if (role === 'admin' && !(await db.kv.get(`adminpw:${mobile}`))) return send(res, 401, { ok: false, error: 'Enter your password first' }), true;
      const user = await db.users.findOne({ mobile, role });
      const o = await checkOtp(role, mobile, 'login', body.otp, ip);
      if (!o.ok || !user || user.status !== 'active') { await log('login.failed', { ip, role }, { mobile, method: 'otp' }, 'warn'); return send(res, 401, { ok: false, error: o.ok ? 'Incorrect OTP' : o.error }), true; }
      await db.kv.del(`adminpw:${mobile}`);
      await log('login.success', { userId: user._id, role, ip }, { method: role === 'admin' ? 'password+otp' : 'otp' });
      return send(res, 200, { ok: true, token: await newSession(user, req), user: publicUser(user) }), true;
    }

    if (u === '/api/auth/password/reset' && M === 'POST') {
      const mobile = normMobile(body.mobile); if (!mobile || !role) return send(res, 400, { ok: false, error: 'Invalid request' }), true;
      const pw = passwordProblem(body.newPassword, role); if (pw) return send(res, 422, { ok: false, error: pw, errors: { password: pw } }), true;
      const user = await db.users.findOne({ mobile, role }); const o = await checkOtp(role, mobile, 'reset', body.otp, ip);
      if (!o.ok || !user) return send(res, 400, { ok: false, error: o.ok ? 'Incorrect OTP' : o.error, field: 'otp' }), true;
      await db.users.update(user._id, { passwordHash: hashPassword(body.newPassword) }); await db.kv.del(`lf:${role}:${mobile}`);
      await log('password.reset', { userId: user._id, role, ip }); return send(res, 200, { ok: true }), true;
    }

    if (u === '/api/auth/me' && M === 'GET') { const user = await userFromReq(req); return send(res, user ? 200 : 401, user ? { ok: true, user: publicUser(user) } : { ok: false }), true; }
    if (u === '/api/auth/logout' && M === 'POST') {
      const m = /^Bearer ([a-f0-9]{64})$/.exec(req.headers.authorization || ''); if (m) { const s = await db.kv.get(`sess:${sha(m[1])}`); await db.kv.del(`sess:${sha(m[1])}`); if (s) await log('logout', { userId: s.userId, role: s.role, ip }); }
      return send(res, 200, { ok: true }), true;
    }
    if (u === '/api/auth/profile' && M === 'POST') {          // user edits own name / language / profile
      const user = await userFromReq(req); if (!user) return send(res, 401, { ok: false }), true;
      const patch = {}; if (body.name) patch.name = clean(body.name, 80); if (body.lang) patch.lang = clean(body.lang, 5);
      if (body.profile && user.role !== 'admin') { const v = validateProfile(user.role, { ...user.profile, ...body.profile }); if (Object.keys(v.errors).length) return send(res, 422, { ok: false, errors: v.errors }), true; patch.profile = v.profile; }
      await db.users.update(user._id, patch); await log('profile.updated', { userId: user._id, role: user.role, ip }, { fields: Object.keys(patch) });
      return send(res, 200, { ok: true, user: publicUser({ ...user, ...patch }) }), true;
    }

    // ---- admin-only tools ----
    if (u === '/api/admin/logs' && M === 'GET') {
      const me = await userFromReq(req); if (!me || me.role !== 'admin') return send(res, 403, { ok: false }), true;
      const q = new URL(req.url, 'http://x').searchParams; const n = Math.min(+q.get('limit') || 100, 500);
      return send(res, 200, { ok: true, logs: q.get('event') ? await db.logs.recent(n, { event: q.get('event') }) : (await db.kv.lrange('logs:recent', n)).length ? await db.kv.lrange('logs:recent', n) : await db.logs.recent(n) }), true;
    }
    if (u === '/api/admin/users' && M === 'GET') {
      const me = await userFromReq(req); if (!me || me.role !== 'admin') return send(res, 403, { ok: false }), true;
      const r = new URL(req.url, 'http://x').searchParams.get('role'); return send(res, 200, { ok: true, users: (await db.users.list(r ? { role: r } : {}, 500)).map(publicUser) }), true;
    }
    if (u === '/api/admin/users/status' && M === 'POST') {
      const me = await userFromReq(req); if (!me || me.role !== 'admin') return send(res, 403, { ok: false }), true;
      if (!['active', 'blocked'].includes(body.status) || body.id === me._id) return send(res, 400, { ok: false }), true;
      await db.users.update(String(body.id), { status: body.status }); await log('admin.user_status', { userId: me._id, role: 'admin', ip }, { target: body.id, status: body.status }, 'warn');
      return send(res, 200, { ok: true }), true;
    }
    return false;
  }

  async function bootstrapAdmin() {
    const mobile = normMobile(env.ADMIN_MOBILE); if (!mobile || !env.ADMIN_PASSWORD) return;
    if (await db.users.findOne({ mobile, role: 'admin' })) return;
    const p = passwordProblem(env.ADMIN_PASSWORD, 'admin'); if (p) { console.error('[admin bootstrap] ' + p); return; }
    if (isProd && /ChangeMe/i.test(env.ADMIN_PASSWORD)) { console.error('[admin bootstrap] refusing the sample admin password in production; set your own ADMIN_PASSWORD'); return; }
    await db.users.insert({ _id: 'u_admin_' + crypto.randomBytes(4).toString('hex'), role: 'admin', mobile, name: clean(env.ADMIN_NAME, 80) || 'Super Admin', passwordHash: hashPassword(env.ADMIN_PASSWORD), profile: {}, adminRole: 'superadmin', lang: 'en', status: 'active', createdAt: new Date(), lastLoginAt: null });
    await log('admin.bootstrapped', {}, { mobile });
  }
  return { handle, userFromReq, bootstrapAdmin, log, rateLimit, ipOf, normMobile };
}
module.exports = { createAuth, validateProfile, normMobile, STATES };
