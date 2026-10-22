/* Storage layer.
   - MongoDB  (MONGODB_URI)  : users, logs, shared dataset.   Collections: users, logs (TTL 180 d), app_state
   - Redis    (REDIS_URL)    : OTPs, login sessions, rate limits, recent-log list (all with TTLs)
   - Fallback (no env set)   : local JSON file + in-memory maps, so the app still runs in development and tests.
   All drivers expose the same async interface. */
const fs = require('fs'), path = require('path');

function memoryKV() {
  const m = new Map();
  const live = (k) => { const e = m.get(k); if (e && e.exp && e.exp < Date.now()) { m.delete(k); return null; } return e || null; };
  return {
    kind: 'memory',
    async get(k) { const e = live(k); return e ? e.v : null; },
    async set(k, v, ttl) { m.set(k, { v, exp: ttl ? Date.now() + ttl * 1000 : 0 }); },
    async del(k) { m.delete(k); },
    async incr(k, ttl) { const e = live(k); const n = (e ? e.v : 0) + 1; m.set(k, { v: n, exp: e ? e.exp : (ttl ? Date.now() + ttl * 1000 : 0) }); return n; },
    async ttl(k) { const e = live(k); return e && e.exp ? Math.max(0, Math.ceil((e.exp - Date.now()) / 1000)) : -1; },
    async lpush(k, v, max) { const e = live(k); const a = e ? e.v : []; a.unshift(v); a.length = Math.min(a.length, max); m.set(k, { v: a, exp: 0 }); },
    async lrange(k, n) { const e = live(k); return e ? e.v.slice(0, n) : []; },
    async ping() { return 'PONG'; },
  };
}

function redisKV(url) {
  const Redis = require('ioredis');                                    // npm install ioredis
  const r = new Redis(url, { maxRetriesPerRequest: 2, enableOfflineQueue: false });
  r.on('error', (e) => console.error('[redis]', e.message));
  return {
    kind: 'redis',
    async get(k) { const v = await r.get(k); return v === null ? null : JSON.parse(v); },
    async set(k, v, ttl) { if (ttl) await r.set(k, JSON.stringify(v), 'EX', ttl); else await r.set(k, JSON.stringify(v)); },
    async del(k) { await r.del(k); },
    async incr(k, ttl) { const n = await r.incr(k); if (n === 1 && ttl) await r.expire(k, ttl); return n; },
    async ttl(k) { return r.ttl(k); },
    async lpush(k, v, max) { await r.lpush(k, JSON.stringify(v)); await r.ltrim(k, 0, max - 1); },
    async lrange(k, n) { return (await r.lrange(k, 0, n - 1)).map((x) => JSON.parse(x)); },
    async ping() { return r.ping(); },
  };
}

function fileDocs(file) {
  let d = { users: [], logs: [], state: null, rev: 0 };
  try { d = { ...d, ...JSON.parse(fs.readFileSync(file, 'utf8')) }; } catch (e) {}
  let timer = null;
  const save = () => { clearTimeout(timer); timer = setTimeout(() => { try { fs.mkdirSync(path.dirname(file), { recursive: true }); const t = file + '.tmp'; fs.writeFileSync(t, JSON.stringify(d)); fs.renameSync(t, file); } catch (e) {} }, 150); };
  const match = (u, q) => Object.entries(q).every(([k, v]) => u[k] === v);
  return {
    kind: 'file',
    users: {
      async findOne(q) { return d.users.find((u) => match(u, q)) || null; },
      async insert(u) { if (d.users.some((x) => x.mobile === u.mobile && x.role === u.role)) { const e = new Error('duplicate'); e.code = 11000; throw e; } d.users.push(u); save(); return u; },
      async deleteDemo() { const before = d.users.length; d.users = d.users.filter((u) => u.demo !== true); save(); return before - d.users.length; },
      async update(id, patch) { const u = d.users.find((x) => x._id === id); if (u) Object.assign(u, patch); save(); },
      async list(q, limit) { return d.users.filter((u) => match(u, q || {})).slice(0, limit || 100); },
      async count(q) { return d.users.filter((u) => match(u, q || {})).length; },
    },
    logs: {
      async insert(e) { d.logs.push(e); if (d.logs.length > 5000) d.logs.splice(0, d.logs.length - 5000); save(); },
      async recent(n, q) { return d.logs.filter((l) => match(l, q || {})).slice(-n).reverse(); },
    },
    state: {
      async get() { return d.state ? { rev: d.rev, state: d.state } : null; },
      async set(st) { d.rev++; d.state = st; save(); return d.rev; },
    },
    async ping() { return true; },
  };
}

function mongoDocs(uri, dbName) {
  const { MongoClient } = require('mongodb');                          // npm install mongodb
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  const ready = client.connect().then(async () => {
    const db = client.db(dbName);
    await db.collection('users').createIndex({ mobile: 1, role: 1 }, { unique: true });
    await db.collection('logs').createIndex({ ts: 1 }, { expireAfterSeconds: 180 * 86400 });
    await db.collection('logs').createIndex({ event: 1, ts: -1 });
    return db;
  });
  ready.catch((e) => console.error('[mongodb]', e.message));
  const col = async (n) => (await ready).collection(n);
  return {
    kind: 'mongo',
    users: {
      async findOne(q) { return (await col('users')).findOne(q); },
      async insert(u) { await (await col('users')).insertOne(u); return u; },
      async deleteDemo() { const r = await (await col('users')).deleteMany({ demo: true }); return r.deletedCount || 0; },
      async update(id, patch) { await (await col('users')).updateOne({ _id: id }, { $set: patch }); },
      async list(q, limit) { return (await col('users')).find(q || {}).limit(limit || 100).toArray(); },
      async count(q) { return (await col('users')).countDocuments(q || {}); },
    },
    logs: {
      async insert(e) { await (await col('logs')).insertOne(e); },
      async recent(n, q) { return (await col('logs')).find(q || {}).sort({ ts: -1 }).limit(n).toArray(); },
    },
    state: {
      async get() { const d = await (await col('app_state')).findOne({ _id: 'main' }); return d ? { rev: d.rev, state: d.state } : null; },
      async set(st) {
        const r = await (await col('app_state')).findOneAndUpdate({ _id: 'main' }, { $inc: { rev: 1 }, $set: { state: st, savedAt: new Date() } }, { upsert: true, returnDocument: 'after' });
        const doc = r && r.value !== undefined ? r.value : r; return doc.rev;
      },
    },
    async ping() { await (await ready).command({ ping: 1 }); return true; },
  };
}

function createDb(env, dataDir) {
  const docs = env.MONGODB_URI ? mongoDocs(env.MONGODB_URI, env.MONGODB_DB || 'kisan_setu') : fileDocs(path.join(dataDir, 'dev-db.json'));
  const kv = env.REDIS_URL ? redisKV(env.REDIS_URL) : memoryKV();
  return { users: docs.users, logs: docs.logs, state: docs.state, kv, info: { docs: docs.kind, kv: kv.kind }, async health() { const out = { docs: docs.kind, kv: kv.kind, ok: true }; try { await docs.ping(); } catch (e) { out.ok = false; out.docsError = e.message; } try { await kv.ping(); } catch (e) { out.ok = false; out.kvError = e.message; } return out; } };
}
module.exports = { createDb };
