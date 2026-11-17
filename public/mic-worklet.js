// Runs in the audio thread. Resamples incoming mic audio to 24 kHz if needed,
// and packages it into 20 ms (480-sample) PCM16 frames.
class MicFrames extends AudioWorkletProcessor {
  constructor() {
    super();
    this.targetRate = 24000;
    this.frameSize = 480; // 20 ms at 24 kHz
    this.frame = new Int16Array(this.frameSize);
    this.filled = 0;
    this.resamplePhase = 0;
  }

  process(inputs) {
    const input = inputs[0]?.[0];
    if (!input || input.length === 0) return true;

    const inRate = sampleRate; // global in AudioWorkletGlobalScope

    if (inRate === this.targetRate) {
      for (let i = 0; i < input.length; i++) {
        const s = Math.max(-1, Math.min(1, input[i]));
        this.frame[this.filled++] = s < 0 ? s * 0x8000 : s * 0x7fff;
        if (this.filled === this.frameSize) {
          this.port.postMessage(this.frame.buffer, [this.frame.buffer]);
          this.frame = new Int16Array(this.frameSize);
          this.filled = 0;
        }
      }
      return true;
    }

    // Resample from inRate to 24000 Hz using linear interpolation
    const ratio = inRate / this.targetRate;
    let i = this.resamplePhase;

    while (i < input.length) {
      const idx0 = Math.floor(i);
      const frac = i - idx0;
      const s0 = input[idx0];
      const s1 = idx0 + 1 < input.length ? input[idx0 + 1] : s0;
      const s = Math.max(-1, Math.min(1, s0 + frac * (s1 - s0)));

      this.frame[this.filled++] = s < 0 ? s * 0x8000 : s * 0x7fff;
      if (this.filled === this.frameSize) {
        this.port.postMessage(this.frame.buffer, [this.frame.buffer]);
        this.frame = new Int16Array(this.frameSize);
        this.filled = 0;
      }
      i += ratio;
    }

    this.resamplePhase = i - input.length;
    return true;
  }
}

registerProcessor("mic-frames", MicFrames);
