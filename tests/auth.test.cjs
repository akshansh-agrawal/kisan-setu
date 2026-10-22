/* Authentication tests (file + in-memory drivers; no MongoDB/Redis needed). Run: npm test */
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const { spawn } = require('node:child_process');
const ROOT = path.join(__dirname, '..'), PORT = 18801, U = `http://localhost:${PORT}`;
let srv;
const post = async (p, body, token) => { const r = await fetch(U + p, { method: 'POST', headers: { 'content-type': 'application/json', ...(token ? { authorization: 'Bearer ' + token } : {}) }, body: JSON.stringify(body) }); return { status: r.status, ...(await r.json()) }; };
const get = async (p, token) => { const r = await fetch(U + p, { headers: token ? { authorization: 'Bearer ' + token } : {} }); return { status: r.status, ...(await r.json()) }; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const farmer = { name: 'Test Farmer', password: 'Harvest2026', consent: true, lang: 'hi', profile: { state: 'Punjab', district: 'Ludhiana', village: 'Raikot', pincode: '141109', acres: 6, crops: ['wheat'] } };
async function register(role, mobile, extra = {}) { const o = await post('/api/auth/otp/send', { mobile, role, purpose: 'register' }); assert.ok(o.devOtp, 'dev OTP returned in development'); return post('/api/auth/register', { role, mobile, otp: o.devOtp, ...farmer, ...extra }); }

before(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ks-auth-'));
  srv = spawn('node', ['server.cjs'], { cwd: ROOT, stdio: 'ignore', env: { ...process.env, PORT, DATA_DIR: dir, NODE_ENV: 'development', SMS_PROVIDER: 'console', LOG_STDOUT: '0', OTP_COOLDOWN_SEC: '1', ADMIN_MOBILE: '9000000001', ADMIN_PASSWORD: 'AdminPass2026!', GEMINI_API_KEY: '', MONGODB_URI: '', REDIS_URL: '' } });
  for (let i = 0; i < 50; i++) { try { if ((await fetch(U + '/api/health')).ok) return; } catch (e) {} await wait(150); }
  throw new Error('server did not start');
});
after(() => srv && srv.kill());

