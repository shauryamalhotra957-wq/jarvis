/**
 * System Telemetry Module
 * Computes live HUD telemetry metrics: FPS, frame delta time, memory statistics, and health statuses.
 */

export class SystemTelemetry {
  constructor() {
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.fps = 60;
    this.history = [];
    this.maxHistory = 30;
  }

  tick(currentTime = performance.now()) {
    this.frameCount++;
    const deltaMs = currentTime - this.lastTime;

    if (deltaMs >= 500) {
      this.fps = Math.round((this.frameCount * 1000) / deltaMs);
      this.history.push(this.fps);
      if (this.history.length > this.maxHistory) {
        this.history.shift();
      }
      this.frameCount = 0;
      this.lastTime = currentTime;
    }

    return {
      fps: this.fps,
      deltaMs: Math.round(deltaMs),
      status: this.fps >= 45 ? "OPTIMAL" : this.fps >= 25 ? "DEGRADED" : "CRITICAL",
    };
  }

  static getDiagnostics() {
    const memory = typeof performance !== "undefined" && performance.memory
      ? {
          usedMB: Math.round(performance.memory.usedJSHeapSize / (1024 * 1024)),
          totalMB: Math.round(performance.memory.totalJSHeapSize / (1024 * 1024)),
          limitMB: Math.round(performance.memory.jsHeapSizeLimit / (1024 * 1024)),
        }
      : { usedMB: 48, totalMB: 64, limitMB: 512 };

    return {
      coreStatus: "ONLINE",
      protocol: "JARVIS-V1-NEURAL",
      orbitalSync: "LOCKED",
      memory,
      timestamp: new Date().toISOString(),
    };
  }
}
