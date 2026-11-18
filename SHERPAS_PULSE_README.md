# Sherpas Pulse ⛰️
> **From Static Financial Plan to Family Alignment & Immediate Action on Mobile.**  
> *Built for the Sherpas x UPV Sigma Data Club Hackathon (November 2026).*

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-cyan.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8.svg)](https://tailwindcss.com/)
[![Zero Hallucinations](https://img.shields.io/badge/Grounding-100%25%20Deterministic-success.svg)](#grounding--zero-hallucinations)

---

## 1. Executive Summary & Problem Solved

Every financial advisor faces a critical **"third job"**: once a comprehensive plan is created, the client takes it home. Without an advisor in the room:
1. **Clients freeze:** Long PDFs and technical jargon (*Roth conversions*, *mortality ratios*, *umbrella liability*) cause confusion.
2. **Couples are misaligned:** One partner is analytical (rates, taxes, ROI), while the other seeks peace of mind (family security, kids' education).
3. **No action is taken:** Overwhelmed by 6 competing recommendations, clients suffer from analysis paralysis and do nothing.

**Sherpas Pulse** solves this with a **100% Mobile-First Web Experience** that turns any family's MCP plan into an interactive **"Financial Wrapped"** story, calibrates doubts automatically without forcing the user to know what to ask, aligns couples asynchronously, and delivers a concrete **"5-Minute Win"** before the human meeting.

---

## 2. The 4 Product Pillars

```
┌────────────────────────────────────────────────────────────────────────┐
│                          SHERPAS PULSE                                 │
├─────────────────────┬──────────────────────┬───────────────────────────┤
│ 1. Mobile Wrapped   │ 2. Couple Alignment  │ 3. Living Map & Guardrail │
│    & Zero-Prompt    │    ("Two Paces,      │    100% Deterministic     │
│    Calibration      │     One Plan")       │    Zero Hallucinations    │
├─────────────────────┴──────────────────────┴───────────────────────────┤
│ 4. The First Domino: 5-Minute Win + Advisor Telemetry + Smart Nudges   │
└────────────────────────────────────────────────────────────────────────┘
```

### Pillar 1: "Financial Wrapped" Mobile Stories (Watch + Listen + Touch)
- **6 vertical, 25-second interactive stories** structured around Sherpas native pillars:
  - **Story 0 (Vibe Check):** Personalize viewing pace in 1 click (Calm/Visual vs. Analytical vs. Express).
  - **Story 1 (Overview):** *Superpower vs. Silent Leak* — contrasts liquid cash ($150k) against the 18% credit card interest burn ($3,240/yr).
  - **Story 2 (The Real-Life Translator):** Converts abstract finance into real life (e.g. $3,240 interest lost = 1 semester of Liam's college).
  - **Story 3 (Advice):** *The Liquidity Tank* — visual preview of strategies competing for the same cash.
  - **Story 4 (Living Map):** *The Time Machine* — interactive milestone horizon (2026 → 2048+).
  - **Story 5 (Action):** *Your 5-Minute Win* — single first step with dollar benefit and 3-step checklist.
- **Sherpi Mascot & Interactive Chapter Checkpoints:**
  - **Sherpi the Guide (`SherpiAvatar.tsx`):** An expressive financial companion who introduces the session, highlights critical numbers, and humanizes abstract advice.
  - **Pause-at-100% Checkpoints:** Critical chapters pause gracefully at the end of their progress bar, giving clients time to absorb the takeaway, tap terms for calibration, ask questions, or tap *Continue* when ready.
- **Dual Persona Calibration ("Zero-Prompt Calibration"):**
  - Tapping underlined financial terms (*Roth IRA*, *Umbrella Liability*, *Mortality Ratio*, *529 Plan*) pauses the story and opens a slide-up **Calibration Micro-Card** with everyday analogies and the client's exact MCP numbers.
  - **Dual Persona Switcher:** Clients can toggle between **Everyday Analogy (Beginner)** and **Financial Mechanics (Expert)** to match their comfort level.
  - **4-Second Inactivity Sensor:** Lingering on a slide for >4 seconds automatically opens calibration for that card's key term to solve the "confused face" problem without forcing the user to know what to ask.

### Pillar 2: "Two Paces, One Plan" (Asymmetric Couple Mode)
- **Automatic Household Detection:** Automatically detects whether the household is a couple (Timothy & Melanie, Daniel & Emily) or single (Michael Carter, Samantha Lewis).
- **Personalized Mobile Links:** Generates distinct views (`?user=timothy` and `?user=melanie`) so each partner explores on their own phone at their own rhythm:
  - **Analytical:** Focused on debt payoff, 18% APR savings, and tax deduction optimization.
  - **Peace of Mind:** Focused on children's college, family term life protection, and life goals.
- **Tactile Cash Allocator:** An interactive liquidity reservoir where each partner orders and prioritizes competing strategies (Pay off 18% card, Life insurance, Umbrella, College 529), watching the surplus cash level dynamically adjust.
- **Consensus Screen ("Family Sync"):**
  - **Green Zone (Ready-to-Act Agreements):** Strategies both partners agreed on (e.g., pay off $18,000 card today).
  - **Amber Zone (Advisor Tie-Breakers):** Topics where partners diverged (e.g., college fund vs. life insurance) automatically queued as Topic #1 for the advisor meeting.

### Pillar 3: Living Map with Boomerang Guardrail (100% Grounding)
- **Zero-Hallucination Architecture:** The LLM never calculates or invents financial figures. Every dollar amount is deterministically read from `financial-health.json` and `investment-analysis.json`.
- **Interactive Grounding Badge:** Every key number displays a verification shield. Tapping it opens the **Grounding Inspector**, revealing the exact JSON path and raw extracted values.
- **Guardrail Router ("Boomerang"):** Intercepts off-plan queries (e.g., *"Should I buy Bitcoin or Nvidia?"*) and gracefully declines external investment advice, redirecting back to the impact on the client's Living Map.

### Pillar 4: Actionable Close + Advisor Telemetry + Smart Nudges
- **The First Domino (5-Minute Win):** A single concrete action quantified in dollars (e.g. Save $3,240/yr and unlock score 60 → 62) with an interactive 3-step checklist.
- **Advisor Pre-Meeting Telemetry ("Advisor Cheat-Sheet"):**
  - Compact dashboard view showing comprehension rate (92%), calibrated doubts, couple consensus, and 3 human questions for the Zoom meeting.
  - **Saves 40 minutes of screen sharing:** The advisor skips slide presentations and dives straight into the human conversation.
- **Multi-Touch Smart Nudges:** Auto-generated WhatsApp and Email follow-up templates tailored to where the client hesitated, ready to copy and send at 48 hours.

---

## 3. How Sherpas Pulse Secures 100/100 Points

*Directly aligned with Borja's official Hackathon Scoring Rubric (weights set Nov 11, 2026):*

| Hackathon Rubric Criterion | Weight | How Sherpas Pulse Wins Maximum Score |
|---|:---:|---|
| **1. Captivating** *(Engancha)* | **20 pts** | Replaces static text with a **100% Mobile-First Financial Wrapped** experience (6 vertical 25s stories, dynamic progress, soundscapes, and Demo Pitch HUD). Captures and holds family attention on the devices they actually use. |
| **2. Understanding** *(Comprensión)* | **20 pts** | **Dual Persona Calibration:** Micro-cards feature an instant toggle between *Everyday Analogies (Beginner)* and *Financial Mechanics (Expert)*, explaining statutory rules (IRC §408A, IRC §529, umbrella excess limits) without losing either partner. |
| **3. Motivation to Act** *(Ganas de actuar)* | **20 pts** | Eliminates paralysis via **"The First Domino"** (a single 5-minute win with quantified dollar ROI) + an interactive **Multi-Touch Follow-Up Cadence (Days 1, 3, 14, 30)** with 1-click `.ics` calendar downloads and hesitation-driven WhatsApp/Email drafts. |
| **4. Personal** *(Personal)* | **15 pts** | **"Two Paces, One Plan"**: Dedicated rhythms for Timothy (Analytical) and Melanie (Peace of Mind), with scannable **Cross-Device QR Pairing** so each partner reviews on their own phone, plus a tactile **Cash Tank Allocator** and **Family Sync** consensus screen. |
| **5. Creativity** *(Creatividad)* | **15 pts** | Strictly avoided typical "chatbot tours". Introduced Zero-Prompt Inactivity Calibration (detecting 4s hesitation pauses), tactile liquidity reservoir drainage, and an out-of-the-box **Advisor Pre-Meeting Telemetry Dashboard (`/case/:caseId/advisor`)** that saves 40 minutes of screen sharing. |
| **6. Your Friday Plan** *(Plan del viernes)* | **10 pts** | **The Friday Decision Matrix**: Clear, transparent architectural choices documented in-app and in code, articulating exactly what we ruled out (PDF chatbots, desktop slide decks, generative LLM math) and why. |

---

### 3.1 The Friday Decision Matrix: What We Ruled Out & Why

| What We Deliberately Ruled Out | Why We Ruled It Out | What We Built Instead |
|---|---|---|
| **The PDF Chatbot ("Chat with your plan")** | Sherpas already has conversational AI. When clients are confused, they suffer from *"blank-page syndrome"*—they don't know what to ask about Roth conversions or umbrella limits. Chat is passive and places the cognitive burden on the client. | **Zero-Prompt Implicit Calibration:** Automatically senses when a user lingers (>4s) or taps an underlined term and slides up an everyday analogy with their exact MCP figures. |
| **40-Minute Desktop Slide Decks** | Screen-sharing static spreadsheets eats up the entire meeting, leaving zero time for human empathy. Moreover, Sherpas has zero mobile presence today. | **100% Mobile-First Wrapped Stories:** Vertical, touch-first cards that clients actually complete at home in 3 minutes. |
| **Generative LLM Math Calculations** | In wealth management, an LLM hallucinating compounding rates or incorrect tax limits destroys fiduciary trust and violates regulatory guidelines. | **100% Deterministic TypeScript Layer (`extractor.ts`):** Direct extraction from MCP files with interactive Grounding Badges inspecting the raw JSON path. |
| **Single-Screen Couple Presentations** | Couples rarely think about money the same way. Timothy is analytical (debt payoff, 18% APR, tax efficiency); Melanie seeks family peace of mind (kids' 529 college, term life shield). Forcing them into one presentation leaves one disengaged. | **"Two Paces, One Plan" + QR Pairing:** Each partner explores on their own phone at their own rhythm, converging on a shared Family Sync screen. |

---

## 4. The 4 Synthetic Households Supported

1. **Timothy & Melanie Weah (San Francisco, CA):**
   - *Pillars:* $150k cash liquidity vs. $18k credit card at 18% APR ($3,240/yr burned).
   - *Consensus:* Agreement on paying off card & adding umbrella; tie-breaker on college vs. life cover.
2. **Daniel & Emily Johnson (Denver, CO):**
   - *Pillars:* $560k mortgage; college funding for Oliver & Sophia vs. retiring at 62.
3. **Michael Carter (Austin, TX):**
   - *Pillars:* $180k salary, single renter; $550k home in 2027 vs. early retirement at 58.
4. **Samantha Lewis (Miami, FL):**
   - *Pillars:* $250k salary, debt-free; college funding starting now vs. second home in 2030.

---

## 5. Quick Start & Setup

### Prerequisites
- Node.js 20+ installed
- Chrome or modern mobile browser

### Installation
```bash
# Clone and enter workspace
git clone <repo-url>
cd Sherpas-Pulse

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
```

### Running Locally
```bash
# Start Vite development server
npm run dev

# Open in browser
# http://localhost:5173
```

### Live Demo Features:
- **Clean Mobile-First Responsive Design:** Seamlessly adapts across mobile, tablet, and desktop viewports with zero fake frames or clumsy split toggles.
- **Voice Interruption:** Hold down the floating mic button to trigger Push-to-Ask voice interruption.
- **Grounding Inspector:** Tap the green shield icon next to any figure to inspect the exact MCP JSON path.

### Automated Test Suite & Build Verification
```bash
# Run the 35/35 automated unit test suite
npm test

# Production type-check & build verification
npm run build
```

---

## 6. Official Hackathon Submission Package (For Submission Tonight)

### 6.1 The Official 1-Paragraph Summary
> **Sherpas Pulse: From Static Financial Plan to Family Alignment & Immediate Action on Mobile.**  
> Traditional financial plans suffer from a fatal 15–20% client drop-off because 40-page technical PDFs freeze clients, divide couples who think differently about money, and end without an immediate next step. **Sherpas Pulse** transforms any raw MCP financial plan into a 3-minute, 100% mobile-first "Financial Wrapped" experience guided by Sherpi. Pulse passively detects client hesitation (>4s dwell time) to surface instant Dual-Persona Calibrations (*Everyday Analogy* vs. *Financial Mechanics*), empowers couples to explore on their own phones via cross-device QR pairing, and visualizes consensus on a tactile Cash Tank that separates instant agreements (green) from advisor tie-breakers (amber). Armed with "The First Domino" (a concrete 5-minute win with quantified dollar ROI), a 30-day multi-touch follow-up cadence, and an advisor pre-meeting telemetry dashboard that saves 40 minutes of screen sharing, Sherpas Pulse turns passive delivery into confident, aligned family action—with 100% deterministic grounding and zero hallucinations.

---

## 7. Beat-by-Beat 2-Minute Demo Video Recording Script & Storyboard

This 120-second storyboard is structured for a high-impact video submission (and directly mirrored in the in-app **Demo Navigator HUD → 2-Min Pitch Script** tab):

| Timestamp | Screen / Flow | Key Visual Actions | Spoken Script (English) |
|---|---|---|---|
| **0:00 - 0:25** | Story Intro & Vibe Check | Launch `/case/timothy-melanie-weah/stories`. Show Sherpi avatar welcome, tap "Calm & Visual" pace, watch Story 1 progress bar fill. | *"Every financial planner knows the third job dilemma: you deliver a 40-page PDF, but the client takes it home, freezes, and never executes. Sherpas Pulse replaces static PDFs with an interactive, 100% mobile Financial Wrapped guided by Sherpi."* |
| **0:25 - 0:55** | Story 1 & Zero-Prompt Calibration | Story 1 displays "$150k Liquid Cash vs. $3,240/yr Credit Card Interest". User pauses for 4 seconds → Micro-card auto-slides up. Toggle between *Everyday Analogy* and *Financial Mechanics*. Tap green shield to inspect JSON grounding. | *"When a client hesitates, Pulse passively detects dwell time without nagging popups. Our Dual Persona Calibration instantly toggles between simple beginner analogies and rigorous statutory mechanics, backed by zero-hallucination deterministic grounding."* |
| **0:55 - 1:25** | Cash Allocator & Family Sync | Navigate to `/case/timothy-melanie-weah/allocate`. Drag cash slider. Click "Pair Partner Device" (show SVG QR code). Navigate to `/case/timothy-melanie-weah/sync`. | *"Couples rarely budget in sync. With Two Paces, One Plan, partners scan a QR code to explore independently. Family Sync automatically categorizes instant agreements in green and flags advisor tie-breakers in amber, eliminating at-home friction."* |
| **1:25 - 1:45** | The First Domino & Multi-Touch Cadence | Navigate to `/case/timothy-melanie-weah/action`. Show 5-minute win checklist (Pay off $18k card → unlock +2 health score). Show 1-tap `.ics` Calendar download and pre-filled WhatsApp nudge. | *"Advice without immediate action is dead advice. We deliver The First Domino: a concrete 5-minute win with quantified dollar ROI, paired with a Days 1 to 30 follow-up timeline, one-tap calendar invites, and advisor WhatsApp drafts."* |
| **1:45 - 2:00** | Advisor Telemetry & Cheat-Sheet | Navigate to `/case/timothy-melanie-weah/advisor`. Show 92% comprehension rate, client hesitation triggers, 3 prepared advisor questions, and tap "Print Cheat-Sheet". | *"Before the Zoom call even starts, the advisor reviews client dwell telemetry and a 1-page ink-friendly cheat-sheet. We skip 40 minutes of slide presenting and jump straight into high-trust human advice. That is Sherpas Pulse."* |

---

## 8. Demo Day Live Pitch Track (19 Nov, 12:45 · Room 2.3)

### How to Present Sherpas Pulse Live
1. **Open the App on Mobile / Chrome Responsive Mode (390 x 844 px)**:
   - Point browser to `http://localhost:5173/`.
   - The app is 100% responsive with zero viewport letterboxing or desktop crutches.
2. **Use the Floating Demo Navigator HUD**:
   - Tap the top-right **Demo Navigator (`⚡`)** button.
   - Switch to the **2-Min Pitch Script** tab to have your exact cues and 1-tap screen jumps right on screen.
3. **Key Pitch Emphasis for the Jury**:
   - **Borja's 6 Rubric Criteria**:
     - *Captivating (20%)*: Point to the mobile Wrapped stories, Sherpi, and story checkpoints.
     - *Understanding (20%)*: Toggle Dual Persona Calibration (Analogy vs. Expert statutory rules).
     - *Motivation (20%)*: Highlight the First Domino ($3,240 saved) + Days 1–30 `.ics` download.
     - *Personal (15%)*: Show the QR pairing modal and Family Sync Green/Amber zones.
     - *Creativity (15%)*: Emphasize zero-prompt inactivity sensing + Tactile Cash Tank + Pre-Meeting Telemetry.
     - *Friday Plan (10%)*: Reference the Friday Decision Matrix (ruling out PDF chatbots and LLM math).
4. **Q&A Defense**:
   - *Q: "Does the AI hallucinate financial projections?"*  
     *A:* **"No. Zero hallucination by architectural constraint. Every single number is deterministically extracted from the MCP JSON layer (`extractor.ts`). Tapping any green shield proves the exact JSON provenance in real time."**
   - *Q: "Why mobile web instead of a native mobile app?"*  
     *A:* **"Zero-friction client adoption. Clients won't download an App Store app just to review a financial plan. A responsive mobile web link sent via SMS/WhatsApp opens instantly on any iOS or Android device."**
