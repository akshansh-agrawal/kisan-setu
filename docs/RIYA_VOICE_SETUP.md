# Riya - voice assistant setup (Sarvam AI Samvaad)

Riya is the voice assistant inside the farmer app. Technically it is a Sarvam AI **Samvaad** conversational agent embedded as a call widget. The app already contains the widget; this guide shows how to create and configure the agent so Riya speaks the farmer's language and answers with **verified mandi prices** from this server.

> Menu names in the Sarvam dashboard change over time. The steps describe the intent; follow the equivalent options in your Sarvam workspace.

## 1. Create the agent
1. Sign in to the Sarvam dashboard and open **Samvaad** (conversational agents).
2. Create a new agent/app named **Riya**. Interaction type: **voice call**.
3. Languages: enable every Indian language you want to support (Hindi, English, Marathi, Punjabi, Gujarati, Tamil, Telugu, Kannada, Malayalam, Bengali, Odia, ...). Let Riya answer in the language the farmer speaks.
4. Voice: choose a natural female voice for Riya.

## 2. Persona prompt (paste as the agent instruction)
```
You are Riya, the voice assistant of Kisan Setu, a farm-to-buyer marketplace for farmers across India.
Speak simply, warmly and briefly, in the language the farmer uses. Never use technical words.
You can help with: today's mandi prices, how to list a crop for sale, how to use Crop Doctor (photograph a leaf),
and how orders, delivery and payments work in the app.
For any price question you MUST call the tool get_mandi_price and read out its "speech" result. Never guess a price.
If the tool says no verified price is available, say so and suggest checking again later.
For crop disease, tell the farmer to open Crop Doctor in the app and take a photo, and to confirm with the local KVK
or Kisan Call Centre 1800-180-1551 before spraying any chemical.
Do not give medical, legal or financial advice. If you are unsure, say so.
Always end by asking if there is anything else you can help with.
```

## 3. Give Riya the live price tool
Riya must call this server, so the server needs a **public HTTPS URL** (deploy it, see README). Then add an **HTTP tool / webhook / function** to the agent:

| Field | Value |
|---|---|
| Name | `get_mandi_price` |
| Description | Returns today's verified mandi price for a crop in India. |
| Method / URL | `GET https://YOUR-SERVER/api/tools/price` |
| Parameters | `crop` (string, required: wheat, tomato, onion, potato, cauliflower, bajra, mustard, cumin, guar, groundnut, gram, soybean, cotton), `state` (string, optional) |
| Header | `x-tool-token: <your VOICE_TOOL_TOKEN>` |

Set `VOICE_TOOL_TOKEN=<long random string>` in the server's `.env` so only Riya can call it. Test it yourself:
```bash
curl -H "x-tool-token: YOURTOKEN" "https://YOUR-SERVER/api/tools/price?crop=wheat"
# -> {"ok":true,"price_per_kg":26.2,"price_per_quintal":2620,"date":"2026-10-10","source":"...","speech":"wheat is selling at about 26.20 rupees per kilo ..."}
```

## 4. Knowledge base (optional but recommended)
Upload to the agent's knowledge section: `README.md` (what the app does), the in-app help text, and a short FAQ (how to list a crop, how payments work, Kisan Call Centre number). Keep it short and factual.

## 5. Connect the agent to the app
From the agent's **embed / widget** settings copy four values into the server `.env`:
```
SARVAM_API_KEY=...
SARVAM_APP_ID=...
SARVAM_ORG_ID=...
SARVAM_WORKSPACE_ID=...
```
Restart the server. In the farmer app tap the mic button: the voice screen shows **Riya** with a **Talk to Riya** button. The browser asks for microphone permission once. If the widget cannot load (offline, key missing) the screen shows Riya's shortcut commands instead.

## 6. Test checklist
| # | Say | Expected |
|---|---|---|
| 1 | "What is the price of wheat today?" | Riya calls `get_mandi_price` and reads a price with date and source |
| 2 | Same question in Hindi / Tamil | answer in the same language |
| 3 | "Price of unicorn" | polite "could not recognise that crop" |
| 4 | "My tomato leaves have spots" | tells the farmer to use Crop Doctor and confirm with KVK |
| 5 | Tool token wrong (test with curl) | `401`, Riya apologises instead of guessing |

## 7. Security notes
- The widget keys are visible in the browser by design: use a key restricted to your domain and rotate it if shared.
- Keep `VOICE_TOOL_TOKEN` secret; it is only used server-to-server.
- Do not put farmer personal data in the agent's knowledge base.
