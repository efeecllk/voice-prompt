// Short synthesized cues, so recording state and results are clear while another app is
// in front. Scheduling uses the audio clock, which keeps running while the window is hidden.

type Note = { freq: number; at: number; length: number };

let ctx: AudioContext | null = null;

function play(notes: Note[], wave: OscillatorType = 'sine', volume = 0.18) {
  ctx ??= new AudioContext();
  const now = ctx.currentTime;
  for (const { freq, at, length } of notes) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = wave;
    osc.frequency.value = freq;
    // Quick attack, smooth exponential decay: a soft chime rather than a beep
    gain.gain.setValueAtTime(0.0001, now + at);
    gain.gain.exponentialRampToValueAtTime(volume, now + at + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + at + length);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now + at);
    osc.stop(now + at + length);
  }
}

export const sounds = {
  // Rising: listening
  start: () => play([{ freq: 659, at: 0, length: 0.14 }, { freq: 880, at: 0.09, length: 0.2 }]),
  // Falling: got it
  stop: () => play([{ freq: 880, at: 0, length: 0.14 }, { freq: 659, at: 0.09, length: 0.2 }]),
  // Bright three-note rise: result is on the clipboard
  done: () =>
    play([
      { freq: 1047, at: 0, length: 0.16 },
      { freq: 1319, at: 0.08, length: 0.16 },
      { freq: 1568, at: 0.16, length: 0.3 },
    ]),
  // Low double pulse: something failed
  error: () =>
    play(
      [{ freq: 220, at: 0, length: 0.12 }, { freq: 196, at: 0.15, length: 0.18 }],
      'triangle',
      0.25
    ),
};
