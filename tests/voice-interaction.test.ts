import test from 'node:test';
import assert from 'node:assert/strict';

test('voice audio: RMS level metering computes accurate amplitudes for visualizer', () => {
  // Test 1: Silent buffer
  const silentFrame = new Int16Array(480);
  let silentSum = 0;
  for (let i = 0; i < silentFrame.length; i++) silentSum += silentFrame[i] * silentFrame[i];
  const silentRms = Math.sqrt(silentSum / silentFrame.length) / 32768;
  const silentLevel = Math.min(1, silentRms * 8);
  assert.equal(silentRms, 0);
  assert.equal(silentLevel, 0);

  // Test 2: Moderate conversational speech level (~0.1 to ~0.3)
  const speechFrame = new Int16Array(480);
  for (let i = 0; i < speechFrame.length; i++) {
    // Generate ~4000 amplitude speech wave
    speechFrame[i] = Math.round(4000 * Math.sin((2 * Math.PI * i) / 30));
  }
  let speechSum = 0;
  for (let i = 0; i < speechFrame.length; i++) speechSum += speechFrame[i] * speechFrame[i];
  const speechRms = Math.sqrt(speechSum / speechFrame.length) / 32768;
  const speechLevel = Math.min(1, speechRms * 8);
  assert.ok(speechRms > 0.05 && speechRms < 0.2, `Expected moderate RMS, got ${speechRms}`);
  assert.ok(speechLevel > 0.4 && speechLevel <= 1.0, `Expected elevated level meter, got ${speechLevel}`);

  // Test 3: Clamped maximum amplitude
  const loudFrame = new Int16Array(480);
  for (let i = 0; i < loudFrame.length; i++) loudFrame[i] = 32767;
  let loudSum = 0;
  for (let i = 0; i < loudFrame.length; i++) loudSum += loudFrame[i] * loudFrame[i];
  const loudRms = Math.sqrt(loudSum / loudFrame.length) / 32768;
  const loudLevel = Math.min(1, loudRms * 8);
  assert.ok(loudRms > 0.99);
  assert.equal(loudLevel, 1);
});

test('voice interaction: tap vs hold duration cleanly disambiguates actions', () => {
  const HOLD_THRESHOLD_MS = 250;

  function evaluatePress(pressDurationMs: number): 'tap' | 'hold' {
    return pressDurationMs < HOLD_THRESHOLD_MS ? 'tap' : 'hold';
  }

  // Quick taps (clicking button)
  assert.equal(evaluatePress(50), 'tap');
  assert.equal(evaluatePress(120), 'tap');
  assert.equal(evaluatePress(240), 'tap');

  // Intentional hold to talk
  assert.equal(evaluatePress(250), 'hold');
  assert.equal(evaluatePress(500), 'hold');
  assert.equal(evaluatePress(2000), 'hold');
});

test('voice lifecycle: pending commit queue handles connecting sockets without false offline abort', () => {
  interface PendingCommit {
    token: number;
    hasAudio: boolean;
  }

  let socketState: 'CONNECTING' | 'OPEN' | 'CLOSED' = 'CONNECTING';
  let pendingCommit: PendingCommit | null = null;
  let voiceState: 'idle' | 'listening' | 'speaking' = 'listening';
  const sentMessages: string[] = [];

  function stopListening(token: number, hasAudio: boolean) {
    if (socketState === 'OPEN') {
      if (hasAudio) {
        sentMessages.push('commit');
        sentMessages.push('response.create');
        voiceState = 'speaking';
      } else {
        voiceState = 'idle';
      }
    } else if (socketState === 'CONNECTING') {
      // Must NOT abort with "offline" notice; queue commit for onopen
      pendingCommit = { token, hasAudio };
      if (hasAudio) {
        voiceState = 'speaking';
      } else {
        voiceState = 'idle';
      }
    } else {
      voiceState = 'idle';
    }
  }

  function onSocketOpen() {
    socketState = 'OPEN';
    if (pendingCommit) {
      const { hasAudio } = pendingCommit;
      pendingCommit = null;
      if (hasAudio) {
        sentMessages.push('commit');
        sentMessages.push('response.create');
        voiceState = 'speaking';
      } else {
        voiceState = 'idle';
      }
    }
  }

  // Simulate user holding to talk while socket is CONNECTING, then releasing
  stopListening(1, true);

  // Verify voice state transitions to speaking (awaiting response) and commit is queued
  assert.equal(voiceState, 'speaking');
  assert.deepEqual(pendingCommit, { token: 1, hasAudio: true });
  assert.equal(sentMessages.length, 0);

  // Simulate socket completing handshake
  onSocketOpen();

  // Verify commit and response.create were immediately dispatched upon open
  assert.equal(pendingCommit, null);
  assert.deepEqual(sentMessages, ['commit', 'response.create']);
  assert.equal(voiceState, 'speaking');
});

