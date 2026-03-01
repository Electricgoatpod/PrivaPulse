/**
 * ZenEngine.js — Tone.js utilities for PrivaPulse
 * - startHealing(): 432Hz sine with breathing volume oscillation
 * - playSuccess(): C-Major 7th chord with shimmer effect
 */

import * as Tone from 'tone';

let healingOsc = null;
let healingGain = null;
let breathingLfo = null;
let healingStarted = false;

/**
 * Ensure audio context is running (call after user gesture).
 */
async function initAudio() {
  if (Tone.context.state !== 'running') {
    await Tone.start();
  }
  return Tone.context.state;
}

/**
 * Start a continuous 432Hz sine wave with slow "breathing" volume oscillation.
 * Safe to call multiple times; only starts once until stopHealing().
 */
export async function startHealing() {
  await initAudio();
  if (healingStarted) return;

  // 432 Hz sine
  healingOsc = new Tone.Oscillator(432, 'sine').start();
  healingGain = new Tone.Gain(0).toDestination();
  healingOsc.connect(healingGain);

  // Slow breathing: LFO modulates gain (scale so peak is ~0.2)
  breathingLfo = new Tone.LFO({
    frequency: 0.25,
    min: 0.08,
    max: 0.22,
  }).start();
  breathingLfo.connect(healingGain.gain);

  healingStarted = true;
}

/**
 * Stop the healing tone and release resources.
 */
export function stopHealing() {
  if (!healingStarted) return;
  try {
    if (breathingLfo) breathingLfo.stop().dispose();
    if (healingOsc) healingOsc.stop().dispose();
    if (healingGain) healingGain.dispose();
  } finally {
    healingOsc = null;
    healingGain = null;
    breathingLfo = null;
    healingStarted = false;
  }
}

/**
 * Play a triumphant C-Major 7th chord with a shimmer effect.
 * C4 E4 G4 B4, with gentle high shimmer (higher harmonics/notes).
 */
export async function playSuccess() {
  await initAudio();

  const reverb = new Tone.Reverb({ decay: 2.5, wet: 0.35 }).toDestination();
  const mainSynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sine' },
    envelope: { attack: 0.05, decay: 0.2, sustain: 0.6, release: 1.2 },
  }).connect(reverb);

  // C Major 7: C4 E4 G4 B4
  const chord = ['C4', 'E4', 'G4', 'B4'];
  const now = Tone.now();
  chord.forEach((note, i) => {
    mainSynth.triggerAttackRelease(note, '2n', now + i * 0.05, 0.5);
  });

  // Shimmer: high notes sprinkled after the chord
  const shimmerSynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sine' },
    envelope: { attack: 0.02, decay: 0.3, sustain: 0.2, release: 0.8 },
  }).connect(reverb);
  const shimmerNotes = ['C5', 'E5', 'G5', 'B5', 'C6'];
  shimmerNotes.forEach((note, i) => {
    Tone.Transport.schedule((t) => {
      shimmerSynth.triggerAttackRelease(note, '8n', t, 0.25);
    }, now + 0.3 + i * 0.12);
  });

  Tone.Transport.scheduleOnce(() => {
    mainSynth.dispose();
    shimmerSynth.dispose();
    reverb.dispose();
  }, now + 3);
}
