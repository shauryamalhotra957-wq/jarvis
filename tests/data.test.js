import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, statSync } from "node:fs";
import { locations, satellites, topics } from "../src/data/worldIntel.js";

test("location ids are unique", () => {
  const ids = locations.map((location) => location.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("topics include rich sections", () => {
  assert.ok(topics.length >= 7);
  assert.equal(topics.every((topic) => topic.sections.length >= 3), true);
});

test("satellites have orbital metadata", () => {
  assert.ok(satellites.length >= 3);
  assert.equal(satellites.every((satellite) => satellite.altitudeKm > 100), true);
});

test("real Earth texture assets are present", () => {
  const assets = [
    "public/assets/earth/world-topo-bathy-5400.jpg",
    "public/assets/earth/earth-night-4096.jpg"
  ];
  for (const asset of assets) {
    assert.equal(existsSync(asset), true, `${asset} should exist`);
    assert.ok(statSync(asset).size > 100_000, `${asset} should not be a placeholder`);
  }
});
