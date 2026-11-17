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
