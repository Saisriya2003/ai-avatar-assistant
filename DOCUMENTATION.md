# AI Avatar Integration System — Complete Documentation

**AI Avatar Integration System — an interactive, talking avatar for customer support and virtual-assistant scenarios**

Repository: https://github.com/Saisriya2003/ai-avatar-integration-system
Author: Pettem Sai Sriya · saisriyavarma@gmail.com

Resume project: *AI Avatar Integration System — Developed an interactive AI avatar for user engagement. Enabled real-time communication between users and AI avatar. Used for customer support and virtual assistant scenarios. Tech: Avatar APIs, React.*

---

## Contents

1. [Overview](#1-overview)
2. [Tech stack](#2-tech-stack)
3. [Repository layout](#3-repository-layout)
4. [System architecture](#4-system-architecture)
5. [The AvatarEngine (Avatar API)](#5-the-avatarengine-avatar-api)
6. [The SVG avatar](#6-the-svg-avatar)
7. [Speech: synthesis, lip-sync, recognition](#7-speech-synthesis-lip-sync-recognition)
8. [Reply engines](#8-reply-engines)
9. [Conversation modes and content](#9-conversation-modes-and-content)
10. [REST API reference](#10-rest-api-reference)
11. [Frontend: components and user workflow](#11-frontend-components-and-user-workflow)
12. [Real-time state flow](#12-real-time-state-flow)
13. [Running the application](#13-running-the-application)
14. [Configuration](#14-configuration)
15. [Testing, CI, and verification](#15-testing-ci-and-verification)
16. [Extending and swapping in a vendor avatar](#16-extending-and-swapping-in-a-vendor-avatar)
17. [Limitations and production path](#17-limitations-and-production-path)
18. [Glossary](#18-glossary)

---

## 1. Overview

The AI Avatar Integration System is a browser-based AI avatar. A stylised SVG bust blinks, breathes, follows the pointer, shows emotions, and **speaks replies aloud with lip-synced mouth shapes (visemes)**. Users type or talk to it. It runs in two modes: **Support** (a fictional SaaS product, Lumen Cloud) and **Assistant** (calendar, reminders, drafting).

The heart of the project is the **AvatarEngine** — a controller object with a small, documented API (`setEmotion`, `setViseme`, `speak`, `lookAt`, `subscribe`, …). Every other part of the UI (chat, microphone, debug drawer) drives the avatar through that API and never touches the SVG directly. That is the "Avatar API" integration surface: a hosted avatar vendor (Ready Player Me, D-ID, HeyGen) can implement the same methods and drop in.

Design goals:

- **Real-time** — state changes propagate synchronously to the avatar via a subscription; speech boundary events adjust mouth shapes mid-sentence.
- **Zero keys** — a local intent engine answers by default; OpenAI is an opt-in upgrade on the server.
- **Never stuck** — a client-side fallback brain, request timeouts, and a speech safety timer keep the avatar responsive if the server or the browser's speech engine misbehaves.
- **Inspectable** — an *Avatar API* drawer shows live state and lets a reviewer trigger every emotion and viseme.

## 2. Tech stack

| Layer | Technology | Notes |
| --- | --- | --- |
| UI library | React 18 | JSX, hooks, StrictMode-safe lifecycle |
| Build tool / dev server | Vite 6 | port 5176, `strictPort`, `/api` proxy → 5070 |
| Avatar rendering | Inline SVG (`Avatar.jsx`) | emotions and visemes as attribute/transform changes; `requestAnimationFrame` sway |
| Avatar control | `createAvatarController()` (`engine.js`) | framework-agnostic plain JS; publish/subscribe |
| Text-to-speech | Web Speech API `speechSynthesis` / `SpeechSynthesisUtterance` | `onboundary` char indexes drive lip-sync |
| Speech-to-text | Web Speech API `SpeechRecognition` / `webkitSpeechRecognition` | interim + final results |
| Server runtime | Node.js 18+ | ES modules |
| Server framework | Express | `cors`, `dotenv`, JSON limit 64 KB |
| Reply engine (default) | Keyword intent matcher (`server/brain.js`) | emotion attached to each reply |
| Reply engine (optional) | OpenAI Chat Completions (`gpt-4o-mini` default) | mode-specific system prompt |
| Client fallback | `src/lib/localBrain.js` | same intents, used when the server is unreachable |
| Styling | Hand-written CSS with design tokens; Outfit + Fraunces | grain overlay, copper accent |
| CI | GitHub Actions (Ubuntu) | |

## 3. Repository layout

```
ai-avatar-integration-system/
├── index.html                  root HTML, fonts, favicon
├── public/favicon.svg
├── package.json                scripts: dev, build, preview, server
├── vite.config.js              port 5176, /api → http://127.0.0.1:5070
├── server/
│   ├── index.js                Express: /api/health, /api/chat, serves dist/ when built
│   └── brain.js                SUPPORT/ASSISTANT facts and intents, matchIntent, replyTo (OpenAI optional)
├── src/
│   ├── main.jsx                React root (StrictMode)
│   ├── App.jsx                 owns the controller, messages, mode, mic, health; send() orchestration
│   ├── index.css
│   ├── avatar/
│   │   ├── engine.js           createAvatarController(): the Avatar API
│   │   └── Avatar.jsx          SVG bust bound to controller state; pointer gaze
│   ├── components/
│   │   ├── Conversation.jsx    right column: header, mode switcher, messages, chips, composer, drawer
│   │   ├── ModeSwitcher.jsx    Support / Assistant tabs
│   │   ├── MessageList.jsx     thread with typing indicator and auto-scroll
│   │   ├── PromptChips.jsx     per-mode suggested prompts
│   │   ├── Composer.jsx        text input, Send, Mic button
│   │   └── DebugDrawer.jsx     "Avatar API" panel: live state, emotion/viseme buttons
│   ├── data/content.js         MODES, seedMessages(), newId()
│   └── lib/
│       ├── api.js              sendChat() with 9 s timeout and local fallback; fetchHealth()
│       ├── localBrain.js       client-side intents
│       └── speech.js           speechSupported(), createRecognizer()
├── .env.example
├── .github/workflows/ci.yml
├── start.ps1 / start.sh
├── .gitattributes, .gitignore
└── README.md
```

## 4. System architecture

```
Browser (Vite, :5176)                                          Node server (:5070)
┌───────────────────────────────────────────────────────┐      ┌──────────────────────────────┐
│ App.jsx                                               │      │ Express                      │
│  ├─ controller = createAvatarController()  ─────┐     │      │  GET  /api/health            │
│  ├─ subscribe(setAvatarState) ◀─────────────────┤     │ /api │  POST /api/chat ─▶ brain.js  │
│  ├─ send(text) ─▶ lib/api.sendChat ─────────────┼─────┼─────▶│      ├─ matchIntent (local)  │
│  │     └─ on failure/timeout ─▶ localBrain      │     │      │      └─ OpenAI (if keyed)    │
│  ├─ recognizer (speech.js) ─▶ onFinal ─▶ send   │     │      └──────────────────────────────┘
│  └─ render                                      │     │
│      ├─ <Avatar controller state/>  ◀───────────┘     │
│      ├─ status pill (Ready/Thinking/Speaking/Listening)│
│      └─ <Conversation …/> ─▶ DebugDrawer calls        │
│              controller.setEmotion / setViseme directly│
│                                                       │
│ engine.js: speak() ─▶ speechSynthesis ─▶ onboundary ─▶ visemes ─▶ emit() ─▶ Avatar re-renders │
└───────────────────────────────────────────────────────┘
```

Two processes in development; the Vite proxy makes `/api` same-origin. The server also allows any origin via `cors({origin: true})` for standalone use.

## 5. The AvatarEngine (Avatar API)

File: `src/avatar/engine.js`. `createAvatarController()` returns a plain object; no React dependency.

### 5.1 State

```js
{ emotion: 'neutral', viseme: 'closed', listening: false, speaking: false, lookAt: {x: 0, y: 0}, blink: false }
```

`emotion ∈ {neutral, smile, listen, think, concern}` · `viseme ∈ {closed, small, mid, open, wide}` · `lookAt` components clamped to \[−1, 1\].

### 5.2 Methods

| Method | Behaviour |
| --- | --- |
| `setEmotion(name)` | Validates against `EMOTIONS`, sets, emits. |
| `setViseme(name)` | Validates against `VISEMES`, sets, emits. |
| `setListening(bool)` | Sets listening; if listening and not speaking, emotion becomes `listen`. |
| `setSpeaking(bool)` | Sets speaking; when turning off, mouth returns to `closed`. |
| `speak(text)` → `Promise` | Normalises whitespace, cancels any current speech, starts TTS with lip-sync (see §7), resolves when speech ends, errors, or the safety timer fires. Without `speechSynthesis` it still animates the mouth for an estimated duration. |
| `stop()` | Clears the viseme ticker, cancels `speechSynthesis`, sets `speaking=false`, mouth `closed`. |
| `blink()` | Sets `blink=true` for 120 ms. |
| `lookAt(x, y, source)` | `source='pointer'` locks gaze; `'idle'` is ignored while locked; `'script'` always applies. |
| `releaseLook()` | Unlocks and recentres. |
| `start()` | Idempotent: `destroyed=false`, schedules blink (every 2.4–5.8 s) and gaze wander (every 4.2–7 s, only when not speaking/listening/locked, returning to centre after 0.9–1.6 s). |
| `destroy()` | Reversible: `destroyed=true`, `stop()`, clears all timers. Does **not** clear subscribers, so React StrictMode's mount→unmount→mount leaves everything working. |
| `subscribe(fn)` | Adds a listener, immediately calls it with a snapshot, returns an unsubscribe function. |
| `getState()` | Returns a defensive copy. |
| `visemes`, `emotions` | The valid value lists, for UIs like the debug drawer. |

### 5.3 Lifecycle in React (`App.jsx`)

```js
const [controller] = useState(() => createAvatarController());     // created once, never recreated
const [avatarState, setAvatarState] = useState(() => controller.getState());
useEffect(() => controller.subscribe(setAvatarState), [controller]); // returns unsubscribe
useEffect(() => { controller.start(); return () => controller.destroy(); }, [controller]);
```

Holding the controller in `useState` (not a ref that cleanup nulls) is what prevents the "Maximum update depth exceeded" loop under StrictMode.

## 6. The SVG avatar

File: `src/avatar/Avatar.jsx`. A layered inline SVG bust (hair, face, eyes with lids and pupils, brows, mouth, shoulders) rendered from `state`:

- **Emotion** changes brow angle/height, mouth curvature, eye scale, and lid bias (e.g. `concern` lowers inner brows and flattens the mouth; `smile` lifts corners; `think` raises one brow and shifts the gaze up-left; `listen` widens eyes slightly).
- **Viseme** sets mouth height and width (`closed` → thin line, `wide` → tall oval) with CSS transitions of ~60 ms for smooth lip movement.
- **Blink** scales the lids closed for 120 ms.
- **lookAt** offsets pupils and slightly rotates the head; the pointer moving over the stage calls `controller.lookAt(x, y, 'pointer')`, leaving calls `releaseLook()`.
- **Idle life**: a `requestAnimationFrame` loop applies a gentle breathing/sway transform.
- **Listening** shows a copper ring around the bust; **speaking** adds a soft glow.

## 7. Speech: synthesis, lip-sync, recognition

### 7.1 Synthesis and lip-sync (`engine.speak`)

1. Build a `SpeechSynthesisUtterance` (rate 0.96, pitch 1.02, `en-US`) and pick the best available English voice — scoring neural/natural/premium voices and female-named voices higher; re-evaluated on `voiceschanged`.
2. `driveVisemes(text)` starts a **75 ms ticker** that walks the text character by character (skipping punctuation and spaces), mapping the leading letter of each 3-char window to a viseme:
   - m b p → `closed` · f v s z t d n → `small` · l e i y → `mid` · a → `open` · o u w r → `wide` · other → `mid`
   When the text is exhausted the ticker stops itself and closes the mouth.
3. `utter.onboundary` (word/sentence boundaries with `charIndex`) **re-syncs** the ticker's position so mouth shapes track the actual audio, not just the estimate.
4. A **generation counter** (`visemeGen`) makes stale ticks or late boundary events no-ops after `stop()` or a new `speak()`.
5. `finish()` detaches `onboundary/onend/onerror`, clears the ticker, sets `speaking=false`, resolves the promise. Guarded by `utterance === utter` so an old utterance cannot finish a new one.
6. **Safety timer**: some browsers never fire `onend` (no voices, muted tab, headless). After `min(30 s, 1.5 s + 90 ms × chars)` the engine checks `speechSynthesis.speaking || pending`; if still busy it re-checks every 1.5 s up to 15 s beyond the estimate, then finishes regardless. This is what keeps the status pill from sticking on *Speaking*.

### 7.2 Recognition (`lib/speech.js`)

`createRecognizer({onInterim, onFinal, onError, onStart, onEnd})` wraps `SpeechRecognition`: `lang en-US`, `interimResults true`, `continuous false`, one alternative. A fresh instance is created per start. Error codes `aborted`/`no-speech` end quietly; `not-allowed` yields a permission message; anything else a retry hint. `speechSupported()` reports `{listen, speak}` so the UI can disable the mic where unsupported (Firefox).

## 8. Reply engines

Three layers, tried in order:

1. **Server local intents** (`server/brain.js`, default) — `matchIntent` normalises the last user message and scores each intent by keyword hits. Keys match on whole words with common English suffixes (`charge` finds "charged", `remind` finds "reminders", `hi` does not match "this"). A single topic word scores 2, a phrase 3, and generic words that appear in many questions (`what is`, `how do`, `how to`, `about`, `workspace`, `lumen`, `what can`) only 1, so "What is your refund policy?" resolves to *refund*, not *product*. Ties are broken toward the intent whose matched keys are longer (more specific). The best intent with score ≥ 2 wins; each intent carries an `emotion`. If nothing matches, a mode-specific clarifying reply with emotion `think` is returned.
2. **OpenAI** (when `OPENAI_API_KEY` is set) — the full thread is sent with a mode-specific system prompt (`SUPPORT_FACTS` or `ASSISTANT_FACTS`: product facts, plan prices, refund policy, seeded calendar, voice rules "short paragraphs, no exclamation spam, no emoji"), temperature 0.5. The emotion is inferred from the reply text (`inferEmotion`: apologies/refund/outage → `concern`; glad/welcome/pinned → `smile`; consider/next/option → `think`). Any HTTP failure or empty reply falls back to layer 1.
3. **Client fallback** (`src/lib/localBrain.js`) — the same intents in the browser. `sendChat()` aborts the server request after **9 s** or on any error and answers locally; the status pill then reads *On-device fallback*.

`/api/health` reports which server engine is active (`local` or `openai`), polled every 20 s by the client.

## 9. Conversation modes and content

File: `src/data/content.js`.

| Mode | Kicker / title | Suggested prompts | Seed messages |
| --- | --- | --- | --- |
| **Support** | Lumen Cloud · Customer support | What is Lumen Cloud? · Explain workspace pricing · How do I open a ticket? · What is your refund policy? | Welcome from the avatar; plan overview and offer to file a draft ticket |
| **Assistant** | Personal · Virtual assistant | What's on my calendar today? · Remind me to send the report at 4 · Help me plan tomorrow morning · Draft a short status update | Introduction; summary of Friday's seeded calendar |

Support knowledge (fictional): plans Spark (free, 3 guests) / Halo ($18 per user/month; shared vaults, Slack, GitHub) / Nova ($42; SSO, audit log, 24/7 support); 15% off annual; tickets via Help → New ticket (sample LC-48219); 14-day full refund on annual under 5 active canvases, then prorated credit; 99.97% thirty-day uptime; integrations Slack, GitHub, Figma, Google Calendar, Okta/Entra SSO on Nova.

Assistant knowledge: today is Friday 11 September 2026; calendar 9:30 standup, 11:00 avatar integration review, 14:00 design critique, 16:30 ship block; can pin session reminders, plan a morning, draft a status line.

Switching modes stops speech, reseeds the thread, and sets the avatar to `smile`.

## 10. REST API reference

Base URL (dev): `http://127.0.0.1:5070`.

| Method | Path | Request | Response |
| --- | --- | --- | --- |
| GET | `/api/health` | — | `{ok: true, llm: boolean, engine: "local"|"openai"}` |
| POST | `/api/chat` | `{messages: [{role: "user"|"aria", text}], mode: "support"|"assistant"}` (≤ 64 KB) | `{reply, emotion}`; on internal fault still 200 with a `concern` reply explaining the switch to local |

## 11. Frontend: components and user workflow

### 11.1 Layout

Two columns on desktop: **stage** (avatar + status pill) on the left, **Conversation** on the right. On narrow screens they stack, avatar first.

### 11.2 Components

| Component | Role |
| --- | --- |
| `Avatar` | SVG bust bound to `avatarState`; pointer gaze handlers |
| Status pill | `Thinking` / `Speaking` / `Listening` / `Ready` plus source: `OpenAI`, `Local server`, or `On-device fallback` |
| `Conversation` | Header with mode kicker/title/blurb, `ModeSwitcher`, `MessageList`, `PromptChips`, error line, `Composer`, `DebugDrawer` toggle |
| `ModeSwitcher` | Support / Assistant tabs |
| `MessageList` | User and avatar bubbles with timestamps and emotion tag; typing indicator while pending; auto-scroll |
| `PromptChips` | Four tappable prompts per mode |
| `Composer` | Text field (Enter sends), Send button, Mic button (disabled with tooltip where unsupported) |
| `DebugDrawer` | "Avatar API" panel: live `emotion`, `viseme`, `listening`, `speaking`, `lookAt`, server `engine`; buttons for each emotion and viseme that call the controller directly |

### 11.3 User workflow

1. Open `http://localhost:5176`. The avatar blinks and glances around; status reads *Ready · Local server*; two seed messages from the avatar are in the thread.
2. Type a question and press Enter, or tap a prompt chip. Status → *Thinking*, avatar emotion `think`.
3. The reply appears; the avatar switches to the reply's emotion and **speaks it** with lip-sync; status → *Speaking*, then *Ready*.
4. Tap the **Mic**: a copper ring appears, status → *Listening*; interim words fill the composer; on the final result the message sends automatically.
5. Switch to **Assistant**: thread reseeds; ask about the calendar or a reminder.
6. Open the **Avatar API** drawer: watch state change live while the avatar speaks; press emotion/viseme buttons to preview them.
7. Move the pointer across the avatar; the eyes and head follow, and recentre when you leave.

## 12. Real-time state flow

```
user input ──▶ App.send()
                ├─ controller.stop(); setListening(false); setEmotion('think'); pending=true
                ├─ append user message
                ├─ await sendChat()   (server intents | OpenAI | 9 s timeout → localBrain)
                ├─ append avatar message; pending=false
                ├─ controller.setEmotion(reply.emotion)
                └─ await controller.speak(reply.text)
                        ├─ setSpeaking(true) ─▶ emit ─▶ Avatar glow, pill "Speaking"
                        ├─ ticker every 75 ms ─▶ setViseme ─▶ emit ─▶ mouth shape
                        ├─ onboundary(charIndex) ─▶ re-sync ticker
                        └─ onend | onerror | safety timer ─▶ finish() ─▶ setSpeaking(false) ─▶ pill "Ready"
```

Every `emit()` calls each subscriber synchronously with a fresh snapshot; React batches the resulting `setAvatarState` into one render.

## 13. Running the application

### Prerequisites

Node.js 18+, Git. Chrome or Edge recommended for both speech synthesis and recognition.

### One command

```powershell
git clone https://github.com/Saisriya2003/ai-avatar-integration-system.git
cd ai-avatar-integration-system
.\start.ps1      # Windows (or: powershell -ExecutionPolicy Bypass -File .\start.ps1)
```

```bash
git clone https://github.com/Saisriya2003/ai-avatar-integration-system.git
cd ai-avatar-integration-system
./start.sh       # macOS / Linux
```

Installs dependencies on first run, starts the server on 5070 and Vite on 5176, opens the browser.

### Manual

```bash
npm install
npm run server   # http://127.0.0.1:5070
npm run dev      # http://localhost:5176  (second terminal)
```

### Docker

`docker compose up --build` (or `docker build -t ai-avatar-integration-system . && docker run -p 5176:5070 ai-avatar-integration-system`) produces one container: a multi-stage build compiles the UI, then a `node:20-alpine` runtime runs `server/index.js`, which serves `/api/chat` **and** the built UI from the same origin. Host port defaults to 5176 (`WEB_PORT`); an `.env` beside the compose file can supply `OPENAI_API_KEY`.

### Production build

`npm run build` → `dist/`. When `dist/index.html` exists, `npm run server` serves it itself (static files plus SPA fallback for non-`/api` routes), so a single Node process is the whole app. Alternatively serve `dist/` from any static host with `/api` proxied to the Node server (the client uses relative `/api` paths).

## 14. Configuration

Copy `.env.example` to `.env` in the repo root (read by `server/index.js`).

| Variable | Default | Effect |
| --- | --- | --- |
| `OPENAI_API_KEY` | unset → local intents | Enables OpenAI replies on the server; `/api/health.llm` becomes `true` |
| `OPENAI_MODEL` | `gpt-4o-mini` | Chat model |
| `PORT` | `5070` | Server port (update `vite.config.js` proxy and start scripts if changed). Avoid 5060/5061: browsers refuse those SIP ports with `ERR_UNSAFE_PORT`. |

Browser permissions: the microphone prompt appears on first Mic use; speech synthesis needs no permission.

## 15. Testing, CI, and verification

### Automated tests (`test/`, `node --test`)

17 tests using Node's built-in runner, run with `npm test`:

- `brain.test.js` — every suggested prompt in both modes reaches its own intent; specific topic words outrank generic question words ("hello, what is the refund policy" → refund); whole-word matching ("this" does not trigger the "hi" greeting); every reply carries a renderable emotion; `replyTo` uses the local engine without an OpenAI key.
- `localBrain.test.js` — the client fallback routes the same prompts; reminders echo the request; empty input gets a listening prompt; unknown input gets a clarifying fallback.
- `engine.test.js` — with a `window` shim and no `speechSynthesis`: viseme mapping and value lists; initial state and synchronous subscriber snapshots with unsubscribe; invalid emotions ignored; listening switches the face; gaze clamping, pointer lock over idle wander, release; blink pulse; `speak()` shows several mouth shapes then resolves closed; `stop()` interrupts and manual visemes are not clobbered by stale ticks; `destroy()`/`start()` is reversible and keeps subscribers.

### GitHub Actions (`.github/workflows/ci.yml`)

Node 20 → `npm ci` → `npm test` → `npm run build` → start `node server/index.js` → `GET /api/health` → `POST /api/chat` with a support question → assert 200 and a non-empty reply.

### End-to-end verification performed

Playwright (Edge) at 1360 px and 390 px, 9 steps: idle avatar and status pill, seed messages, chip → reply → speaking → ready cycle, typed message, mode switch reseeds, Avatar API drawer state and every emotion/viseme button, pointer gaze, mobile layout, no stuck *Speaking* state. Zero console errors and zero failed requests after three fixes: StrictMode render loop (controller now in `useState`), stuck speaking state (safety timer), and stale viseme ticks overriding manual controls (generation guard). Microphone input is not automatable and was checked manually. Fresh clone from GitHub set up strictly by the README succeeded; CI green on Ubuntu.

## 16. Extending and swapping in a vendor avatar

Because every consumer talks to `createAvatarController()`'s interface, a vendor adapter only has to implement the same methods:

| Method | Ready Player Me / three.js | D-ID / HeyGen (video) |
| --- | --- | --- |
| `setEmotion` | drive blend shapes / morph targets | send expression parameter or choose a clip |
| `setViseme` / `speak` | map to ARKit visemes on audio timeline | send text; the service returns a lip-synced stream |
| `setListening` / `setSpeaking` | toggle idle vs talk animation | overlay ring / glow in the DOM |
| `lookAt` | rotate head bone | usually unsupported; no-op |
| `subscribe` / `getState` | unchanged | unchanged |

Other extensions: add intents (append to `SUPPORT_INTENTS` / `ASSISTANT_INTENTS` and `localBrain.js`), add a mode (extend `MODES`, `seedMessages`, facts and intents), swap the LLM provider (edit `replyTo`), persist conversations (add a store behind `/api/chat`).

## 17. Limitations and production path

- **Web Speech API dependence.** Synthesis quality and recognition availability vary by browser and OS; Firefox lacks recognition. Production would use server-side TTS/STT (e.g. Azure Speech, ElevenLabs, Whisper) with timed viseme data.
- **Lip-sync is estimated.** Character-based visemes corrected by boundary events look convincing but are not phoneme-accurate; use an audio-to-viseme service for fidelity.
- **Local intent engine** is keyword-based; it demonstrates the contract, not natural language understanding. OpenAI mode provides that.
- **No persistence or auth.** Conversations live in memory for the session.
- **Support knowledge is fictional** (Lumen Cloud) by design.

## 18. Glossary

- **Avatar API / AvatarEngine** — the controller interface through which the UI drives the avatar.
- **Viseme** — a visual mouth shape corresponding to a group of speech sounds.
- **Emotion** — one of five facial expression presets.
- **TTS / STT** — text-to-speech / speech-to-text.
- **`onboundary`** — Web Speech event fired at word/sentence boundaries with the character index reached.
- **Intent** — a set of keywords mapped to a canned reply and emotion.
- **Fallback brain** — the in-browser intent engine used when the server cannot be reached.
- **StrictMode** — React development mode that double-invokes effects to surface unsafe side effects.