test('AU-01 farmer registers with OTP, receives a session and public profile (no password hash)', async () => {
  const r = await register('farmer', '9811111111'); assert.equal(r.status, 201); assert.ok(/^[a-f0-9]{64}$/.test(r.token));
  assert.equal(r.user.role, 'farmer'); assert.equal(r.user.profile.district, 'Ludhiana'); assert.equal(r.user.passwordHash, undefined);
  const me = await get('/api/auth/me', r.token); assert.equal(me.user.mobile, '9811111111');
});
test('AU-02 duplicate mobile, weak password, bad mobile, missing consent and wrong OTP are rejected', async () => {
  assert.equal((await post('/api/auth/otp/send', { mobile: '9811111111', role: 'farmer', purpose: 'register' })).status, 409);
  assert.equal((await post('/api/auth/otp/send', { mobile: '12345', role: 'farmer', purpose: 'register' })).status, 400);
  const o = await post('/api/auth/otp/send', { mobile: '9822222222', role: 'farmer', purpose: 'register' });
  const weak = await post('/api/auth/register', { role: 'farmer', mobile: '9822222222', otp: o.devOtp, ...farmer, password: 'short' }); assert.equal(weak.status, 422); assert.ok(weak.errors.password);
  const noc = await post('/api/auth/register', { role: 'farmer', mobile: '9822222222', otp: o.devOtp, ...farmer, consent: false }); assert.equal(noc.status, 422); assert.ok(noc.errors.consent);
  const bad = await post('/api/auth/register', { role: 'farmer', mobile: '9822222222', otp: '000000', ...farmer }); assert.equal(bad.status, 400); assert.equal(bad.field, 'otp');
  const ok = await post('/api/auth/register', { role: 'farmer', mobile: '9822222222', otp: o.devOtp, ...farmer }); assert.equal(ok.status, 201, 'real OTP still valid after one wrong try');
});
test('AU-03 OTP resend cooldown', async () => {
  await post('/api/auth/otp/send', { mobile: '9833333333', role: 'farmer', purpose: 'register' });
  const again = await post('/api/auth/otp/send', { mobile: '9833333333', role: 'farmer', purpose: 'register' }); assert.equal(again.status, 429); assert.ok(again.resendIn > 0);
});
test('AU-04 password login, wrong password, lock-out after 5 failures', async () => {
  const good = await post('/api/auth/login', { role: 'farmer', mobile: '+91 98111 11111', password: 'Harvest2026' }); assert.equal(good.status, 200); assert.ok(good.token);
  assert.equal((await post('/api/auth/login', { role: 'buyer', mobile: '9811111111', password: 'Harvest2026' })).status, 401, 'same mobile is not a buyer account');
  for (let i = 0; i < 5; i++) assert.equal((await post('/api/auth/login', { role: 'farmer', mobile: '9822222222', password: 'wrong-pass-1' })).status, 401);
  assert.equal((await post('/api/auth/login', { role: 'farmer', mobile: '9822222222', password: 'Harvest2026' })).status, 429, 'locked even with the right password');
});
test('AU-05 OTP login works; wrong OTP fails; unknown numbers get the same answer (no enumeration)', async () => {
  await wait(1200);
  const o = await post('/api/auth/otp/send', { mobile: '9811111111', role: 'farmer', purpose: 'login' }); assert.ok(o.devOtp);
  assert.equal((await post('/api/auth/login/otp', { role: 'farmer', mobile: '9811111111', otp: '111111' })).status, 401);
  const ok = await post('/api/auth/login/otp', { role: 'farmer', mobile: '9811111111', otp: o.devOtp }); assert.equal(ok.status, 200); assert.ok(ok.token);
  const unknown = await post('/api/auth/otp/send', { mobile: '9899999999', role: 'farmer', purpose: 'login' }); assert.equal(unknown.status, 200); assert.equal(unknown.devOtp, undefined);
});
test('AU-06 logout invalidates the session', async () => {
  const l = await post('/api/auth/login', { role: 'farmer', mobile: '9811111111', password: 'Harvest2026' });
  assert.equal((await post('/api/auth/logout', {}, l.token)).ok, true); assert.equal((await get('/api/auth/me', l.token)).status, 401);
});
test('AU-07 shared data requires login', async () => {
  assert.equal((await get('/api/state')).status, 401);
  const l = await post('/api/auth/login', { role: 'farmer', mobile: '9811111111', password: 'Harvest2026' });
  const put = await fetch(U + '/api/state', { method: 'PUT', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + l.token }, body: JSON.stringify({ state: { farmers: [], marker: 7 } }) }); assert.equal(put.status, 200);
  assert.equal((await get('/api/state', l.token)).state.marker, 7);
});
test('AU-08 buyer and delivery partner registration validate their own fields', async () => {
  const o = await post('/api/auth/otp/send', { mobile: '9844444444', role: 'buyer', purpose: 'register' });
  const bad = await post('/api/auth/register', { role: 'buyer', mobile: '9844444444', otp: o.devOtp, name: 'Meera Rao', password: 'Mandi2026x', consent: true, profile: { businessName: 'Hotel Sunrise', businessType: 'Hotel', contactName: 'Meera', designation: 'Manager', address: 'MG Road 12', city: 'Pune', state: 'Maharashtra', pincode: '411001', gstin: 'NOTAGSTIN' } });
  assert.equal(bad.status, 422); assert.ok(bad.errors.gstin);
  const ok = await post('/api/auth/register', { role: 'buyer', mobile: '9844444444', otp: (await post('/api/auth/otp/send', { mobile: '9844444444', role: 'buyer', purpose: 'register' })).devOtp || o.devOtp, name: 'Meera Rao', password: 'Mandi2026x', consent: true, profile: { businessName: 'Hotel Sunrise', businessType: 'Hotel', contactName: 'Meera', designation: 'Manager', address: 'MG Road 12', city: 'Pune', state: 'Maharashtra', pincode: '411001', gstin: '27AABCU9603R1ZM' } });
  assert.equal(ok.status, 201); assert.equal(ok.user.profile.gstin, '27AABCU9603R1ZM');
  const o2 = await post('/api/auth/otp/send', { mobile: '9855555555', role: 'logistics', purpose: 'register' });
  const drv = await post('/api/auth/register', { role: 'logistics', mobile: '9855555555', otp: o2.devOtp, name: 'Ravi Kumar', password: 'Truck2026ok', consent: true, profile: { vehicleType: 'Mini truck', vehicleNumber: 'dl 01 ab 1234', licenseNumber: 'DL0420110012345', city: 'Delhi', state: 'Delhi' } });
  assert.equal(drv.status, 201); assert.equal(drv.user.profile.vehicleNumber, 'DL 01 AB 1234');
});
test('AU-09 password reset with OTP', async () => {
  await wait(1200);
  const o = await post('/api/auth/otp/send', { mobile: '9811111111', role: 'farmer', purpose: 'reset' }); await wait(0);
  assert.equal((await post('/api/auth/password/reset', { role: 'farmer', mobile: '9811111111', otp: o.devOtp, newPassword: 'weak' })).status, 422);
  const r = await post('/api/auth/password/reset', { role: 'farmer', mobile: '9811111111', otp: o.devOtp, newPassword: 'NewHarvest2027' }); assert.equal(r.status, 200);
  assert.equal((await post('/api/auth/login', { role: 'farmer', mobile: '9811111111', password: 'Harvest2026' })).status, 401);
  assert.equal((await post('/api/auth/login', { role: 'farmer', mobile: '9811111111', password: 'NewHarvest2027' })).status, 200);
});
test('AU-10 admin needs password AND OTP; cannot self-register; admin tools are admin-only; actions are logged', async () => {
  assert.equal((await post('/api/auth/otp/send', { mobile: '9000000009', role: 'admin', purpose: 'register' })).status, 400);
  assert.equal((await post('/api/auth/login/otp', { role: 'admin', mobile: '9000000001', otp: '123456' })).status, 401, 'OTP alone is not enough');
  const step1 = await post('/api/auth/login', { role: 'admin', mobile: '9000000001', password: 'AdminPass2026!' }); assert.equal(step1.status, 200); assert.equal(step1.token, undefined); assert.ok(step1.devOtp);
  const step2 = await post('/api/auth/login/otp', { role: 'admin', mobile: '9000000001', otp: step1.devOtp }); assert.equal(step2.status, 200); assert.ok(step2.token);
  const f = await post('/api/auth/login', { role: 'farmer', mobile: '9811111111', password: 'NewHarvest2027' });
  assert.equal((await get('/api/admin/logs', f.token)).status, 403); assert.equal((await get('/api/admin/users', f.token)).status, 403);
  const logs = await get('/api/admin/logs?limit=200', step2.token); assert.equal(logs.status, 200);
  const events = logs.logs.map((l) => l.event); for (const e of ['user.registered', 'login.success', 'login.failed', 'otp.sent']) assert.ok(events.includes(e), 'log has ' + e);
  assert.ok(!JSON.stringify(logs.logs).includes('NewHarvest2027') && !JSON.stringify(logs.logs).includes('passwordHash'), 'no secrets in logs');
  const users = await get('/api/admin/users?role=farmer', step2.token); assert.ok(users.users.length >= 2); assert.equal(users.users[0].passwordHash, undefined);
});
