import test from "node:test";
import assert from "node:assert/strict";
import { distanceKm, latLonToCartesian, nearestLocation, parseCoordinates, validCoordinate } from "../src/core/geo.js";
import { locations } from "../src/data/worldIntel.js";

test("all indexed locations have valid coordinates", () => {
  assert.equal(locations.every(validCoordinate), true);
});

test("latLonToCartesian returns a vector on the requested radius", () => {
  const vector = latLonToCartesian(28.6139, 77.209, 2);
  const radius = Math.sqrt(vector.x ** 2 + vector.y ** 2 + vector.z ** 2);
  assert.ok(Math.abs(radius - 2) < 0.000001);
});

test("nearestLocation identifies Delhi from nearby coordinates", () => {
  const nearest = nearestLocation(28.6, 77.2);
  assert.equal(nearest.location.id, "delhi");
  assert.ok(nearest.km < 20);
});

test("parseCoordinates extracts latitude and longitude", () => {
  assert.deepEqual(parseCoordinates("scan lat 40.7 lon -74.0"), { lat: 40.7, lon: -74 });
});

test("parseCoordinates accepts comma-separated and hemisphere formats", () => {
  assert.deepEqual(parseCoordinates("scan 40.7, -74.0"), { lat: 40.7, lon: -74 });
  assert.deepEqual(parseCoordinates("scan 40.7 N, 74.0 W"), { lat: 40.7, lon: -74 });
  assert.deepEqual(parseCoordinates("latitude 33.9 S longitude 151.2 E"), { lat: -33.9, lon: 151.2 });
});

test("parseCoordinates rejects out-of-range coordinates", () => {
  assert.equal(parseCoordinates("scan lat 120 lon -74.0"), null);
  assert.equal(parseCoordinates("scan lat 40.7 lon 240"), null);
  assert.equal(parseCoordinates("scan 120, -74.0"), null);
});

test("distanceKm returns a plausible long-distance value", () => {
  const km = distanceKm({ lat: 51.5072, lon: -0.1276 }, { lat: 40.7128, lon: -74.006 });
  assert.ok(km > 5500 && km < 5700);
});
