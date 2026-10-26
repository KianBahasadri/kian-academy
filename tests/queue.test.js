"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const C = require("../js/curriculum.js");
const FIRST = "feeling-good", SECOND = "why-we-get-mad", THIRD = "why-we-sleep-critical-review", LATER = "motivational-interviewing-4";

function finish(state, id) {
  state = C.update(state, id, "resource", true);
  state = C.update(state, id, "draft", "An explanation in my own words.");
  state = C.update(state, id, "practice");
  state = C.update(state, id, "confidence", "confident");
  return C.update(state, id, "complete");
}

test("multiple queued resources retain their order without duplicates or changing study work", () => {
  const original = C.initialState();
  let state = C.enqueue(original, SECOND);
  state = C.enqueue(state, THIRD);
  state = C.enqueue(state, SECOND);
  assert.deepEqual(state.queueIds, [FIRST, SECOND, THIRD]);
  assert.deepEqual(state.resources, original.resources);
  assert.equal(state.selectedId, original.selectedId);
  assert.deepEqual(original.queueIds, [FIRST]);
  assert.equal(C.upNext(state).id, FIRST);
});

test("removal leaves the resource, drafts, and other queue entries intact", () => {
  let state = C.enqueue(C.initialState(), SECOND);
  state = C.update(state, FIRST, "resource", true);
  state = C.update(state, FIRST, "draft", "Keep this writing after removal.");
  const resources = structuredClone(state.resources);
  state = C.dequeue(state, FIRST);
  assert.deepEqual(state.queueIds, [SECOND]);
  assert.deepEqual(state.resources, resources);
  assert.equal(C.upNext(state).id, SECOND);
  assert.equal(C.upNext(C.dequeue(state, SECOND)), null);
});

test("an explicitly empty queue stays empty after reload and catalog refresh", () => {
  let state = C.dequeue(C.initialState(), FIRST);
  state = C.addCatalogResources(C.readState(JSON.parse(JSON.stringify(state))));
  assert.deepEqual(state.queueIds, []);
  assert.equal(C.upNext(state), null);
  assert.equal(state.resources.length, 7);
});

test("unfinished prerequisites can be queued, and up next skips them until they are ready", () => {
  let state = C.dequeue(C.initialState(), FIRST);
  state = C.enqueue(state, LATER);
  assert.equal(C.upNext(state), null);
  state = C.enqueue(state, FIRST);
  state = C.enqueue(state, THIRD);
  assert.deepEqual(state.queueIds, [LATER, FIRST, THIRD]);
  assert.equal(C.upNext(state).id, FIRST);
  state = finish(state, FIRST);
  assert.deepEqual(state.queueIds, [LATER, THIRD]);
  assert.equal(C.upNext(state).id, LATER);
});

test("completing the current resource advances the queue and preserves its completion", () => {
  let state = C.enqueue(C.initialState(), SECOND);
  state = C.enqueue(state, THIRD);
  state = finish(state, FIRST);
  assert.deepEqual(state.queueIds, [SECOND, THIRD]);
  assert.equal(C.upNext(state).id, SECOND);
  assert.ok(state.resources.find((resource) => resource.id === FIRST).completedAt);
  assert.throws(() => C.enqueue(state, FIRST), /Reopen/);
  assert.throws(() => C.enqueue(state, "missing"), /could not be found/);
});

test("backups retain queue order, including planned resources needing preparation", () => {
  let state = C.dequeue(C.initialState(), FIRST);
  for (const id of [THIRD, LATER, SECOND]) state = C.enqueue(state, id);
  state.resources.reverse();
  assert.deepEqual(C.readState(JSON.parse(JSON.stringify(state))), state);
});

test("older backups carry unfinished study into the queue without queuing the whole catalog", () => {
  const old = C.update(C.update(C.initialState(), SECOND, "start"), THIRD, "start");
  delete old.queueIds;
  const snapshot = structuredClone(old);
  assert.deepEqual(C.readState(old).queueIds, [SECOND, THIRD]);
  assert.deepEqual(old, snapshot);
  const fresh = C.initialState(); delete fresh.queueIds;
  assert.deepEqual(C.readState(fresh).queueIds, [FIRST]);
  const legacy = { version: 1, selectedId: SECOND, modules: old.resources.filter((resource) => [SECOND, THIRD].includes(resource.id)).map((resource) => ({ ...resource, prerequisiteId: null })) };
  assert.deepEqual(C.readState(legacy).queueIds, [SECOND, THIRD]);
});

test("queue restoration drops stale and duplicate entries while rejecting malformed queues", () => {
  const raw = finish(C.initialState(), FIRST);
  raw.queueIds = [SECOND, FIRST, "missing", SECOND, THIRD];
  assert.deepEqual(C.readState(raw).queueIds, [SECOND, THIRD]);
  for (const ids of [null, "not-a-queue", [123]]) {
    assert.throws(() => C.readState({ ...raw, queueIds: ids }), /invalid learning queue/);
  }
});
