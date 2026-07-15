import { locations, satellites, startupSignals, topics } from "../data/worldIntel.js";
import { nearestLocation, parseCoordinates } from "./geo.js";

const STOP_WORDS = new Set(["the", "and", "about", "show", "tell", "give", "me", "over", "near", "what", "is", "are", "with", "from", "for", "please"]);

export function normalizeQuery(query) {
  return String(query || "")
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s.-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(query) {
  return normalizeQuery(query)
    .replace(/-/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

export function scoreTokens(tokens, candidateTerms, query = "") {
  const candidateText = normalizeQuery(candidateTerms.join(" ")).replace(/-/g, " ");
  const candidateTokens = new Set(candidateText.split(/\s+/).filter(Boolean));
  let score = tokens.reduce((total, token) => total + (candidateTokens.has(token) ? 1 : 0), 0);
  const normalizedQuery = normalizeQuery(query).replace(/-/g, " ");
  for (const term of candidateTerms) {
    const normalizedTerm = normalizeQuery(term).replace(/-/g, " ");
    if (normalizedTerm.includes(" ") && normalizedQuery.includes(normalizedTerm)) score += 2;
  }
  return score;
}

export function findLocation(query) {
  const normalized = normalizeQuery(query);
  const coordinate = parseCoordinates(query);
  if (coordinate) {
    const nearest = nearestLocation(coordinate.lat, coordinate.lon);
    return {
      ...nearest.location,
      name: `${nearest.location.name} vicinity`,
      lat: coordinate.lat,
      lon: coordinate.lon,
      signal: `Coordinate lock accepted. Nearest indexed node is ${nearest.location.name}, ${Math.round(nearest.km)} km away.`
    };
  }

  const tokens = tokenize(normalized);
  const ranked = locations
    .map((location) => ({
      location,
      score: scoreTokens(tokens, [location.id, location.name, location.country, location.type, ...(location.tags || [])], normalized)
    }))
    .sort((a, b) => b.score - a.score);
  return ranked[0]?.score > 0 ? ranked[0].location : null;
}

export function findTopic(query) {
  const tokens = tokenize(query);
  const ranked = topics
    .map((topic) => ({
      topic,
      score: scoreTokens(tokens, [topic.id, topic.title, ...(topic.keywords || [])], query)
    }))
    .sort((a, b) => b.score - a.score);
  return ranked[0]?.score > 0 ? ranked[0].topic : null;
}

export function selectSatellite(query, candidates = satellites) {
  if (!candidates.length) return null;
  let hash = 2166136261;
  for (const character of normalizeQuery(query)) {
    hash = Math.imul(hash ^ character.codePointAt(0), 16777619);
  }
  return candidates[(hash >>> 0) % candidates.length];
}

function locationAnswer(location, topic) {
  const detailTopic = topic ? ` ${topic.title.toLowerCase()} overlay` : "";
  return {
    title: `${location.name}${detailTopic}`,
    summary: `${location.signal} ${topic ? topic.summary : "I have pulled the indexed regional intelligence packet from the globe."}`,
    confidence: topic ? Math.min(98, Math.round((topic.confidence + 86) / 2)) : 86,
    globeFocus: {
      id: location.id,
      label: location.name,
      lat: location.lat,
      lon: location.lon,
      type: location.type
    },
    sections: [
      {
        heading: "Regional profile",
        body: `${location.name}, ${location.country}. Type: ${location.type}. Population: ${location.population}.`
      },
      ...location.details.map((body, index) => ({
        heading: ["Strategic readout", "Risk model", "Satellite utility"][index] || "Intel note",
        body
      })),
      ...(topic ? topic.sections.slice(0, 2) : [])
    ],
    actions: [
      "Focus globe and lock satellite pointer",
      "Open regional telemetry panel",
      "Recommend live API integrations for production data"
    ],
    mode: topic?.id || "location"
  };
}

function topicAnswer(topic) {
  return {
    title: topic.title,
    summary: topic.summary,
    confidence: topic.confidence,
    globeFocus: null,
    sections: topic.sections,
    actions: [
      "Run global satellite sweep",
      "Cross-link relevant world nodes",
      "Prepare production integration checklist"
    ],
    mode: topic.id
  };
}

function globalScanAnswer(query) {
  const sampled = locations.slice(0, 5).map((location) => `${location.name}: ${location.signal}`).join(" ");
  return {
    title: "Global orbital scan",
    summary: `I did not find a precise indexed target, so I ran a broad global sweep for: "${query || "standby"}".`,
    confidence: 74,
    globeFocus: {
      id: "global",
      label: "Global scan",
      lat: 18,
      lon: 25,
      type: "planetary"
    },
    sections: [
      {
        heading: "Global pulse",
        body: sampled
      },
      {
        heading: "How to sharpen the lock",
        body: "Ask for a city, region, coordinate, or system domain. Examples: Tokyo satellites, Delhi climate risk, London cyber threat, Pacific ocean scan."
      },
      {
        heading: "Assistant capability",
        body: "I can route the command through location intelligence, topic intelligence, or combined target-plus-topic analysis."
      }
    ],
    actions: ["Sweep globe", "Show indexed nodes", "Ask clarifying command"],
    mode: "global"
  };
}

export function answerQuery(query, options = {}) {
  const normalized = normalizeQuery(query);
  const location = findLocation(query);
  const topic = findTopic(normalized);
  const wantsSatellite = /\b(satellite|orbit|scan|track|pointer|iss|landsat|sentinel)\b/i.test(normalized);

  let answer;
  if (location) answer = locationAnswer(location, topic || (wantsSatellite ? topics.find((item) => item.id === "satellite") : null));
  else if (topic) answer = topicAnswer(topic);
  else answer = globalScanAnswer(normalized);

  if (wantsSatellite) {
    const satellite = selectSatellite(normalized);
    answer.sections = [
      {
        heading: "Satellite pointer",
        body: `${satellite.name} simulated lock. Orbit: ${satellite.orbit}. Altitude: ${satellite.altitudeKm} km. Specialty: ${satellite.specialty}.`
      },
      ...answer.sections
    ];
    answer.actions = ["Animate satellite lock", ...answer.actions];
    answer.mode = "satellite";
  }

  if (options.includeBootSignals) {
    answer.sections.push({
      heading: "Boot signals",
      body: startupSignals.join(". ")
    });
  }

  return answer;
}

export function bootAnswer() {
  return {
    title: "JARVIS online",
    summary: "Arc reactor interface stable. Globe telemetry calibrated. Satellite pointer armed. Awaiting command.",
    confidence: 96,
    globeFocus: {
      id: "global",
      label: "Planetary systems",
      lat: 20,
      lon: 30,
      type: "global"
    },
    sections: [
      {
        heading: "Ready systems",
        body: startupSignals.join(". ")
      },
      {
        heading: "Try commands",
        body: "Ask: show Delhi climate risk, track satellite over Tokyo, explain cybersecurity threat level, focus Pacific ocean signals, or explain the arc reactor orb."
      }
    ],
    actions: ["Wake interface", "Start globe rotation", "Stand by"],
    mode: "boot"
  };
}