test('audio worklet resampler: downsampling preserves 20ms 480-sample 24kHz frame size', () => {
  const inRate = 48000;
  const targetRate = 24000;
  const ratio = inRate / targetRate; // 2
  const frameSize = 480;
  const frame = new Int16Array(frameSize);
  let filled = 0;
  const chunks: Int16Array[] = [];

  // Generate 2 blocks of 48kHz audio (128 samples per block in Web Audio API)
  const inputBlock = new Float32Array(128);
  for (let i = 0; i < inputBlock.length; i++) inputBlock[i] = 0.5;

  let resamplePhase = 0;
  // Process 8 blocks (1024 samples at 48kHz -> 512 samples at 24kHz -> generates 1 frame of 480 + 32 remainder)
  for (let block = 0; block < 8; block++) {
    let i = resamplePhase;
    while (i < inputBlock.length) {
      const idx0 = Math.floor(i);
      const frac = i - idx0;
      const s0 = inputBlock[idx0];
      const s1 = idx0 + 1 < inputBlock.length ? inputBlock[idx0 + 1] : s0;
      const s = Math.max(-1, Math.min(1, s0 + frac * (s1 - s0)));

      frame[filled++] = s < 0 ? s * 0x8000 : s * 0x7fff;
      if (filled === frameSize) {
        chunks.push(new Int16Array(frame));
        filled = 0;
      }
      i += ratio;
    }
    resamplePhase = i - inputBlock.length;
  }

  assert.equal(chunks.length, 1, 'Should have generated exactly one 480-sample chunk');
  assert.equal(chunks[0].length, 480, 'Chunk length must be exactly 480 samples');
  assert.ok(Math.abs(chunks[0][0] - 16384) <= 1);
  assert.equal(filled, 32, 'Remaining 32 samples buffered for next frame');
});

test('voice interaction: PointerEvents capture and release lifecycle', () => {
  interface SimulatedPointerCapture {
    capturedId: number | null;
    isPressing: boolean;
    pressStartTime: number;
    opened: boolean;
    pressEndCalls: number;
    pressStartCalls: number;
  }

  const state: SimulatedPointerCapture = {
    capturedId: null,
    isPressing: false,
    pressStartTime: 0,
    opened: false,
    pressEndCalls: 0,
    pressStartCalls: 0,
  };

  function handlePointerDown(pointerId: number, button: number, pointerType: string, now: number) {
    // Ignore non-primary mouse clicks
    if (button !== 0 && pointerType === 'mouse') return;

    state.capturedId = pointerId;
    state.isPressing = true;
    state.pressStartTime = now;
    state.pressStartCalls++;
  }

  function handlePointerUp(pointerId: number, now: number) {
    if (state.capturedId !== null) {
      state.capturedId = null;
    }
    if (!state.isPressing) return;
    state.isPressing = false;
    state.pressEndCalls++;

    const duration = now - state.pressStartTime;
    if (duration < 250) {
      state.opened = !state.opened;
    } else {
      state.opened = true;
    }
  }

  function handlePointerCancel(_pointerId: number) {
    state.capturedId = null;
    if (state.isPressing) {
      state.isPressing = false;
      state.pressEndCalls++;
    }
  }

  // 1. Right click should be ignored
  handlePointerDown(1, 2, 'mouse', 1000);
  assert.equal(state.isPressing, false);
  assert.equal(state.capturedId, null);

  // 2. Touch down & quick tap (<250ms)
  handlePointerDown(10, 0, 'touch', 1000);
  assert.equal(state.isPressing, true);
  assert.equal(state.capturedId, 10);
  handlePointerUp(10, 1150); // 150ms tap
  assert.equal(state.isPressing, false);
  assert.equal(state.capturedId, null);
  assert.equal(state.opened, true, 'Quick tap toggled modal open');

  // 3. Second quick tap toggles modal closed
  handlePointerDown(10, 0, 'touch', 2000);
  handlePointerUp(10, 2100); // 100ms tap
  assert.equal(state.opened, false, 'Second quick tap toggled modal closed');

  // 4. Intentional hold (>=250ms)
  handlePointerDown(11, 0, 'mouse', 3000);
  assert.equal(state.isPressing, true);
  handlePointerUp(11, 3800); // 800ms hold
  assert.equal(state.isPressing, false);
  assert.equal(state.opened, true, 'Hold left modal open for results');

  // 5. Pointer cancel (e.g. system alert or drag off boundary on non-captured devices)
  handlePointerDown(12, 0, 'touch', 4000);
  assert.equal(state.isPressing, true);
  handlePointerCancel(12);
  assert.equal(state.isPressing, false);
  assert.equal(state.capturedId, null);
});

