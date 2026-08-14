<div align="center">

<br>

# MAVIE

### *A look made for your life.*

**Decision intelligence for beauty and fashion**

<br>

[![Perfect Corp](https://img.shields.io/badge/Perfect_Corp-Skin_AI_%2B_Apparel_VTO-C08089?style=for-the-badge&labelColor=2E2723)](https://yce.perfectcorp.com/)
[![React](https://img.shields.io/badge/React_18-Vite-5C7290?style=for-the-badge&labelColor=2E2723)](https://vitejs.dev/)
[![Node](https://img.shields.io/badge/Node_20-Express-75886F?style=for-the-badge&labelColor=2E2723)](https://nodejs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-1F5245?style=for-the-badge&labelColor=2E2723)](https://supabase.com/)
[![Gemini](https://img.shields.io/badge/Gemini-Reasoning-6E4A85?style=for-the-badge&labelColor=2E2723)](https://ai.google.dev/)

<br>

`60 real garments` · `31 API endpoints` · `31 automated checks` · `9 pages` · `2 adversarial agents`

<br>

</div>

---

<div align="center">
<br>

## Looking good in something and making a good<br>decision about buying it are not the same thing.

<br>
</div>

---

<br>

## Table of contents

<table>
<tr>
<td valign="top" width="33%">

**Understanding it**
- [The problem](#the-problem)
- [The solution](#the-solution)
- [Three layers](#three-layers)
- [The decision engine](#the-decision-engine)
- [Scoring model](#scoring-model)

</td>
<td valign="top" width="33%">

**Using it**
- [Every feature](#every-feature-and-how-to-run-it)
- [Quickstart](#quickstart)
- [Environment](#environment)
- [Commands](#commands)
- [Demo script](#demo-script)

</td>
<td valign="top" width="33%">

**Building on it**
- [Architecture](#architecture)
- [Perfect Corp APIs](#perfect-corp--youcam-apis)
- [Project structure](#project-structure)
- [API reference](#api-reference)
- [Design system](#design-system)
- [Privacy & security](#privacy--security)
- [Deployment](#deployment)
- [Engineering notes](#engineering-notes)
- [Limitations](#honest-limitations)
- [Roadmap](#roadmap)

</td>
</tr>
</table>

<br>

---

## The problem

Online fashion and beauty shopping creates a gap that nothing actually closes.

You see a piece you like. Then, entirely in your head, you have to run five calculations:

<table>
<tr><td width="60"><div align="center"><b>01</b></div></td><td>Would this work <b>on me</b>?</td></tr>
<tr><td><div align="center"><b>02</b></div></td><td>Would it work for <b>the occasion</b>?</td></tr>
<tr><td><div align="center"><b>03</b></div></td><td>Does it match <b>how I actually dress</b>?</td></tr>
<tr><td><div align="center"><b>04</b></div></td><td>Would I ever <b>wear it again</b>?</td></tr>
<tr><td><div align="center"><b>05</b></div></td><td>Is it worth <b>$98</b>?</td></tr>
</table>

Virtual try-on answers the **first one**, beautifully.

Nothing answers the other four. So you guess — and the guess is where the regret comes from. The return, the tag still on it in six months, the third black dress.

<br>

---

## The solution

MAVIE is not a shopping app with AI bolted on. It is a **decision layer that happens to be able to see.**

Most fashion tech optimises for:

> *"How do we make you want this?"*

MAVIE optimises for:

> *"How do we help you make a decision you will still be happy with next month?"*

That difference shows up in one place above all: **MAVIE will tell you not to buy something.** It does this often, specifically, with its reasoning fully exposed — and the alternative it offers instead is usually cheaper.

A recommendation engine that can never say no isn't giving advice. It's selling.

<br>

---

## Three layers

<table>
<tr>
<td width="33%" valign="top">

### 💗 Personalize

Who you are, what you're dressing for, what you already own, and what your skin actually needs.

Context is parsed from **plain language**, not dropdowns.

</td>
<td width="33%" valign="top">

### 🪞 Visualize

Perfect Corp Skin AI and Apparel VTO — real analysis, real photoreal try-on, on **your** photo.

Not a model. Not an illustration.

</td>
<td width="33%" valign="top">

### 🧠 Decide

Two adversarial agents supply evidence. Deterministic scoring returns the call.

**BUY · WAIT · SKIP**

</td>
</tr>
</table>

Everything else in this document is an elaboration of those three boxes.

<br>

---

## The decision engine

This is the part that makes MAVIE more than a styling toy.

Two AI agents receive the **same evidence packet** and are handed opposing briefs.

<table>
<tr>
<td width="50%" valign="top">

### 🟢 The Stylist

**Brief:** argue *for* the piece.

Occasion fit · style coherence · how it reads against your colouring · what it does that nothing you own already does · why this is the version of you that suits the moment.

</td>
<td width="50%" valign="top">

### 🔴 The Skeptic

**Brief:** argue *against* it.

Closet overlap **by name** · rewear potential · care burden · budget pressure · versatility · whether the occasion actually calls for this.

</td>
</tr>
</table>

<div align="center">

### Neither of them decides anything.

</div>

Every claim either agent makes **must cite a real numeric field** from the evidence packet. A claim that can't be traced back to a number is rejected before it ever reaches you. Zod validates the model's output the same way it validates an incoming request body — an LLM is treated as an untrusted input source, because it is one.

The agents supply argument. **Deterministic code supplies the verdict.**

The Skeptic is also handed the *names* of colliding closet pieces, not just an overlap percentage — because "you already own a black slip dress, a black wrap dress and a black mini dress" is an argument, while "closet overlap: 34%" is a statistic.

<br>

---

## Scoring model

Two independent scores, computed in plain code, from real garment attributes.

### MAVIE Match — *how well does this satisfy what you asked for?*

| Factor | Weight | | What it measures |
|:--|--:|:--|:--|
| **Occasion** | 25% | `████████████▌` | Formality and occasion tags against the parsed context |
| **Style** | 20% | `██████████` | Style tags against your Style DNA |
| **Preference** | 15% | `███████▌` | Colours you love, colours you avoid |
| **Budget** | 15% | `███████▌` | Total against your stated ceiling |
| **Comfort** | 10% | `█████` | Fit and material against comfort priority |
| **Beauty compatibility** | 10% | `█████` | Coordination with your skin analysis |
| **Closet fit** | 5% | `██▌` | Whether it works with what you own |

> This is **not** an attractiveness score. MAVIE has no opinion about your face. It measures how well a look satisfies constraints you stated yourself.

### Decision Risk — *how likely are you to wish you hadn't?*

| Factor | Weight | | What it measures |
|:--|--:|:--|:--|
| **Context mismatch** | 20% | `██████████` | Wrong register for the moment |
| **Preference mismatch** | 20% | `██████████` | Not how you actually dress |
| **Low versatility** | 15% | `███████▌` | Few other places you could wear it |
| **Low rewear** | 15% | `███████▌` | Statement pieces you'll be seen in twice |
| **Closet overlap** | 10% | `█████` | You already own this |
| **Maintenance burden** | 10% | `█████` | Dry clean only, delicate, high upkeep |
| **Budget pressure** | 10% | `█████` | Proportion of your stated ceiling |

### The verdict

<table>
<tr>
<td width="140" align="center"><h3>🟢<br>BUY</h3></td>
<td><b>risk ≤ 30 and match ≥ 78</b><br>It earns its place. Versatility, budget fit and occasion match all hold up.</td>
</tr>
<tr>
<td width="140" align="center"><h3>🟡<br>WAIT</h3></td>
<td><b>risk ≤ 60</b><br>Something real is wrong. MAVIE names it, then offers an alternative that reduces the specific risk it just identified.</td>
</tr>
<tr>
<td width="140" align="center"><h3>🔴<br>SKIP</h3></td>
<td><b>risk &gt; 60</b><br>Don't.</td>
</tr>
</table>

Each **high-severity** Skeptic claim adds **+6** to the risk score.

That is the *only* channel through which a language model can influence the outcome — and it can only ever push toward caution. A model having a bad day cannot talk you into a purchase.

<br>

---

## Every feature, and how to run it

<br>

### 🕯️ Moment — `/`

The primary entry point. Describe the situation the way you'd say it out loud:

> *"Dinner date tonight. I want to feel feminine but not overdressed, and comfortable. My budget is $100."*

Gemini extracts **occasion, goal, formality, budget, comfort priority and avoided colours** into a structured constraint object. Anything it can't determine is filled from your saved profile rather than guessed.

Twenty starting points live in a collapsible picker grouped **Work · Evening · Occasion · Everyday · Away**. Each seeds real phrasing rather than a bare keyword — so you can see what a good description looks like and edit from there, instead of facing an empty box.

<details>
<summary><b>Run it</b></summary>

<br>

1. Type a moment, or open **Pick a moment** and choose one
2. Optionally add vibes and adjust the budget slider
3. Press **Create my look**

Watch the loader copy — *"MAVIE is searching real products, not imagining them."*

</details>

<br>

### ✨ Skin Analysis — Perfect Corp, live

Upload a selfie on the home page. Perfect Corp's Skin AI returns **eight concern scores**: `wrinkle` `texture` `pore` `acne` `oiliness` `moisture` `radiance` `redness`.

MAVIE never renders *"your face is 78/100."* Those numbers are translated into **styling direction** — preferred finish, makeup intensity, and guidance where every line is derived from your own values.

Concerns are only spoken to below a threshold, and contradictory pairs are resolved: oily and dry cannot both be the headline. **Balanced skin is told it is balanced**, rather than handed invented problems so the feature looks busy.

<details>
<summary><b>Run it</b></summary>

<br>

1. Home page → **Add a selfie**
2. Read the beauty direction card that appears
3. Go to `/profile` → **View skin analysis** for the raw eight scores behind an explicit disclosure

Requires `YOUCAM_API_KEY` and `YOUCAM_SECRET_KEY`. Without them you get a deterministic mock, clearly labelled.

</details>

<br>

### 👗 Looks — `/looks`

Three complete outfits assembled from a real catalog of **60 garments** — not generated pictures of clothes that don't exist.

Every piece carries `material` `formality` `fit` `season` `style_tags` `occasion_tags` `versatility` `maintenance` `hex`. That is what lets reasoning be **attribute-based** rather than a hard-coded occasion → product lookup: nothing in the code says "dinner means dress."

A match ring and six factor bars show exactly why each look scored what it did, and a comparison table puts all three side by side with the winner highlighted per factor.

<details>
<summary><b>Run it</b></summary>

<br>

1. Click any of the three cards — it gets a **Your choice** badge
2. The detail panel below follows your selection, not MAVIE's pick
3. Try-on, the verdict and **Save** all act on *your* choice

If you pick something other than MAVIE's, it tells you what it would have chosen and at what score — then defers to you.

</details>

<br>

### 🪞 Try On — `/try-on`

**Perfect Corp Apparel VTO. Photoreal. On your own photo.**

Uses your **full-body** photo, kept deliberately separate from the selfie — a face crop has no legs to fit trousers to, and MAVIE says so rather than silently producing a bad result.

Both images are staged through Perfect Corp's file API rather than linked by URL, which means **this works on localhost.** No deployment, no public host, no tunnel.

<details>
<summary><b>Run it</b></summary>

<br>

1. `/try-on` → **Add a full-body photo**
2. Stand facing the camera, head to feet, in good light
3. Expect **12–16 seconds**

Switch between the three looks with the chips at the top; each re-renders. Results are cached, so returning is instant.

</details>

<br>

### ⚖️ Aftermath — `/aftermath`

**The centre of the product.**

The Stylist and the Skeptic debate, staged deliberately: argument first, then evidence, then the call — roughly two seconds — so the verdict doesn't land in the same instant as the reasoning that produced it.

Then eight metric bars, the verdict card, alternatives when it isn't a BUY, and five feedback buttons.

<details>
<summary><b>Run it</b></summary>

<br>

1. From `/looks`, press **Should I buy it?**
2. Read the debate as it lands, then the evidence, then the verdict
3. Press a feedback chip — *Love it · Not me · Too expensive · Too uncomfortable · Too bold*

Feedback adjusts your profile weights immediately. Compose again and the looks change.

</details>

<br>

### 🔍 Found It — `/found`

The second entry point, and the clearest argument that MAVIE is a decision layer rather than a catalogue.

Screenshot anything — Instagram, a store page, a friend's story. Gemini vision reads it into a structured product with a stated confidence, and it runs through the **identical engine** as a curated look. Same agents, same weights, same thresholds.

You can try it on too, using the screenshot itself as the garment reference.

<details>
<summary><b>Run it</b></summary>

<br>

1. `/found` → upload a screenshot
2. Correct the price if it couldn't read one — price is load-bearing for the budget maths
3. **Try it on me**, or **Should I buy this?**

The confidence percentage tells you how much to trust the extraction before you act on the verdict.

</details>

<br>

### 🚪 Closet — `/closet`

What you already own is the cheapest wardrobe you will ever have. It is also what lets the Skeptic say something **true and specific** rather than generically cautious.

Add pieces by category and colour — eight quick swatches plus a **full colour wheel**. Any picked hex is resolved to the nearest colour word in the catalog's own vocabulary, so duplicate detection keeps working; a raw hex would silently break it.

Attach a real photo of the actual garment, or let MAVIE borrow a catalog look-alike, always marked **similar** so it never implies it has a picture of your clothes.

<details>
<summary><b>Run it</b></summary>

<br>

1. Add three black dresses
2. Watch **"You already own 3 black dresses"** appear in the amber panel
3. Now go get a verdict on a fourth — the Skeptic cites them **by name**

**Style my closet** builds complete outfits from what you own. Total cost: **$0**.

**Clear all** empties it. `npm run test:all` snapshots and restores your closet, so it's safe to run against a populated instance.

</details>

<br>

### 🧳 Trip — `/trip`

Describe a trip and MAVIE builds a **capsule** — not one outfit per day, but the smallest set of pieces that recombines across the whole trip.

Starts from what you already own, matches the season rather than merely permitting it, and applies occasion-aware footwear rules so you don't get sneakers with the one nice dinner.

<details>
<summary><b>Run it</b></summary>

<br>

> *"I am going to Lisbon for four days, mostly walking around plus one nice dinner"*

Returns days covered, pieces packed, and **wears per piece** — the number that actually measures whether a capsule is any good.

</details>

<br>

### 🫀 Profile — `/profile`

Your name, Style DNA, preferred and avoided colours, budget range and comfort priority. **All editable, all persisted.**

These start as sensible defaults and are moved by what you actually choose. Style DNA suggestions are drawn from tags the catalog genuinely carries — offering free text would let you pick an identity nothing can match, so the setting would look like it worked and change nothing.

<details>
<summary><b>Run it</b></summary>

<br>

1. Set your name → the home page greets you
2. Type a budget range → press **Save** → it becomes the ceiling MAVIE assumes when a moment doesn't state one
3. Drop a Style DNA tag, add another, then recompose — the looks change

</details>

<br>

### 🛡️ Privacy — everywhere

Guest mode processes your photo and stores nothing. Delete both photos, or your entire profile and closet, in one tap. Photos are never written to disk.

<br>

---

## Quickstart

```bash
git clone https://github.com/Faleesha-Zaeen/Mavie.git
cd Mavie
npm run setup
cp server/.env.example server/.env
npm run dev
```

<div align="center">
<br>

**Client → `http://localhost:5173`  ·  API → `http://localhost:5000`**

<br>
</div>

> ### It runs with no API keys at all.
>
> A disk cache in `server/.cache/` is consulted **before** provider selection, so a fresh clone produces real looks, real agent reasoning and real verdicts completely offline. Add keys to go live.

<br>

### Environment

Everything lives in `server/.env`. The client needs nothing locally.

| Variable | Required | Purpose |
|:--|:--:|:--|
| `YOUCAM_API_KEY` | ● | Perfect Corp Skin AI + Apparel VTO |
| `YOUCAM_SECRET_KEY` | ● | RSA public key used to mint the `id_token` |
| `YOUCAM_API_BASE` | ● | `https://yce-api-01.perfectcorp.com` |
| `AI_PROVIDER` | ● | `gemini` · `openai` · `mock` |
| `GEMINI_API_KEY` | ○ | Required when the provider is `gemini` |
| `GEMINI_MODEL` | ○ | Defaults to `gemini-flash-latest` |
| `OPENAI_API_KEY` | ○ | Required when the provider is `openai` |
| `SUPABASE_URL` | ○ | Omit entirely to use the in-memory store |
| `SUPABASE_SERVICE_KEY` | ○ | **Server-side only.** Never reaches the client bundle |
| `CLIENT_ORIGIN` | ○ | CORS allowlist, comma-separated, `*.suffix` supported |
| `PORT` | ○ | Defaults to `5000` |

In deployment the client takes exactly one variable — `VITE_API_URL`, pointing at the API origin with **no trailing slash and no `/api`**.

<br>

### Persistence

MAVIE runs fine without a database; the in-memory store is a complete implementation, not a stub.

To switch Postgres on, run [`server/db/schema.sql`](server/db/schema.sql) in the Supabase SQL editor and set the two Supabase variables. Writes are mirrored fire-and-forget and hydrated at boot, so a persistence failure degrades to memory rather than breaking a user's request.

<br>

---

## Commands

| Command | What it does |
|:--|:--|
| `npm run setup` | Install both workspaces |
| `npm run dev` | Client and API together, both watching |
| `npm run test:all` | **31 checks** across every endpoint, against the live server |
| `npm run preflight` | Report which integrations are live vs mocked |
| `npm run check:youcam` | Diagnose Perfect Corp connectivity and auth |
| `npm run find:youcam` | Probe for a reachable API host |
| `npm run images:import` | Rebuild and optimise the catalog imagery |
| `npm run demo:seed` | Seed the scripted demo profile and closet |
| `npm run build` | Production client bundle |
| `npm start` | Production API |

<br>

---

## Architecture

```
     ┌──────────────────────────────────────────────────────────────┐
     │  ①  CONTEXT                                                  │
     │     plain language ──▶ structured constraints                │
     │     Gemini · occasion · budget · comfort · goal · formality   │
     └───────────────────────────┬──────────────────────────────────┘
                                 ▼
     ┌──────────────────────────────────────────────────────────────┐
     │  ②  CATALOG                                                  │
     │     60 real garments, each with 9 reasoning attributes       │
     │     composer builds complete, coherent, in-budget looks      │
     └───────────────────────────┬──────────────────────────────────┘
                                 ▼
     ┌──────────────────────────────────────────────────────────────┐
     │  ③  VISUALISATION                                            │
     │     Perfect Corp Skin AI  ·  Perfect Corp Apparel VTO        │
     │     photoreal, on the user's own photograph                  │
     └───────────────────────────┬──────────────────────────────────┘
                                 ▼
     ┌──────────────────────────────────────────────────────────────┐
     │  ④  DECISION                                                 │
     │     Stylist ⇄ Skeptic  supply evidence                       │
     │     deterministic scoring  returns the verdict               │
     │                                                              │
     │              🟢 BUY      🟡 WAIT      🔴 SKIP                 │
     └──────────────────────────────────────────────────────────────┘
```

### The recommendation pipeline

```
user text
   └─▶ contextService      Gemini → { occasion, goal, budget, comfort, colours }
        └─▶ outfitComposer  filter → combine → coherence-check → top 3
             └─▶ scoringService   7 weighted factors → MAVIE Match
                  └─▶ regretService    7 weighted factors → Decision Risk
                       └─▶ agents      Stylist + Skeptic, in parallel
                            └─▶ verdictService   thresholds → BUY | WAIT | SKIP
                                 └─▶ findAlternatives   cheaper, lower-risk, in-occasion
```

<br>

### Stack

<table>
<tr><td width="140"><b>Frontend</b></td><td>React 18 · Vite · Tailwind CSS · Framer Motion · TanStack Query · React Router</td></tr>
<tr><td><b>Backend</b></td><td>Node 20 · Express · Zod — validating incoming requests <i>and</i> model output</td></tr>
<tr><td><b>Data</b></td><td>Supabase Postgres over raw PostgREST — no SDK, one less thing to break</td></tr>
<tr><td><b>AI</b></td><td>Gemini with a model cascade, an 11-second wall-clock budget and per-request abort</td></tr>
<tr><td><b>Vision</b></td><td>Perfect Corp YouCam — Skin Analysis and Apparel VTO</td></tr>
<tr><td><b>Imaging</b></td><td>sharp — trim, resize and encode the catalog</td></tr>
</table>

<br>

---

## Perfect Corp / YouCam APIs

| Endpoint | Use |
|:--|:--|
| `POST /s2s/v1.0/client/auth` | Exchange the `id_token` for an access token |
| `POST /s2s/v1.0/file/{feature}` | Reserve an upload slot, receive a signed `PUT` URL and a `file_id` |
| `POST /s2s/v2.0/task/skin-analysis` | Eight concern scores → beauty personalisation |
| `POST /s2s/v2.0/task/cloth-v4` | Apparel VTO · `upper_body` · `lower_body` · `full_body` |

**Auth** is RSA-PKCS1. `client_id` and a timestamp are encrypted with the provided public key to mint an `id_token`, which is exchanged for a bearer token. Tasks are asynchronous — submit, receive a `task_id`, then poll.

### Two findings worth recording

> **`dress` is not a valid `garment_category`.**
> Despite dresses being the obvious case, `cloth-v4` rejects it. Dresses must route through `full_body`. The API returns a union-validation error listing every branch, which reads like a generic malformed-request message rather than pointing at the offending field.

> **Tasks accept `file_id` as well as `file_url`.**
> Because the bytes can be staged with Perfect Corp directly, **no public host is required** — photoreal try-on runs on `localhost` with no tunnel and no deployment.

### What MAVIE deliberately does *not* do with Skin AI

- No clinical-looking scores in the main flow
- No condition names, no diagnosis, no medical framing
- No "your skin is 72/100"
- Raw values only behind an explicit, user-initiated disclosure
- A permanent disclaimer: *beauty personalisation, not a medical assessment*

<br>

---

## Project structure

```
Mavie/
├── client/
│   ├── public/catalog/            60 optimised garment images
│   └── src/
│       ├── pages/                 Moment · Looks · TryOn · Aftermath · Found
│       │                          Trip · Closet · Saved · Profile
│       ├── components/            LookCard · VerdictCard · AgentDebate
│       │                          MatchRing · ScoreBar · GarmentVisual
│       │                          VTOViewer · OccasionPicker · BeautyChain
│       ├── context/               MavieContext — session state
│       ├── services/api.js        every endpoint, one place
│       └── utils/                 image handling · colour naming
│
└── server/
    ├── controllers/               thin HTTP layer
    ├── services/
    │   ├── ai/                    llm · agents · contextService · productVision
    │   ├── catalog/               outfitComposer · searchService
    │   ├── decision/              scoringService · regretService · verdictService
    │   └── youcam/                client · skinService · clothesService · upload
    ├── data/                      catalog.js · demo.js
    ├── db/                        supabase.js · schema.sql
    ├── middleware/validation.js   Zod schemas
    ├── scripts/                   preflight · test-all · check-youcam · images
    └── .cache/                    keyless-demo cache
```

<br>

---

## API reference

<details>
<summary><b>31 endpoints</b> — click to expand</summary>

<br>

**Context & profile**
```http
POST   /api/context/parse            plain language → structured constraints
GET    /api/profile
POST   /api/profile                  partial patch
DELETE /api/profile                  cascades to closet, looks, decisions
```

**Beauty**
```http
POST   /api/skin/analyze             Perfect Corp Skin AI → beauty profile
POST   /api/makeup/recommend
POST   /api/makeup/try-on
```

**Catalog & looks**
```http
GET    /api/catalog                  ?category= optional
POST   /api/catalog/search
POST   /api/outfits/compose          three complete looks + a pick
POST   /api/looks/score
POST   /api/looks/compare
POST   /api/looks/save
GET    /api/looks/saved
```

**Virtual try-on**
```http
POST   /api/vto/clothes              catalog garments, resolved server-side
POST   /api/vto/found                a piece you screenshotted
```

**Decision**
```http
POST   /api/decision/analyze         Stylist ⇄ Skeptic → verdict
POST   /api/decision/verdict         alias
POST   /api/alternatives             cheaper, lower-risk, same occasion
POST   /api/feedback                 adjusts profile weights
```

**Found it online**
```http
POST   /api/product/analyze          screenshot → structured product
POST   /api/product/buy-confidence   same engine as a curated look
```

**Closet**
```http
GET    /api/closet
POST   /api/closet/upload
DELETE /api/closet                   clear everything
DELETE /api/closet/:id
POST   /api/closet/analyze           duplicates and gaps
POST   /api/closet/style             outfits from what you own · $0
```

**Trip · demo · health**
```http
POST   /api/trip/plan
POST   /api/demo/seed
GET    /api/health                   integration status
```

<br>

Every request body is Zod-validated. AI and VTO routes are separately rate-limited. Errors return a human sentence, never a bare status code.

</details>

<br>

---

## Design system

The brief: **editorial fashion magazine × premium beauty app × modern AI.**
Not Barbie pink. Not generic SaaS blue. Not five hundred cards on one screen.

| Token | Value | Use |
|:--|:--|:--|
| Ivory | `#F0E9DE` | Page background |
| Surface | `#FAF6EF` | Raised surfaces — a soft cream, never pure white |
| Espresso | `#2E2723` | Primary text |
| Dusty rose | `#C08089` | Brand fill — borders, bars, rings |
| Rose text | `#92535F` | The same accent at AA contrast for text |
| Blush | `#E4CDCB` | Secondary |
| Champagne | `#DEC69B` | Highlight |
| Sage | `#75886F` | **BUY** |
| Amber | `#BF9822` | **WAIT** |
| Rust | `#AC5A48` | **SKIP** |
| Line | `#DCD0BE` | Hairlines |

Every accent ships as a **fill** and a separate **text** variant. A colour that looks right as a 3px bar fails WCAG AA as 11px type, and shipping one value for both is how design systems quietly become inaccessible.

**Typography** — Cormorant Garamond for display, Inter for body and UI. Serif signals fashion; sans signals technology. Letter-spacing tokens `editorial` (0.28em) and `salon` (0.16em) carry the eyebrow labels.

**Loading states are part of the design**, because AI calls take real seconds:

| Stage | Copy |
|:--|:--|
| Context | *Understanding your moment…* |
| Skin | *Reading your beauty profile…* |
| Outfit | *Finding pieces that fit your moment…* |
| VTO | *Putting your look together…* |
| Aftermath | *Looking beyond the first impression…* |
| Closet | *Going through what you already own…* |

<br>

---

## Privacy & security

MAVIE processes photographs of people's faces and bodies. That is not an afterthought here.

**User-facing controls**
- **Guest mode** — analyse, show, persist nothing
- **Delete my photos** — clears both the selfie and the body photo
- **Delete my profile** — cascades to closet, saved looks, decisions and feedback
- Plain-language disclosure on every upload surface
- A permanent note that skin analysis is **beauty personalisation, not medical advice**

**Engineering**
- Every third-party key is server-side only and never enters the client bundle
- Photos are held in memory for the request; nothing is written to disk
- Zod validation on every request body **and** every AI response
- MIME-type allowlisting and size limits on uploads; images downscaled before transit
- Path traversal guarded when resolving garment files
- Rate limiting on all AI and VTO endpoints
- CORS allowlist with explicit origins
- Graceful degradation everywhere — a failed try-on shows a composite preview and an explanation, never a raw `500`

<br>

---

## Deployment

**Backend → Render**
Root `server` · build `npm install` · start `npm start`. Set the Perfect Corp, Gemini and Supabase variables. **Don't set `PORT`** — Render injects it.

**Frontend → Vercel**
Root `client` · framework Vite · output `dist`. Set `VITE_API_URL` to the Render URL — no trailing slash, no `/api`.

**Then close the loop**
Set `CLIENT_ORIGIN` on Render to `https://your-app.vercel.app,*.vercel.app`. The wildcard covers Vercel's per-commit preview domains, which would otherwise all fail CORS.

Verify:

```bash
curl https://your-api.onrender.com/api/health
```

You want `youcam: live`, `llm: gemini`, `database: supabase`. Anything reading `mocked` or `in-memory` means a variable didn't take.

> **Render's free tier sleeps after 15 minutes idle** and takes 30–50 seconds to wake. Warm it before a demo or a judging window.

<br>

---

## Demo script

The seeded path, which produces a known-good run in about ninety seconds.

| # | Action | What to point at |
|:--:|:--|:--|
| 1 | Type the dinner scenario | Plain language in, structure out |
| 2 | Add a selfie | Live Skin AI — direction, not a score |
| 3 | Three looks appear | Real catalog, real prices, visible factor scores |
| 4 | Pick one, try it on | **Photoreal**, on your own photo |
| 5 | *Should I buy it?* | The debate — every claim cites a field |
| 6 | Go to **Found it**, upload the velvet dress | The same engine on a piece MAVIE never curated |
| 7 | The verdict lands on **WAIT** | Versatility 34%, care burden 84%, three black dresses already owned |
| 8 | Take the alternative | **BUY** — and it costs less |

> **The WAIT is not staged.** It falls out of the numbers. The composer only builds outfits it can defend, so a regrettable verdict has to come from a piece the *user* brought in — which is exactly where regret comes from in real life.

### Questions to be ready for

<details>
<summary><b>"Isn't this just a recommendation engine?"</b></summary>
<br>
A recommendation engine cannot tell you not to buy. MAVIE returns WAIT and SKIP with reasons, and the alternative it offers is usually cheaper. That is the opposite of an engine optimised for conversion.
</details>

<details>
<summary><b>"How do you stop the AI hallucinating a reason?"</b></summary>
<br>
Agents never see the verdict logic and never produce a score. Every claim must cite a numeric field from the evidence packet, and the output is schema-validated before it is rendered. The only influence a model has on the outcome is +6 risk per high-severity concern — it can push toward caution, never away from it.
</details>

<details>
<summary><b>"Is the skin analysis medical?"</b></summary>
<br>
No, and the product is built to make that impossible to misread. No condition names, no diagnosis, no clinical scores in the main flow. Raw values sit behind an explicit disclosure with a permanent disclaimer.
</details>

<details>
<summary><b>"What happens when the APIs are down?"</b></summary>
<br>
Every layer degrades honestly. Try-on falls back to a structured composite that shows the real garment colours and says why. The LLM cascades across models, then to a deterministic local reasoner. Persistence falls back to memory. The user is always told which one they're seeing.
</details>

<br>

---

## Engineering notes

A few problems that were more interesting than they should have been.

**ISP DNS hijacking.** Every `perfectcorp.com` host resolved to a sinkhole on the development network. The client now resolves over **DNS-over-HTTPS** and connects to the returned IP with explicit SNI, falling back to normal `fetch`. Changing the OS resolver didn't help — IPv6 DNS is configured separately and the interception was at port 53.

**Thinking tokens truncating JSON.** Agent responses were being cut off at the token limit *before* emitting valid JSON, so the code silently fell back to templates and everything looked fine. Hitting `MAX_TOKENS` now throws rather than degrading quietly.

**A foreign-key race in fire-and-forget writes.** Mirrored writes could reach Postgres before the profile row they reference. Any write that fails with `23503` now creates the missing profile and retries once, rather than requiring every call site to order itself.

**Unknown columns rejecting the whole row.** PostgREST refuses an entire insert when it carries a column the table lacks — so adding one field silently stopped *all* profile persistence. The adapter now drops the unknown column, warns with the exact migration to run, and saves the rest.

**Stock photography didn't survive contact with reality.** Colour-matched search returned a men's flat-lay for an ivory blouse. Of 60 fetched images, 46 were clothing, 34 matched on colour, and 14 didn't contradict the garment — and those were still the wrong products. The catalog is now purpose-generated imagery, trimmed and resized from 386MB to 3.6MB.

<br>

---

## Honest limitations

A short list, because a product claiming no weaknesses isn't being straight with you.

- **Skin analysis is beauty personalisation, not medical assessment.** MAVIE does not diagnose skin conditions and deliberately avoids clinical framing.
- **The catalog is 60 curated garments**, not a live retail feed. Every attribute is real and hand-set; the integration surface for a merchant catalog is identical.
- **Makeup VTO is partially mapped.** The effects schema is deep, and the hackathon brief covers Skin AI and Apparel VTO — effort went there instead.
- **Preference learning is shallow by design.** Feedback nudges weights; it does not train a model. Claiming more at this scale would be dishonest.
- **Try-on quality depends on your photo.** Full body, facing the camera, decent light.
- **No authentication yet.** Single-profile by design for the hackathon; the store is already user-scoped throughout.

<br>

---

## Roadmap

| | |
|:--|:--|
| **Retail integration** | Swap the curated catalog for live merchant feeds — the attribute contract already exists |
| **Wardrobe photography** | Recognise closet pieces from photos rather than typed entries |
| **Longitudinal regret tracking** | Ask, six weeks later, whether you actually wore it — and feed the answer back into the weights |
| **Multi-user accounts** | Authentication over the already user-scoped store |
| **Full Makeup VTO** | Map the complete effects schema |

<br>

---

## What MAVIE is not

Not a filter. Not a beauty score. Not a rating of how you look.

It has **no opinion about your face.** It has opinions about **decisions** — and it shows its working every single time, so you can disagree with it.

<br>

<div align="center">

---

<br>

### Anyone can show you the outfit.<br>MAVIE tells you the truth about it.

<br>

**MAVIE** · *A look made for your life.*

<br>

<sub>Built for the Perfect Corp YouCam API Skin AI & Apparel VTO Hackathon</sub>

<br>

</div>
