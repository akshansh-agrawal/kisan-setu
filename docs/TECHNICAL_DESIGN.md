# Technical Design Document - Kisan Setu (India edition)

Version 8.0 · Status: pilot-ready, pre-production · Diagrams use [Mermaid](https://mermaid.js.org) (render natively on GitHub/GitLab/VS Code).

## 1. Purpose and scope
Kisan Setu connects India farmers directly with bulk buyers, households and delivery partners, and gives farmers AI crop diagnosis, live mandi prices and a voice assistant in their own language. This document describes the architecture, data, integrations, security and quality approach.

**Goals:** simple mobile-first UI in 23 languages; real data in/out (CSV import, shared store, live prices); graceful degradation when any external service is down.
**Non-goals (this release):** payments settlement, OTP identity, multi-tenant authorization, native apps.

## 2. System context
```mermaid
flowchart LR
  F[Farmer] & B[Bulk buyer] & H[Household] & D[Delivery partner] & A[Admin] --> APP[Kisan Setu web app<br/>single-file React SPA]
  APP <--> API[Kisan Setu server<br/>Node.js]
  API --> GEM[Google Gemini API<br/>vision]
  API --> DGI[data.gov.in<br/>Agmarknet prices]
  APP --> SAR[Riya voice agent<br/>Sarvam AI Samvaad]
  SAR --> API
  APP --> FONT[Google Fonts]
  APP --> WIKI[Wikimedia Commons<br/>photos - optional]
```

## 3. Architecture
```mermaid
flowchart TB
  subgraph Browser
    UI[Portals: Farmer / Buyer / Consumer / Logistics / Admin]
    ST[Reducer state + localStorage cache]
    I18N[i18n: 23 language packs]
    ENG[On-device Crop Doctor fallback]
    VW[Voice sheet + Sarvam widget]
    UI --- ST
    UI --- I18N
    UI --- ENG
    UI --- VW
  end
  subgraph Server[server.cjs - zero dependency]
    R1[/api/doctor/]
    R2[/api/mandi/]
    R3[/api/state/]
    R4[/api/config/]
    R6[/api/translate/]
    TRC[(data/translations.json)]
    R6 --- TRC
    R5[/api/health/]
    STATIC[Static host dist/index.html]
    CACHE[(data/mandi.json)]
    STORE[(data/state.json)]
    R2 --- CACHE
    R3 --- STORE
  end
  ST <-- poll 6s / debounced PUT --> R3
  UI --> R1
  UI --> R2
  VW --> R4
  I18N -- untranslated text --> R6
  R6 --> GEMINI
  R1 --> GEMINI[(Gemini)]
  R2 --> DATAGOV[(data.gov.in)]
```
**Build:** `build.cjs` bundles `src/js/*.jsx` (ordered by filename) with esbuild, inlines CSS and any images in `assets/`, and emits one `dist/index.html`. React, no router library; roles are switched by `session.role`.

| Layer | Files | Notes |
|---|---|---|
| Foundation | `01a_head`, `01b_logic`, `01c_i18n_ext` | constants, languages, reducer, persistence + sync |
| UI kit & art | `02a_art`, `02b_ui` | icons, crop illustrations, shared components |
| Portals | `03_landing`, `05*_farmer`, `06_buyer_consumer`, `06z_account`, `07_logistics`, `08_admin` | one file per portal |
| Crop Doctor | `04a_doctor_data`, `04b_doctor`, `04c_doctor_engine` | UI, data, Gemini client + offline engine |
| India data | `00_india` | states, MSP, live price hook, Sarvam component |

## 4. Key flows
### 4.1 Crop Doctor
```mermaid
sequenceDiagram
  participant U as Farmer
  participant C as Client
  participant S as Server
  participant G as Gemini
  U->>C: photo + crop + symptoms
  C->>C: resize / validate image
  C->>S: POST /api/doctor (image, language, region)
  alt AI available
    S->>G: vision request (JSON-only prompt)
    G-->>S: diagnosis JSON
    S-->>C: normalised result
  else no key / network / rate limit
    C->>C: on-device colour + symptom scoring
  end
  C-->>U: condition, actions, prevention, care (in selected language)
```
### 4.2 Live mandi prices (multi-source, validated)
```mermaid
sequenceDiagram
  participant C as Client
  participant S as Server
  participant P as agmarknet.gov.in
  participant D as data.gov.in
  participant E as eNAM
  C->>S: GET /api/mandi
  alt cache fresh (3 h) or CSV upload (24 h)
    S-->>C: cached JSON
  else refresh
    S->>P: portal API (9 s timeout)
    P-->>S: records or error
    S->>D: paged query (limit 500) if portal failed
    alt ok
      D-->>S: records (any key casing)
    else key missing / rejected / empty
      S->>E: POST trade_data_list (no key)
      E-->>S: records or error
    end
    S->>S: normalise rows -> validate (drop inconsistent rows and outliers) -> map commodity to crop -> latest day -> median modal price
    S-->>C: crops{modal,min,max,date,markets}, source, or attempts[] with the reason each source failed
  end
  C->>C: PRICE_BOARD[crop] = modal / 100 (Rs per kg)
```
Fallback of last resort: admin uploads a CSV (`POST /api/mandi/import`), which needs no external service.

### 4.3 Shared data sync
```mermaid
sequenceDiagram
  participant A as Client A
  participant S as Server
  participant B as Client B
  A->>S: PUT /api/state (debounced 700 ms)
  S->>S: rev++ and atomic write state.json
  loop every 6 s
    B->>S: GET /api/state?rev=N
    S-->>B: same | new state
  end
```
### 4.4 Voice assistant (Riya)
```mermaid
sequenceDiagram
  participant F as Farmer
  participant W as Riya widget (Sarvam)
  participant A as Sarvam agent
  participant S as Kisan Setu server
  F->>W: Talk to Riya (speaks)
  W->>A: audio stream
  A->>S: GET /api/tools/price?crop=wheat (x-tool-token)
  S-->>A: verified price + speech sentence
  A-->>W: answer in the farmer's language
  W-->>F: spoken reply
```
Farmer home -> mic button -> `VoiceSheet`. If the server returns Sarvam config (`/api/config`) the widget script loads and a **Talk to Riya** voice session starts; otherwise a shortcut-command menu (Sell, Prices, Crop Doctor, Orders) is shown.

### 4.5 Accounts and sessions
Every portal uses the same `AuthScreen`: mobile + password or OTP, role-specific registration, forgot-password, and (for Operations) password followed by OTP. On success the server returns a session token; the app then loads the shared dataset **before** creating the user's profile so it never overwrites other users' data, and saves the profile immediately. Full flows, data stores and Redis keys: [AUTH_AND_DATA.md](AUTH_AND_DATA.md).

## 5. Data model
```mermaid
erDiagram
  FARMER ||--o{ LISTING : creates
  LISTING ||--o{ ORDER : "fulfilled by"
  BUYER ||--o{ ORDER : places
  DRIVER ||--o{ ROUTE_STOP : delivers
  ORDER ||--|| ROUTE_STOP : "planned as"
  FARMER ||--o{ SCAN : runs
  FARMER { string id string name string phone string region string lang bool kycVerified }
  BUYER { string id string businessName string type string region bool verified }
  DRIVER { string id string name string phone string vehicle string region }
  LISTING { string id string crop number qtyKg number pricePerKg }
  ORDER { string id string status number total }
  SCAN { string id string cropId string diagnosis date createdAt }
```
Persistence: MongoDB (`users`, `app_state`, `logs`) and Redis (OTP, sessions, rate limits) plus a localStorage cache per client; a local file and memory are used only when the URIs are not set. Collections: farmers, buyers, industrialBuyers, drivers, listings, orders, scans, residueListings, fraudFlags, audit log.

## 6. API reference
| Method | Path | Purpose | Errors |
|---|---|---|---|
| POST | `/api/auth/otp/send`, `/api/auth/register`, `/api/auth/login`, `/api/auth/login/otp`, `/api/auth/password/reset`, `/api/auth/logout`, `/api/auth/profile`; GET `/api/auth/me` | accounts for all portals (see AUTH_AND_DATA.md) | 400, 401, 409, 422, 429 |
| GET / POST | `/api/admin/logs`, `/api/admin/users`, `/api/admin/users/status` | operations tools (admin only) | 403 |
| GET | `/api/health` | status, `aiConfigured`, `mandiConfigured`, `rev` | - |
| POST | `/api/doctor` | AI diagnosis (JSON body: image data URL, lang, region, cropHint) | 400 bad image, 413 too large, 429 rate limit, 503 no key / upstream |
| GET | `/api/mandi[?refresh=1]` | live prices, `source`, or `{ok:false, reason, attempts[]}` | never 5xx (degrades) |
| POST | `/api/mandi/import` | admin CSV rows -> prices | 400 if no usable rows |
| GET / PUT | `/api/state` | shared dataset (login required); `?rev=` for conditional pull | 400, 401 |
| POST | `/api/translate` | batch-translate UI strings (`{lang, texts[]}` -> `{map}`), cached server-side | 400 bad language |
| GET | `/api/tools/price?crop=&state=` | speakable verified price for the Riya voice agent (`x-tool-token` if `VOICE_TOOL_TOKEN` set) | 401 |
| GET | `/api/config` | public widget config (`sarvam` or `null`) | - |

## 6a. Internationalisation
Three layers: (1) curated packs (`i18n/*.txt`: 106 UI strings + 98 Crop Doctor/guide strings, 19 languages plus built-in en/hi/mr/pa), (2) **auto-translate**, (3) fallback Hindi -> English. RTL for ur/ks/sd; fonts Noto Sans + script variants.
```mermaid
sequenceDiagram
  participant U as User
  participant C as Client (autoTranslate)
  participant S as Server
  participant G as Gemini
  U->>C: switch language
  C->>C: restore English, load cache for language
  C->>C: scan DOM text nodes (skip pack-translated elements)
  alt all texts cached
    C-->>U: translated screen
  else uncached texts
    C->>S: POST /api/translate {lang, texts[<=60]}
    S->>S: lookup data/translations.json
    S->>G: translate only the missing strings (JSON array)
    G-->>S: array
    S-->>C: map (stored on server + browser)
    C-->>U: translated screen (MutationObserver keeps new screens translated)
  end
```
Design notes: text nodes are edited in place (never replaced) so React reconciliation is unaffected; elements carrying `data-lang` (pack strings) and `translate="no"` are skipped; numbers, URLs and brand names are preserved by the prompt; failures are remembered per session so there is no retry storm.

## 7. Non-functional requirements
| Area | Target / approach |
|---|---|
| Performance | single 1.2 MB file, no runtime framework fetch; API calls under 1 request/6 s/client |
| Availability | every external dependency has a fallback (AI -> on-device, prices -> reference, voice -> shortcuts, photos -> illustrations) |
| Usability | mobile-first, light theme, WCAG-style contrast, large tap targets |
| Maintainability | zero-dependency server, one file per feature area, generated i18n |
| Demonstration | `npm run demo` (Playwright) records screenshots and video of the end-to-end story |
| Observability | server logs per request; `/api/health` |

## 8. Deployment
```mermaid
flowchart LR
  DEV[Developer] -->|npm run build| DIST[dist/index.html]
  DIST --> HOST[Any Node 18+ host: VM / Render / Railway / Fly]
  ENV[.env secrets] --> HOST
  HOST --> VOL[(persistent volume: data/)]
  USERS[Phones] -->|HTTPS via reverse proxy| HOST
```
Run behind HTTPS (Caddy/Nginx/Cloudflare). Mount `DATA_DIR` on a persistent volume and back it up daily.

## 9. Security and risk register
| # | Risk | Impact | Mitigation now | Next step |
|---|---|---|---|---|
| 1 | Any logged-in user can read the whole shared dataset | High | login required, hashed credentials, lock-outs, rate limits, audit log | per-record authorisation and record-level collections |
| 2 | Last-write-wins sync loses concurrent edits | Medium | 700 ms debounce, 6 s poll | per-collection patch API or SQLite/Postgres |
| 3 | Sarvam key visible in browser | Medium | server-provided config, not in source | restricted/rotatable key, domain allow-list |
| 4 | AI misdiagnosis | High (crop loss) | confidence shown, KVK / Kisan Call Centre prompt, doses from standard recommendations | expert review of KB, feedback loop |
| 5 | Stale or wrong mandi data / source outage | Medium | three independent sources, date + source shown, diagnostics in admin | alerts when data older than 2 days, paid data feed if needed |
| 6 | Machine translations inaccurate | Medium | curated packs first, auto-translate cached for review in `data/translations.json` | native-speaker review, glossary of agronomy terms |
| 7 | PII (phone numbers, addresses) stored | High | MongoDB with auth/TLS, consent recorded, passwords hashed, logs free of secrets | encryption at rest, DPDP Act retention and deletion flow |
| 8 | OTP delivery failure or abuse | Medium | 30 s cooldown, 5/hour per mobile, 20/hour per IP, 5 tries, provider errors logged | provider fail-over |

## 10. Roadmap
OTP authentication and roles -> database (SQLite/Postgres) -> payments/escrow -> push notifications -> native wrapper -> native-speaker translation review -> Manipuri and Santali packs.
