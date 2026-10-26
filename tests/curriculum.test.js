"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const C = require("../js/curriculum.js");
const { buildGraph } = require("../js/resource-map.js");
const ROOT = "feeling-good";
function base() {
  const state = C.initialState();
  state.resources = state.resources.filter((resource) => resource.id === ROOT);
  state.selectedId = ROOT;
  return state;
}
const get = (state, id = state.selectedId) => state.resources.find((resource) => resource.id === id);
function add(state, fields = {}) {
  return C.saveResource(state, { title: "Another resource", url: `https://example.com/${state.resources.length}`, tier: 1, tags: ["cbt"], ...fields });
}
function finish(state, id = state.selectedId, confidence = "needs-work") {
  state = C.update(state, id, "resource", true);
  state = C.update(state, id, "draft", "My own explanation, with a question to revisit.");
  state = C.update(state, id, "practice");
  state = C.update(state, id, "confidence", confidence);
  return C.update(state, id, "complete");
}
function legacy(state) {
  return { version: 1, selectedId: state.selectedId, modules: state.resources.map((resource) => ({ ...resource, unit: "My original unit", prerequisiteId: null })) };
}

test("the requested catalog has five tiers and one unit per resource, with no universal volume quota", () => {
  const state = C.initialState();
  assert.equal(state.version, 2);
  assert.equal(state.resources.length, 6);
  assert.equal(C.TIERS.length, 5);
  assert.equal(C.TIERS[0].name, "Entry point");
  assert.equal(get(state, ROOT).tier, 1);
  assert.equal(get(state, "human-biology").tier, 2);
  assert.equal(C.availability(state, get(state, "human-biology")).kind, "setup");
  for (const resource of state.resources.filter((item) => item.tier === 1)) {
    assert.deepEqual(resource.prerequisiteIds, []);
    assert.deepEqual(resource.volume, []);
    assert.equal(C.availability(state, resource).ready, true);
  }
  assert.deepEqual(C.readState(JSON.parse(JSON.stringify(state))), state);
});

test("completion requires external study, a saved practice response, and self-assessment", () => {
  let state = base(); const snapshot = structuredClone(state);
  assert.throws(() => C.update(state, ROOT, "practice"), /Study the resource/);
  assert.throws(() => C.update(state, ROOT, "complete"), /Finish the study/);
  state = C.update(state, ROOT, "resource", true);
  assert.throws(() => C.update(state, ROOT, "practice"), /Write a response/);
  state = C.update(state, ROOT, "draft", "My work");
  state = C.update(state, ROOT, "practice");
  assert.throws(() => C.update(state, ROOT, "complete"), /self-assessment/);
  assert.equal(C.status(get(state)), "in-progress");
  assert.equal(snapshot.resources[0].started, false);
});

test("completing a unit is independent of confidence and extra work", () => {
  let state = finish(base());
  state = C.update(state, ROOT, "reflection", { field: "extraWork", text: "Record another explanation." });
  assert.equal(C.status(get(state)), "completed");
  assert.equal(C.needsReview(get(state)), true);
  state = C.update(state, ROOT, "confidence", "confident");
  assert.equal(C.needsReview(get(state)), true);
  state = C.update(state, ROOT, "reflection", { field: "extraDone", text: true });
  assert.equal(C.needsReview(get(state)), false);
});

test("an upper tier with no named resource is an incomplete plan, never ready", () => {
  const state = add(base(), { tier: 2 });
  const resource = get(state);
  assert.equal(C.availability(state, resource).kind, "setup");
  assert.equal(C.blocked(state, resource), true);
  assert.throws(() => C.update(state, resource.id, "start"), /prerequisites/);
  assert.throws(() => C.update(state, resource.id, "resource", true), /prerequisites/);
  assert.throws(() => C.update(state, resource.id, "complete"), /prerequisites/);
});

