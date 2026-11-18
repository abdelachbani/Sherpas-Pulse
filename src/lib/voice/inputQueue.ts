/** Holds audio captured while the browser's relay connection is opening. */
export function createInputQueue() {
  let frames: string[] = [];
  return {
    append(audio: string) { frames.push(audio); },
    clear() { frames = []; },
    flush(send: (message: { type: 'input_audio_buffer.append'; audio: string }) => void) {
      for (const audio of frames) send({ type: 'input_audio_buffer.append', audio });
      frames = [];
    },
  };
}
