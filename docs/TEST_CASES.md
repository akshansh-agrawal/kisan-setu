# Test Cases - Kisan Setu

Automated: `npm test` (node:test; no network, no API keys). Manual cases below use the starter records in `data-kisan-setu/reference/`.

## 0. Guided end-to-end run
`npm run demo` plays the main story automatically (farmer lists a crop -> buyer orders -> delivery route and map -> admin) and fails visibly if a step breaks. Reference screenshots are in `screenshots/`.

## A0. Authentication (tests/auth.test.cjs)
| ID | Check | Expected |
|---|---|---|
| AU-01 | farmer registers with OTP | 201, session token, profile saved, no password hash exposed |
| AU-02 | duplicate mobile / weak password / bad mobile / no consent / wrong OTP | 409 / 422 / 400 / 422 / 400, correct OTP still works after a wrong try |
| AU-03 | request a second OTP at once | 429 with `resendIn` |
| AU-04 | password login, wrong password, 5 failures | 200 / 401 / then 429 even with the right password |
| AU-05 | OTP login, wrong OTP, unknown number | 200 / 401 / same answer as a known number (no enumeration) |
| AU-06 | logout | the token stops working (401) |
| AU-07 | `/api/state` without and with login | 401 / 200 |
| AU-08 | buyer (GSTIN) and delivery partner (vehicle number) validation | 422 with field errors; valid data normalised |
| AU-09 | password reset with OTP | old password rejected, new works |
| AU-10 | admin: OTP alone, password then OTP, non-admin calling admin routes, log contents | 401 / token / 403 / events present and no secrets in logs |

## A. Automated (tests/app.test.cjs)
| ID | Area | Check | Expected |
|---|---|---|---|
| AT-01 | Server | `GET /api/health` | 200, `ok:true`, `mandiConfigured:true` (test env) |
| AT-02 | Mandi | `GET /api/mandi` against mock data.gov.in | wheat modal 2625, mustard 6350, cumin 22500; Green Gram not mapped to gram; Bengal Gram is |
| AT-03 | State | `PUT` then `GET /api/state` | same payload, `rev` increments; `?rev=` returns `same:true` |
| AT-04 | Config | `GET /api/config` | Sarvam object with all four fields |
| AT-05 | Doctor | `POST /api/doctor` without AI key | JSON error (4xx/5xx), never a crash |
| AT-06 | Static | `GET /` | 200 HTML containing `Kisan Setu` |
| AT-07 | i18n | all packs | 106 UI strings (22 languages), B pack 95-98 strings, no empty cells |
| AT-08 | Starter records | CSV headers | match importer columns |
| AT-10 | Translate | `POST /api/translate` with mock Gemini | translated map returned, second call served from cache (no extra upstream call), `en` rejected with 400 |
| AT-11 | Prices | data.gov.in records with Capitalised keys | parsed correctly |
| AT-12 | Prices | data.gov.in unavailable | eNAM fallback used; if all fail, `attempts[]` explains each failure |
| AT-13 | Prices | CSV upload with spaced headers | prices served, source `Uploaded CSV`; bad file -> 400 |
| AT-14 | Prices | agmarknet.gov.in mock with one absurd price | outlier removed, `official:true`, `rowsRejected >= 1` |
| AT-15 | Voice tool | `/api/tools/price` without / with token | 401 / speakable price; unknown crop -> `ok:false` |
| AT-09 | Build | `dist/index.html` | exists, contains Sarvam component and light-only colour scheme |

## B0. Manual login and registration
| ID | Portal | Steps | Expected |
|---|---|---|---|
| LG-01 | each of Farmer, Buyer, Household, Delivery | open portal, Create account, fill every field, Send OTP, enter OTP | account created, logged in, profile visible in Account |
| LG-02 | any | leave required fields empty / bad PIN / bad GSTIN / bad vehicle number | inline messages under each field, nothing submitted |
| LG-03 | any | log out, log in with password, then with OTP | both work |
| LG-04 | any | 5 wrong passwords | lock-out message; OTP login still possible |
| LG-05 | any | Forgot password flow | new password works |
| LG-06 | Operations | password then OTP | only then the admin console opens; no "Create account" tab |
| LG-07 | Operations | Real data: users list, block a user, view server log | blocked user cannot log in; log shows login events |
| LG-08 | Buyer | register, admin approves in Verification, buyer logs in again | "In review" badge disappears, ordering works |
| LG-09 | any | register on phone A, log in on phone B | same profile and shared data appear |
| LG-10 | ops | `npm run db:check` with real `MONGODB_URI` / `REDIS_URL` | all checks pass; data visible in MongoDB `users`, `logs`; Redis has `sess:*` keys |