test("all named prerequisites are required and must be from the immediately preceding tier", () => {
  let state = add(base()); const other = state.selectedId;
  state = add(state, { tier: 2, prerequisiteIds: [ROOT, other] }); const id = state.selectedId;
  assert.equal(C.blocked(state, get(state)), true);
  state = finish(state, ROOT);
  assert.equal(C.blocked(state, get(state, id)), true);
  state = finish(state, other);
  assert.equal(C.blocked(state, get(state, id)), false);
  assert.throws(() => add(state, { tier: 3, prerequisiteIds: [ROOT] }), /Tier 2/);
  assert.throws(() => add(state, { tier: 1, prerequisiteIds: [ROOT] }), /Entry points/);
});

test("a five-tier path is valid independently of array order and cannot form a cycle", () => {
  let state = finish(base()); let previous = ROOT;
  for (let tier = 2; tier <= 5; tier++) {
    state = add(state, { tier, prerequisiteIds: [previous] }); previous = state.selectedId;
    state = finish(state);
  }
  state.resources.reverse();
  assert.deepEqual(C.readState(JSON.parse(JSON.stringify(state))), state);
  assert.throws(() => C.saveResource(state, { ...get(state, ROOT), prerequisiteIds: [previous] }, ROOT), /Entry points/);
  assert.throws(() => add(state, { tier: 6 }), /1 to 5/);
});

test("volume rules require completed work at an exact tier matching any specified tag", () => {
  let state = add(base(), { tags: ["cbt", "depression", "counseling"] }); const extra = state.selectedId;
  state = add(state, { tags: ["biology"] }); const unrelated = state.selectedId;
  state = add(state, { tier: 2, prerequisiteIds: [ROOT], volume: [{ tier: 1, count: 2, tags: ["cbt", "depression"] }] }); const id = state.selectedId;
  state = finish(state, ROOT);
  state = finish(state, unrelated);
  let readiness = C.availability(state, get(state, id));
  assert.equal(readiness.specific[0].met, true);
  assert.equal(readiness.volume[0].current, 1);
  assert.equal(readiness.ready, false);
  // Matching several tags still gives a resource one credit.
  state = finish(state, extra);
  readiness = C.availability(state, get(state, id));
  assert.equal(readiness.volume[0].current, 2);
  assert.equal(readiness.ready, true);
});

test("named prerequisites alone do not bypass volume rules, and volume alone does not bypass named ones", () => {
  let state = add(base()); const alternate = state.selectedId;
  state = add(state, { tier: 2, prerequisiteIds: [ROOT], volume: [{ tier: 1, count: 1, tags: ["cbt"] }] }); const id = state.selectedId;
  state = finish(state, alternate);
  assert.equal(C.availability(state, get(state, id)).volume[0].met, true);
  assert.equal(C.availability(state, get(state, id)).ready, false);
  assert.throws(() => C.update(state, id, "complete"), /prerequisites/);
  state = finish(state, ROOT);
  assert.equal(C.availability(state, get(state, id)).ready, true);
});

test("multiple volume rules must each be met and do not count an unrelated tier", () => {
  let state = finish(base());
  state = add(state, { tier: 2, prerequisiteIds: [ROOT], tags: ["counseling"] }); const second = state.selectedId;
  state = finish(state);
  state = add(state, { tier: 3, prerequisiteIds: [second], volume: [
    { tier: 1, count: 2, tags: ["cbt"] }, { tier: 2, count: 1, tags: ["counseling"] }
  ] });
  const availability = C.availability(state, get(state));
  assert.equal(availability.volume[0].current, 1);
  assert.equal(availability.volume[1].current, 1);
  assert.equal(availability.ready, false);
  assert.equal(availability.volume[0].shortfall, 1);
});

test("invalid volume tiers, counts, and empty topic scopes are rejected", () => {
  const state = base();
  for (const volume of [
    [{ tier: 2, count: 1, tags: ["cbt"] }], [{ tier: 0, count: 1, tags: ["cbt"] }],
    [{ tier: 1, count: 0, tags: ["cbt"] }], [{ tier: 1, count: 1.5, tags: ["cbt"] }], [{ tier: 1, count: 1, tags: [] }]
  ]) assert.throws(() => add(state, { tier: 2, prerequisiteIds: [ROOT], volume }), /Volume|volume|count|tag/);
});