test('voice visualizer: soundwave bar heights and halo scaling invariants', () => {
  const levels = [0.0, 0.1, 0.25, 0.5, 0.75, 1.0];

  for (const lvl of levels) {
    // Header equalizer bars
    const hBar1 = Math.max(3, Math.min(14, 3 + lvl * 16));
    const hBar2 = Math.max(4, Math.min(14, 4 + lvl * 22));
    const hBar3 = Math.max(3, Math.min(14, 3 + lvl * 14));

    assert.ok(hBar1 >= 3 && hBar1 <= 14, `hBar1 out of range: ${hBar1}`);
    assert.ok(hBar2 >= 4 && hBar2 <= 14, `hBar2 out of range: ${hBar2}`);
    assert.ok(hBar3 >= 3 && hBar3 <= 14, `hBar3 out of range: ${hBar3}`);

    // Button soundwave bars
    const bBar1 = Math.max(3, Math.min(12, 3 + lvl * 14));
    const bBar2 = Math.max(4, Math.min(12, 4 + lvl * 18));
    const bBar3 = Math.max(3, Math.min(12, 3 + lvl * 12));

    assert.ok(bBar1 >= 3 && bBar1 <= 12, `bBar1 out of range: ${bBar1}`);
    assert.ok(bBar2 >= 4 && bBar2 <= 12, `bBar2 out of range: ${bBar2}`);
    assert.ok(bBar3 >= 3 && bBar3 <= 12, `bBar3 out of range: ${bBar3}`);

    // Halo scale and opacity
    const haloScale = 1 + lvl * 0.25;
    const haloOpacity = Math.max(0.4, Math.min(1, 0.4 + lvl * 0.8));

    assert.ok(haloScale >= 1.0 && haloScale <= 1.25, `haloScale out of range: ${haloScale}`);
    assert.ok(haloOpacity >= 0.4 && haloOpacity <= 1.0, `haloOpacity out of range: ${haloOpacity}`);
  }
});

test('voice mic permissions: cleanly handles permission denial without crash', async () => {
  let errorNotice: string | null = null;
  let showSuggestions = false;

  async function mockEnsureMic(allowMic: boolean): Promise<boolean> {
    try {
      if (!allowMic) {
        throw new Error('NotAllowedError: Permission denied');
      }
      return true;
    } catch (err: any) {
      errorNotice = 'Microphone access blocked. Please allow mic in browser settings.';
      showSuggestions = true;
      return false;
    }
  }

  // When mic is denied
  const successDenied = await mockEnsureMic(false);
  assert.equal(successDenied, false);
  assert.equal(errorNotice, 'Microphone access blocked. Please allow mic in browser settings.');
  assert.equal(showSuggestions, true);

  // When mic is allowed
  errorNotice = null;
  showSuggestions = false;
  const successAllowed = await mockEnsureMic(true);
  assert.equal(successAllowed, true);
  assert.equal(errorNotice, null);
  assert.equal(showSuggestions, false);
});