## B. Manual functional
| ID | Portal | Steps | Expected |
|---|---|---|---|
| MT-01 | Farmer | Landing -> Open farmer app -> sign in as Ramu | Home shows greeting, price card (green), promo (amber) |
| MT-02 | Farmer | Crop Doctor -> photo of a leaf -> choose crop -> tick symptoms -> Check | Result with condition, actions, prevention; note says AI or on-device |
| MT-03 | Farmer | Crop Doctor with server offline | On-device result still appears |
| MT-04 | Farmer | Mic button | Screen titled Riya with "Talk to Riya" (if configured) else shortcut menu |
| MT-20 | Voice | Ask Riya "price of wheat today" (after docs/RIYA_VOICE_SETUP.md) | spoken verified price with date and source |
| MT-05 | Farmer | Account -> My details -> edit phone -> Save | Saved; shown in subtitle |
| MT-06 | Farmer | Account -> Language -> pick Tamil | UI strings switch; Crop Doctor result in Tamil |
| MT-07 | Farmer | Home tile "India crop and MSP guide" | 9 crops with MSP, season filter works, live line if prices live |
| MT-08 | Buyer | Place order from marketplace | Order appears in Orders; farmer sees it |
| MT-09 | Logistics | Register driver (name/phone/vehicle) | Appears in admin Data count |
| MT-10 | Admin | Real data -> import `farmers.csv` | "6 farmers imported"; duplicates by phone skipped |
| MT-11 | Admin | Import `buyers.csv`, `drivers.csv` | counts update |
| MT-12 | Admin | Remove starter records | seeded farmers/buyers/listings gone, imported remain |
| MT-13 | Sync | Open app on two devices, add a listing on A | Appears on B within ~10 s |
| MT-15 | Language | Switch to Tamil on Farmer, Buyer, Logistics and Admin portals | every visible label, button and placeholder is Tamil (numbers, ₹ and brand names unchanged) |
| MT-16 | Language | Switch back to English | all text returns to English without reload |
| MT-17 | Language | Switch to Urdu | layout becomes right-to-left |
| MT-18 | Language | Server without `GEMINI_API_KEY` | pack-covered screens translate, others remain English, no errors |
| MT-14 | Prices | Set `DATA_GOV_API_KEY` (or leave it empty) | Home price card shows the source and date (data.gov.in or eNAM) |
| MT-19 | Prices | Admin -> Real data -> upload `data/sample/mandi_prices.csv` | status says "Uploaded CSV"; slides show those prices |

## C. UI / accessibility
| ID | Check | Expected |
|---|---|---|
| UI-01 | OS dark mode on | App stays light |
| UI-02 | All screens at 360 px width | no horizontal scroll, last item not hidden by tab bar |
| UI-03 | Contrast of text on green/amber/mint surfaces | at least 4.5:1 for body text |
| UI-04 | Urdu / Kashmiri / Sindhi | right-to-left alignment |
| UI-05 | Devanagari, Tamil, Ol Chiki glyphs | render (device font) or fall back gracefully |

## D. Negative / edge
| ID | Case | Expected |
|---|---|---|
| NG-01 | Upload non-plant photo | "Not a plant" message |
| NG-02 | Upload > 20 MB or wrong type | clear error, no crash |
| NG-03 | data.gov.in down | stale cache or reference prices, no error banner |
| NG-04 | `WRITE_TOKEN` set, no header | 401 on PUT |
| NG-05 | CSV with missing columns | rows skipped, no crash |
