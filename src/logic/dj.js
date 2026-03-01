/**
 * Tone.js DJ logic: play music based on verification result.
 * - Success: upbeat loop (major, forward)
 * - Failure / error: darker loop (minor, slower)
 */

import * as Tone from 'tone';

let successSynth = null;
let failureSynth = null;
let successLoop = null;
let failureLoop = null;

/**
 * Initialize audio context (must be called after user gesture).
 * Safe to call multiple times.
 */
export async function initAudio() {
  if (Tone.context.state !== 'running') {
    await Tone.start();
  }
  return Tone.context.state;
}

/**
 * Play the "success" vibe (verification passed).
 */
export async function playVerificationSuccess() {
  await initAudio();
  if (successLoop) successLoop.stop();
  if (failureLoop) failureLoop.stop();

  const filter = new Tone.Filter(800, 'lowpass').toDestination();
  const reverb = new Tone.Reverb({ decay: 2, wet: 0.3 }).connect(filter);
  successSynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sine' },
    envelope: { attack: 0.1, decay: 0.3, sustain: 0.6, release: 1 },
  }).connect(reverb);

  const progression = ['C4', 'E4', 'G4', 'B4']; // Cmaj7
  successLoop = new Tone.Loop((time) => {
    const note = progression[Math.floor(Math.random() * progression.length)];
    successSynth.triggerAttackRelease(note, '8n', time, 0.6);
  }, '2n').start(0);

  Tone.Transport.start();
  await Tone.Transport.scheduleOnce(() => {
    successLoop.stop();
    successSynth.dispose();
    reverb.dispose();
    filter.dispose();
  }, '+4');
}

/**
 * Play the "failure" vibe (verification failed or error).
 */
export async function playVerificationFailure() {
  await initAudio();
  if (successLoop) successLoop.stop();
  if (failureLoop) failureLoop.stop();

  const filter = new Tone.Filter(400, 'lowpass').toDestination();
  const reverb = new Tone.Reverb({ decay: 3, wet: 0.4 }).connect(filter);
  failureSynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.3, decay: 0.5, sustain: 0.2, release: 1.5 },
  }).connect(reverb);

  const progression = ['Ab3', 'B3', 'Db4', 'Eb4']; // darker
  failureLoop = new Tone.Loop((time) => {
    const note = progression[Math.floor(Math.random() * progression.length)];
    failureSynth.triggerAttackRelease(note, '4n', time, 0.4);
  }, '4n').start(0);

  Tone.Transport.start();
  await Tone.Transport.scheduleOnce(() => {
    failureLoop.stop();
    failureSynth.dispose();
    reverb.dispose();
    filter.dispose();
  }, '+4');
}

/**
 * Stop any currently playing DJ loops.
 */
export function stopAll() {
  if (successLoop) successLoop.stop();
  if (failureLoop) failureLoop.stop();
  Tone.Transport.stop();
}
