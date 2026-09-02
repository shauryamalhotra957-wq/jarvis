import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { SystemTelemetry } from "../src/core/systemTelemetry.js";

describe("SystemTelemetry", () => {
  it("tracks frame counts and calculates FPS", () => {
    const telemetry = new SystemTelemetry();
    telemetry.lastTime = 1000;

    for (let i = 0; i < 30; i++) {
      telemetry.tick(1100 + i * 16);
    }
    const result = telemetry.tick(1600);
    assert.ok(result.fps > 0);
    assert.ok(["OPTIMAL", "DEGRADED", "CRITICAL"].includes(result.status));
  });

  it("returns diagnostic telemetry structure", () => {
    const diagnostics = SystemTelemetry.getDiagnostics();
    assert.equal(diagnostics.coreStatus, "ONLINE");
    assert.equal(diagnostics.protocol, "JARVIS-V1-NEURAL");
    assert.ok(diagnostics.memory.usedMB > 0);
    assert.ok(diagnostics.timestamp);
  });
});