test("reopening a volume contributor invalidates downstream completion without a named edge", () => {
  let state = finish(base());
  state = add(state); const contributor = state.selectedId; state = finish(state);
  state = add(state, { tier: 2, prerequisiteIds: [ROOT], volume: [{ tier: 1, count: 2, tags: ["cbt"] }] }); const second = state.selectedId; state = finish(state);
  state = add(state, { tier: 3, prerequisiteIds: [second] }); const third = state.selectedId; state = finish(state);
  const before = structuredClone(state);
  state = C.update(state, contributor, "reopen");
  assert.ok(get(state, ROOT).completedAt);
  assert.equal(get(state, second).completedAt, null);
  assert.equal(get(state, third).completedAt, null);
  assert.equal(C.availability(state, get(state, second)).volume[0].current, 1);
  assert.equal(get(state, third).practice.drafts.essay, get(before, third).practice.drafts.essay);
  assert.ok(get(before, third).completedAt);
});

test("reopening an optional contributor keeps valid completion when another resource fills the count", () => {
  let state = finish(base());
  state = add(state); const first = state.selectedId; state = finish(state);
  state = add(state); state = finish(state);
  state = add(state, { tier: 2, prerequisiteIds: [ROOT], volume: [{ tier: 1, count: 2, tags: ["cbt"] }] }); const id = state.selectedId; state = finish(state);
  state = C.update(state, first, "reopen");
  assert.ok(get(state, id).completedAt);
  assert.equal(C.availability(state, get(state, id)).volume[0].current, 2);
});

test("editing contributor tags updates volume readiness and downstream completion", () => {
  let state = finish(base());
  state = add(state, { tags: ["research methods"] }); const contributor = state.selectedId; state = finish(state);
  state = add(state, { tier: 2, prerequisiteIds: [ROOT], volume: [{ tier: 1, count: 1, tags: ["research methods"] }] }); const id = state.selectedId; state = finish(state);
  state = C.saveResource(state, { ...get(state, contributor), tags: ["biology"] }, contributor);
  assert.ok(get(state, contributor).completedAt);
  assert.equal(get(state, id).completedAt, null);
  assert.equal(C.availability(state, get(state, id)).ready, false);
});

test("tier edits that would break a dependent's named prerequisites fail without mutating the state", () => {
  const state = add(base(), { tier: 2, prerequisiteIds: [ROOT] }); const snapshot = structuredClone(state);
  assert.throws(() => C.saveResource(state, { ...get(state, ROOT), tier: 2 }, ROOT), /Tier 1/);
  assert.deepEqual(state, snapshot);
});

test("source and practice edits preserve saved writing but require the affected work again", () => {
  let state = finish(base());
  state = C.update(state, ROOT, "reflection", { field: "strengths", text: "My notes" });
  state = C.saveResource(state, { ...get(state), url: "https://example.com/revised" }, ROOT);
  assert.equal(get(state).resourceDone, false);
  assert.equal(get(state).practice.done, false);
  assert.equal(get(state).confidence, "unrated");
  assert.equal(get(state).completedAt, null);
  assert.equal(get(state).strengths, "My notes");
  assert.match(get(state).practice.drafts.essay, /explanation/);
});

test("practice formats keep separate drafts and require resaving after edits", () => {
  let state = C.update(base(), ROOT, "resource", true);
  state = C.update(state, ROOT, "draft", "Essay"); state = C.update(state, ROOT, "practice");
  state = C.update(state, ROOT, "format", "video");
  assert.equal(get(state).practice.done, false);
  assert.equal(get(state).practice.drafts.essay, "Essay");
  state = C.update(state, ROOT, "draft", "https://example.com/video"); state = C.update(state, ROOT, "practice");
  state = C.update(state, ROOT, "draft", "Revised video");
  assert.equal(get(state).practice.done, false);
});

test("tags normalize case, whitespace, and duplicates without imposing exclusive topics", () => {
  assert.deepEqual(C.tags(" CBT,  Depression , cbt , Research   methods, "), ["cbt", "depression", "research methods"]);
});

