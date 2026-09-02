/**
 * Audio Reactive Telemetry Module
 * Computes frequency bands (bass, mid, treble) and waveform amplitude for UI reactive visualizers.
 */

export class AudioTelemetryEngine {
  constructor(options = {}) {
    this.fftSize = options.fftSize || 64;
    this.smoothingTimeConstant = options.smoothingTimeConstant || 0.8;
    this.audioContext = null;
    this.analyser = null;
    this.dataArray = new Uint8Array(this.fftSize / 2);
    this.isActive = false;
  }

  static computeBandLevels(frequencies) {
    if (!frequencies || frequencies.length === 0) {
      return { bass: 0, mid: 0, treble: 0, overall: 0 };
    }

    const len = frequencies.length;
    const bassEnd = Math.max(1, Math.floor(len * 0.2));
    const midEnd = Math.max(bassEnd + 1, Math.floor(len * 0.7));

    let bassSum = 0;
    for (let i = 0; i < bassEnd; i++) bassSum += frequencies[i];
    const bass = bassSum / (bassEnd * 255);

    let midSum = 0;
    for (let i = bassEnd; i < midEnd; i++) midSum += frequencies[i];
    const mid = midSum / ((midEnd - bassEnd) * 255);

    let trebleSum = 0;
    for (let i = midEnd; i < len; i++) trebleSum += frequencies[i];
    const treble = trebleSum / ((len - midEnd) * 255);

    let totalSum = 0;
    for (let i = 0; i < len; i++) totalSum += frequencies[i];
    const overall = totalSum / (len * 255);

    return {
      bass: Number(bass.toFixed(3)),
      mid: Number(mid.toFixed(3)),
      treble: Number(treble.toFixed(3)),
      overall: Number(overall.toFixed(3)),
    };
  }

  static generateSynthesizedWaveform(timeSeconds, pulseRate = 1.2) {
    const t = timeSeconds * pulseRate;
    const bass = (Math.sin(t * 2.5) + 1) * 0.4 + (Math.sin(t * 5.0) + 1) * 0.1;
    const mid = (Math.sin(t * 4.0 + 1.2) + 1) * 0.35 + (Math.cos(t * 8.0) + 1) * 0.15;
    const treble = (Math.cos(t * 7.0 + 2.0) + 1) * 0.3 + (Math.sin(t * 12.0) + 1) * 0.2;
    const overall = (bass + mid + treble) / 3;

    return {
      bass: Number(Math.min(1, Math.max(0, bass)).toFixed(3)),
      mid: Number(Math.min(1, Math.max(0, mid)).toFixed(3)),
      treble: Number(Math.min(1, Math.max(0, treble)).toFixed(3)),
      overall: Number(Math.min(1, Math.max(0, overall)).toFixed(3)),
    };
  }
}
