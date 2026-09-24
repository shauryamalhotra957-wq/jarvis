import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { AudioPeakEnvelopeFollower } from '../src/utils/audio_envelope.js';

describe('AudioPeakEnvelopeFollower Test Suite', () => {
  test('fast attack jumps toward high input', () => {
    const follower = new AudioPeakEnvelopeFollower({ attackFactor: 0.8, decayFactor: 0.1 });
    const res = follower.processSample(1.0);
    assert.ok(res.level >= 0.79);
    assert.ok(res.peak >= 0.79);
  });

  test('decay gradually diminishes signal during silence', () => {
    const follower = new AudioPeakEnvelopeFollower({ attackFactor: 1.0, decayFactor: 0.2 });
    follower.processSample(1.0); // level = 1.0
    const step1 = follower.processSample(0.0);
    assert.strictEqual(step1.level, 0.8);
    const step2 = follower.processSample(0.0);
    assert.strictEqual(step2.level, 0.64);
  });

  test('reset restores initial zero state', () => {
    const follower = new AudioPeakEnvelopeFollower();
    follower.processSample(0.9);
    follower.reset();
    assert.strictEqual(follower.currentLevel, 0.0);
    assert.strictEqual(follower.peakHold, 0.0);
  });
});
