"use strict";

(() => {
  const C = window.Curriculum;
  // Retain this key so the existing browser curriculum upgrades in place.
  const STORAGE_KEY = "psych-roadmap-curriculum-v1";
  const STATUS = { planned: "Planned", "in-progress": "In progress", completed: "Completed" };
  const ASSESSMENTS = { "needs-work": "Needs work", developing: "Getting there", confident: "Confident" };
  const FORMATS = { essay: "Essay", questions: "Self-quiz", video: "5-minute video" };
  const STEPS = { learn: "Learn", practice: "Practice", reflect: "Reflect" };
  const $ = (id) => document.getElementById(id);
  const escape = (value) => String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  const icon = (name) => {
    const paths = {
      book: '<path d="M12 6C8 3 4 4 3 5v14c3-1 6-1 9 1m0-14c4-3 8-2 9-1v14c-3-1-6-1-9 1Zm0 0v14"/>',
      play: '<circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4Z"/>',
      pencil: '<path d="m15 5 4 4M4 20l5-1L20 8a2.8 2.8 0 0 0-4-4L5 15Z"/>',
      reflect: '<path d="M21 11a8 8 0 0 1-8 8H7l-4 3V7a4 4 0 0 1 4-4h6a8 8 0 0 1 8 8Z"/><path d="M7 9h10M7 13h6"/>',
      check: '<circle cx="12" cy="12" r="9"/><path d="m7 12 3 3 7-7"/>',
      arrow: '<path d="M6 18 18 6M6 6h12v12"/>',
      home: '<path d="m3 10 9-7 9 7v11h-7v-7h-4v7H3Z"/>',
      progress: '<path d="M4 20V10m8 10V4m8 16v-7"/>',
      lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
      map: '<circle cx="5" cy="6" r="3"/><circle cx="19" cy="5" r="3"/><circle cx="12" cy="19" r="3"/><path d="m8 6 8-1M6 9l4 7m8-8-4 8"/>'
    };
    return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`;
  };
  let state = C.initialState();
  let storageLocked = false;
  let editingId = null;
  let messageTimer;
  let mapCleanup;
  let mapSelectedId = null;
  let interest = "";
  let migrated = false;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const raw = JSON.parse(saved);
      state = C.readState(raw);
      if (raw.version === 1) {
        // Retain the exact pre-migration data as a one-time local recovery copy.
        if (!localStorage.getItem("kian-academy-before-tiers")) localStorage.setItem("kian-academy-before-tiers", saved);
        migrated = true;
      }
    }
    interest = localStorage.getItem("kian-academy-interest") || "";
  } catch { storageLocked = true; }
  const before = state.resources.length;
  state = C.addCatalogResources(state);
  const catalogAdded = state.resources.length > before;

  function route() {
    try {
      const [path, query = ""] = location.hash.slice(1).split("?");
      const [kind = "home", id, step] = path.split("/").map(decodeURIComponent);
      const params = new URLSearchParams(query);
      if (["curriculum", "course", "map"].includes(kind)) return { kind: kind === "course" ? "curriculum" : kind, tag: params.get("tag") || "", tier: params.get("tier") || "", availability: params.get("availability") || "", q: params.get("q") || "", context: params.get("context") !== "0", related: params.get("related") === "1" };
      if (["resource", "module", "unit"].includes(kind)) {
        const resource = state.resources.find((item) => item.id === id) || (kind === "unit" ? state.resources.find((item) => item.tags.includes(id?.toLowerCase())) : null);
        if (resource) return { kind: "resource", id: resource.id, step: [...Object.keys(STEPS), "overview", "complete"].includes(step) ? step : kind === "unit" ? "overview" : resumeStep(resource) };
      }
      if (kind === "progress") return { kind, filter: ["review", "confident", "planned", "completed"].includes(id) ? id : "all" };
    } catch {}
    return { kind: "home" };
  }
  const selected = () => state.resources.find((resource) => resource.id === state.selectedId) || state.resources[0];
  const resourceIcon = (resource) => /(^|\.)(youtube\.com|youtu\.be)$/.test(new URL(resource.url).hostname) ? "play" : "book";
  const resourcePath = (resource, step = resumeStep(resource)) => `#resource/${encodeURIComponent(resource.id)}/${step}`;
  const done = (resource, step) => step === "learn" ? resource.resourceDone : step === "practice" ? resource.practice.done : resource.confidence !== "unrated";
  const locked = (resource) => !resource.completedAt && C.blocked(state, resource);
  const allTags = () => [...new Set(state.resources.flatMap((resource) => resource.tags))].sort((a, b) => a.localeCompare(b));
  const tierName = (tier) => C.TIERS[tier - 1].name;
  function resumeStep(resource) { return resource.completedAt ? "complete" : !resource.resourceDone ? "learn" : !resource.practice.done ? "practice" : "reflect"; }
  function nextResource(resources = state.resources) {
    const available = resources.filter((resource) => !resource.completedAt && !locked(resource));
    return available.find((resource) => resource.started) || available.sort((a, b) => a.tier - b.tier)[0] || null;
  }
  function tierBadge(resource) { return `<span class="tier-badge" data-tier="${resource.tier}"><span>${resource.tier}</span>${tierName(resource.tier)}</span>`; }
  function statusTag(resource) { return `<span class="status-tag" data-status="${C.status(resource)}">${STATUS[C.status(resource)]}</span>`; }
  function availabilityTag(resource) {
    if (resource.completedAt) return '<span class="readiness" data-ready="completed">✓ Completed</span>';
    const availability = C.availability(state, resource);
    return `<span class="readiness" data-ready="${availability.kind}">${availability.ready ? "Ready to learn" : availability.configured ? "Prerequisites to do" : "Needs prerequisite setup"}</span>`;
  }
  function confidenceTag(resource) { return ASSESSMENTS[resource.confidence] ? `<span class="status-tag confidence-${resource.confidence}">Self-assessed: ${ASSESSMENTS[resource.confidence]}</span>` : ""; }
  function tagLinks(resource) { return `<div class="tag-list">${resource.tags.map((tag) => `<a class="topic-tag" href="#curriculum?tag=${encodeURIComponent(tag)}">${escape(tag)}</a>`).join("")}</div>`; }
  function counts(resources = state.resources) {
    const completed = resources.filter((resource) => resource.completedAt).length;
    return { completed, total: resources.length, percent: resources.length ? Math.round(completed / resources.length * 100) : 0 };
  }
  function progressBox(resources, label) {
    const n = counts(resources);
    return `<div class="progress-box"><p class="progress-box-label">${label}<strong>${n.percent}%</strong></p><div class="progress-track" role="progressbar" aria-label="${label}" aria-valuemin="0" aria-valuemax="${n.total || 1}" aria-valuenow="${n.completed}"><div class="progress-fill" style="width:${n.percent}%"></div></div><p class="progress-caption">${n.completed} of ${n.total} resource units completed</p></div>`;
  }
  function breadcrumbs(resource = null) {
    const current = route();
    const label = current.kind === "progress" ? "My progress" : current.kind === "map" ? "Resource map" : "Resources";
    const href = current.kind === "progress" ? "#progress" : current.kind === "map" ? "#map" : "#curriculum";
    return `<nav class="breadcrumbs" aria-label="Breadcrumb"><a href="#home" aria-label="Home">${icon("home")}</a><span aria-hidden="true">›</span><a href="${href}">${label}</a>${resource ? `<span aria-hidden="true">›</span><a href="${resourcePath(resource, "overview")}">${escape(resource.title)}</a>` : ""}</nav>`;
  }
  function persist() {
    try {
      if (storageLocked) throw new Error("Storage unavailable");
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      $("save-status").textContent = "All changes saved in this browser.";
    } catch { $("save-status").textContent = "Changes could not be saved. Download your progress from Learning settings to keep this work."; }
  }
  function message(text) {
    clearTimeout(messageTimer); $("app-message").textContent = text; $("app-message").hidden = false;
    messageTimer = setTimeout(() => { $("app-message").hidden = true; }, 6500);
  }
  function closeMenus() {
    $("course-nav").classList.remove("is-open"); $("contents-toggle").setAttribute("aria-expanded", "false");
    document.querySelectorAll(".site-header details").forEach((menu) => { menu.open = false; });
  }
  function go(path) { closeMenus(); if (location.hash === path) render(true); else location.hash = path; }
  function navigation() {
    const current = route();
    const resource = current.kind === "resource" ? state.resources.find((item) => item.id === current.id) : null;
    const inResources = ["curriculum", "resource"].includes(current.kind);
    const activePath = current.kind === "home" ? "#home" : current.kind === "progress" ? "#progress" : current.kind === "map" ? "#map" : "#curriculum";
    document.querySelectorAll(".primary-nav a, .header-progress").forEach((link) => {
      if (link.getAttribute("href") === activePath) link.setAttribute("aria-current", "page"); else link.removeAttribute("aria-current");
    });
    $("contents-toggle").hidden = !inResources;
    $("course-navigation").innerHTML = `<nav class="sidebar-links" aria-label="Learning pages">${[
      ["#home", "home", "Home"], ["#curriculum", "book", "Resources"], ["#map", "map", "Resource map"], ["#progress", "progress", "My progress"]
    ].map(([path, name, label]) => `<a class="sidebar-link" href="${path}" ${path === activePath ? 'aria-current="page"' : ""}>${icon(name)}${label}</a>`).join("")}</nav>
      ${inResources ? `<p class="sidebar-section-label">RESOURCE UNITS</p><ol class="unit-nav">${[...state.resources].sort((a, b) => a.tier - b.tier).map((item) => `<li><a class="unit-nav-link" href="${resourcePath(item, "overview")}" ${resource?.id === item.id ? 'aria-current="page"' : ""}><small>TIER ${item.tier} · ${tierName(item.tier)}</small><span>${escape(item.title)}</span></a>${resource?.id === item.id ? `<ul class="activity-nav">${Object.entries(STEPS).map(([step, label]) => `<li><a href="${resourcePath(item, step)}" ${current.step === step || current.step === "complete" && step === "reflect" ? 'aria-current="step"' : ""}>${icon(done(item, step) ? "check" : step === "learn" ? resourceIcon(item) : step === "practice" ? "pencil" : "reflect")}${label}</a></li>`).join("")}</ul>` : ""}</li>`).join("")}</ol>` : `<div class="sidebar-note"><p>One resource. One unit.</p><span>Learn elsewhere. Practice here. Build toward what’s next.</span></div>`}`;
  }
  function homeRow(resource, context = "planned") {
    const review = context === "review";
    const availability = C.availability(state, resource);
    const note = review ? resource.gaps.trim() || (!resource.extraDone && resource.extraWork.trim()) || "Self-assessed as needing more work." : !availability.configured ? `Choose a Tier ${resource.tier - 1} prerequisite to complete this plan.` : !availability.ready && !resource.completedAt ? `${availability.specific.filter((item) => !item.met).length} named prerequisite${availability.specific.filter((item) => !item.met).length === 1 ? "" : "s"} and ${availability.volume.filter((rule) => !rule.met).length} volume rule${availability.volume.filter((rule) => !rule.met).length === 1 ? "" : "s"} left.` : resource.author;
    return `<article class="home-module-row"><span class="home-row-icon">${icon(review ? "reflect" : resource.completedAt ? "check" : locked(resource) ? "lock" : resourceIcon(resource))}</span><div><h3><a href="${resourcePath(resource, review ? "reflect" : locked(resource) ? "overview" : resumeStep(resource))}">${escape(resource.title)}</a></h3><p>${escape(note)}</p><div class="module-meta">${tierBadge(resource)}${review ? confidenceTag(resource) : availabilityTag(resource)}</div></div></article>`;
  }
  function homePage() {
    const relevant = interest ? state.resources.filter((resource) => resource.tags.includes(interest)) : state.resources;
    const next = nextResource(relevant);
    const ready = relevant.filter((resource) => !resource.completedAt && !locked(resource) && resource.id !== next?.id);
    const waiting = relevant.filter((resource) => !resource.completedAt && locked(resource));
    const review = relevant.filter(C.needsReview);
    const n = counts(relevant);
    const recent = relevant.filter((resource) => resource.completedAt).sort((a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt)).slice(0, 3);
    const topics = allTags().map((tag) => ({ tag, resources: state.resources.filter((resource) => resource.tags.includes(tag)) })).sort((a, b) => b.resources.length - a.resources.length).slice(0, 8);
    return `<div class="home-heading"><div><p class="eyebrow">Kian Academy</p><h1 tabindex="-1">My learning</h1></div><button class="button button-small" type="button" data-action="plan">+ Add a resource</button></div>
      <div class="interest-bar"><label for="home-interest">I’m exploring</label><select id="home-interest"><option value="">All my interests</option>${allTags().map((tag) => `<option value="${escape(tag)}" ${interest === tag ? "selected" : ""}>${escape(tag)}</option>`).join("")}</select><a href="#map${interest ? `?tag=${encodeURIComponent(interest)}` : ""}">Explore the map →</a></div>
      <div class="home-top-grid"><section class="resume-card" aria-labelledby="resume-title">${next ? `<div class="resume-label"><span class="subject-icon">${icon(resourceIcon(next))}</span><p class="eyebrow">${next.started ? "Continue learning" : "Ready when you are"}</p></div>${tierBadge(next)}<h2 id="resume-title">${escape(next.title)}</h2><p class="resume-meta">${escape(next.author)}</p>${tagLinks(next)}<nav class="home-steps" aria-label="Resource activities">${Object.entries(STEPS).map(([step, label], index) => `<a href="${resourcePath(next, step)}" class="${done(next, step) ? "done" : resumeStep(next) === step ? "current" : ""}"><span aria-label="${done(next, step) ? "Done" : `Step ${index + 1}`}">${done(next, step) ? "✓" : index + 1}</span>${label}</a>`).join("")}</nav><div class="resume-actions"><a class="button button-primary" id="home-resume" href="${resourcePath(next)}">${next.started ? "Continue learning" : "Start this unit"}</a><a href="${resourcePath(next, "overview")}">View resource →</a></div>` : `<span class="subject-icon">${icon(n.completed === n.total && n.total ? "check" : "map")}</span><h2 id="resume-title">${n.completed === n.total && n.total ? "Your current resources are complete" : waiting.length ? "Build toward your next resource" : "Choose your next resource"}</h2><p class="resume-meta">${waiting.length ? "Your planned resources need more preparation. Open one below to see the specific reading and topic counts it needs." : "Add a resource to keep building your learning path."}</p><div class="resume-actions"><a class="button button-primary" href="#curriculum${interest ? `?tag=${encodeURIComponent(interest)}` : ""}">Explore resources</a><button class="text-button" type="button" data-action="plan">Add a resource</button></div>`}</section>
      <section class="home-summary" aria-label="Learning progress">${progressBox(relevant, interest ? "Progress in this interest" : "Overall progress")}<dl class="learning-totals"><div><dt>Completed</dt><dd>${n.completed}</dd></div><div><dt>Ready</dt><dd>${ready.length + (next ? 1 : 0)}</dd></div><div><dt>Preparing</dt><dd>${waiting.length}</dd></div></dl><div class="home-assessments"><span>Your own assessment</span><a href="#progress/confident">${relevant.filter((resource) => resource.confidence === "confident").length} confident</a><a href="#progress/review">${review.length} to revisit</a></div></section></div>
      <div class="home-bottom-grid"><section class="home-section"><div class="section-heading"><h2>Also ready <span class="section-count">${ready.length}</span></h2><a href="#curriculum?availability=ready${interest ? `&tag=${encodeURIComponent(interest)}` : ""}">View all →</a></div><div class="home-list">${ready.map((resource) => homeRow(resource)).join("") || '<p class="home-empty">No other resources are ready in this view yet.</p>'}</div></section><section class="home-section"><div class="section-heading"><h2>To revisit <span class="section-count">${review.length}</span></h2><a href="#progress/review">View all →</a></div><div class="home-list">${review.slice(0, 3).map((resource) => homeRow(resource, "review")).join("") || '<p class="home-empty">Resources you mark Needs work, or give extra practice, will appear here.</p>'}</div></section></div>
      ${waiting.length ? `<section class="home-section"><div class="section-heading"><h2>Build toward <span class="section-count">${waiting.length}</span></h2><a href="#map${interest ? `?tag=${encodeURIComponent(interest)}` : ""}">See connections →</a></div><div class="home-list">${waiting.map((resource) => homeRow(resource)).join("")}</div></section>` : ""}
      <section class="home-section"><div class="section-heading"><h2>Where do you want to go?</h2><a href="#curriculum">All resources →</a></div><div class="topic-paths">${topics.map(({ tag, resources }) => `<a href="#curriculum?tag=${encodeURIComponent(tag)}"><strong>${escape(tag)}</strong><span>${resources.length} resources · ${resources.filter((resource) => !resource.completedAt && !locked(resource)).length} ready</span></a>`).join("")}</div><p class="helper-text topic-note">Topics overlap. A resource can take you in more than one direction.</p></section>
      ${recent.length ? `<section class="home-section"><div class="section-heading"><h2>Recently completed</h2><a href="#progress/completed">View all →</a></div><div class="home-list">${recent.map((resource) => homeRow(resource, "completed")).join("")}</div></section>` : ""}`;
  }
  function filters(current, map = false) {
    return `<form class="resource-filters" id="resource-filters" aria-label="Filter resources"><label class="field filter-search">Search<input name="q" id="resource-search" type="search" value="${escape(current.q)}" placeholder="Title, creator, or topic"></label><label class="field">Topic<select name="tag" id="filter-tag"><option value="">All topics</option>${allTags().map((tag) => `<option value="${escape(tag)}" ${tag === current.tag ? "selected" : ""}>${escape(tag)}</option>`).join("")}</select></label><label class="field">Tier<select name="tier" id="filter-tier"><option value="">All tiers</option>${C.TIERS.map((tier) => `<option value="${tier.value}" ${String(tier.value) === current.tier ? "selected" : ""}>${tier.value} · ${tier.name}</option>`).join("")}</select></label><label class="field">Readiness<select name="availability" id="filter-availability">${Object.entries({ "": "All resources", ready: "Ready to learn", waiting: "Prerequisites to do", setup: "Needs setup", completed: "Completed" }).map(([value, label]) => `<option value="${value}" ${value === current.availability ? "selected" : ""}>${label}</option>`).join("")}</select></label><button class="text-button filter-reset" type="button" data-action="reset-filters">Reset</button>${map ? `<div class="map-options"><label class="checkbox-field"><input name="context" type="checkbox" ${current.context ? "checked" : ""}> Include prerequisite context</label><label class="checkbox-field"><input name="related" type="checkbox" ${current.related ? "checked" : ""}> Show shared topics</label></div>` : ""}</form>`;
  }
  function filteredResources(current) {
    return state.resources.filter((resource) => (!current.tag || resource.tags.includes(current.tag)) && (!current.tier || resource.tier === Number(current.tier)) && (!current.q || `${resource.title} ${resource.author} ${resource.tags.join(" ")}`.toLowerCase().includes(current.q.toLowerCase())) && (!current.availability || (current.availability === "completed" ? resource.completedAt : !resource.completedAt && C.availability(state, resource).kind === current.availability))).sort((a, b) => a.tier - b.tier);
  }
  function resourceCard(resource) {
    const activityCount = Object.keys(STEPS).filter((step) => done(resource, step)).length;
    return `<section class="unit-card resource-card" aria-labelledby="card-${escape(resource.id)}"><div class="unit-card-heading"><div class="unit-heading-main"><span class="subject-icon">${icon(locked(resource) ? "lock" : resourceIcon(resource))}</span><div>${tierBadge(resource)}<h3 id="card-${escape(resource.id)}"><a href="${resourcePath(resource, "overview")}">${escape(resource.title)}</a></h3><p class="unit-card-meta">${escape(resource.author)}<span aria-hidden="true">·</span>${activityCount} of 3 activities done</p></div></div><a class="button button-small ${locked(resource) ? "" : "button-primary"}" href="${resourcePath(resource, locked(resource) ? "overview" : resumeStep(resource))}">${resource.completedAt ? "Review unit" : locked(resource) ? "See prerequisites" : resource.started ? "Continue unit" : "Start unit"}</a></div><div class="resource-card-body">${tagLinks(resource)}<div class="resource-card-readiness">${availabilityTag(resource)}${statusTag(resource)}${confidenceTag(resource)}</div></div><nav class="card-activities" aria-label="${escape(resource.title)} activities">${Object.entries(STEPS).map(([step, label]) => `<a href="${resourcePath(resource, step)}" class="${done(resource, step) ? "done" : ""}">${icon(done(resource, step) ? "check" : step === "learn" ? resourceIcon(resource) : step === "practice" ? "pencil" : "reflect")}${label}${done(resource, step) ? '<span class="sr-only"> completed</span>' : ""}</a>`).join("")}</nav></section>`;
  }
  function tierGuide() {
    return `<details class="tier-guide"><summary>How the five tiers work</summary><p>Tier describes the audience and assumed knowledge, not a score or a required number of resources.</p><ol>${C.TIERS.map((tier) => `<li><strong>Tier ${tier.value} · ${tier.name}</strong><span>${tier.description}</span></li>`).join("")}</ol><p>Above Tier 1, each resource needs named prerequisites from the tier immediately below. Any volume rules are chosen for that resource and its topics.</p></details>`;
  }
  function curriculumPage(current) {
    const resources = filteredResources(current);
    const next = nextResource(resources);
    return `${breadcrumbs()}<section class="course-hero"><div><p class="eyebrow">Your academy</p><h1 tabindex="-1">Resources</h1><p class="course-meta">Every resource is its own unit. Learn, practice, reflect.</p><div class="hero-actions">${next ? `<a class="button button-primary" href="${resourcePath(next)}">${next.started ? "Continue learning" : "Start learning"}</a>` : ""}<button class="button" data-action="plan" type="button">+ Add a resource</button><a class="button" href="#map">Explore map</a></div></div>${progressBox(state.resources, "Overall progress")}</section>${filters(current)}${tierGuide()}<div class="section-heading"><h2>${current.tag ? escape(current.tag) : "Your resource units"}</h2><span>${resources.length} of ${state.resources.length} resources</span></div>${resources.map(resourceCard).join("") || '<div class="empty-state"><p>No resources match these filters.</p><button class="text-button" data-action="reset-filters" type="button">Reset filters</button></div>'}`;
  }
  function prerequisitePanel(resource, compact = false) {
    const availability = C.availability(state, resource);
    if (resource.tier === 1) return `<section class="prerequisite-panel entry-prerequisites"><div class="section-heading"><h2>Start here</h2>${availabilityTag(resource)}</div><p>No prerequisites. This is an entry point for independent learning.</p>${resource.tierReason ? `<p class="helper-text">${escape(resource.tierReason)}</p>` : ""}</section>`;
    return `<section class="prerequisite-panel ${compact ? "compact-prerequisites" : ""}" aria-label="Preparation for this resource"><div class="section-heading"><h2>Before this resource</h2>${availabilityTag(resource)}</div>${resource.legacyCredit && resource.completedAt ? '<p class="helper-text legacy-note">Your earlier completion is kept. These preparation rules apply if you reopen this unit.</p>' : ""}<h3>Specific prerequisites <span>Tier ${resource.tier - 1}</span></h3>${availability.specific.length ? `<ul class="specific-list">${availability.specific.map((item) => `<li><span class="requirement-marker ${item.met ? "met" : ""}" aria-label="${item.met ? "Completed" : "Incomplete"}">${item.met ? "✓" : "○"}</span><div><a href="${resourcePath(item.resource, "overview")}">${escape(item.resource.title)}</a><small>Tier ${item.resource.tier} · ${tierName(item.resource.tier)}</small></div></li>`).join("")}</ul>` : `<p class="setup-note">This plan needs a suitable Tier ${resource.tier - 1} resource. Choose one in Edit resource, or add it to your collection first.</p>`}${availability.volume.length ? `<h3>Volume prerequisites</h3><p class="helper-text">Completed resources matching any listed topic. Each resource counts once per rule, including named prerequisites.</p><div class="volume-requirements">${availability.volume.map((rule) => `<div class="volume-requirement ${rule.met ? "met" : ""}"><div><strong>${rule.current} / ${rule.count}</strong><span>Tier ${rule.tier} · ${tierName(rule.tier)}</span><span class="requirement-marker" aria-label="${rule.met ? "Met" : "Not met"}">${rule.met ? "✓" : "○"}</span></div><p>Any of: ${rule.tags.map(escape).join(", ")}</p>${!compact ? `<details><summary>${rule.candidates.length} matching resource${rule.candidates.length === 1 ? "" : "s"} in your collection</summary>${rule.candidates.length ? `<ul>${rule.candidates.map((item) => `<li><span>${item.completedAt ? "✓" : "○"}</span> <a href="${resourcePath(item, "overview")}">${escape(item.title)}</a></li>`).join("")}</ul>` : '<p class="helper-text">No matching resources yet.</p>'}${rule.shortfall ? `<p class="helper-text">Find at least ${rule.shortfall} more matching resource${rule.shortfall === 1 ? "" : "s"} to make this plan possible.</p>` : ""}</details>` : ""}</div>`).join("")}</div>` : '<p class="helper-text volume-none">No additional volume prerequisites for this resource.</p>'}${resource.preparationNote ? `<p class="preparation-note">${escape(resource.preparationNote)}</p>` : ""}</section>`;
  }
  function activityTabs(resource, currentStep) {
    return Object.entries(STEPS).map(([step, label]) => `<a href="${resourcePath(resource, step)}" data-step="${step}" ${currentStep === step || currentStep === "complete" && step === "reflect" ? 'aria-current="step"' : ""}>${icon(done(resource, step) ? "check" : step === "learn" ? resourceIcon(resource) : step === "practice" ? "pencil" : "reflect")}${label}</a>`).join("");
  }
  function overviewPage(resource) {
    const activityCount = Object.keys(STEPS).filter((step) => done(resource, step)).length;
    return `<div class="resource-overview-meta">${tagLinks(resource)}<p>${escape(resource.author)}</p>${resource.tierReason ? `<p class="helper-text">${escape(resource.tierReason)}</p>` : ""}</div>${prerequisitePanel(resource)}<section class="lesson-block" aria-label="Resource activities"><div class="lesson-block-header"><div class="section-heading"><h2>Your activities</h2><span>${activityCount} of 3 done</span></div><p class="helper-text">Study the external material, do your own practice, and assess your understanding.</p></div>${Object.entries(STEPS).map(([step, label]) => `<a class="activity-row ${done(resource, step) ? "done" : ""}" href="${resourcePath(resource, step)}">${icon(done(resource, step) ? "check" : step === "learn" ? resourceIcon(resource) : step === "practice" ? "pencil" : "reflect")}<span class="activity-row-label">${label}<small>${step === "learn" ? "Open the original external resource" : step === "practice" ? "An essay, self-quiz, or five-minute video" : "Record strengths, questions, and extra work"}</small></span><span class="activity-row-state">${done(resource, step) ? "Done" : locked(resource) ? "Preview" : "Start →"}</span></a>`).join("")}</section><p class="map-resource-link"><a href="#map?focus=${encodeURIComponent(resource.id)}">See this resource on the map →</a></p>`;
  }
  function studyPage(resource) {
    const host = new URL(resource.url).hostname.replace(/^www\./, "");
    return `<div class="resource-stage"><span class="play-circle">${icon(resourceIcon(resource))}</span><p>${host === "youtube.com" || host === "youtu.be" ? "YouTube lectures" : escape(host)}</p><h2>${escape(resource.title)}</h2>${resource.author ? `<p>${escape(resource.author)}</p>` : ""}<a class="button button-primary" data-action="open-resource" href="${escape(resource.url)}" target="_blank" rel="noopener noreferrer">${locked(resource) ? "Preview external resource" : "Open external resource"} ${icon("arrow")}</a></div><p class="activity-instruction">${locked(resource) ? "You can preview the source. Meet the prerequisites before starting this unit or recording activities." : "Study the linked material, then return here to continue."}</p><div class="activity-footer"><p>${resource.resourceDone ? "✓ Resource marked as studied." : "When you have finished studying, mark this activity done and move on to practice."}</p><button class="button button-primary" type="button" data-action="study-next" ${locked(resource) ? "disabled" : ""}>${resource.resourceDone ? "Continue to practice" : "Mark studied and continue"}</button></div>`;
  }
  function assignment(resource) {
    const title = `<strong>${escape(resource.title)}</strong>`;
    if (resource.practice.format === "questions") return `<ol><li>What main ideas did you take from ${title}?</li><li>Explain one idea in your own words, using an example of your own.</li><li>How does it connect to something else you have studied?</li><li>What are you still unsure about, and where will you look next?</li></ol>`;
    if (resource.practice.format === "video") return `Record a five-minute video summarizing ${title}. Explain the ideas in your own words, connect them to something else you have studied, and finish with a question you still need to clarify.`;
    return `Write a short essay about two ideas you took from ${title}. Explain how they relate, include an example of your own, cite the resource, and identify a question you still have.`;
  }
  function practicePage(resource) {
    const disabled = locked(resource) || Boolean(resource.completedAt) || !resource.resourceDone;
    return `${!resource.resourceDone && !locked(resource) ? `<p class="dependency-note"><a href="${resourcePath(resource, "learn")}">Study the external resource</a> first, then return here for practice.</p>` : ""}<fieldset ${disabled ? "disabled" : ""} aria-label="Practice assignment"><div class="practice-format" role="group" aria-label="Choose your homework format">${Object.entries(FORMATS).map(([format, label]) => `<button id="format-${format}" type="button" data-format="${format}" aria-pressed="${resource.practice.format === format}">${label}</button>`).join("")}</div><div class="assignment">${assignment(resource)}${resource.focus ? `<p class="focus-note"><strong>Your focus:</strong> ${escape(resource.focus)}</p>` : ""}</div><label class="field">Your response or a link to your work<textarea id="practice-response" rows="8" placeholder="Write here, or link to your essay, recording, or notes.">${escape(resource.practice.drafts[resource.practice.format])}</textarea></label><p class="helper-text" id="draft-status" role="status">${resource.practice.done ? "✓ Practice saved." : "Choose one format to complete this activity."}</p></fieldset><div class="activity-footer"><a href="${resourcePath(resource, "learn")}">← Back to learning</a>${resource.completedAt ? `<a class="button button-primary" href="${resourcePath(resource, "reflect")}">View reflection</a>` : `<button class="button button-primary" type="button" data-action="save-practice" ${disabled ? "disabled" : ""}>Save practice and continue</button>`}</div>`;
  }
  function completionHint(resource) {
    if (locked(resource)) return "Complete the specific and volume prerequisites first.";
    const remaining = C.requirements(resource);
    return remaining.length ? `Still to do: ${remaining.map(escape).join(" · ")}.` : "Your study, practice, and self-assessment are recorded.";
  }
  function reflectionPage(resource) {
    return `<h2 class="assessment-heading">How well do you understand this material?</h2><p class="helper-text">Your own assessment. Finishing a resource and feeling confident are tracked separately.</p><fieldset ${locked(resource) ? "disabled" : ""} aria-label="Assess your understanding"><div class="assessment-options">${Object.entries(ASSESSMENTS).map(([value, label]) => `<button id="confidence-${value}" type="button" data-confidence="${value}" aria-pressed="${resource.confidence === value}">${label}</button>`).join("")}</div></fieldset><div class="field-pair"><label class="field">What feels solid?<textarea id="strengths" data-reflection="strengths" rows="4" placeholder="Ideas you can explain or apply.">${escape(resource.strengths)}</textarea></label><label class="field">What needs work?<textarea id="gaps" data-reflection="gaps" rows="4" placeholder="Specific questions or weak areas.">${escape(resource.gaps)}</textarea></label></div><details class="extra-practice" ${resource.extraWork.trim() ? "open" : ""}><summary>Extra work to revisit</summary><label class="field">Plan extra practice<textarea id="extraWork" data-reflection="extraWork" rows="3" placeholder="A lecture to rewatch, an extra essay, or another resource to find.">${escape(resource.extraWork)}</textarea></label><label class="checkbox-field" id="extra-work-checkbox" ${resource.extraWork.trim() ? "" : "hidden"}><input id="extra-done" type="checkbox" ${resource.extraDone ? "checked" : ""}> Extra work complete</label></details><div class="activity-footer">${resource.completedAt ? `<p>✓ This resource is complete. You can keep updating your reflection.</p><a class="button button-primary" href="${resourcePath(resource, "complete")}">Continue</a>` : `<p id="completion-hint">${completionHint(resource)}</p><button class="button button-primary" id="complete-resource" type="button" data-action="complete" ${locked(resource) || C.requirements(resource).length ? "disabled" : ""}>Complete resource</button>`}</div>`;
  }
  function completedPage(resource) {
    if (!resource.completedAt) return `<p class="dependency-note">This resource unit is not complete yet.</p><a class="button button-primary" href="${resourcePath(resource)}">Continue unit</a>`;
    const unlocked = state.resources.filter((item) => item.prerequisiteIds.includes(resource.id) && !item.completedAt);
    const next = nextResource();
    return `<div class="completed-panel"><span class="completed-check" aria-hidden="true">✓</span><h2>Resource unit complete</h2><p>${escape(resource.title)}</p><p>${confidenceTag(resource)}</p>${C.needsReview(resource) ? `<div class="completed-followup"><h3>Keep on your review list</h3>${resource.gaps ? `<p>${escape(resource.gaps)}</p>` : ""}${resource.extraWork.trim() && !resource.extraDone ? `<p><strong>Extra work:</strong> ${escape(resource.extraWork)}</p>` : ""}<p><a href="${resourcePath(resource, "reflect")}">Update your reflection →</a></p></div>` : ""}${next ? `<a class="button button-primary" href="${resourcePath(next)}">Next: ${escape(next.title)}</a>` : '<a class="button button-primary" href="#curriculum">Plan what comes next</a>'}<p><a href="#curriculum">Back to resources</a></p></div>${unlocked.length ? `<section class="home-section"><div class="section-heading"><h2>This helps you build toward</h2></div><div class="home-list">${unlocked.map((item) => homeRow(item)).join("")}</div></section>` : ""}<div class="activity-footer"><button class="text-button" type="button" data-action="reopen">Reopen unit</button><a href="${resourcePath(resource, "learn")}">Review the resource →</a></div>`;
  }
  function resourcePage(resource, step) {
    const heading = ["learn", "overview"].includes(step) ? resource.title : step === "practice" ? "Practice" : step === "reflect" ? "Reflect on your learning" : "Your progress";
    return `${breadcrumbs(resource)}<div class="activity-topline"><div class="module-meta" id="resource-meta">${tierBadge(resource)}${statusTag(resource)}</div><button class="text-button" type="button" data-action="edit">Edit resource</button></div><h1 class="activity-heading" tabindex="-1">${escape(heading)}</h1>${step === "overview" ? overviewPage(resource) : `<p class="resource-context"><a href="${resourcePath(resource, "overview")}">${escape(resource.title)} · View unit</a></p><nav class="activity-subnav" id="activity-tabs" aria-label="Resource activities">${activityTabs(resource, step)}</nav>${locked(resource) ? prerequisitePanel(resource) : ""}${step === "learn" ? studyPage(resource) : step === "practice" ? practicePage(resource) : step === "reflect" ? reflectionPage(resource) : completedPage(resource)}`}`;
  }
  function progressPage(filter) {
    const filtered = state.resources.filter((resource) => filter === "all" || filter === "review" && C.needsReview(resource) || filter === "confident" && resource.confidence === "confident" || C.status(resource) === filter);
    const n = counts();
    return `${breadcrumbs()}<section class="course-hero"><div><h1 tabindex="-1">My progress</h1><p class="course-meta">${n.completed} completed<span aria-hidden="true">·</span>${state.resources.filter((resource) => C.status(resource) === "in-progress").length} in progress<span aria-hidden="true">·</span>${state.resources.filter((resource) => C.status(resource) === "planned").length} planned</p></div>${progressBox(state.resources, "Overall progress")}</section><nav class="progress-tabs" aria-label="Filter progress">${Object.entries({ all: "All resources", review: "To revisit", confident: "Confident", planned: "Planned", completed: "Completed" }).map(([value, label]) => `<a href="${value === "all" ? "#progress" : "#progress/" + value}" ${filter === value ? 'aria-current="page"' : ""}>${label}</a>`).join("")}</nav>${filtered.map((resource) => `<article class="progress-module"><h2><a href="${resourcePath(resource, filter === "review" || filter === "confident" ? "reflect" : locked(resource) ? "overview" : resumeStep(resource))}">${escape(resource.title)}</a></h2><div class="module-meta">${tierBadge(resource)}${statusTag(resource)}${confidenceTag(resource)}${availabilityTag(resource)}</div>${tagLinks(resource)}${resource.strengths ? `<p><strong>Feels solid:</strong> ${escape(resource.strengths)}</p>` : ""}${resource.gaps ? `<p><strong>Needs work:</strong> ${escape(resource.gaps)}</p>` : ""}${resource.extraWork.trim() ? `<p><strong>Extra work${resource.extraDone ? " (done)" : ""}:</strong> ${escape(resource.extraWork)}</p>` : ""}${locked(resource) ? `<p class="helper-text"><a href="${resourcePath(resource, "overview")}">See specific and volume prerequisites →</a></p>` : ""}</article>`).join("") || `<p class="empty-state">${filter === "review" ? "No resources flagged for review yet." : filter === "confident" ? "No resources assessed as confident yet." : filter === "completed" ? "No completed resource units yet. Study, practice, and reflect to complete one." : "No resources in this view."}</p>`}`;
  }
  function mapDetails(resource) {
    return `<div class="map-detail-heading"><p class="eyebrow">Selected resource</p>${tierBadge(resource)}<h2>${escape(resource.title)}</h2><p>${escape(resource.author)}</p>${tagLinks(resource)}<a class="button button-primary button-small" href="${resourcePath(resource, "overview")}">Open resource unit →</a><button class="text-button" type="button" data-action="edit-map-resource" data-id="${escape(resource.id)}">Edit resource</button></div>${prerequisitePanel(resource, true)}<p class="helper-text map-detail-note">Solid arrows are required resources. Dashed arrows show resources eligible for a volume rule; not every candidate is required.</p>`;
  }
  function mapPage(current) {
    const matches = filteredResources(current);
    const focus = new URLSearchParams(location.hash.split("?")[1] || "").get("focus");
    if (focus && state.resources.some((item) => item.id === focus)) mapSelectedId = focus;
    else if (!matches.some((item) => item.id === mapSelectedId)) mapSelectedId = matches[0]?.id || null;
    const resource = state.resources.find((item) => item.id === mapSelectedId);
    return `${breadcrumbs()}<div class="map-page-heading"><div><p class="eyebrow">Explore your learning</p><h1 tabindex="-1">Resource map</h1><p class="course-meta">Follow a path, see the gaps, or find your next direction.</p></div><a class="button button-small" href="#curriculum">Academy view</a></div>${filters(current, true)}<div class="map-workspace"><section class="graph-panel" aria-label="Interactive resource connections"><div class="map-toolbar"><p id="map-count" role="status">${matches.length} matching resources</p><div class="map-zoom"><button type="button" class="icon-button" data-map-action="out" aria-label="Zoom out">−</button><button type="button" class="icon-button" data-map-action="in" aria-label="Zoom in">+</button><button type="button" class="text-button" data-map-action="fit">Fit map</button></div></div><div id="resource-graph" class="resource-graph" aria-label="Resource map. Drag the background to pan, select a resource to inspect its prerequisites."></div><div class="map-legend"><span><i class="legend-line"></i>Specific prerequisite</span><span><i class="legend-line dashed"></i>Volume candidate</span>${current.related ? '<span><i class="legend-line related"></i>Shared topic</span>' : ""}<span><i class="legend-dot ready"></i>Ready</span><span><i class="legend-dot completed"></i>Completed</span><span><i class="legend-dot waiting"></i>Preparing</span></div><p class="graph-hint">Drag to pan or move nodes · + / − to zoom · Select a node for details</p></section><aside id="map-selection" class="map-selection" aria-label="Selected resource details" aria-live="polite">${resource ? mapDetails(resource) : '<p class="empty-state">No resources match. Change the filters or add a resource.</p>'}</aside></div>`;
  }
  function render(focusHeading = false) {
    const active = document.activeElement;
    const activeId = active?.id;
    const selection = active && ["text", "search"].includes(active.type) ? [active.selectionStart, active.selectionEnd] : null;
    mapCleanup?.(); mapCleanup = null;
    const current = route();
    if (current.kind === "resource") state.selectedId = current.id;
    navigation();
    $("page").dataset.view = current.kind;
    $("page").innerHTML = current.kind === "home" ? homePage() : current.kind === "curriculum" ? curriculumPage(current) : current.kind === "map" ? mapPage(current) : current.kind === "progress" ? progressPage(current.filter) : resourcePage(selected(), current.step);
    document.title = `${current.kind === "resource" ? selected().title : current.kind === "progress" ? "My progress" : current.kind === "curriculum" ? "Resources" : current.kind === "map" ? "Resource map" : "Home"} | Kian Academy`;
    if (current.kind === "map") {
      mapCleanup = window.ResourceMap.mount({
        element: $("resource-graph"), state, matches: filteredResources(current), context: current.context, related: current.related,
        selectedId: mapSelectedId, onSelect: (id) => {
          mapSelectedId = id;
          const resource = state.resources.find((item) => item.id === id);
          $("map-selection").innerHTML = mapDetails(resource);
        }, onCount: (total, contextCount) => { $("map-count").textContent = `${filteredResources(current).length} matches${contextCount ? ` + ${contextCount} prerequisites in context` : ""} · ${total} shown`; }
      });
    }
    if (focusHeading) $("page").querySelector("h1")?.focus({ preventScroll: true });
    else if (activeId && $(activeId)) {
      $(activeId).focus({ preventScroll: true });
      if (selection) $(activeId).setSelectionRange(...selection);
    }
  }
  function editorCandidates(tier) {
    return state.resources.filter((resource) => resource.id !== editingId && resource.tier === tier - 1);
  }
  function volumeRuleRow(rule, tier) {
    const row = document.createElement("div"); row.className = "volume-rule-row";
    row.innerHTML = `<label class="field">At least<input class="volume-count" type="number" min="1" max="999" value="${rule.count || 1}" required aria-label="Number of completed resources"></label><label class="field">From tier<select class="volume-tier" aria-label="Volume rule tier">${C.TIERS.filter((item) => item.value < tier).map((item) => `<option value="${item.value}" ${item.value === rule.tier ? "selected" : ""}>${item.value} · ${item.name}</option>`).join("")}</select></label><label class="field volume-tags-field">With any tag<input class="volume-tags" value="${escape((rule.tags || []).join(", "))}" required placeholder="cbt, depression" aria-label="Volume rule topic tags"></label><button class="icon-button" type="button" data-action="remove-volume-rule" aria-label="Remove volume rule">×</button>`;
    return row;
  }
  function editorRequirements(checkedIds = null, volume = null) {
    const tier = Number($("editor-tier").value);
    const previous = checkedIds || [...$("editor-specific-options").querySelectorAll("input:checked")].map((input) => input.value);
    const rules = volume || [...$("editor-volume-rules").children].map((row) => ({ count: Number(row.querySelector(".volume-count").value), tier: Number(row.querySelector(".volume-tier").value), tags: C.tags(row.querySelector(".volume-tags").value) }));
    $("editor-tier-description").textContent = C.TIERS[tier - 1].description;
    $("editor-prerequisites").hidden = tier === 1;
    $("editor-specific-help").textContent = `Choose one or more Tier ${tier - 1} resources. All must be complete. With none selected, this resource stays a plan needing prerequisite setup.`;
    const candidates = editorCandidates(tier);
    $("editor-specific-options").innerHTML = candidates.map((resource) => `<label class="checkbox-field"><input type="checkbox" value="${escape(resource.id)}" ${previous.includes(resource.id) ? "checked" : ""}><span>${escape(resource.title)}<small>${resource.completedAt ? "Completed" : "Not yet completed"}</small></span></label>`).join("") || `<p class="setup-note">No Tier ${tier - 1} resources to choose yet. Add one, then return to connect it.</p>`;
    $("editor-volume-rules").replaceChildren(...rules.filter((rule) => rule.tier < tier).map((rule) => volumeRuleRow(rule, tier)));
  }
  function openEditor(edit = false, id = null) {
    closeMenus();
    const resource = id ? state.resources.find((item) => item.id === id) : selected();
    editingId = edit ? resource.id : null;
    const form = $("resource-form"); form.reset();
    for (const field of ["title", "url", "author", "tierReason", "preparationNote", "focus"]) form.elements[field].value = edit ? resource[field] : "";
    form.elements.tier.value = edit ? String(resource.tier) : "1";
    form.elements.tags.value = edit ? resource.tags.join(", ") : route().tag || interest;
    $("tag-options").innerHTML = allTags().map((tag) => `<option value="${escape(tag)}"></option>`).join("");
    editorRequirements(edit ? resource.prerequisiteIds : [], edit ? resource.volume : []);
    $("editor-title").textContent = edit ? "Edit resource" : "Add a resource";
    $("save-resource").textContent = edit ? "Save changes" : "Add resource";
    $("editor-error").hidden = true; $("resource-editor").showModal();
  }
  function changeFilters() {
    const form = $("resource-filters"); if (!form) return;
    const current = route();
    const data = new FormData(form);
    const params = new URLSearchParams();
    for (const name of ["q", "tag", "tier", "availability"]) if (String(data.get(name) || "").trim()) params.set(name, String(data.get(name)).trim());
    if (current.kind === "map") {
      if (!data.has("context")) params.set("context", "0");
      if (data.has("related")) params.set("related", "1");
    }
    history.replaceState(null, "", `#${current.kind}${params.size ? `?${params}` : ""}`); render();
  }
  document.addEventListener("click", (event) => {
    if (event.target.closest(".skip-link")) { event.preventDefault(); $("page").focus(); return; }
    if (event.target.closest('a[href^="#"]')) closeMenus();
    const control = event.target.closest("[data-action], [data-format], [data-confidence]");
    if (!control || control.disabled) return;
    try {
      if (control.dataset.format || control.dataset.confidence) {
        state = C.update(state, state.selectedId, control.dataset.format ? "format" : "confidence", control.dataset.format || control.dataset.confidence);
        persist(); render(); return;
      }
      const resource = selected();
      switch (control.dataset.action) {
        case "plan": openEditor(); break;
        case "edit": openEditor(true); break;
        case "edit-map-resource": openEditor(true, control.dataset.id); break;
        case "close-editor": $("resource-editor").close(); break;
        case "remove-volume-rule": control.closest(".volume-rule-row").remove(); break;
        case "reset-filters": go(`#${route().kind === "map" ? "map" : "curriculum"}`); break;
        case "open-resource":
          if (!locked(resource) && !resource.completedAt) { state = C.update(state, resource.id, "start"); persist(); navigation(); $("resource-meta").innerHTML = tierBadge(selected()) + statusTag(selected()); }
          break;
        case "study-next":
          if (!resource.resourceDone) state = C.update(state, resource.id, "resource", true);
          persist(); go(resourcePath(selected(), "practice")); break;
        case "save-practice": state = C.update(state, resource.id, "practice"); persist(); go(resourcePath(selected(), "reflect")); break;
        case "complete": state = C.update(state, resource.id, "complete"); persist(); go(resourcePath(selected(), "complete")); break;
        case "reopen":
          state = C.update(state, resource.id, "reopen"); persist(); go(resourcePath(selected(), "learn"));
          message("Unit reopened. Saved work is kept; dependent completion and volume counts have been updated."); break;
        case "export": {
          const url = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type: "application/json" }));
          const link = document.createElement("a"); link.href = url; link.download = `kian-academy-${new Date().toISOString().slice(0, 10)}.json`;
          document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); closeMenus(); break;
        }
        case "import": $("import-file").click(); closeMenus(); break;
      }
    } catch (error) { event.preventDefault(); message(error.message); }
  });
  document.addEventListener("input", (event) => {
    try {
      if (event.target.id === "resource-search") { changeFilters(); return; }
      if (event.target.id === "practice-response") {
        state = C.update(state, state.selectedId, "draft", event.target.value); persist(); navigation();
        $("activity-tabs").innerHTML = activityTabs(selected(), "practice"); $("draft-status").textContent = "Draft saved. Continue when your response is ready.";
      } else if (event.target.dataset.reflection) {
        const field = event.target.dataset.reflection;
        state = C.update(state, state.selectedId, "reflection", { field, text: event.target.value }); persist(); navigation();
        if (field === "extraWork") { $("extra-work-checkbox").hidden = !event.target.value.trim(); $("extra-done").checked = false; }
      }
    } catch (error) { message(error.message); }
  });
  $("page").addEventListener("change", (event) => {
    try {
      if (event.target.id === "home-interest") {
        interest = event.target.value; try { localStorage.setItem("kian-academy-interest", interest); } catch {}
        render();
      } else if (event.target.closest("#resource-filters")) changeFilters();
      else if (event.target.id === "extra-done") {
        state = C.update(state, state.selectedId, "reflection", { field: "extraDone", text: event.target.checked }); persist(); navigation();
      }
    } catch (error) { message(error.message); }
  });
  $("page").addEventListener("submit", (event) => { if (event.target.id === "resource-filters") { event.preventDefault(); changeFilters(); } });
  $("editor-tier").addEventListener("change", () => editorRequirements());
  $("add-volume-rule").addEventListener("click", () => {
    const tier = Number($("editor-tier").value);
    if (tier > 1) $("editor-volume-rules").append(volumeRuleRow({ tier: tier - 1, count: 1, tags: [] }, tier));
  });
  $("resource-form").addEventListener("submit", (event) => {
    event.preventDefault();
    try {
      const fields = Object.fromEntries(new FormData(event.currentTarget));
      const tier = Number(fields.tier);
      fields.prerequisiteIds = tier === 1 ? [] : [...$("editor-specific-options").querySelectorAll("input:checked")].map((input) => input.value);
      fields.volume = tier === 1 ? [] : [...$("editor-volume-rules").children].map((row) => ({ count: row.querySelector(".volume-count").value, tier: row.querySelector(".volume-tier").value, tags: row.querySelector(".volume-tags").value }));
      const wasMap = route().kind === "map";
      state = C.saveResource(state, fields, editingId); persist(); $("resource-editor").close();
      if (wasMap) { mapSelectedId = state.selectedId; render(); }
      else go(resourcePath(selected(), "overview"));
    } catch (error) { $("editor-error").textContent = error.message; $("editor-error").hidden = false; }
  });
  $("import-file").addEventListener("change", async (event) => {
    const file = event.target.files[0]; if (!file) return;
    try {
      const imported = C.readState(JSON.parse(await file.text()));
      if (!confirm(`Replace this browser’s learning plan with the ${imported.resources.length}-resource backup? Download your current progress first if you want to keep it.`)) return;
      state = C.addCatalogResources(imported); storageLocked = false; persist(); go("#home"); message("Learning plan and progress restored.");
    } catch (error) { message(`Could not restore this file: ${error.message}`); }
    finally { event.target.value = ""; }
  });
  $("contents-toggle").addEventListener("click", () => { const open = $("course-nav").classList.toggle("is-open"); $("contents-toggle").setAttribute("aria-expanded", String(open)); });
  function updateTheme() { $("theme-toggle").textContent = `Switch to ${document.documentElement.dataset.theme === "light" ? "dark" : "light"} appearance`; }
  $("theme-toggle").addEventListener("click", () => {
    const theme = document.documentElement.dataset.theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = theme; updateTheme(); closeMenus();
    try { localStorage.setItem("psych-curriculum-theme", theme); } catch {}
  });
  window.addEventListener("hashchange", () => { closeMenus(); render(true); persist(); window.scrollTo(0, 0); });
  updateTheme(); render();
  if (storageLocked) $("save-status").textContent = "Saved progress could not be read. Download any new work before closing.";
  else if (catalogAdded || migrated) persist();
})();
