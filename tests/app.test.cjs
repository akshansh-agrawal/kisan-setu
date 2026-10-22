/* Automated tests: node --test tests/   (no network, no keys; uses a local mock of data.gov.in) */
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http'), fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const { spawn, execFileSync } = require('node:child_process');
const ROOT = path.join(__dirname, '..');
const PORT = 18787, MOCK = 18911;
let server, mock, tmp;
const get = (p) => fetch(`http://localhost:${PORT}${p}`);

before(async () => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ks-'));
  const payload = fs.readFileSync(path.join(ROOT, 'data/sample/mandi.sample.json'), 'utf8');
  mock = http.createServer((q, r) => { r.setHeader('content-type', 'application/json'); r.end(payload); }).listen(MOCK);
  server = spawn('node', ['server.cjs'], { cwd: ROOT, stdio: 'ignore', env: { ...process.env, PORT, DATA_DIR: tmp, AGMARKNET_URL: 'http://localhost:1/x', DATA_GOV_API_KEY: 'test', MANDI_BASE: `http://localhost:${MOCK}`,
    SARVAM_API_KEY: 'k', SARVAM_APP_ID: 'a', SARVAM_ORG_ID: 'o', SARVAM_WORKSPACE_ID: 'w', GEMINI_API_KEY: '' } });
  for (let i = 0; i < 40; i++) { try { if ((await get('/api/health')).ok) return; } catch (e) {} await new Promise(r => setTimeout(r, 150)); }
  throw new Error('server did not start');
});
after(() => { server && server.kill(); mock && mock.close(); });

test('AT-01 health', async () => { const j = await (await get('/api/health')).json(); assert.equal(j.ok, true); assert.equal(j.mandiConfigured, true); });
test('AT-02 mandi mapping and aggregation', async () => {
  const j = await (await get('/api/mandi')).json();
  assert.equal(j.ok, true); assert.equal(j.crops.wheat.modal, 2625); assert.equal(j.crops.mustard.modal, 6350); assert.equal(j.crops.cumin.modal, 22500);
  assert.equal(j.crops.gram.modal, 5750, 'Bengal gram mapped, Green gram (moong) excluded');
  assert.equal(j.crops.wheat.date, '2026-10-07');
});
test('AT-03 shared state round trip (requires login)', async () => {
  assert.equal((await get('/api/state')).status, 401);
  const o = await (await fetch(`http://localhost:${PORT}/api/auth/otp/send`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ mobile: '9877777777', role: 'farmer', purpose: 'register' }) })).json();
  const reg = await (await fetch(`http://localhost:${PORT}/api/auth/register`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ role: 'farmer', mobile: '9877777777', otp: o.devOtp, name: 'Test Farmer', password: 'Harvest2026', consent: true, profile: { state: 'Punjab', district: 'Ludhiana', pincode: '141109' } }) })).json();
  const H = { 'content-type': 'application/json', authorization: 'Bearer ' + reg.token };
  const body = { state: { farmers: [{ id: 'x1', name: 'T' }], marker: 42 } };
  const put = await (await fetch(`http://localhost:${PORT}/api/state`, { method: 'PUT', headers: H, body: JSON.stringify(body) })).json();
  assert.ok(put.rev >= 1);
  const g = await (await fetch(`http://localhost:${PORT}/api/state`, { headers: H })).json(); assert.equal(g.state.marker, 42); assert.equal(g.rev, put.rev);
  const same = await (await fetch(`http://localhost:${PORT}/api/state?rev=` + put.rev, { headers: H })).json(); assert.equal(same.same, true);
});
test('AT-04 public config exposes sarvam', async () => { const j = await (await get('/api/config')).json(); assert.deepEqual(Object.keys(j.sarvam).sort(), ['apiKey', 'appId', 'orgId', 'workspaceId']); });
test('AT-05 doctor without AI key fails cleanly', async () => {
  const r = await fetch(`http://localhost:${PORT}/api/doctor`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ image: 'data:image/png;base64,AAAA', lang: 'en' }) });
  assert.ok(r.status >= 400 && r.status < 600); await r.json();
});
test('AT-06 static app is served', async () => { const r = await get('/'); assert.equal(r.status, 200); assert.match(await r.text(), /Kisan Setu/); });

