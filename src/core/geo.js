import { locations } from "../data/worldIntel.js";

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

export function latLonToCartesian(lat, lon, radius = 1) {
  const phi = toRadians(90 - lat);
  const theta = toRadians(lon + 180);
  return {
    x: -radius * Math.sin(phi) * Math.cos(theta),
    y: radius * Math.cos(phi),
    z: radius * Math.sin(phi) * Math.sin(theta)
  };
}

export function distanceKm(a, b) {
  const earthRadiusKm = 6371;
  const dLat = toRadians(b.lat - a.lat);
  const dLon = toRadians(b.lon - a.lon);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * earthRadiusKm * Math.asin(Math.sqrt(h));
}

export function validCoordinate(location) {
  return Number.isFinite(location.lat) && Number.isFinite(location.lon) && location.lat >= -90 && location.lat <= 90 && location.lon >= -180 && location.lon <= 180;
}

export function nearestLocation(lat, lon, candidates = locations) {
  const target = { lat, lon };
  return [...candidates]
    .filter(validCoordinate)
    .map((location) => ({ location, km: distanceKm(target, location) }))
    .sort((a, b) => a.km - b.km)[0];
}

export function parseCoordinates(query) {
  const text = String(query || "").toLowerCase();
  const latMatch = text.match(/lat(?:itude)?\s*[:=]?\s*(-?\d+(?:\.\d+)?)/);
  const lonMatch = text.match(/(?:lon|lng|longitude)\s*[:=]?\s*(-?\d+(?:\.\d+)?)/);
  if (!latMatch || !lonMatch) return null;
  const lat = Number(latMatch[1]);
  const lon = Number(lonMatch[1]);
  if (!validCoordinate({ lat, lon })) return null;
  return { lat, lon };
}
