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

function signedCoordinate(value, hemisphere) {
  const coordinate = Number(value);
  if (!hemisphere) return coordinate;
  return Math.abs(coordinate) * (/[sw]/i.test(hemisphere) ? -1 : 1);
}

export function parseCoordinates(query) {
  const text = String(query || "").toLowerCase();
  const latMatch = text.match(/lat(?:itude)?\s*[:=]?\s*([+-]?\d+(?:\.\d+)?)\s*°?\s*([ns])?/);
  const lonMatch = text.match(/(?:lon|lng|longitude)\s*[:=]?\s*([+-]?\d+(?:\.\d+)?)\s*°?\s*([ew])?/);

  let lat;
  let lon;
  if (latMatch && lonMatch) {
    lat = signedCoordinate(latMatch[1], latMatch[2]);
    lon = signedCoordinate(lonMatch[1], lonMatch[2]);
  } else {
    const pair = text.match(/([+-]?\d+(?:\.\d+)?)\s*°?\s*([ns])?\s*[,/]\s*([+-]?\d+(?:\.\d+)?)\s*°?\s*([ew])?/);
    if (!pair) return null;
    lat = signedCoordinate(pair[1], pair[2]);
    lon = signedCoordinate(pair[3], pair[4]);
  }

  if (!validCoordinate({ lat, lon })) return null;
  return { lat, lon };
}