test('AT-07 i18n packs are complete', () => {
  const dir = path.join(ROOT, 'i18n'); let n = 0;
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.txt') && f !== 'en_b.txt')) {
    const code = f.replace('.txt', ''); const lines = fs.readFileSync(path.join(dir, f), 'utf8').split('\n').filter(l => l.trim());
    const cells = lines.map(l => l.split('¦').map(x => x.trim()));
    if (!['hi', 'mr', 'pa'].includes(code)) assert.equal(cells[0].length, 106, code + ' UI pack');
    const b = cells[cells.length - 1]; assert.ok([95, 97, 98].includes(b.length), code + ' B pack ' + b.length);
    cells.flat().forEach(c => assert.ok(c.length > 0, code + ' has an empty cell')); n++;
  }
  assert.ok(n >= 20, 'expected at least 20 language packs, got ' + n);
});
test('AT-08 sample CSV headers match importer', () => {
  const h = f => fs.readFileSync(path.join(ROOT, 'data/sample', f), 'utf8').split('\n')[0].trim();
  assert.equal(h('farmers.csv'), 'name,phone,district,village,acres,lang');
  assert.equal(h('buyers.csv'), 'name,type,district,contact,phone,window');
  assert.equal(h('drivers.csv'), 'name,phone,vehicle,district');
});
test('AT-09 build output is light-only and includes voice merge', () => {
  execFileSync('node', ['build.cjs'], { cwd: ROOT, stdio: 'ignore' });
  const html = fs.readFileSync(path.join(ROOT, 'dist/index.html'), 'utf8');
  assert.ok(html.includes('sarvam-widget') && html.includes('color-scheme:light'));
  assert.ok(!/prefers-color-scheme:\s*dark/.test(html));
});

test('AT-10 auto-translate endpoint (mock Gemini, cached)', async () => {
  let hits = 0;
  const gem = http.createServer((q, r) => { let b = ''; q.on('data', d => b += d); q.on('end', () => { hits++; const req = JSON.parse(b); const list = JSON.parse(req.contents[0].parts[0].text.split('\n').pop());
    r.setHeader('content-type', 'application/json'); r.end(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(list.map(t => 'TA:' + t)) }] } }] })); }); }).listen(18912);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ks2-'));
  const srv = spawn('node', ['server.cjs'], { cwd: ROOT, stdio: 'ignore', env: { ...process.env, PORT: 18788, DATA_DIR: dir, GEMINI_API_KEY: 'test', GEMINI_API_URL: 'http://localhost:18912' } });
  try {
    for (let i = 0; i < 40; i++) { try { if ((await fetch('http://localhost:18788/api/health')).ok) break; } catch (e) {} await new Promise(r => setTimeout(r, 150)); }
    const post = (body) => fetch('http://localhost:18788/api/translate', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json());
    const a = await post({ lang: 'ta', texts: ['Sell crop', 'Orders'] });
    assert.equal(a.map['Sell crop'], 'TA:Sell crop'); assert.equal(hits, 1);
    const b = await post({ lang: 'ta', texts: ['Sell crop'] }); assert.equal(b.map['Sell crop'], 'TA:Sell crop'); assert.equal(hits, 1, 'second call served from cache');
    const bad = await fetch('http://localhost:18788/api/translate', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ lang: 'en', texts: ['x'] }) }); assert.equal(bad.status, 400);
  } finally { srv.kill(); gem.close(); }
});

