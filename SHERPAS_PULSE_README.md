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
- **Implicit Calibration ("Zero-Prompt Calibration"):**
  - Tapping underlined financial terms (*Roth IRA*, *Umbrella Liability*, *Mortality Ratio*, *529 Plan*) pauses the story and opens a slide-up **Calibration Micro-Card** with everyday analogies and the client's exact MCP numbers.
  - **4-Second Inactivity Sensor:** Pausing for >4 seconds automatically opens calibration for that card's key term to solve the "confused face" problem without forcing the user to ask.

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
