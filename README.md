# Kisan Setu

**A digital agriculture platform concept for connecting farmers, buyers, consumers, logistics partners, and agricultural support services.**

Kisan Setu is a digital agriculture marketplace application connecting farmers, buyers, consumers, logistics partners, and agricultural support services. This repository includes a local starter dataset and workflows for setup, evaluation, and further development.

> **Data notice:** The included starter profiles and transactions are illustrative records, not verified customer or financial records. Mandi prices are indicative reference estimates, not a live feed or official quote. Verify current prices and all safety, identity, payment, and delivery information before making operational decisions. The real database and APIs are not implemented, sample data is illustrated for demonstration.

>**NOTE:** The features like crop doctor, database inteegrstion, voice bot, etc. are functional only after the .env file is configured for the application.

## Contents

- [Features](#features)
- [Technology overview](#technology-overview)
- [Requirements](#requirements)
- [Quick start on Windows](#quick-start-on-windows)
- [Manual setup](#manual-setup)
- [Portal access](#portal-access)
- [Starter dataset](#starter-dataset)
- [Integrations and connectivity](#integrations-and-connectivity)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)
- [Security and limitations](#security-and-limitations)
- [Project structure](#project-structure)
- [License](#license)

## Features

The project includes interfaces and marketplace workflows for:

- **Farmer marketplace:** farmer profiles, crop availability, quantities, locations, and listing prices.
- **Bulk buyers:** business buyer profiles and produce discovery.
- **Consumer marketplace:** consumer-facing purchase workflows.
- **Logistics:** delivery-partner profiles and related delivery workflows.
- **Administration:** an operations portal for reviewing marketplace and marketplace activity.
- **Market information:** reference mandi-price records and support for configured external data sources.
- **Crop assistance:** optional AI-assisted crop support when the required provider credentials and network access are available.
- **Voice and language resources:** optional voice-provider integration and included language resources.

Feature availability depends on the current configuration and external service access. The presence of an interface does not mean that every workflow or integration has been independently validated end to end.

## Technology overview

- **Frontend:** React, bundled by `build.cjs`.
- **Backend:** Node.js HTTP server in `server.cjs`.
- **Local storage:** JSON-backed state selected through `DATA_DIR`.
- **Optional infrastructure:** MongoDB and Redis modules are included for configurations that use them.
- **Optional external services:** AI, voice, and live market-data features may require API credentials and an internet connection.

The default local launcher selects a local data directory and clears MongoDB/Redis connection variables for the local process, so local use does not depend on a separately configured cloud database.

## Requirements

For the Windows quick start:

- Windows 10 or later.
- [Node.js 18 or newer](https://nodejs.org/) with npm.
- Internet access for initial package installation if dependencies are not already installed or cached.

## Quick start on Windows

1. Extract the complete ZIP archive into a writable folder, such as `C:\KisanSetu`. Do not run the application from inside the ZIP viewer.
2. Double-click `START-KISAN-SETU.bat`.
3. Allow the script to install dependencies if needed, build the frontend, and seed the local starter dataset.
4. Open [http://localhost:8787](http://localhost:8787) in your browser if it does not open automatically.
5. Keep the terminal window open while using the application. Closing it stops the local server.

The launcher uses the project's `data-kisan-setu` directory for the seeded marketplace data. Running the launcher seeds the local state again; back up any data you want to retain before rerunning it.

### Stop the application

Press `Ctrl+C` in the terminal window and confirm if prompted.

## Manual setup

Run the following commands from the project root—the directory containing `package.json`.

**Windows PowerShell:**

```powershell
npm install
npm run build
$env:DATA_DIR = ".\data-kisan-setu"
npm run seed:data
npm start
```

**macOS/Linux:**

```bash
npm install
npm run build
export DATA_DIR="./data-kisan-setu"
npm run seed:data
npm start
```

Then visit [http://localhost:8787](http://localhost:8787). Use the same `DATA_DIR` value when seeding and starting the server so both commands access the same local dataset.

## Portal access

The data seeder creates **exactly one login account per portal** (five accounts total). The larger set of farmer, buyer, consumer, and delivery-partner profiles are marketplace records—not additional login accounts. Marketplace listings, orders, and route stops are linked to these five accounts so activity can be followed across the portals.

| Portal | Mobile number | Password |
|---|---|---|
| Admin / Operations | `9000000001` | `AdminKisan26!` |
| Farmer | `9000000101` | `FarmKisan26!` |
| Bulk Buyer | `9000000201` | `BuyerKisan26!` |
| Consumer | `9000000301` | `HomeKisan26!` |
| Delivery Partner | `9000000401` | `DriveKisan26!` |

**Login steps:** Select the matching portal, enter its mobile number and password from the table, then complete the development OTP if prompted. With the development console SMS provider, the OTP is shown on the login screen and in the server terminal. The five credentials above are the only seeded login accounts; other seeded profiles are marketplace records, not additional accounts.

These credentials are public starter credentials. Use them only for local evaluation and never in a production deployment. The seeder also writes `reference/portal-access.csv` with these five logins in the configured data directory for convenient reference.

## Starter dataset

Run `npm run seed:data` to generate the local state. The seeded dataset includes:

- Exactly 5 login accounts: one per portal.
- 25 farmer profiles, 10 bulk-buyer profiles, 10 consumer profiles, and 5 delivery-partner profiles (these additional profiles are data only, not login accounts).
- 60 crop listings and 12 initial orders, linked so the farmer and buyer portals show related transactions; consumer orders appear in the household portal, and corresponding pickup/delivery stops appear in logistics.
- 3 industrial/biomass buyer records and 9 residue listings.
- 12 sowing-intent records, 3 glut-alert records, 8 voice-call records, and audit history.
- 120 indicative mandi-price rows across example crops and markets.
- Reference CSV/JSON files in the selected data directory's reference folder.

All seeded identities and activity are fictional. Mandi-price records are indicative and are not official or live prices.

## Integrations and connectivity

The core application can run locally with the seeded JSON dataset, but not every feature is fully offline.

- **Initial installation:** `npm install` generally requires internet access unless packages are already available locally.
- **Live mandi information:** requires internet access and a supported external source. Seeded prices are indicative estimates only.
- **AI crop assistance:** requires a valid server-side provider API key and internet access.
- **Voice services:** may require a configured provider/widget and internet access.
- **Third-party assets:** some images, maps, fonts, or other assets may not load when offline.

Before presenting the project, test the specific workflows you plan to evaluate and clearly distinguish indicative records from live service responses.

## Configuration

- `.env.example` lists environment variables supported by the project. Create a local `.env` only when configuration is needed.
- Keep API keys on the server. Do not hard-code secrets into frontend code or commit a populated `.env` file.
- Leave `MONGODB_URI` and `REDIS_URL` unset for the local JSON-backed local configuration.
- `DATA_DIR` selects the local storage directory. Keep it consistent between the seeder and server.
- `PORT` can be used to select a server port. If the port changes, open the matching local URL manually if necessary.

## Troubleshooting

**Node.js or npm is not found**  
Install Node.js 18 or newer, reopen the terminal, and verify `node -v` and `npm -v`.

**Dependency installation fails**  
Check your internet connection and run `npm install` from the project directory. A managed network may block access to the package registry.

**Port 8787 is already in use**  
Stop the process using that port or configure another `PORT` value, then open the corresponding URL.

**The portal login or starter records are missing**  
Check that `npm run seed:data` completed successfully and that `DATA_DIR` is identical for the seed and server processes. Select the Admin / Operations portal and use the starter credentials above.

**The login requests an OTP**  
With the development console SMS provider, check the login screen and the terminal running the server.

**AI or voice functionality is unavailable**  
Check internet access, provider status, and server-side configuration. These optional integrations are not required to explore the local local marketplace.

## Security and limitations

This is a project/local implementation, not a production-ready agricultural, identity, logistics, or financial service. Before any production deployment:

- Replace authentication and credentials with a reviewed, secure identity flow.
- Review authorization, input validation, session handling, and data access controls.
- Configure HTTPS, backups, monitoring, and appropriate operational safeguards.
- Review applicable privacy and data-protection obligations.
- Validate external data sources and independently assess AI-generated outputs.
- Obtain appropriate agronomic expertise before using crop-related recommendations for real decisions.

Do not expose the local server publicly or use the starter credentials on an untrusted network. Do not present indicative data as real-world data.

## Project structure

```text
kisan-setu/
├── assets/                 Static assets
├── data/                   Reference data
├── dist/                   Built frontend output
├── docs/                   Technical and source documentation
├── i18n/                   Language resources and generator
├── scripts/                Build helpers and data seeder
├── server/                 Database, authentication, and service modules
├── src/                    Frontend source and templates
├── tests/                  Automated tests
├── server.cjs              Node.js HTTP server
├── build.cjs               Frontend build script
├── package.json            Scripts and dependencies
├── START-KISAN-SETU.bat    Windows startup helper
├── LICENSE                 Project license
└── README.md               Project documentation
```

## License

This project includes an MIT License in the `LICENSE` file. Third-party packages, images, fonts, datasets, embedded widgets, and external services may be subject to their own licenses or terms; those are not relicensed by the project's license. Review `docs/PHOTO_SOURCES.md` and relevant provider documentation before redistributing third-party materials.

Kisan Setu is an agriculture marketplace project and is not affiliated with or endorsed by a government department or market-data provider unless explicitly stated by that organization.
