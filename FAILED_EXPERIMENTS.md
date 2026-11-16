# Failed Experiments & What We Learned — Sherpas Pulse

_This document is a mandatory submission requirement documenting the technical hypotheses, dead ends, failed attempts, and architecture pivots encountered during the hackathon._

---

## 1. LLM-Calculated Financial Figures vs. Deterministic MCP Extraction

- **Hypothesis:** We initially explored using a small LLM call to dynamically summarize the exact debt interest savings and retirement gap numbers from `financial-health.json` and `investment-analysis.json`.
- **What Failed:** Even with low temperature (`temperature: 0.1`), the LLM occasionally rounded Timothy & Melanie's 18% credit card interest from `$3,240/yr` to "about $3,200/yr" or calculated a slightly different payoff duration. In regulated wealth advisory and according to the hackathon rubric (Rule #1: "Every single number displayed or spoken must be deterministically injected"), this would fail the 20-point Grounding rubric.
- **The Solution:** We scrapped all LLM math. We decoupled the architecture into a **100% deterministic pure TypeScript MCP extraction layer** (`src/lib/mcp/extractor.ts`). The LLM is used strictly for conversational speech narration, while every single dollar amount, percentage, and date is injected via typed templates with an interactive **Grounding Inspector** showing the exact JSON source path.

---

## 2. WebAudio AudioWorklet & Sample Rate Mismatches

- **Hypothesis:** Stream raw microphone input directly through the Web Audio `AudioContext` to the WebSocket relay proxy at standard browser hardware rates (44.1kHz or 48kHz).
- **What Failed:** The OpenAI / Sherpas Realtime voice model strictly expects 24,000Hz (24kHz) 16-bit mono PCM. Feeding 48kHz audio into the worklet caused the model to hear chipmunk-speed audio, resulting in transcription failures or silence.
- **The Solution:** We ported the standalone `mic-worklet.js` from `examples/voice/public/` to `public/mic-worklet.js` and explicitly configured `new AudioContext({ sampleRate: 24000 })` in `src/lib/voice/useVoiceSession.ts`. Furthermore, we added an automatic fallback using the browser's native Web Speech API (`speechSynthesis`) so the app can narrate stories out-of-the-box even in offline demo environments where team API keys may not be configured.

---

## 3. Gesture Conflicts: Story Tap vs. Hold-to-Ask vs. Term Calibration

- **Hypothesis:** Allow natural vertical and horizontal touch swiping between stories, while allowing users to tap anywhere to pause or advance.
- **What Failed:** Fast tapping to advance stories frequently conflicted with tapping underlined financial terms (e.g., *Roth IRA*, *18% APR*). In addition, holding down the screen to pause conflicted with the "Hold-to-Ask" (Push-to-Ask) voice feature.
- **The Solution:** We separated the interaction zones:
  - **Left 35% of viewport:** Go to previous story.
  - **Right 65% of viewport:** Advance to next story.
  - **Touch & hold (>250ms):** Pauses story progress bar.
  - **Underlined Term Click:** Explicitly calls `e.stopPropagation()` and opens the `CalibrationMicroCard` bottom sheet.
  - **4-Second Inactivity Sensor:** If a user pauses on a card for >4 seconds without touching, the app automatically surfaces the calibration card for that card's key term, solving the "confused client" problem without requiring them to formulate a prompt.

---

## 4. Live Stage Demo Presentation & Asynchronous Couple Sync

- **Hypothesis:** Require two physical smartphones connected over WebSockets to demonstrate the couple alignment feature on stage.
- **What Failed:** During a live hackathon presentation with venue Wi-Fi, tethering two separate physical phones and syncing them live presents high latency and single-point-of-failure risks.
- **The Solution:** We implemented:
  1. **Demo Split-Screen Mode (`SplitScreenToggle.tsx`):** A single toggle on the top right transforms the web app into two side-by-side mobile device mockups on the projector screen (e.g. Timothy on the left, Melanie or Advisor on the right).
  2. **Simulate Partner Turn Button:** The presenter can prioritize as Timothy, and with one click simulate Melanie's known profile preferences to instantly demonstrate the Consensus Screen ("Family Sync") with green agreements and amber tie-breakers.

---

## 5. Tailwind CSS v4 vs. Legacy Configuration

- **Hypothesis:** Use traditional Tailwind v3 configuration files (`tailwind.config.js` with `content: [...]` and `@tailwind base;`).
- **What Failed:** In modern Vite with `@tailwindcss/vite` 4.x, legacy `@tailwind` directives throw build-time syntax errors, and TypeScript flags missing module declarations.
- **The Solution:** Cleanly migrated to the native Tailwind v4 `@import "tailwindcss";` pipeline in `src/index.css` paired with the `@tailwindcss/vite` plugin.


---

## 6. Mobile Vertical Viewports & Voice Engine Bridge

- **Hypothesis:** Place a floating round "Hold to Ask" button centered at the bottom of the screen (`fixed bottom-8` or `absolute bottom-3`), and rely on Vite's default dev server to relay WebSocket voice connections.
- **What Failed:** 
  1. On mobile vertical viewports (iPhone/Android screens ~667–844px), a floating button centered at the bottom covered the footer links, story navigation hints, and the critical "Continue to Consensus & Advisor Prep" button in Story 5. When opened, the upward-expanding bubble obscured charts and text.
  2. In modern mobile browsers (iOS Safari, Android Chrome), calling `speechSynthesis.speak()` inside a delayed callback (`setTimeout`) drops the user gesture activation context, causing silent audio failure. Furthermore, fast taps or quiet microphones captured empty strings, making it seem like "the voice stopped and nothing happened".
- **The Solution:** 
  1. We completely eliminated floating buttons. We engineered a **dedicated flex child Bottom Action Bar (`shrink-0 h-14`)** at the bottom of `StoryContainer` housing `[← Prev]`, `[🎙️ Ask Sherpas]`, and `[Next →]`. The story card above it lives in `flex-1 min-h-0 overflow-y-auto`, making overlap physically impossible on any screen size.
  2. We engineered a slide-up **Voice & Calibration Hub (`VoiceAssistantModal.tsx`)** equipped with live waveform feedback, multilingual term recognition (English & Spanish), 1-tap quick question chips tailored to each household, and an instant text input with Send button. Speech synthesis is invoked synchronously on user actions, ensuring 100% audio and visual feedback even in quiet rooms or without microphone permissions.
