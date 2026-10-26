(function (root) {
  "use strict";

  const FORMATS = ["essay", "questions", "video"];
  const CONFIDENCE = ["unrated", "needs-work", "developing", "confident"];
  const TIERS = [
    { value: 1, name: "Entry point", description: "Made for a general reader. No prior study, no university background, and a manageable scope for independent learning." },
    { value: 2, name: "Foundations", description: "Builds on entry-level familiarity with the topic." },
    { value: 3, name: "Intermediate", description: "Assumes established foundations and broader relevant reading." },
    { value: 4, name: "Advanced", description: "Assumes substantial knowledge of the subject and its methods." },
    { value: 5, name: "Specialist", description: "Written for specialists in a narrow area, beyond general expertise in the wider discipline." }
  ];
  const copy = (value) => structuredClone(value);
  function resourceUrl(value) {
    let url;
    try { url = new URL(value); } catch { throw new Error("Use an http or https link for the external resource."); }
    if (!["https:", "http:"].includes(url.protocol)) throw new Error("Use an http or https link for the external resource.");
    return url.href;
  }
  function tags(value) {
    const values = Array.isArray(value) ? value : String(value || "").split(",");
    return [...new Set(values.map((tag) => String(tag).trim().replace(/\s+/g, " ").toLowerCase()).filter(Boolean))];
  }
  function metadata(fields) {
    const title = String(fields.title || "").trim();
    if (!title) throw new Error("Give the resource a title.");
    const tier = Number(fields.tier);
    if (!Number.isInteger(tier) || tier < 1 || tier > 5) throw new Error("Choose a tier from 1 to 5.");
    const prerequisiteIds = [...new Set(fields.prerequisiteIds || [])];
    const volume = (fields.volume || []).map((rule) => {
      const normalized = { tier: Number(rule.tier), count: Number(rule.count), tags: tags(rule.tags) };
      if (!Number.isInteger(normalized.tier) || normalized.tier < 1 || normalized.tier >= tier) {
        throw new Error("Volume prerequisites must use a lower tier than this resource.");
      }
      if (!Number.isInteger(normalized.count) || normalized.count < 1 || normalized.count > 999) {
        throw new Error("Each volume prerequisite needs a whole-number count from 1 to 999.");
      }
      if (!normalized.tags.length) throw new Error("Give each volume prerequisite at least one relevant tag.");
      return normalized;
    });
    if (tier === 1 && (prerequisiteIds.length || volume.length)) throw new Error("Entry points cannot have prerequisites.");
    return {
      id: fields.id || crypto.randomUUID(), title, author: String(fields.author || "").trim(), url: resourceUrl(fields.url),
      tier, tags: tags(fields.tags), prerequisiteIds, volume,
      tierReason: String(fields.tierReason || "").trim(),
      preparationNote: String(fields.preparationNote || "").trim(),
      focus: String(fields.focus || "").trim()
    };
  }
  function createResource(fields) {
    return {
      ...metadata(fields), started: false, resourceDone: false,
      practice: { format: "essay", drafts: { essay: "", questions: "", video: "" }, done: false },
      confidence: "unrated", strengths: "", gaps: "", extraWork: "", extraDone: false,
      completedAt: null, legacyCredit: false
    };
  }
  // These are editable curriculum judgments, not prerequisites claimed by the publishers.
  const CATALOG = [
    {
      id: "human-biology", title: "Human Behavioral Biology", author: "Robert Sapolsky", tier: 2,
      url: "https://www.youtube.com/playlist?list=PLzxlKUNNLxmEvjCSUAurMReJBZxaLdD1_",
      tags: ["biology", "neuroscience", "psychology", "behavior"],
      tierReason: "A full university lecture series: a larger commitment than an entry point.",
      preparationNote: "Choose a manageable Tier 1 introduction to biology and behavior. The current collection does not yet include one."
    },
    {
      id: "feeling-good", title: "Feeling Good: The New Mood Therapy", author: "David D. Burns", tier: 1,
      url: "https://feelinggood.com/books/", tags: ["psychology", "cbt", "depression", "psychotherapy"],
      tierReason: "Written for independent use by general readers, with practical exercises rather than assumed university training.",
      focus: "Explain one idea about thoughts and mood from the book using your own example. Identify a claim, the evidence Burns gives for it, and a question you still have."
    },
    {
      id: "why-we-get-mad", title: "Why We Get Mad", author: "Ryan Martin", tier: 1,
      url: "https://redwheelweiser.com/book/why-we-get-mad-9781786784452/", tags: ["psychology", "anger", "emotion"],
      tierReason: "An accessible book for general readers about understanding anger.",
      focus: "Explain the account of anger presented by Martin. Connect two ideas from the book to an example and distinguish the author's claims from your own interpretation."
    },
    {
      id: "why-we-sleep-critical-review", title: "Why We Sleep: A Critical Review", author: "Alexey Guzey", tier: 1,
      url: "https://guzey.com/books/why-we-sleep/", tags: ["sleep", "psychology", "research literacy"],
      tierReason: "A standalone article for general readers. Following its cited studies can become extra practice.",
      focus: "Choose one criticism in Guzey's article. Trace the cited evidence, explain the claim and counterclaim in your own words, and note what remains uncertain."
    },
    {
      id: "great-psychotherapy-debate", title: "The Great Psychotherapy Debate", author: "Bruce E. Wampold and Zac E. Imel", tier: 3,
      url: "https://www.routledge.com/The-Great-Psychotherapy-Debate-The-Evidence-for-What-Makes-Psychotherapy/Wampold-Imel/p/book/9780805857092",
      tags: ["psychology", "psychotherapy", "treatment efficacy", "research methods"],
      prerequisiteIds: ["motivational-interviewing-4"],
      volume: [
        { tier: 1, count: 3, tags: ["cbt", "depression", "counseling", "psychotherapy"] },
        { tier: 2, count: 2, tags: ["counseling", "psychotherapy", "treatment efficacy", "research methods"] }
      ],
      tierReason: "A research-focused comparison of explanations for psychotherapy outcomes.",
      preparationNote: "This proposed path combines a counseling foundation with broader reading on therapy and evidence. More relevant entry points and foundations are still needed.",
      focus: "Compare two accounts of psychotherapy outcomes discussed in the book. Explain the supporting evidence, its limitations, and what would change your mind."
    },
    {
      id: "motivational-interviewing-4", title: "Motivational Interviewing: Helping People Change and Grow (4th ed.)", author: "William R. Miller and Stephen Rollnick", tier: 2,
      url: "https://www.guilford.com/books/Motivational-Interviewing/Miller-Rollnick/9781462552795",
      tags: ["psychology", "counseling", "psychotherapy", "motivational interviewing"], prerequisiteIds: ["feeling-good"],
      tierReason: "A practitioner guide and course text, beyond a general-reader entry point.",
      preparationNote: "Feeling Good provides a first perspective on talk therapy before studying another approach. This is a proposed personal learning path, not a publisher requirement.",
      focus: "Explain an idea about conversations around change from the fourth edition. Use your own example, cite the relevant passages, and identify a question to revisit."
    }
  ];
  function initialState() {
    return { version: 2, resources: CATALOG.map(createResource), selectedId: "feeling-good" };
  }
  function addCatalogResources(state) {
    const next = copy(state);
    const ids = new Set(next.resources.map((item) => item.id));
    const urls = new Set(next.resources.map((item) => item.url));
    const mapping = new Map(CATALOG.map((fields) => [fields.id, next.resources.find((item) => item.id === fields.id || item.url === fields.url)?.id || fields.id]));
    for (const fields of CATALOG) {
      if (ids.has(fields.id) || urls.has(fields.url)) continue;
      const resource = createResource({ ...fields, prerequisiteIds: (fields.prerequisiteIds || []).map((id) => mapping.get(id)) });
      // Do not impose a new edge on a customized resource at a different tier.
      resource.prerequisiteIds = resource.prerequisiteIds.filter((id) => {
        const previous = next.resources.find((item) => item.id === id) || CATALOG.find((item) => mapping.get(item.id) === id);
        return previous?.tier === resource.tier - 1;
      });
      next.resources.push(resource); ids.add(resource.id); urls.add(resource.url);
    }
    return next;
  }
  const status = (resource) => resource.completedAt ? "completed" : resource.started ? "in-progress" : "planned";
  const requirements = (resource) => [
    ...(!resource.resourceDone ? ["Study the external resource"] : []),
    ...(!resource.practice.done ? ["Save a practice response"] : []),
    ...(resource.confidence === "unrated" ? ["Assess your understanding"] : [])
  ];
  const needsReview = (resource) => resource.confidence === "needs-work" || Boolean(resource.extraWork.trim() && !resource.extraDone);
  function matchesTags(resource, wanted) { return !wanted.length || resource.tags.some((tag) => wanted.includes(tag)); }
  function volumeMatches(state, resource, rule) {
    return state.resources.filter((item) => item.id !== resource.id && item.tier === rule.tier && matchesTags(item, rule.tags));
  }
  function availability(state, resource) {
    const specific = resource.prerequisiteIds.map((id) => {
      const item = state.resources.find((candidate) => candidate.id === id);
      return { id, resource: item || null, met: Boolean(item?.completedAt), valid: Boolean(item && item.tier === resource.tier - 1) };
    });
    const volume = resource.volume.map((rule) => {
      const candidates = volumeMatches(state, resource, rule);
      const completed = candidates.filter((item) => item.completedAt);
      return { ...rule, candidates, completed, current: completed.length, met: completed.length >= rule.count, shortfall: Math.max(0, rule.count - candidates.length) };
    });
    const configured = resource.tier === 1 || specific.length > 0 && specific.every((item) => item.valid);
    const ready = configured && specific.every((item) => item.met) && volume.every((rule) => rule.met);
    return { ready, configured, specific, volume, kind: !configured ? "setup" : ready ? "ready" : "waiting" };
  }
  const blocked = (state, resource) => !availability(state, resource).ready;
  function validateGraph(state) {
    const byId = new Map(state.resources.map((resource) => [resource.id, resource]));
    for (const resource of state.resources) {
      for (const id of resource.prerequisiteIds) {
        const previous = byId.get(id);
        if (!previous) throw new Error(`The prerequisite for “${resource.title}” could not be found.`);
        if (previous.tier !== resource.tier - 1) throw new Error(`“${resource.title}” needs specific prerequisites from Tier ${resource.tier - 1}. Tier changes must also keep its dependent resources valid.`);
      }
    }
    // Every edge goes up exactly one tier, so cycles cannot form.
  }
  function reconcile(state, previousState = null) {
    // Volume counts can affect resources with no named edge to the changed resource.
    // Re-evaluate in tier order so lost credits propagate through every dependency.
    for (const resource of [...state.resources].sort((a, b) => a.tier - b.tier)) {
      const current = availability(state, resource);
      const previous = previousState?.resources.find((item) => item.id === resource.id);
      const before = previous ? availability(previousState, previous) : null;
      const lostPreparation = before && (
        current.specific.some((item) => !item.met && before.specific.some((old) => old.id === item.id && old.met)) ||
        current.volume.some((rule, index) => !rule.met && before.volume[index]?.current > rule.current)
      );
      if (resource.completedAt && !requirements(resource).length && (current.ready || resource.legacyCredit && !lostPreparation)) continue;
      if (resource.completedAt) { resource.completedAt = null; resource.legacyCredit = false; }
    }
    return state;
  }
  function update(state, id, action, value) {
    const next = copy(state);
    const resource = next.resources.find((item) => item.id === id);
    if (!resource) throw new Error("This resource could not be found.");
    if (blocked(next, resource) && !["reflection", "select", "reopen"].includes(action) && !resource.completedAt) {
      throw new Error("Meet the specific and volume prerequisites before starting this resource.");
    }
    if (resource.completedAt && ["resource", "format", "draft", "practice"].includes(action)) throw new Error("Reopen the resource before changing its completed work.");
    switch (action) {
      case "select": next.selectedId = id; break;
      case "start": resource.started = true; break;
      case "resource": resource.started = true; resource.resourceDone = Boolean(value); if (!value) resource.practice.done = false; break;
      case "format":
        if (!FORMATS.includes(value)) throw new Error("Choose a practice format.");
        if (value !== resource.practice.format) resource.practice.done = false;
        resource.practice.format = value; break;
      case "draft": resource.practice.drafts[resource.practice.format] = String(value); resource.practice.done = false; break;
      case "practice":
        if (!resource.resourceDone) throw new Error("Study the resource before completing the practice.");
        if (!resource.practice.drafts[resource.practice.format].trim()) throw new Error("Write a response or add a link to your work first.");
        resource.started = true; resource.practice.done = true; break;
      case "confidence":
        if (!CONFIDENCE.includes(value)) throw new Error("Choose an assessment.");
        resource.confidence = value; break;
      case "reflection":
        if (!["strengths", "gaps", "extraWork", "extraDone"].includes(value.field)) throw new Error("Unknown reflection field.");
        resource[value.field] = value.field === "extraDone" ? Boolean(value.text) : String(value.text);
        if (value.field === "extraWork") resource.extraDone = false; break;
      case "complete":
        if (!availability(next, resource).ready) throw new Error("Meet the specific and volume prerequisites first.");
        if (requirements(resource).length) throw new Error("Finish the study, practice, and self-assessment steps first.");
        resource.started = true; resource.completedAt = new Date().toISOString(); resource.legacyCredit = false; break;
      case "reopen": resource.completedAt = null; resource.legacyCredit = false; resource.started = true; break;
      default: throw new Error("Unknown learning action.");
    }
    return reconcile(next, state);
  }
  function saveResource(state, fields, editingId = null) {
    const next = copy(state);
    const index = editingId ? next.resources.findIndex((item) => item.id === editingId) : next.resources.length;
    if (index < 0) throw new Error("This resource could not be found.");
    const fresh = createResource({ ...fields, id: editingId || undefined });
    if (editingId) {
      const previous = next.resources[index];
      const sourceChanged = previous.url !== fresh.url;
      const practiceChanged = sourceChanged || previous.focus !== fresh.focus;
      const preparationChanged = previous.tier !== fresh.tier || JSON.stringify(previous.prerequisiteIds) !== JSON.stringify(fresh.prerequisiteIds) || JSON.stringify(previous.volume) !== JSON.stringify(fresh.volume);
      next.resources[index] = { ...previous, ...metadata({ ...fields, id: editingId }) };
      if (sourceChanged) { next.resources[index].resourceDone = false; next.resources[index].confidence = "unrated"; }
      if (practiceChanged) next.resources[index].practice.done = false;
      if (practiceChanged || preparationChanged) { next.resources[index].completedAt = null; next.resources[index].legacyCredit = false; }
    } else next.resources.push(fresh);
    validateGraph(next); next.selectedId = fresh.id;
    return reconcile(next, state);
  }
  function restoreWork(resource, raw) {
    resource.started = Boolean(raw.started); resource.resourceDone = Boolean(raw.resourceDone);
    resource.practice.format = FORMATS.includes(raw.practice?.format) ? raw.practice.format : "essay";
    for (const format of FORMATS) resource.practice.drafts[format] = String(raw.practice?.drafts?.[format] || "");
    resource.practice.done = Boolean(raw.practice?.done && resource.resourceDone && resource.practice.drafts[resource.practice.format].trim());
    resource.confidence = CONFIDENCE.includes(raw.confidence) ? raw.confidence : "unrated";
    for (const field of ["strengths", "gaps", "extraWork"]) resource[field] = String(raw[field] || "");
    resource.extraDone = Boolean(raw.extraDone);
    if (raw.completedAt && Number.isFinite(Date.parse(raw.completedAt)) && !requirements(resource).length) resource.completedAt = raw.completedAt;
    resource.legacyCredit = Boolean(raw.legacyCredit && resource.completedAt);
    if (resource.resourceDone || resource.practice.done || resource.completedAt) resource.started = true;
    return resource;
  }
  function validateIds(items) {
    const seen = new Set();
    for (const item of items) {
      if (!item || typeof item.id !== "string" || !/^[a-zA-Z0-9_-]+$/.test(item.id) || seen.has(item.id)) throw new Error("The backup contains an invalid or duplicate resource.");
      seen.add(item.id);
    }
    return seen;
  }
  function migrateLegacy(raw) {
    const ids = validateIds(raw.modules);
    const tiers = new Map();
    const resources = [];
    for (const item of raw.modules) {
      if (item.prerequisiteId && !tiers.has(item.prerequisiteId)) throw new Error("Legacy prerequisites must refer to earlier modules.");
      const known = CATALOG.find((fields) => fields.id === item.id || fields.url === item.url);
      const inferredTier = item.prerequisiteId ? tiers.get(item.prerequisiteId) + 1 : known?.tier || 1;
      const tier = Math.min(5, inferredTier);
      tiers.set(item.id, tier);
      const resource = restoreWork(createResource({
        ...known, ...item, tier, tags: [...(known?.tags || []), ...(item.unit && item.unit !== "Foundations" ? [item.unit] : [])],
        prerequisiteIds: item.prerequisiteId && inferredTier <= 5 ? [item.prerequisiteId] : [], volume: [],
        preparationNote: inferredTier > 5 ? `The earlier plan followed “${raw.modules.find((previous) => previous.id === item.prerequisiteId).title}”. Choose a Tier 4 prerequisite to fit the five-tier system. Saved work is kept.` : known?.preparationNote || ""
      }), item);
      if (item.prerequisiteId && !resources.find((previous) => previous.id === item.prerequisiteId)?.completedAt) resource.completedAt = null;
      // Credit is historical: this learner completed the old curriculum before the tier rules existed.
      resource.legacyCredit = Boolean(resource.completedAt);
      resources.push(resource);
    }
    const migrated = { version: 2, resources, selectedId: ids.has(raw.selectedId) ? raw.selectedId : resources[0].id };
    // Install proposed paths only where the old curriculum had no named prerequisite.
    const byId = new Map(resources.map((resource) => [resource.id, resource]));
    const catalogIds = new Map(CATALOG.map((fields) => [fields.id, resources.find((resource) => resource.id === fields.id || resource.url === fields.url)?.id || fields.id]));
    for (const resource of resources) {
      const old = raw.modules.find((item) => item.id === resource.id);
      const known = CATALOG.find((fields) => fields.id === resource.id || fields.url === resource.url);
      if (!old.prerequisiteId && known && resource.tier === known.tier) {
        resource.prerequisiteIds = (known.prerequisiteIds || []).map((id) => catalogIds.get(id)).filter((id) => byId.get(id)?.tier === resource.tier - 1);
        resource.volume = copy(known.volume || []);
      }
    }
    validateGraph(migrated);
    return migrated;
  }
  function readState(raw) {
    if (!raw || ![1, 2].includes(raw.version)) throw new Error("This is not a supported learning backup.");
    if (raw.version === 1) {
      if (!Array.isArray(raw.modules) || !raw.modules.length) throw new Error("This is not a supported learning backup.");
      return migrateLegacy(raw);
    }
    if (!Array.isArray(raw.resources) || !raw.resources.length) throw new Error("This is not a supported learning backup.");
    const ids = validateIds(raw.resources);
    const resources = raw.resources.map((item) => restoreWork(createResource(item), item));
    const state = { version: 2, resources, selectedId: ids.has(raw.selectedId) ? raw.selectedId : resources[0].id };
    validateGraph(state);
    return reconcile(state);
  }
  const api = { TIERS, initialState, addCatalogResources, tags, status, requirements, needsReview, matchesTags, volumeMatches, availability, blocked, update, saveResource, readState };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Curriculum = api;
})(globalThis);
