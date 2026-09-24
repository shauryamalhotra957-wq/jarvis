/**
 * Audio Spectrum Envelope & Peak Decay Follower for Arc Reactor HUD.
 * Tracks transient acoustic attack with customizable exponential release decay.
 */
export class AudioPeakEnvelopeFollower {
  constructor({ attackFactor = 0.8, decayFactor = 0.05 } = {}) {
    this.attackFactor = attackFactor;
    this.decayFactor = decayFactor;
    this.currentLevel = 0.0;
    this.peakHold = 0.0;
  }

  processSample(rms) {
    const input = Math.max(0.0, Math.min(1.0, rms));

    if (input > this.currentLevel) {
      // Fast attack
      this.currentLevel += (input - this.currentLevel) * this.attackFactor;
    } else {
      // Smooth decay
      this.currentLevel -= this.currentLevel * this.decayFactor;
    }

    if (this.currentLevel > this.peakHold) {
      this.peakHold = this.currentLevel;
    } else {
      this.peakHold -= this.peakHold * (this.decayFactor * 0.5);
    }

    return {
      level: Number(this.currentLevel.toFixed(4)),
      peak: Number(this.peakHold.toFixed(4)),
    };
  }

  reset() {
    this.currentLevel = 0.0;
    this.peakHold = 0.0;
  }
}
