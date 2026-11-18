# Sherpas Pulse ⛰️
> **From Static Financial Plan to Family Alignment & Immediate Action on Mobile.**  
> *An interactive, mobile-first financial diagnostic and joint decision platform for wealth advisors and modern households.*

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-cyan.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8.svg)](https://tailwindcss.com/)
[![Zero Hallucinations](https://img.shields.io/badge/Grounding-100%25%20Deterministic-success.svg)](#grounding--zero-hallucinations)
[![Tests](https://img.shields.io/badge/Tests-35%2F35%20Passing-emerald.svg)](#automated-test-suite--build-verification)

---

## 1. Executive Summary & Problem Solved

Every financial advisor faces a critical **"third job"**: once a comprehensive financial plan is generated, the client takes it home. Without an advisor in the room:

1. **Clients Freeze (Cognitive Overload):** 40-page technical PDFs filled with abstract financial jargon (*Roth conversions*, *mortality ratios*, *umbrella excess limits*) overwhelm clients, leading to a 15–20% drop-off rate before any action is taken.
2. **Couples Are Asymmetric:** Spouses rarely think about wealth the same way. One partner is analytical (focusing on interest rates, tax efficiency, and ROI), while the other seeks family security and peace of mind (term life protection, children's education). Forcing both into a single static presentation leaves one partner disengaged.
3. **Paralysis by Analysis:** Confronted with six competing recommendations simultaneously, clients freeze because there is no single, low-friction starting step.

**Sherpas Pulse** transforms any raw Model Context Protocol (MCP) financial plan into an interactive, 100% mobile-first **"Financial Wrapped"** diagnostic experience. Guided by **Sherpi**, Pulse passively calibrates client doubts in real time without forcing them to formulate prompts, enables couples to explore independently on their own phones, aligns their priorities into an instant consensus, and drives immediate joint momentum through **"The First Domino"** before the advisor Zoom meeting even begins.

---

## 2. Product Architecture & The 4 Core Pillars

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
- **6 Vertical Interactive Chapters (25s each):**
  - **Chapter 0 (Vibe Check):** Allows clients to personalize their viewing pace in one click (*Calm & Visual* vs. *Analytical* vs. *Express*).
  - **Chapter 1 (Overview):** *Superpower vs. Silent Leak* — vividly contrasts liquid cash ($150k) against revolving 18% credit card interest burn ($3,240/yr).
  - **Chapter 2 (The Real-Life Translator):** Converts abstract financial figures into tangible milestones (e.g. $3,240 annual interest burned = 1 full semester of college tuition).
  - **Chapter 3 (Advice):** *The Liquidity Tank* — interactive preview of competing wealth strategies contending for the same surplus cash pool.
  - **Chapter 4 (Living Map):** *The Time Machine* — touch-scrubbable milestone horizon projecting family net worth from 2026 to 2050.
  - **Chapter 5 (Action):** *Your 5-Minute Win* — single highest-impact initial move with quantified dollar benefit and a 3-step execution checklist.
- **Sherpi Mascot Guide & Checkpoints:**
  - **Sherpi the Mascot (`SherpiAvatar.tsx`):** An expressive, animated financial guide that introduces chapters, highlights critical numbers, and humanizes technical advice.
  - **Pause-at-100% Checkpoints:** Critical chapters pause gracefully at the end of their progress bar, giving clients time to absorb the takeaway, tap terms for calibration, ask questions, or tap *Continue* when ready.
- **Dual-Persona Calibration ("Zero-Prompt Calibration"):**
  - Tapping underlined financial terms (*Roth IRA*, *Umbrella Liability*, *Mortality Ratio*, *529 Plan*) pauses playback and slides up an interactive **Calibration Micro-Card**.
  - **Dual Persona Switcher:** Clients can toggle between **Everyday Analogy (Beginner)** and **Financial Mechanics (Expert)** to match their comfort level.
  - **4-Second Inactivity Sensor:** Lingering on a slide for >4 seconds automatically opens calibration for that card's key term to solve the "confused face" problem without forcing the user to know what to ask.

### Pillar 2: "Two Paces, One Plan" (Asymmetric Couple Alignment)
- **Automatic Household Detection:** Automatically detects whether the household is a couple (Timothy & Melanie, Daniel & Emily) or a single client (Michael Carter, Samantha Lewis).
- **Personalized Mobile Links & QR Pairing:** Generates distinct views (`?user=timothy` and `?user=melanie`) so each partner explores on their own phone at their own rhythm:
  - **Analytical Track:** Focused on debt elimination, APR savings, and tax deduction optimization.
  - **Peace-of-Mind Track:** Focused on children's college funding, family term life protection, and long-term milestones.
  - **Cross-Device SVG QR Code:** One partner displays the QR code on screen; the other scans it with their phone to join asynchronously.
- **Tactile Cash Allocator:** An interactive liquidity reservoir where each partner orders and prioritizes competing strategies (Pay off 18% card, Life insurance, Umbrella, College 529), watching the surplus cash level dynamically adjust.
- **Consensus Screen ("Family Sync"):**
  - **Green Zone (Ready-to-Act Agreements):** Strategies both partners agreed on (e.g., pay off $18,000 card today).
  - **Amber Zone (Advisor Tie-Breakers):** Topics where partners diverged (e.g., college fund vs. life insurance) automatically queued as Topic #1 for the advisor meeting.

### Pillar 3: Living Map with Boomerang Guardrails (100% Deterministic)
- **Zero-Hallucination Architecture:** The AI never computes or approximates financial figures. Every single dollar amount, percentage, and date is deterministically read from verified MCP files (`financial-health.json` and `investment-analysis.json`).
- **Interactive Grounding Badges:** Every key metric displays a verification shield. Tapping it opens the **Grounding Inspector**, revealing the exact JSON path and raw extracted values.
- **Guardrail Router ("Boomerang"):** Intercepts off-plan queries (e.g., *"Should I buy Bitcoin or Nvidia?"*) and gracefully declines external speculation, redirecting the client back to the concrete tradeoffs of their Living Map.

### Pillar 4: The First Domino + Advisor Pre-Meeting Telemetry + Multi-Touch
- **The First Domino (5-Minute Win):** A single concrete action quantified in dollars (e.g., Save $3,240/yr and unlock score 60 → 62) with an interactive 3-step checklist.
- **Advisor Pre-Meeting Telemetry Dashboard (`/case/:caseId/advisor`):**
  - Displays client comprehension index (e.g. 92%), calibrated hesitation hotspots, hesitation terms, and household consensus.
  - **Generates 3 Prioritized Human Questions** for the Zoom call based on where the client paused or diverged.
  - **Saves 40 Minutes of Screen Sharing:** The advisor skips slide presentations and dives straight into high-trust human conversation.
- **1-Page Printable Cheat-Sheet:** Ink-friendly print stylesheet formatting an executive brief for the advisor's physical desk during calls.
- **Multi-Touch Smart Cadence (Days 1, 3, 14, 30):**
  - **Day 1:** 1-click `.ics` calendar download to lock in the 5-minute win.
  - **Day 3:** Doubt calibrator nudge based on the client's longest hesitation term.
  - **Day 14:** Couple alignment follow-up for agreed Green Zone items.
  - **Day 30:** Pre-meeting blueprint highlighting tie-breakers.
  - 1-click export to WhatsApp and Email templates.

---

## 3. Product Architecture & Design Principles

### 3.1 Architectural Principles: What We Deliberately Ruled Out & Why

| What We Deliberately Ruled Out | Why We Ruled It Out | What We Built Instead |
|---|---|---|
| **The PDF Chatbot ("Chat with your plan")** | When clients are confused, they suffer from *"blank-page syndrome"*—they do not know what to ask about Roth conversions or umbrella limits. Chat places the cognitive burden on the client. | **Zero-Prompt Implicit Calibration:** Automatically senses when a user lingers (>4s) or taps an underlined term and slides up an everyday analogy with their exact MCP figures. |
| **40-Minute Desktop Slide Decks** | Screen-sharing static spreadsheets eats up the entire meeting, leaving zero time for human empathy and trust-building. | **100% Mobile-First Wrapped Stories:** Vertical, touch-first cards that clients complete at home in 3 minutes on their own phones. |
| **Generative LLM Math Calculations** | In wealth management, an LLM hallucinating compounding rates or tax limits destroys fiduciary trust and violates regulatory standards. | **100% Deterministic TypeScript Layer (`extractor.ts`):** Direct extraction from MCP files with interactive Grounding Badges inspecting the raw JSON path. |
| **Single-Screen Couple Presentations** | Couples rarely think about money the same way. Forcing both into one presentation causes disengagement and at-home conflict. | **"Two Paces, One Plan" + QR Pairing:** Each partner explores on their own phone at their own rhythm, converging on a shared Family Sync screen. |

---

## 4. Household Profiles & Supported Journeys

Sherpas Pulse supports four distinct household profiles directly from MCP files:

1. **Timothy & Melanie Weah (San Francisco, CA) · Couple Household**
   - *Pillars:* $150k cash liquidity vs. $18k credit card balance at 18% APR ($3,240/yr interest burn).
   - *Consensus:* Instant agreement on paying off the credit card and adding umbrella protection; tie-breaker on college 529 vs. life insurance.
2. **Daniel & Emily Johnson (Denver, CO) · Couple Household**
   - *Pillars:* $560k mortgage; college funding for Oliver & Sophia vs. retiring at age 62.
   - *Consensus:* Agreement on life coverage expansion; discussion point on savings acceleration vs. 529 front-loading.
3. **Michael Carter (Austin, TX) · Single Household**
   - *Pillars:* $180k salary, single renter; trade-off between buying a $550k home in 2027 vs. early retirement at age 58.
   - *What-If Simulator:* Dynamic living map scrubber showing equity accumulation vs. retirement age shift.
4. **Samantha Lewis (Miami, FL) · Single Household**
   - *Pillars:* $250k salary, debt-free; balancing college tuition starting now vs. second home purchase in 2030.
   - *What-If Simulator:* Cash flow preservation analysis and liquidity maintenance.

---

## 5. Built-in Demonstration HUD & Navigation

Sherpas Pulse includes a persistent **Demo Navigator HUD (`⚡`)** in the upper-right corner for guided exploration:

- **Flow Navigator Tab:** Jump directly to any of the 6 core product milestones across any household:
  1. *Financial Wrapped Stories* (Pillar 1)
  2. *Zero-Prompt Calibration* (Pillar 1)
  3. *Tactile Cash Tank Allocator* (Pillar 2)
  4. *Family Sync Consensus* (Pillar 2)
  5. *5-Min Win & Multi-Touch Cadence* (Pillar 4)
  6. *Advisor Telemetry & Pre-Meeting Cheat-Sheet* (Pillar 4)
- **2-Minute Walkthrough Tab:** Built-in storyboard and spoken script providing a 120-second guided product tour with 1-tap screen jumps.

---

## 6. Quick Start & Developer Guide

### Prerequisites
- **Node.js 20+**
- **npm 10+**
- Modern mobile browser or desktop browser (Chrome, Safari, Firefox, Edge)

### Installation
```bash
# Clone the repository
git clone <repo-url>
cd Sherpas-Pulse

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

### Running Locally
```bash
# Start Vite development server
npm run dev

# Open in browser:
# http://localhost:5173
```

### Automated Test Suite & Build Verification
```bash
# Run the 35/35 automated unit test suite
npm test

# Run ESLint checks
npm run lint

# Production type-check & build verification
npm run build
```

---

## 7. Enterprise & Regulatory Compliance

- **Fiduciary-Grade Deterministic Grounding:** Zero LLM financial hallucination. Every metric traces directly to typed MCP schemas.
- **Client Privacy & Data Security:** No client personal identifiable information (PII) is transmitted to external generative models for calculations.
- **Mobile Accessibility (WCAG 2.1 AA):** All touch targets enforce a minimum 44px tap area (`min-h-11`). Contrast ratios, keyboard navigation, and screen-reader semantics are verified across all views.