test("backups round-trip requirements, progress, writing, reflection, and arbitrary resource order", () => {
  let state = finish(base());
  state = C.update(state, ROOT, "reflection", { field: "gaps", text: "A question with <markup> & quotations" });
  state = add(state, { tier: 2, prerequisiteIds: [ROOT], volume: [{ tier: 1, count: 2, tags: ["cbt"] }] });
  state.resources.reverse();
  assert.deepEqual(C.readState(JSON.parse(JSON.stringify(state))), state);
});

test("invalid, unsafe, cyclic, and false-completion backups are rejected or corrected", () => {
  const state = base();
  assert.throws(() => C.readState({ version: 3, resources: [] }), /supported/);
  const duplicate = structuredClone(state); duplicate.resources.push(duplicate.resources[0]);
  assert.throws(() => C.readState(duplicate), /duplicate/);
  const unsafe = structuredClone(state); unsafe.resources[0].url = "javascript:alert(1)";
  assert.throws(() => C.readState(unsafe), /http/);
  const cycle = structuredClone(state); cycle.resources[0].prerequisiteIds = [ROOT];
  assert.throws(() => C.readState(cycle), /Entry points/);
  const forged = structuredClone(state); forged.resources[0].completedAt = new Date().toISOString(); forged.resources[0].practice.done = true;
  assert.equal(get(C.readState(forged)).completedAt, null);
  const missing = add(state, { tier: 2, prerequisiteIds: [ROOT] }); get(missing).prerequisiteIds = ["missing"];
  assert.throws(() => C.readState(missing), /could not be found/);
});

test("legacy migration retains exact saved work and completion while adding tier and tag metadata", () => {
  let previous = finish(base());
  previous = C.update(previous, ROOT, "reflection", { field: "gaps", text: "My saved question" });
  const old = legacy(previous); const snapshot = structuredClone(old);
  const state = C.readState(old);
  assert.equal(state.version, 2);
  assert.equal(get(state).completedAt, get(previous).completedAt);
  assert.deepEqual(get(state).practice, get(previous).practice);
  assert.equal(get(state).gaps, "My saved question");
  assert.equal(get(state).legacyCredit, true);
  assert.ok(get(state).tags.includes("my original unit"));
  assert.deepEqual(C.readState(JSON.parse(JSON.stringify(state))), state);
  assert.deepEqual(old, snapshot);
});

test("historical completion of a university resource survives migration and is rechecked after reopening", () => {
  const old = legacy(base()); old.modules[0].id = "human-biology"; old.modules[0].title = "My Sapolsky title";
  old.modules[0].url = C.initialState().resources[0].url;
  old.modules[0].resourceDone = true; old.modules[0].started = true;
  old.modules[0].practice = { format: "essay", drafts: { essay: "My original work", questions: "", video: "" }, done: true };
  old.modules[0].confidence = "confident"; old.modules[0].completedAt = new Date().toISOString(); old.selectedId = "human-biology";
  let state = C.readState(old);
  assert.equal(get(state).title, "My Sapolsky title");
  assert.equal(get(state).tier, 2);
  assert.ok(get(state).completedAt);
  state = C.update(state, "human-biology", "reopen");
  assert.equal(get(state).completedAt, null);
  assert.equal(get(state).legacyCredit, false);
  assert.throws(() => C.update(state, "human-biology", "complete"), /prerequisites/);
  assert.equal(get(state).practice.drafts.essay, "My original work");
});

test("catalog additions are idempotent and keep customized resources and their progress", () => {
  let state = finish(base()); const snapshot = structuredClone(state);
  state = C.addCatalogResources(state);
  assert.equal(state.resources.length, 6);
  assert.deepEqual(get(state, ROOT), get(snapshot, ROOT));
  assert.deepEqual(C.addCatalogResources(state), state);
  state = C.saveResource(state, { ...get(state, ROOT), title: "My own title", url: "https://example.com/my-edition" }, ROOT);
  assert.equal(get(C.addCatalogResources(state), ROOT).title, "My own title");
});

