import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { AudioTelemetryEngine } from "../src/core/audioTelemetry.js";

describe("AudioTelemetryEngine", () => {
  it("computes band levels correctly from frequency arrays", () => {
    const freqs = new Uint8Array([255, 255, 128, 128, 0, 0, 0, 0, 0, 0]);
    const bands = AudioTelemetryEngine.computeBandLevels(freqs);

    assert.ok(bands.bass > 0);
    assert.ok(bands.bass <= 1);
    assert.ok(bands.mid >= 0);
    assert.ok(bands.treble === 0);
    assert.ok(bands.overall > 0);
  });

  it("handles empty or zero frequency buffers gracefully", () => {
    const bands = AudioTelemetryEngine.computeBandLevels([]);
    assert.deepEqual(bands, { bass: 0, mid: 0, treble: 0, overall: 0 });
  });

  it("generates deterministic synthesized waveform levels", () => {
    const wave1 = AudioTelemetryEngine.generateSynthesizedWaveform(1.0);
    assert.ok(wave1.bass >= 0 && wave1.bass <= 1);
    assert.ok(wave1.mid >= 0 && wave1.mid <= 1);
    assert.ok(wave1.treble >= 0 && wave1.treble <= 1);
    assert.ok(wave1.overall >= 0 && wave1.overall <= 1);

    const wave2 = AudioTelemetryEngine.generateSynthesizedWaveform(2.5);
    assert.notDeepEqual(wave1, wave2);
  });
});
