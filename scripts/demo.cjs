/* Kisan Setu automatic walkthrough (uses the real login and registration screens).
   Usage:  npm run demo            (opens a browser window and plays the whole app hands-free)
           npm run demo:headless   (no window; just regenerates the screenshots in ./screenshots)
   It starts the local server, then drives the app like a user: landing page -> farmer (live prices, voice,
   Crop Doctor, add crop with photo) -> bulk buyer (place an order) -> delivery partner (route, map, delivery)
   -> admin (every section) -> language switch. Screenshots and a video are saved in ./screenshots. */
const { spawn } = require('node:child_process');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
let chromium; try { ({ chromium } = require('playwright')); } catch (e) { console.error('Playwright is required: npm install && npx playwright install chromium'); process.exit(1); }
const ROOT = path.join(__dirname, '..'), OUT = path.join(ROOT, 'screenshots'), PORT = 8799;
const headless = process.argv.includes('--headless') || process.env.CI;
const LEAF = path.join(ROOT, 'data/sample/leaf.jpg');
fs.mkdirSync(OUT, { recursive: true }); fs.readdirSync(OUT).filter(f => /\.(png|webm)$/.test(f)).forEach(f => fs.unlinkSync(path.join(OUT, f)));
const results = []; let n = 0;
const wait = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  const server = spawn('node', ['server.cjs'], { cwd: ROOT, stdio: 'ignore', env: { ...process.env, PORT, DATA_DIR: fs.mkdtempSync(path.join(os.tmpdir(), 'ks-demo-')), NODE_ENV: 'development', SMS_PROVIDER: 'console', LOG_STDOUT: '0', OTP_COOLDOWN_SEC: '1', MONGODB_URI: '', REDIS_URL: '', ADMIN_MOBILE: '9000000001', ADMIN_PASSWORD: 'AdminKisan26!' } });
  for (let i = 0; i < 40; i++) { try { if ((await fetch(`http://localhost:${PORT}/api/health`)).ok) break; } catch (e) {} await wait(200); }
  const browser = await chromium.launch({ headless: !!headless, slowMo: headless ? 0 : 250 });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, recordVideo: { dir: OUT, size: { width: 390, height: 844 } } });
  const page = await ctx.newPage();
  const cap = (t) => page.evaluate((t) => { let e = document.getElementById('demo-cap'); if (!e) { e = document.createElement('div'); e.id = 'demo-cap'; e.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);top:8px;z-index:99999;background:rgba(20,40,28,.92);color:#fff;font:600 13px system-ui;padding:7px 14px;border-radius:999px;max-width:92%;text-align:center;pointer-events:none'; document.body.appendChild(e); } e.textContent = t; }, t).catch(() => {});
  const shot = async (name, caption) => { if (caption) await cap(caption); await wait(500); n++; const f = String(n).padStart(2, '0') + '-' + name + '.png';
    await page.evaluate(() => { const e = document.getElementById('demo-cap'); if (e) e.style.display = 'none'; }); await page.screenshot({ path: path.join(OUT, f) });   // captions are shown in the video only
    await page.evaluate(() => { const e = document.getElementById('demo-cap'); if (e) e.style.display = ''; }); results.push(['shot', f]); };
  const step = async (label, fn) => { try { await fn(); results.push(['ok', label]); console.log('  ok  ' + label); } catch (e) { results.push(['skip', label + ' (' + String(e.message).split('\n')[0] + ')']); console.log('  --  ' + label + ' skipped: ' + String(e.message).split('\n')[0].slice(0, 160)); } };
  const open = async (session, size) => { if (size) await page.setViewportSize(size); await page.evaluate((s) => localStorage.setItem('kisan_setu_session_v3', JSON.stringify(s)), session); await page.reload(); await wait(1600); };
  const click = (re, opt = {}) => page.getByRole('button', { name: re }).first().click({ timeout: 4000, ...opt });
  const tab = (re) => page.locator('.tab, .anav-item').filter({ hasText: re }).first().click({ timeout: 4000 });

  const PEOPLE = {
    farmer:    { name: 'Gurpreet Singh', mobile: '9811100001', state: 'Punjab', district: 'Ludhiana', village: 'Raikot', pincode: '141001', password: 'Harvest2026', confirm: 'Harvest2026' },
    buyer:     { name: 'Meera Rao', mobile: '9811100002', businessName: 'Hotel Sunrise', businessType: 'Hotel', gstin: '27AABCU9603R1ZM', contactName: 'Meera Rao', designation: 'Purchase Manager', address: 'MG Road 12', city: 'Pune', pincode: '411001', state: 'Maharashtra', password: 'Mandi2026x', confirm: 'Mandi2026x' },
    consumer:  { name: 'Asha Verma', mobile: '9811100003', address: 'Flat 4, Green Park', city: 'Delhi', pincode: '110016', state: 'Delhi', password: 'Fresh2026ok', confirm: 'Fresh2026ok' },
    logistics: { name: 'Ravi Kumar', mobile: '9811100004', vehicleType: 'Mini truck', vehicleNumber: 'DL 01 AB 1234', licenseNumber: 'DL0420110012345', city: 'Delhi', state: 'Delhi', password: 'Truck2026ok', confirm: 'Truck2026ok' },
  };
  const fillForm = async (data) => { for (const [k, v] of Object.entries(data)) { const el = page.locator(`[name="${k}"]`).first(); if (await el.count() === 0) continue; const tag = await el.evaluate((e) => e.tagName); if (tag === 'SELECT') await el.selectOption(v); else await el.fill(v); } };
  const portal = async (role, size) => { await open({ role, lang: 'en', screen: 'home', token: null }, size); };
  const register = async (role) => {
    await portal(role); await shot(role + '-login', `${role}: login screen (mobile + password, or OTP)`);
    await page.getByRole('tab', { name: 'Create account' }).click(); await wait(400); await fillForm(PEOPLE[role]); await page.check('[name=acceptTerms]'); await shot(role + '-register', `${role}: registration form`);
    await page.getByRole('button', { name: 'Send OTP' }).click(); await page.waitForSelector('.dev-otp b', { timeout: 6000 }); await shot(role + '-otp', 'OTP sent to the mobile number (shown here only in development mode)');
    await page.fill('[name=otp]', await page.textContent('.dev-otp b')); await page.getByRole('button', { name: 'Verify OTP and create account' }).click(); await wait(2600);
  };
  const login = async (role, mobile, password, size) => { await portal(role, size); await page.fill('[name=mobile]', mobile); await page.fill('[name=password]', password); await page.getByRole('button', { name: /^(Log in|Continue)$/ }).click(); await wait(1800); };
  const adminLogin = async (shotName) => { await portal('admin', { width: 900, height: 800 }); if (shotName) await shot(shotName + '-login', 'Operations login: password, then OTP'); await page.fill('[name=mobile]', '9000000001'); await page.fill('[name=password]', 'AdminKisan26!'); await page.getByRole('button', { name: 'Continue' }).click(); await page.waitForSelector('.dev-otp b', { timeout: 6000 }); if (shotName) await shot(shotName + '-otp', 'Second step: OTP'); await page.fill('[name=otp]', await page.textContent('.dev-otp b')); await page.getByRole('button', { name: /Verify OTP and log in/ }).click(); await wait(2200); await page.setViewportSize({ width: 1100, height: 800 }); };
  const logout = async () => { await tab(/Account/); await wait(500); await page.getByRole('button', { name: /Log out/ }).click({ timeout: 4000 }); await wait(900); };

  await page.goto(`http://localhost:${PORT}/`); await wait(1800);
  console.log('Kisan Setu walkthrough');
  await step('Landing page', async () => { await shot('landing', 'Landing page'); await page.evaluate(() => window.scrollTo(0, 900)); await shot('landing-features', 'Trust score, oversupply alerts, residue marketplace'); });

  console.log('Farmer');
  await step('Farmer registers', async () => { await register('farmer'); await shot('farmer-home', 'Farmer home: crop price slides change automatically'); });
  await step('Farmer home slides', async () => { await wait(4300); await shot('farmer-home-next-slide', 'Next crop slide'); });
  await step('Voice assistant (Riya)', async () => { await page.locator('.fab-mic').click({ timeout: 4000 }); await shot('farmer-voice', 'Voice assistant Riya, with shortcut commands'); await page.reload(); await wait(1500); });
  await step('Crop Doctor diagnosis', async () => { await tab(/Crop Doctor/); await wait(600); await page.setInputFiles('input[type=file]:not([capture])', LEAF); await wait(800); await click(/Wheat/); await shot('crop-doctor-ready', 'Crop Doctor: photo, crop and symptoms'); await click(/Check my crop/); await wait(3600); await shot('crop-doctor-result', 'AI diagnosis with actions, prevention and care'); });
  await step('Add crop with live photo', async () => { await tab(/Add crop/); await wait(700); await click(/^Wheat$/); await wait(500); await page.setInputFiles('input[type=file]:not([capture])', LEAF); await wait(900); await shot('farmer-add-crop', 'Add crop: attach a live photo, set quantity and price'); await click(/List|Publish|Sell|Post/i); await wait(900); await shot('farmer-confirm', 'Listen and confirm before listing'); await click(/Yes, confirm/); await wait(1400); await shot('farmer-listed', 'Crop listed'); });
  await step('Farmer account and logout', async () => { await tab(/Account/); await shot('farmer-account', 'Account: details, language, help'); await logout(); await shot('farmer-logged-out', 'Logged out: back to the login screen'); });

  console.log('Bulk buyer');
  await step('Buyer registers', async () => { await register('buyer'); await shot('buyer-home', 'Bulk buyer dashboard: account is "In review" until an admin verifies it'); await logout(); });
  console.log('Admin verification');
  await step('Admin verifies the new accounts', async () => { await adminLogin('admin'); await page.locator('.anav-item').filter({ hasText: /Verification/ }).click({ timeout: 4000 }); await wait(900); await shot('admin-verification', 'Admin verification queue: new farmer and buyer accounts'); for (let i = 0; i < 6; i++) { const btn = page.getByRole('button', { name: /^Approve$/ }).first(); if (await btn.count() === 0) break; await btn.click({ timeout: 3000 }).catch(() => {}); await wait(600); } await shot('admin-approved', 'Accounts approved'); });
  await step('Buyer logs in and orders', async () => { await login('buyer', '9811100002', 'Mandi2026x', { width: 390, height: 844 }); await shot('buyer-home-verified', 'Verified buyer dashboard'); await click(/Place a new order/); await wait(900); await click(/^Tomato$/); await wait(700); await click(/^200 kg$/); await shot('buyer-pick-crop', 'Pick a crop and quantity; verified farmers are matched'); await click(/Review order/); await wait(900); await shot('buyer-order', 'Review the order'); await click(/Yes, confirm|Place order|Confirm/i); await wait(1500); await shot('buyer-order-placed', 'Order placed'); await tab(/Orders/); await shot('buyer-orders', 'Orders and tracking'); await tab(/Account/); await logout(); });

  console.log('Delivery partner');
  await step('Delivery partner registers; route and map', async () => { await register('logistics'); await shot('delivery-route', "Today's route: the buyer's order appears as a stop"); await tab(/Map/); await wait(900); await shot('delivery-map', 'Route map with stops'); await tab(/Account/); await logout(); });

  console.log('Household');
  await step('Household registers and shops', async () => { await register('consumer'); await shot('household-shop', 'Households buy fresh produce directly'); await tab(/Account/); await logout(); });

  console.log('Admin');
  await step('Admin overview', async () => { await adminLogin(null); await shot('admin-overview', 'Admin overview'); });
  await step('Admin sections', async () => { const k = await page.locator('.anav-item').count(); for (let i = 1; i < Math.min(k, 9); i++) { await page.locator('.anav-item').nth(i).click({ timeout: 3000 }).catch(() => {}); await wait(700); await shot('admin-section-' + i, 'Admin section ' + i); } });
  await step('Admin: users and server logs', async () => { await page.locator('.anav-item').filter({ hasText: /Real data/ }).click({ timeout: 3000 }); await wait(1200); await shot('admin-users-and-logs', 'Registered users and the server activity log'); });

  console.log('Language');
  await step('Language switch', async () => { await page.setViewportSize({ width: 390, height: 844 }); await portal('farmer'); await page.fill('[name=mobile]', '9811100001'); await page.fill('[name=password]', 'Harvest2026'); await page.getByRole('button', { name: 'Log in' }).click(); await wait(2200); await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('kisan_setu_session_v3')); s.lang = 'hi'; localStorage.setItem('kisan_setu_session_v3', JSON.stringify(s)); }); await page.reload(); await wait(2500); await shot('farmer-home-hindi', 'Switching language translates every screen (Hindi shown)'); });

  const video = page.video(); await ctx.close(); await browser.close(); server.kill();
  try { const v = await video.path(); fs.renameSync(v, path.join(OUT, 'walkthrough.webm')); } catch (e) {}
  const shots = results.filter(r => r[0] === 'shot').map(r => r[1]);
  fs.writeFileSync(path.join(OUT, 'README.md'), '# Screenshots\n\nGenerated by `npm run demo` (see scripts/demo.cjs). `walkthrough.webm` is the full recording.\n\n' + shots.map(f => `### ${f.replace(/^\d+-|\.png$/g, '').replace(/-/g, ' ')}\n![${f}](${f})\n`).join('\n'));
  console.log(`\nDone: ${results.filter(r => r[0] === 'ok').length} steps ok, ${results.filter(r => r[0] === 'skip').length} skipped, ${shots.length} screenshots in ./screenshots`);
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