test("a resource already added under another ID is not duplicated and new edges use its existing ID", () => {
  const original = get(C.initialState(), ROOT);
  let state = add({ version: 2, resources: [], selectedId: null }, { ...original, id: undefined, title: "My title" });
  const id = state.selectedId;
  state = C.addCatalogResources(state);
  assert.equal(state.resources.filter((resource) => resource.url === original.url).length, 1);
  assert.equal(get(state, id).title, "My title");
  assert.ok(get(state, "motivational-interviewing-4").prerequisiteIds.includes(id));
  assert.deepEqual(C.readState(JSON.parse(JSON.stringify(state))), state);
});

test("map edges distinguish named requirements, eligible volume candidates, and shared topics", () => {
  const state = C.initialState();
  const graph = buildGraph(state, state.resources, false, false);
  assert.ok(graph.edges.some((edge) => edge.kind === "specific" && edge.from === ROOT && edge.to === "motivational-interviewing-4"));
  assert.ok(graph.edges.some((edge) => edge.kind === "volume" && edge.from === ROOT && edge.to === "great-psychotherapy-debate"));
  assert.equal(graph.edges.some((edge) => edge.kind === "volume" && edge.from === "why-we-get-mad"), false);
  assert.equal(graph.edges.some((edge) => edge.kind === "related"), false);
  assert.ok(buildGraph(state, state.resources, false, true).edges.some((edge) => edge.kind === "related"));
});

test("map filtering can include recursive prerequisite context or strictly show only matching nodes", () => {
  const state = C.initialState(); const debate = get(state, "great-psychotherapy-debate");
  const strict = buildGraph(state, [debate], false);
  assert.equal(strict.nodes.length, 1); assert.equal(strict.edges.length, 0);
  const context = buildGraph(state, [debate], true);
  assert.equal(context.nodes.length, 3);
  assert.equal(context.nodes.filter((node) => node.context).length, 2);
  assert.ok(context.nodes.some((node) => node.resource.id === ROOT));
});

test("migrated completion is retained until a real prerequisite credit is subsequently lost", () => {
  let previous = finish(base());
  previous = add(previous, { tier: 2, prerequisiteIds: [ROOT] }); const child = previous.selectedId; previous = finish(previous);
  const old = legacy(previous); old.modules[1].prerequisiteId = ROOT;
  let state = C.readState(old);
  assert.ok(get(state, child).completedAt);
  state = C.update(state, ROOT, "reopen");
  assert.equal(get(state, child).completedAt, null);
  assert.equal(get(state, child).legacyCredit, false);
  assert.match(get(state, child).practice.drafts.essay, /My own explanation/);
});

test("legacy chains longer than five tiers retain work and expose the unresolved link for planning", () => {
  const root = legacy(finish(base()));
  for (let index = 1; index <= 7; index++) root.modules.push({
    ...structuredClone(root.modules[0]), id: `legacy-${index}`, title: `Legacy resource ${index}`,
    url: `https://example.com/legacy-${index}`, prerequisiteId: index === 1 ? ROOT : `legacy-${index - 1}`
  });
  root.selectedId = "legacy-7";
  const state = C.readState(root);
  assert.equal(state.resources.length, 8);
  assert.equal(get(state).tier, 5);
  assert.ok(get(state).completedAt);
  assert.deepEqual(get(state).prerequisiteIds, []);
  assert.match(get(state).preparationNote, /Choose a Tier 4 prerequisite/);
  assert.match(get(state).practice.drafts.essay, /My own explanation/);
  assert.deepEqual(C.readState(JSON.parse(JSON.stringify(state))), state);
});

test("legacy imports do not grant completion when the original named prerequisite was incomplete", () => {
  let previous = finish(base());
  previous = add(previous, { tier: 2, prerequisiteIds: [ROOT] }); previous = finish(previous);
  const old = legacy(previous); old.modules[1].prerequisiteId = ROOT; old.modules[0].completedAt = null;
  const state = C.readState(old);
  assert.equal(get(state).completedAt, null);
  assert.equal(get(state).legacyCredit, false);
});
