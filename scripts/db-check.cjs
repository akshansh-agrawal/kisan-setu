/* npm run db:check  - verifies your MongoDB and Redis settings from .env and shows what the server will use. */
const fs = require('fs'), path = require('path');
try { fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n').forEach((l) => { const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*(#.*)?$/.exec(l); if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2]; }); } catch (e) {}
const { createDb } = require('../server/db.cjs');
(async () => {
  const env = process.env; const db = createDb(env, path.join(__dirname, '..', 'data'));
  console.log(`Documents (users, logs, shared data): ${db.info.docs}${env.MONGODB_URI ? '' : '   <- set MONGODB_URI to use MongoDB'}`);
  console.log(`Sessions / OTP / rate limits:          ${db.info.kv}${env.REDIS_URL ? '' : '   <- set REDIS_URL to use Redis'}`);
  let bad = 0; const ok = (n, v) => console.log(`  ${v ? 'ok ' : 'FAIL'}  ${n}`) || (v || bad++);
  try {
    const h = await db.health(); ok('connection health', h.ok);
    const id = 'dbcheck_' + Date.now();
    await db.users.insert({ _id: id, role: 'consumer', mobile: '6' + String(Date.now()).slice(-9), name: 'db-check', status: 'active', createdAt: new Date() });
    ok('write + read a user document', !!(await db.users.findOne({ _id: id }))); await db.users.update(id, { status: 'blocked' }); ok('update a user document', (await db.users.findOne({ _id: id })).status === 'blocked');
    await db.logs.insert({ ts: new Date(), level: 'info', event: 'db.check', meta: {} }); ok('write a log entry', (await db.logs.recent(1)).length === 1);
    await db.kv.set('dbcheck:k', { a: 1 }, 30); ok('key/value with TTL', (await db.kv.get('dbcheck:k')).a === 1); ok('counter', (await db.kv.incr('dbcheck:n', 30)) === 1); await db.kv.del('dbcheck:k'); await db.kv.del('dbcheck:n');
    console.log(bad ? `\n${bad} check(s) failed. See the messages above.` : '\nAll checks passed. (A "db-check" user and log entry were left behind; delete them if you like.)');
  } catch (e) { console.error('\nFAILED: ' + e.message); bad = 1; }
  process.exit(bad ? 1 : 0);
})();