async function withServer(port, env, fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ks3-'));
  const srv = spawn('node', ['server.cjs'], { cwd: ROOT, stdio: 'ignore', env: { ...process.env, PORT: port, DATA_DIR: dir, GEMINI_API_KEY: '', DATA_GOV_API_KEY: '', AGMARKNET_URL: 'http://localhost:1/x', ...env } });
  try { for (let i = 0; i < 40; i++) { try { if ((await fetch(`http://localhost:${port}/api/health`)).ok) break; } catch (e) {} await new Promise(r => setTimeout(r, 150)); } await fn(`http://localhost:${port}`); }
  finally { srv.kill(); }
}
test('AT-11 data.gov.in with Capitalised field names', async () => {
  const rec = (c, m) => ({ State: 'Punjab', District: 'Ludhiana', Market: 'Ludhiana', Commodity: c, Variety: 'x', Grade: 'FAQ', Arrival_Date: '10/10/2026', Min_Price: String(m - 100), Max_Price: String(m + 100), Modal_Price: String(m) });
  const api = http.createServer((q, r) => { r.setHeader('content-type', 'application/json'); r.end(JSON.stringify({ records: [rec('Wheat', 2600), rec('Tomato', 1800), rec('Potato', 1200)] })); }).listen(18913);
  await withServer(18789, { DATA_GOV_API_KEY: 'k', MANDI_BASE: 'http://localhost:18913' }, async (u) => {
    const j = await (await fetch(u + '/api/mandi')).json(); assert.equal(j.ok, true); assert.equal(j.crops.wheat.modal, 2600); assert.equal(j.crops.tomato.modal, 1800); assert.match(j.source, /data.gov.in/);
  }); api.close();
});
test('AT-12 falls back to eNAM when data.gov.in is unavailable and reports why', async () => {
  const enam = http.createServer((q, r) => { r.setHeader('content-type', 'application/json'); r.end(JSON.stringify({ data: [{ state: 'Gujarat', apmc: 'Rajkot', commodity: 'GROUNDNUT', min_price: '5800', max_price: '6400', modal_price: '6200', created_at: '2026-10-10' }] })); }).listen(18914);
  await withServer(18790, { DATA_GOV_API_KEY: '', ENAM_URL: 'http://localhost:18914' }, async (u) => {
    const j = await (await fetch(u + '/api/mandi')).json(); assert.equal(j.ok, true); assert.equal(j.crops.groundnut.modal, 6200); assert.match(j.source, /eNAM/);
  }); enam.close();
  await withServer(18791, { DATA_GOV_API_KEY: '', ENAM_URL: 'http://localhost:1' }, async (u) => {
    const j = await (await fetch(u + '/api/mandi')).json(); assert.equal(j.ok, false); assert.ok(j.attempts.length === 3 && /DATA_GOV_API_KEY/.test(j.attempts[1].error), 'diagnostics explain each failed source');
  });
});
test('AT-13 admin CSV price upload works with no API at all', async () => {
  await withServer(18792, { ENAM_URL: 'http://localhost:1' }, async (u) => {
    const rows = [{ state: 'Haryana', district: 'Karnal', market: 'Karnal', commodity: 'Wheat', 'arrival date': '10/10/2026', 'min price': '2500', 'max price': '2700', 'modal price': '2620' }];
    const r = await (await fetch(u + '/api/mandi/import', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ rows }) })).json(); assert.equal(r.ok, true);
    const j = await (await fetch(u + '/api/mandi')).json(); assert.equal(j.source, 'Uploaded CSV'); assert.equal(j.crops.wheat.modal, 2620);
    const bad = await fetch(u + '/api/mandi/import', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ rows: [{ foo: 1 }] }) }); assert.equal(bad.status, 400);
  });
});

test('AT-14 Agmarknet portal source + data-quality filter', async () => {
  const rows = [['Wheat', 2600], ['Wheat', 2650], ['Wheat', 2620], ['Wheat', 90000], ['Tomato', 1800]].map(([c, m]) => ({ state_name: 'Punjab', market_name: 'Ludhiana', commodity_name: c, reported_date: '2026-10-10', min_price: m - 100, max_price: m + 100, modal_price: m }));
  const api = http.createServer((q, r) => { r.setHeader('content-type', 'application/json'); r.end(JSON.stringify({ data: { records: rows } })); }).listen(18915);
  await withServer(18793, { AGMARKNET_URL: 'http://localhost:18915/report' }, async (u) => {
    const j = await (await fetch(u + '/api/mandi')).json(); assert.equal(j.ok, true); assert.match(j.source, /Agmarknet \(agmarknet.gov.in\)/); assert.equal(j.official, true);
    assert.equal(j.crops.wheat.modal, 2620, 'outlier 90000 removed'); assert.equal(j.crops.wheat.n, 3); assert.ok(j.rowsRejected >= 1);
  }); api.close();
});
test('AT-15 voice tool endpoint (Riya) returns a speakable verified price', async () => {
  await withServer(18794, { VOICE_TOOL_TOKEN: 'secret', DATA_GOV_API_KEY: 'k', MANDI_BASE: 'http://localhost:18911' }, async (u) => {
    assert.equal((await fetch(u + '/api/tools/price?crop=wheat')).status, 401);
    const j = await (await fetch(u + '/api/tools/price?crop=wheat', { headers: { 'x-tool-token': 'secret' } })).json();
    assert.equal(j.ok, true); assert.equal(j.price_per_quintal, 2625); assert.match(j.speech, /rupees per kilo/);
    const bad = await (await fetch(u + '/api/tools/price?crop=unicorn', { headers: { 'x-tool-token': 'secret' } })).json(); assert.equal(bad.ok, false);
  });
});
