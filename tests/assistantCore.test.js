import test from "node:test";
import assert from "node:assert/strict";
import { answerQuery, bootAnswer, findLocation, findTopic, normalizeQuery, tokenize } from "../src/core/assistantCore.js";

test("normalizeQuery folds accents without discarding international letters", () => {
  assert.equal(normalizeQuery("São Paulo — météo"), "sao paulo meteo");
  assert.equal(normalizeQuery("東京 satellite"), "東京 satellite");
});

test("tokenize removes conversational filler", () => {
  assert.deepEqual(tokenize("show me satellite over Tokyo please"), ["satellite", "tokyo"]);
});

test("findLocation matches city and region aliases", () => {
  assert.equal(findLocation("scan Delhi air quality").id, "delhi");
  assert.equal(findLocation("focus Pacific ocean climate signals").id, "pacific");
  assert.equal(findLocation("inspect São Paulo").id, "sao-paulo");
});

test("findTopic matches cybersecurity commands", () => {
  assert.equal(findTopic("explain ransomware cybersecurity threat").id, "cybersecurity");
});

test("answerQuery combines location and satellite mode", () => {
  const answer = answerQuery("show me satellite intel over Tokyo");
  assert.equal(answer.mode, "satellite");
  assert.equal(answer.globeFocus.id, "tokyo");
  assert.ok(answer.sections[0].heading.includes("Satellite"));
});

test("answerQuery returns topic-only answers", () => {
  const answer = answerQuery("explain the arc reactor blue orb");
  assert.equal(answer.mode, "arc-reactor");
  assert.ok(answer.title.includes("Arc Reactor"));
});

test("answerQuery falls back to global scan", () => {
  const answer = answerQuery("what are the unknown impossible signals");
  assert.equal(answer.mode, "global");
  assert.ok(answer.globeFocus);
});

test("bootAnswer is high confidence and ready for UI", () => {
  const answer = bootAnswer();
  assert.ok(answer.confidence >= 90);
  assert.ok(answer.sections.length >= 2);
});
