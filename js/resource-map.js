(function (root) {
  "use strict";
  const C = typeof module !== "undefined" && module.exports ? require("./curriculum.js") : root.Curriculum;

  function buildGraph(state, matches, includeContext = true, related = false) {
    const primary = new Set(matches.map((resource) => resource.id));
    const shown = new Set(primary);
    if (includeContext) {
      const queue = [...matches];
      for (let index = 0; index < queue.length; index++) {
        const resource = queue[index];
        const prerequisites = [...resource.prerequisiteIds.map((id) => state.resources.find((item) => item.id === id)), ...resource.volume.flatMap((rule) => C.volumeMatches(state, resource, rule))].filter(Boolean);
        for (const previous of prerequisites) if (!shown.has(previous.id)) { shown.add(previous.id); queue.push(previous); }
      }
    }
    const nodes = state.resources.filter((resource) => shown.has(resource.id)).map((resource) => ({ resource, context: !primary.has(resource.id) }));
    const edges = [];
    for (const { resource } of nodes) {
      for (const id of resource.prerequisiteIds) if (shown.has(id)) edges.push({ from: id, to: resource.id, kind: "specific" });
      const seen = new Set();
      for (const rule of resource.volume) {
        for (const candidate of C.volumeMatches(state, resource, rule)) {
          if (shown.has(candidate.id) && !seen.has(candidate.id)) {
            edges.push({ from: candidate.id, to: resource.id, kind: "volume" }); seen.add(candidate.id);
          }
        }
      }
    }
    if (related) for (let a = 0; a < nodes.length; a++) for (let b = a + 1; b < nodes.length; b++) {
      const first = nodes[a].resource, second = nodes[b].resource;
      const shared = first.tags.filter((tag) => second.tags.includes(tag));
      if (shared.length && !edges.some((edge) => edge.from === first.id && edge.to === second.id || edge.to === first.id && edge.from === second.id)) {
        edges.push({ from: first.id, to: second.id, kind: "related", tags: shared });
      }
    }
    return { nodes, edges };
  }
  function mount({ element, state, matches, context, related, selectedId, onSelect, onCount }) {
    const { nodes, edges } = buildGraph(state, matches, context, related);
    onCount(nodes.length, nodes.filter((node) => node.context).length);
    const ns = "http://www.w3.org/2000/svg";
    const make = (tag, attributes = {}, value = null) => {
      const item = document.createElementNS(ns, tag);
      for (const [name, attribute] of Object.entries(attributes)) item.setAttribute(name, attribute);
      if (value !== null) item.textContent = value;
      return item;
    };
    const svg = make("svg", { role: "group", "aria-label": "Interactive map of resource prerequisites", width: "100%", height: "100%", tabindex: "0" });
    element.replaceChildren(svg);
    if (!nodes.length) {
      const empty = document.createElement("p"); empty.className = "graph-empty"; empty.textContent = "No resources match these filters."; element.append(empty);
      return () => {};
    }
    const defs = make("defs");
    for (const kind of ["specific", "volume"]) {
      const marker = make("marker", { id: `arrow-${kind}`, markerWidth: "8", markerHeight: "8", refX: "7", refY: "4", orient: "auto", markerUnits: "userSpaceOnUse" });
      marker.append(make("path", { d: "M0 0 8 4 0 8Z", class: `map-arrow ${kind}` })); defs.append(marker);
    }
    svg.append(defs);
    const viewport = make("g"); svg.append(viewport);
    const edgeLayer = make("g", { "aria-hidden": "true" }); viewport.append(edgeLayer);
    const labelLayer = make("g", { "aria-hidden": "true" }); viewport.append(labelLayer);
    const nodeLayer = make("g"); viewport.append(nodeLayer);
    const positions = new Map();
    const elements = new Map();
    const tierCounts = new Map();
    const width = 202, height = 100, column = 288, row = 158;
    let active = selectedId;
    for (const { resource, context: contextual } of nodes) {
      const index = tierCounts.get(resource.tier) || 0; tierCounts.set(resource.tier, index + 1);
      positions.set(resource.id, { x: (resource.tier - 1) * column + 25, y: index * row + 70 });
      const readiness = resource.completedAt ? "completed" : C.availability(state, resource).kind;
      const node = make("g", { class: `map-node ${contextual ? "context-node" : ""}`, "data-id": resource.id, "data-ready": readiness, tabindex: "0", role: "button", "aria-label": `${resource.title}, Tier ${resource.tier}, ${resource.completedAt ? "completed" : readiness === "ready" ? "ready to learn" : readiness === "setup" ? "needs prerequisite setup" : "prerequisites to do"}${contextual ? ", prerequisite context" : ""}`, "aria-pressed": String(resource.id === active) });
      node.append(make("title", {}, resource.title));
      node.append(make("rect", { width, height, rx: "9", class: "node-shape" }));
      node.append(make("circle", { cx: "17", cy: "18", r: "4", class: "node-status" }));
      node.append(make("text", { x: "29", y: "22", class: "node-tier" }, `TIER ${resource.tier} · ${C.TIERS[resource.tier - 1].name.toUpperCase()}`));
      const title = make("text", { x: "14", y: "44", class: "node-title" });
      const words = resource.title.split(/\s+/); const lines = []; let line = "";
      for (const word of words) {
        if (line.length + word.length > 26 && line) { lines.push(line); line = word; }
        else line += (line ? " " : "") + word;
      }
      if (line) lines.push(line);
      lines.slice(0, 2).forEach((value, index) => title.append(make("tspan", { x: "14", dy: index ? "17" : "0" }, value.length > 27 ? `${value.slice(0, 25)}…` : index === 1 && lines.length > 2 ? `${value.slice(0, 24)}…` : value)));
      node.append(title);
      node.append(make("text", { x: "14", y: "85", class: "node-subtitle" }, resource.completedAt ? "✓ Completed" : readiness === "ready" ? "Ready to learn" : readiness === "setup" ? "Needs prerequisite setup" : "Prerequisites to do"));
      nodeLayer.append(node); elements.set(resource.id, node);
    }
    for (const [tier, count] of tierCounts) {
      const x = (tier - 1) * column + 25;
      labelLayer.append(make("text", { x, y: "24", class: "map-tier-label" }, `${tier} · ${C.TIERS[tier - 1].name}`));
      labelLayer.append(make("text", { x, y: "43", class: "map-tier-count" }, `${count} resource${count === 1 ? "" : "s"}`));
    }
    const edgeElements = edges.map((edge) => {
      const path = make("path", { class: `map-edge ${edge.kind}`, ...(edge.kind !== "related" ? { "marker-end": `url(#arrow-${edge.kind})` } : {}) });
      edgeLayer.append(path);
      return { edge, path };
    });
    function draw() {
      for (const [id, node] of elements) { const point = positions.get(id); node.setAttribute("transform", `translate(${point.x} ${point.y})`); }
      for (const { edge, path } of edgeElements) {
        const from = positions.get(edge.from), to = positions.get(edge.to);
        const offset = edge.kind === "volume" ? 13 : 0;
        const x1 = from.x + width, y1 = from.y + height / 2 + offset;
        const x2 = to.x - 5, y2 = to.y + height / 2 + offset;
        if (edge.kind === "volume" && to.x - from.x > column + 30) {
          // A count spanning tiers must not look like it passes through an unrelated resource.
          const lane = 55;
          path.setAttribute("d", `M${x1},${y1} C${x1 + 26},${y1} ${x1 + 26},${lane} ${x1 + 52},${lane} L${x2 - 52},${lane} C${x2 - 26},${lane} ${x2 - 26},${y2} ${x2},${y2}`);
        } else if (Math.abs(to.x - from.x) < 10) {
          const x = from.x + width + 65; path.setAttribute("d", `M${x1},${y1} C${x},${y1} ${x},${y2} ${x2 + width + 5},${y2}`);
        } else {
          const bend = Math.max(40, Math.abs(x2 - x1) / 2); path.setAttribute("d", `M${x1},${y1} C${x1 + bend},${y1} ${x2 - bend},${y2} ${x2},${y2}`);
        }
        path.classList.toggle("edge-muted", Boolean(active && edge.from !== active && edge.to !== active));
        path.classList.toggle("edge-active", edge.from === active || edge.to === active);
      }
      for (const [id, node] of elements) node.setAttribute("aria-pressed", String(id === active));
    }
    let scale = 1, tx = 0, ty = 0;
    let viewWidth = element.clientWidth, viewHeight = element.clientHeight;
    const transform = () => viewport.setAttribute("transform", `translate(${tx} ${ty}) scale(${scale})`);
    function fit() {
      viewWidth = element.clientWidth; viewHeight = element.clientHeight;
      const points = [...positions.values()];
      const minX = Math.min(...points.map((point) => point.x)) - 25;
      const maxX = Math.max(...points.map((point) => point.x)) + width + 35;
      const minY = Math.min(0, ...points.map((point) => point.y)) - 5;
      const maxY = Math.max(...points.map((point) => point.y)) + height + 30;
      scale = Math.min(1.15, (viewWidth - 24) / (maxX - minX), (viewHeight - 28) / (maxY - minY));
      scale = Math.max(.12, scale); tx = (viewWidth - (maxX - minX) * scale) / 2 - minX * scale; ty = (viewHeight - (maxY - minY) * scale) / 2 - minY * scale; transform();
    }
    function zoom(factor, x = viewWidth / 2, y = viewHeight / 2) {
      const previous = scale; scale = Math.max(.12, Math.min(3.5, scale * factor));
      tx = x - (x - tx) * scale / previous; ty = y - (y - ty) * scale / previous; transform();
    }
    const controls = element.closest(".graph-panel").querySelector(".map-toolbar");
    const controlClick = (event) => {
      const action = event.target.closest("[data-map-action]")?.dataset.mapAction;
      if (action === "fit") fit(); else if (action === "in") zoom(1.25); else if (action === "out") zoom(.8);
    };
    controls.addEventListener("click", controlClick);
    function select(id) { active = id; draw(); onSelect(id); }
    let drag = null;
    svg.addEventListener("pointerdown", (event) => {
      if (event.button !== 0 || event.target.closest(".map-node") && event.target.closest(".map-node").getAttribute("role") !== "button") return;
      const node = event.target.closest(".map-node");
      drag = { id: node?.dataset.id, x: event.clientX, y: event.clientY, moved: false };
      svg.setPointerCapture(event.pointerId); element.classList.add("is-panning");
    });
    svg.addEventListener("pointermove", (event) => {
      if (!drag) return;
      const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 2) drag.moved = true;
      if (drag.id) { const point = positions.get(drag.id); point.x += dx / scale; point.y += dy / scale; draw(); }
      else { tx += dx; ty += dy; transform(); }
      drag.x = event.clientX; drag.y = event.clientY;
    });
    function endDrag() {
      if (drag?.id && !drag.moved) select(drag.id);
      drag = null; element.classList.remove("is-panning");
    }
    svg.addEventListener("pointerup", endDrag); svg.addEventListener("pointercancel", () => { drag = null; element.classList.remove("is-panning"); });
    svg.addEventListener("keydown", (event) => {
      const id = event.target.closest(".map-node")?.dataset.id;
      if (id && ["Enter", " "].includes(event.key)) { event.preventDefault(); select(id); }
      else if (["+", "=", "-", "0"].includes(event.key)) { event.preventDefault(); if (event.key === "0") fit(); else zoom(event.key === "-" ? .8 : 1.25); }
      else if (!id && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
        event.preventDefault(); tx += event.key === "ArrowLeft" ? 30 : event.key === "ArrowRight" ? -30 : 0; ty += event.key === "ArrowUp" ? 30 : event.key === "ArrowDown" ? -30 : 0; transform();
      }
    });
    svg.addEventListener("wheel", (event) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault(); const rect = svg.getBoundingClientRect(); zoom(Math.exp(-event.deltaY * .004), event.clientX - rect.left, event.clientY - rect.top);
    }, { passive: false });
    draw(); fit();
    const observer = new ResizeObserver(fit); observer.observe(element);
    return () => { observer.disconnect(); controls.removeEventListener("click", controlClick); };
  }
  if (typeof module !== "undefined" && module.exports) module.exports = { buildGraph };
  else root.ResourceMap = { mount, buildGraph };
})(globalThis);
