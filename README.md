<div align="center">

# 💗 MAVIE

### *A look made for your life.*

**AI Decision Intelligence for Personal Appearance**

Beauty · Fashion · Context · Visualization · Purchase Reasoning

</div>

---

> **Looking good in something and making a good decision about buying it are not the same thing.**

MAVIE is an AI-powered beauty and fashion **decision companion**. It helps people decide what to wear, how to style themselves, and — crucially — whether an appearance-related purchase is actually worth making.

Most fashion tech optimizes for *"How do we make you want this?"*
MAVIE optimizes for *"How do we help you make a decision you'll still be happy with later?"*

---

## Table of contents

- [The problem](#the-problem)
- [The solution](#the-solution)
- [Three core layers](#three-core-layers)
- [Features](#features)
- [Build status](#build-status)
- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Perfect Corp. / YouCam APIs](#perfect-corp--youcam-apis)
- [Project structure](#project-structure)
- [Setup](#setup)
- [Environment variables](#environment-variables)
- [Running locally](#running-locally)
- [API reference](#api-reference)
- [Scoring model](#scoring-model)
- [Design system](#design-system)
- [Privacy & security](#privacy--security)
- [Deployment](#deployment)
- [Demo script](#demo-script)
- [Honest limitations](#honest-limitations)
- [Roadmap](#roadmap)

---

## The problem

Online fashion and beauty shopping creates a gap that no product actually closes.

You see a model wearing a dress, and then you have to mentally calculate:

1. Would this work **on me**?
2. Would it work for **the occasion**?
3. Does it match **my style**?
4. Would I actually **wear it again**?
5. Is it worth **₹2,000**?

You buy it anyway. And sometimes, later:

> *"Why did I buy this?"*

Virtual try-on answers question 1. Nothing answers questions 2 through 5.

## The solution

MAVIE runs a single coherent pipeline:

```
Context → Personalization → Skin → Makeup → Real Products
       → Virtual Try-On → Decision Intelligence → Buy / Wait / Skip
```

The signature difference: MAVIE doesn't stop at *"Here's how you look."*
It asks *"Was this actually a good decision for you?"*

---

## Three core layers

Every feature in MAVIE belongs to exactly one of these.

### 💗 Layer 1 — PERSONALIZE
*Who are you and what do you want?*

Occasion · Goal · Style · Budget · Comfort · Beauty preferences · Skin profile · Existing wardrobe · Previous decisions

### 🪞 Layer 2 — VISUALIZE
*What would you actually look like?*

Real clothing catalog · Apparel VTO · Makeup VTO · Skin analysis · Complete-look visualization

### 🧠 Layer 3 — DECIDE
*Is this actually a good choice?*

MAVIE Match · Stylist vs Skeptic · Versatility · Rewear potential · Context compatibility · Budget · Buy Confidence · Regret Risk · Buy / Wait / Skip · Better alternatives

---

## Features

<table>
<tr><td width="50%" valign="top">

**🧠 AI**
- Natural-language context understanding
- Conversational style assistant
- Personal style profile (Style DNA)
- Context engine → structured constraints
- Outfit composer over a real catalog
- MAVIE Match scoring
- Aftermath engine
- Stylist agent 🟢 / Skeptic agent 🔴
- Buy Confidence · Regret Risk
- Alternative engine
- Preference learning loop

</td><td width="50%" valign="top">

**🧴 Beauty**
- Skin Analysis (15+ concerns)
- Beauty profile translation
- Makeup direction per look
- Makeup Virtual Try-On
- Complete-look coordination

</td></tr>
<tr><td valign="top">

**👗 Fashion**
- Real garment catalog with metadata
- Outfit composition from actual products
- Apparel Virtual Try-On
- Outfit & product comparison
- Style / budget / occasion / comfort matching

</td><td valign="top">

**🛍️ Commerce**
- Product links, prices, images
- Buy / Wait / Skip verdict
- Better alternatives
- Saved looks *(API only)*
- ○ "I found this online" screenshot flow

</td></tr>
<tr><td valign="top">

**👚 Closet**
- Digital closet
- Style what you already own
- Duplicate / overlap detection
- Closet overlap feeds the decision engine

</td><td valign="top">

**🧳 Lifestyle**
- Occasion styling
- ○ Trip Mode (multi-day packing plans)
- ○ Event planning
- ○ Capsule wardrobe

</td></tr>
</table>

○ = designed, not yet built. See [Build status](#build-status).

---

## Build status

Everything below runs today with **zero API keys** — every external service has a
deterministic fallback, so the full journey is demoable offline.

| Area | Status |
| --- | --- |
| Context engine (NL → constraints) | ✅ Working, LLM + deterministic fallback |
| Curated catalog (60 garments, 15 beauty) | ✅ Working |
| Outfit composer over real products | ✅ Working |
| MAVIE Match scoring | ✅ Working |
| Makeup engine + look coordination | ✅ Working |
| Skin Analysis → beauty profile | ✅ Working (mock without keys) |
| Apparel VTO | ✅ Working (composite preview without keys) |
| Makeup VTO | ✅ Working (swatches without keys) |
| Stylist vs Skeptic panel | ✅ Working, LLM + deterministic fallback |
| Aftermath metrics + Buy/Wait/Skip | ✅ Working |
| Alternative engine | ✅ Working |
| Closet + overlap detection | ✅ Working |
| Preference learning loop | ✅ Working (shallow — weights, not a model) |
| Guest mode + delete controls | ✅ Working |
| Saved looks | ⚠️ API implemented, no UI yet |
| Supabase persistence | ⚠️ In-memory store; schema documented, not wired |
| Auth | ⚠️ Single demo user |
| Product screenshot upload | ○ Not built |
| Trip Mode | ○ Not built |

---

## Architecture

The governing principle: **the LLM does not control everything.**

| Component | Responsibility |
| --- | --- |
| **LLM** | Language understanding, style reasoning, agent argumentation |
| **Deterministic engine** | Scoring, constraints, ranking, final verdict |
| **YouCam / Perfect Corp.** | Specialized visual AI (skin, apparel, makeup) |
| **Catalog** | Source of real, purchasable products |

```
                              💗 MAVIE
                     A LOOK MADE FOR YOUR LIFE
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │       USER CONTEXT      │
                    │  Occasion · Goal        │
                    │  Budget · Style         │
                    │  Comfort                │
                    └────────────┬────────────┘
                                 ▼
                    ┌─────────────────────────┐
                    │    PERSONAL PROFILE     │
                    │  Style DNA              │
                    │  Beauty Profile         │
                    │  Closet                 │
                    │  Decision History       │
                    └────────────┬────────────┘
                                 │
             ┌───────────────────┼────────────────────┐
             ▼                   ▼                    ▼
      YouCam Skin AI      MAVIE PRODUCT         MAVIE CLOSET
             │              CATALOG                   │
             ▼                   │                    │
      Beauty Profile             └─────────┬──────────┘
                                           ▼
                                  ┌──────────────────┐
                                  │ AI OUTFIT ENGINE │
                                  └────────┬─────────┘
                                           │
                                    REAL PRODUCTS
                                           ▼
                                  ┌──────────────────┐
                                  │  COMPLETE LOOKS  │
                                  │  Outfit + Makeup │
                                  └────────┬─────────┘
                          ┌────────────────┼────────────────┐
                          ▼                                 ▼
                 YouCam Clothes VTO                YouCam Makeup VTO
                          │                                 │
                          └────────────────┬────────────────┘
                                           ▼
                                  ┌──────────────────┐
                                  │   MAVIE MATCH    │
                                  └────────┬─────────┘
                                           ▼
                                  ┌──────────────────┐
                                  │ MAVIE AFTERMATH  │
                                  │  🟢 Stylist      │
                                  │  🔴 Skeptic      │
                                  │  Rewear          │
                                  │  Versatility     │
                                  │  Closet overlap  │
                                  └────────┬─────────┘
                                           ▼
                                  ┌──────────────────┐
                                  │ DECISION ENGINE  │
                                  └────────┬─────────┘
                             ┌─────────────┼─────────────┐
                             ▼             ▼             ▼
                           🟢 BUY       🟡 WAIT       🔴 SKIP
                                           ▼
                                  BETTER ALTERNATIVES
                                           ▼
                                     USER FEEDBACK
                                           ▼
                                     MAVIE LEARNS
```

### The recommendation pipeline

```
User request
     ↓ LLM context extraction
Structured constraints
     ↓ deterministic catalog filtering
Candidate garments
     ↓ combinatorial composition
Outfit combinations
     ↓ LLM style reasoning
Scored candidates
     ↓ deterministic ranking
Top 3 complete looks
```

The LLM **never invents a garment**. It selects `product_id`s from the catalog.

---

## Tech stack

**Frontend** — React 18, Vite, Tailwind CSS, Framer Motion, TanStack Query, React Router, Lucide icons

**Backend** — Node.js, Express, Zod (validates requests *and* AI outputs), Multer

**AI** — one primary LLM provider (OpenAI **or** Gemini), configured via env. Falls back to a deterministic local reasoner when no key is present, so the app always runs.

**Visual AI** — Perfect Corp. YouCam: Skin Analysis, Clothes/Apparel VTO, Makeup VTO

**Database** — Supabase (PostgreSQL + Auth + Storage). The prototype ships with an in-memory store so it runs with zero configuration.

**Deploy** — Vercel (frontend) · Render/Railway (backend) · Supabase (data)

---

## Perfect Corp. / YouCam APIs

MAVIE uses three endpoints, each contributing to a single decision. The goal is not *"we called 15 APIs"* — it's *"every call contributes to one decision."*

| API | Role in MAVIE | Status |
| --- | --- | --- |
| **Skin Analysis** | Returns structured scores and visual overlays across 15+ skin concerns. MAVIE translates these into a *beauty personalization* profile — preferred finish, beauty direction, makeup intensity. | **Required core** |
| **Clothes / Apparel VTO** | Accepts a user photo + a garment image and returns a generated try-on result. Supports upper-body, lower-body and full-body garments. | **Required core** |
| **Makeup VTO** | Visualizes foundation, blush, bronzer, contour, eyeliner, eyeshadow, brows, lashes, highlight, lip color and lip liner. | **Optional, high-value** |

> ⚠️ **Verify before depending on it.** Makeup VTO availability depends on your specific Perfect Corp. account and plan. Test all three in the API Playground **before** building UI that assumes them. The guaranteed foundation is **Skin Analysis + Apparel VTO**.

### What MAVIE deliberately does *not* do with Skin AI

MAVIE will **never** display a sentence like *"Your face is 78/100."*

Skin Analysis provides **skin information**, which MAVIE uses to **personalize beauty recommendations**. It is not an attractiveness rating and it is not a medical product. Raw API values remain available behind an explicit **"View skin analysis"** disclosure so the feature stays transparent without becoming diagnostic.

---

## Project structure

```
Mavie/
├── client/                      # React + Vite frontend
│   ├── src/
│   │   ├── components/          # LookCard, ProductCard, GarmentVisual, VTOViewer,
│   │   │                        #   AgentDebate, VerdictCard, MatchRing, ScoreBar, Loader
│   │   ├── pages/               # Moment, Looks, TryOn, Aftermath, Closet, Profile
│   │   ├── services/            # api.js
│   │   ├── context/             # MavieContext (session + guest mode)
│   │   ├── utils/               # image validation
│   │   ├── index.css            # design tokens
│   │   └── App.jsx
│   ├── tailwind.config.js       # colour + type system
│   └── vite.config.js
│
├── server/                      # Node + Express backend
│   ├── controllers/             # context, catalog, beauty, vto, decision, closet
│   ├── services/
│   │   ├── youcam/              # client, skinService, clothesService, makeupService
│   │   ├── ai/                  # llm, contextService, makeupService, agents
│   │   ├── catalog/             # searchService, outfitComposer
│   │   └── decision/            # scoringService, regretService, verdictService
│   ├── data/                    # curated garment + beauty catalog
│   ├── routes/
│   ├── middleware/              # validation (Zod)
│   ├── store.js                 # in-memory store (Supabase-shaped)
│   └── server.js
│
└── README.md
```

---

## Setup

**Prerequisites:** Node.js 18+ and npm.

```bash
git clone <your-repo-url> mavie
cd mavie
npm run setup
```

`npm run setup` installs dependencies for both `client/` and `server/`.

Then copy the environment templates:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

MAVIE runs **with no API keys at all** — every external service has a deterministic mock. Add keys to progressively light up real functionality.

---

## Environment variables

### `server/.env`

```ini
PORT=5000
CLIENT_ORIGIN=http://localhost:5173

# Perfect Corp. / YouCam — server-side only
YOUCAM_API_KEY=
YOUCAM_SECRET_KEY=
YOUCAM_API_BASE=https://yce-api-01.perfectcorp.com

# LLM — set ONE provider
AI_PROVIDER=mock          # openai | gemini | mock
OPENAI_API_KEY=
GEMINI_API_KEY=

# Supabase — optional; omit to use the in-memory store
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
```

### `client/.env`

```ini
VITE_API_URL=http://localhost:5000
```

> 🔐 **Never** put a YouCam or LLM key behind a `VITE_` prefix. Anything prefixed `VITE_` is compiled into the browser bundle and is publicly readable. All third-party keys live on the server only.
>
> **Never commit `.env`.** It is gitignored.

---

## Running locally

```bash
npm run dev
```

This starts both servers concurrently:

| Service | URL |
| --- | --- |
| Frontend | http://localhost:5173 |
| Backend | http://localhost:5000 |
| Health check | http://localhost:5000/api/health |

Run them individually if you prefer:

```bash
npm run dev:server
```

```bash
npm run dev:client
```

The health endpoint reports which integrations are live vs. mocked — useful for confirming your keys are wired correctly before a demo.

---

## API reference

```
POST /api/context/parse          Natural language → structured constraints
POST /api/profile/create         Build Style DNA from preferences + photos

POST /api/skin/analyze           YouCam Skin Analysis → beauty profile
POST /api/makeup/recommend       Makeup direction for a look
POST /api/makeup/try-on          YouCam Makeup VTO

GET  /api/catalog                Browse the curated catalog
POST /api/catalog/search         Constraint-filtered product search
POST /api/outfits/compose        Compose 3 complete looks from real products

POST /api/vto/clothes            YouCam Apparel VTO
POST /api/looks/compare          Side-by-side look comparison
POST /api/looks/score            MAVIE Match scoring

POST /api/decision/analyze       Stylist 🟢 vs Skeptic 🔴 + Aftermath metrics
POST /api/decision/verdict       BUY / WAIT / SKIP
POST /api/alternatives           Lower-decision-risk alternatives

POST /api/closet/upload          Add an owned item
POST /api/closet/analyze         Overlap & gap analysis
POST /api/closet/style           Style what the user already owns

POST /api/looks/save             Save a look
GET  /api/looks/saved            Retrieve saved looks
POST /api/feedback               Preference learning signal
```

---

## Scoring model

Both scores are **transparent product heuristics**, not scientifically validated measurements. MAVIE states this in the UI. Weights live in `server/services/decision/` and are trivially tunable.

### MAVIE Match — *how well does this satisfy what you asked for?*

| Factor | Weight |
| --- | ---: |
| Occasion fit | 25% |
| Style match | 20% |
| Preference match | 15% |
| Budget fit | 15% |
| Comfort | 10% |
| Beauty compatibility | 10% |
| Closet compatibility | 5% |

> **MAVIE Match is not an attractiveness score.** It measures how well a decision satisfies the user's *own stated requirements*.

### Decision Risk — *how likely is this to disappoint you later?*

| Factor | Weight |
| --- | ---: |
| Context mismatch | 20% |
| Preference mismatch | 20% |
| Low versatility | 15% |
| Low rewear potential | 15% |
| Closet overlap | 10% |
| Maintenance burden | 10% |
| Budget pressure | 10% |

| Score | Regret Risk |
| --- | --- |
| 0–30 | 🟢 LOW |
| 31–60 | 🟡 MEDIUM |
| 61–100 | 🔴 HIGH |

**How we describe it:** *"MAVIE estimates purchase regret risk from your stated constraints and decision signals."*
**Not:** *"MAVIE scientifically predicts regret."*

### The two agents

| | Role | Constraint |
| --- | --- | --- |
| 🟢 **Stylist** | Find the strongest reasons this is a good decision | Only from stated goals, preferences, catalog data and visual evidence |
| 🔴 **Skeptic** | Challenge the purchase — budget, versatility, closet, maintenance, expected usage | **Must not invent facts** |

Both receive **identical structured evidence**. Neither decides. They produce structured reasons; the deterministic Decision Engine weighs that evidence alongside catalog metadata, user constraints, scores and history to produce the verdict. That separation is what makes the architecture defensible.

---

## Design system

The brief: *editorial fashion magazine × premium beauty app × modern AI.*
Not Barbie pink. Not generic SaaS blue. Not 500 cards on one screen.

| Token | Value | Use |
| --- | --- | --- |
| Ivory | `#FAF7F2` | Background |
| Espresso | `#2E2723` | Primary text |
| Dusty rose | `#C98B94` | Accent |
| Blush | `#E8D3D1` | Secondary |
| Champagne | `#E3CDA4` | Highlight |
| Sage | `#7C8F76` | BUY |
| Amber | `#C9A227` | WAIT |
| Rust | `#B4614F` | SKIP |

**Typography** — Cormorant Garamond (display / headings) + Inter (body / UI). Serif signals fashion; sans signals technology.

**Loading states** are part of the design, because AI calls take real time:

| Stage | Copy |
| --- | --- |
| Skin | *Reading your beauty profile…* |
| Outfit | *Finding pieces that fit your moment…* |
| VTO | *Putting your look together…* |
| Aftermath | *Looking beyond the first impression…* |

---

## Privacy & security

MAVIE processes user photographs. This is not an afterthought.

**Privacy controls (user-facing)**
- Guest Mode — nothing persists
- "Don't save this photo" toggle on every upload
- Delete my photos
- Delete my profile
- Plain-language disclosure: *"Your photo is used to generate your personalized experience."*

**Security**
- All third-party API keys are server-side only — never in the client bundle
- HTTPS in production
- Authentication on user-scoped routes
- Rate limiting on all AI and VTO endpoints
- Zod validation on every request body **and** every AI response
- Image size limits and MIME-type validation
- Signed storage URLs
- Graceful error states — judges should see *"We couldn't generate your try-on this time. Try again"*, never a raw `500`

---

## Deployment

```
                    INTERNET
                       │
                       ▼
                Vercel Frontend
                       │
                       ▼
                Express Backend
                 /      |      \
           YouCam       AI    Supabase
```

| Layer | Platform |
| --- | --- |
| Frontend | Vercel |
| Backend | Render / Railway |
| Database & storage | Supabase |
| Source control | GitHub |

Set the same environment variables in your hosting dashboards. Point `VITE_API_URL` at the deployed backend and `CLIENT_ORIGIN` at the deployed frontend.

---

## Demo script

Do **not** open by explaining technology. Open with the problem.

| # | Scene |
| --- | --- |
| 1 | A product. *"I really like this."* → *"But should I buy it?"* |
| 2 | Upload user photo |
| 3 | YouCam Skin Analysis → beauty profile |
| 4 | MAVIE understands: interview tomorrow · ₹3,000 · feminine · professional · comfortable |
| 5 | MAVIE finds **real products** → three complete looks |
| 6 | Apparel VTO — the user sees themselves |
| 7 | Makeup VTO — the complete look |
| 8 | MAVIE Match — 94% |
| 9 | Aftermath — 🟢 *"Strong match."* / 🔴 *"Low versatility."* |
| 10 | 🟡 **WAIT** — *"You look great in it. But you probably won't get enough use from it."* |
| 11 | MAVIE suggests an alternative → VTO again → 🟢 **BUY — 91%** |

**Closing line:**

> *"MAVIE doesn't just help you look good. It helps you make a decision you'll feel good about later."*

### Questions to be ready for

<details>
<summary><b>"Why isn't this just an AI stylist?"</b></summary>

The stylist is only one component. MAVIE combines real products, Skin AI, virtual try-on, beauty personalization and a decision engine that evaluates whether the purchase actually fits the user's context and history.
</details>

<details>
<summary><b>"Why do you need YouCam?"</b></summary>

YouCam provides the specialized visual evidence layer. Skin AI gives us beauty analysis; Apparel VTO lets users visualize actual garments on themselves. MAVIE builds the decision intelligence around those capabilities.
</details>

<details>
<summary><b>"Where do the clothes come from?"</b></summary>

MAVIE maintains a structured product catalog containing real garment images, metadata, prices and product links. The AI selects from those products rather than hallucinating clothing.
</details>

<details>
<summary><b>"How is the regret score calculated?"</b></summary>

It's a transparent decision-support heuristic based on context mismatch, preference mismatch, versatility, expected reuse, closet overlap, maintenance and budget pressure. We're not claiming to scientifically predict human regret.
</details>

<details>
<summary><b>"Why would users trust an AI telling them not to buy something?"</b></summary>

Because MAVIE is not optimized to maximize purchases. It explicitly exposes both the reasons to buy and the reasons not to. That makes it a decision companion rather than a conversion engine.
</details>

---

## Honest limitations

Stated plainly, because overclaiming is the fastest way to lose a technical judge.

- **Scoring weights are product judgment**, not empirically validated. They are visible and tunable.
- **Regret Risk is a heuristic**, not a prediction model. No human-outcome data has been used to fit it.
- **Skin Analysis is not diagnostic.** MAVIE makes no medical claims and does not name conditions.
- **The catalog is curated**, not a live retailer feed. Real integration is a partnership problem, not a technical one.
- **Makeup VTO is conditional** on account-level API access. Skin Analysis + Apparel VTO is the guaranteed core.
- **Preference learning is shallow** in the prototype — feedback updates weights; it does not train a model.
- **VTO quality depends on input photos.** Well-lit, front-facing, full-body photos produce meaningfully better results.

---

## Roadmap

| Horizon | Product |
| --- | --- |
| **Today** | **MAVIE** — consumer beauty + fashion decision companion |
| **Next** | **MAVIE Commerce** — personalized shopping decision layer, affiliate commerce |
| **Then** | **MAVIE API** — retailers embed *"Try with MAVIE"* on product pages: product → personalization → VTO → decision intelligence → conversion |
| **Longer** | **Retail intelligence** — anonymized, aggregated decision signals. *High visual appeal, low purchase confidence* tells a retailer exactly why customers hesitate. |

**Business model:** B2C premium subscription · affiliate commission · B2B retailer integration · aggregated retail intelligence.

---

## What MAVIE is not

❌ Another AI stylist  ❌ Another skin analyzer  ❌ Another virtual try-on
❌ A makeup filter  ❌ A shopping chatbot  ❌ A generic recommendation engine

**MAVIE is AI Decision Intelligence for Personal Appearance.**

---

<div align="center">

### The one-liner

*"MAVIE is an AI beauty and fashion decision companion that lets you see yourself in real products, personalize the complete look, and then decide whether it's actually worth buying."*

---

**YouCam provides the eyes. The catalog provides real products.
The LLM provides reasoning. The decision engine provides the intelligence.
MAVIE connects all of it into one consumer experience.**

💗

</div>
