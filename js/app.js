(function () {
  const roadmap = window.ROADMAP;
  const view = document.getElementById("view");
  const pathList = document.getElementById("pathList");
  const navRoot = document.getElementById("navRoot");
  const sidebarSlot = document.getElementById("sidebarSlot");
  const tocDrawer = document.getElementById("tocDrawer");
  const tocDrawerBody = document.getElementById("tocDrawerBody");
  const tocTrigger = document.getElementById("tocTrigger");
  const spotlightDialog = document.getElementById("spotlightDialog");
  const spotlightTrigger = document.getElementById("spotlightTrigger");
  const spotlightInput = document.getElementById("spotlightInput");
  const spotlightResults = document.getElementById("spotlightResults");
  const spotlightStatus = document.getElementById("spotlightStatus");
  const shortcutsDialog = document.getElementById("shortcutsDialog");
  const shortcutList = document.getElementById("shortcutList");
  const topicDialog = document.getElementById("topicDialog");
  const topicTitle = document.getElementById("topicTitle");
  const topicClose = document.getElementById("topicClose");
  const topicCode = document.getElementById("topicCode");
  const topicRole = document.getElementById("topicRole");
  const topicAbout = document.getElementById("topicAbout");
  const topicCovers = document.getElementById("topicCovers");
  const topicFollowsBlock = document.getElementById("topicFollowsBlock");
  const topicFollows = document.getElementById("topicFollows");
  const topicLeadsBlock = document.getElementById("topicLeadsBlock");
  const topicLeads = document.getElementById("topicLeads");
  const topicFooter = document.getElementById("topicFooter");
  const bridgeBtn = document.getElementById("bridgeBtn");
  const themeToggleBtn = document.getElementById("themeToggleBtn");
  const themeIconUse = document.getElementById("themeIconUse");
  const tooltip = document.getElementById("tooltip");

  const ROLE_LABEL = { core: "Core", elective: "Elective", bridge: "Bridge" };
  const apple = /Mac|iPhone|iPad|iPod/.test(navigator.platform || "") || /Mac OS|iPhone|iPad/.test(navigator.userAgent);
  const altName = apple ? "⌥" : "Alt";
  const MODE_COPY = {
    commands: {
      dialog: "Search and commands",
      input: "Search commands",
      placeholder: "Search commands",
      list: "Commands",
      empty: "No matching commands",
      noun: "commands"
    },
    jump: {
      dialog: "Jump to a path",
      input: "Jump to a path",
      placeholder: "Jump to a path",
      list: "Paths",
      empty: "No matching paths",
      noun: "paths"
    },
    topics: {
      dialog: "Find a topic",
      input: "Find a topic",
      placeholder: "Find a topic",
      list: "Topics",
      empty: "No matching topics",
      noun: "topics"
    }
  };

  const index = buildIndex(roadmap);
  const destinations = roadmap.paths.map((path) => ({
    id: path.id,
    title: path.title,
    search: [path.title, path.summary, path.search].join(" ")
  }));

  let pinnedId = null;
  let holdPin = false;
  let applying = false;
  let suppressTocReturn = false;
  let suppressSpotlightReturn = false;
  let dialogInvoker = null;
  let shortcutsInvoker = null;
  let spotMode = "commands";
  let spotAnnounce = false;
  let tipTarget = null;
  let tipTimer = 0;

  const mobileQuery = window.matchMedia("(max-width: 900px)");

  function buildIndex(data) {
    const ids = new Set(["all"]);
    const codes = new Set();
    const topics = new Map();
    const stages = new Map();
    const pathsById = new Map();
    const claim = (id, kind) => {
      if (!id || ids.has(id)) throw new Error("Duplicate or empty id " + id + " for " + kind);
      ids.add(id);
    };
    data.paths.forEach((path) => {
      claim(path.id, "path");
      pathsById.set(path.id, path);
      path.stages.forEach((stage) => {
        claim(stage.id, "stage");
        stages.set(stage.id, { path, stage });
        stage.rows.forEach((row) => {
          if (!row.length) throw new Error("Empty row in " + stage.id);
          row.forEach((topic) => {
            claim(topic.id, "topic");
            if (codes.has(topic.code)) throw new Error("Duplicate code " + topic.code);
            codes.add(topic.code);
            if (!topic.title || !topic.summary || !topic.about || !topic.covers || !topic.covers.length) {
              throw new Error("Incomplete topic " + topic.id);
            }
            topics.set(topic.id, { path, stage, topic });
          });
        });
      });
    });
    const followers = new Map([...topics.keys()].map((id) => [id, []]));
    topics.forEach(({ topic }) => {
      const role = topic.role || "core";
      if (!ROLE_LABEL[role]) throw new Error("Bad role on " + topic.id);
      if (role === "bridge" && !pathsById.has(topic.bridgeTo)) throw new Error("Bad bridge on " + topic.id);
      if (role !== "bridge" && topic.bridgeTo) throw new Error("bridgeTo set on " + topic.id);
      (topic.prereqs || []).forEach((pre) => {
        if (!topics.has(pre)) throw new Error(topic.id + " is missing prereq " + pre);
        followers.get(pre).push(topic.id);
      });
    });
    return { topics, stages, pathsById, followers };
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (ch) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;"
    }[ch]));
  }

  function ordinal(number) {
    return String(number).padStart(2, "0");
  }

  function motion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
  }

  function metric(label, value) {
    return `<div class="metric"><p class="metric-label">${escapeHtml(label)}</p><p class="metric-value">${value}</p></div>`;
  }

  const BIOLOGY_ID = "human-biology";
  const BIOLOGY_PLAYLIST = "https://www.youtube.com/playlist?list=PLzxlKUNNLxmEvjCSUAurMReJBZxaLdD1_";
  const callout = `<p class="callout callout-info"><span class="callout-label">Study map:</span> Topic names are placeholders for a later curriculum. This is not clinical training, supervision, or medical advice.</p>`;

  function nodeButton(topic) {
    const role = topic.role || "core";
    return `<button type="button" class="node" id="node-${escapeHtml(topic.id)}" data-open-topic="${escapeHtml(topic.id)}" aria-haspopup="dialog" aria-controls="topicDialog">
      <span class="node-meta"><span class="meta-tag">${escapeHtml(topic.code)}</span><span class="badge badge-nominal">${escapeHtml(ROLE_LABEL[role])}</span></span>
      <span class="node-title">${escapeHtml(topic.title)}</span>
      <span class="node-summary">${escapeHtml(topic.summary)}</span>
    </button>`;
  }

  function renderTree() {
    const lanes = roadmap.paths.map((path) => {
      const stages = path.stages.map((stage) => {
        const columns = stage.rows.map((row) => `<div class="topic-col">${row.map(nodeButton).join("")}</div>`).join("");
        return `<section class="stage-lane" id="${escapeHtml(stage.id)}" aria-labelledby="${escapeHtml(stage.id)}-title">
          <div class="branch-node stage-node">
            <h3 class="stage-title" id="${escapeHtml(stage.id)}-title" tabindex="-1">${escapeHtml(stage.title)}</h3>
            <p class="node-summary">${escapeHtml(stage.summary)}</p>
          </div>
          <div class="stage-rows">${columns}</div>
        </section>`;
      }).join("");
      return `<section class="path-lane" id="${escapeHtml(path.id)}" aria-labelledby="${escapeHtml(path.id)}-title">
        <div class="branch-node path-node">
          <h2 id="${escapeHtml(path.id)}-title" tabindex="-1">${escapeHtml(path.title)}</h2>
          <p class="node-summary">${escapeHtml(path.summary)}</p>
        </div>
        <div class="lane-stages">${stages}</div>
      </section>`;
    }).join("");
    view.innerHTML = `<div class="tree-viewport" id="treeViewport">
      <div class="skill-tree" id="map">
        <svg class="tree-wires" id="treeWires" aria-hidden="true"></svg>
        <div class="tree-root-col">
          <section class="tree-root" id="${BIOLOGY_ID}" aria-labelledby="${BIOLOGY_ID}-title">
            <a class="node node-root" href="${BIOLOGY_PLAYLIST}" target="_blank" rel="noopener noreferrer">
              <span class="node-meta"><span class="meta-tag">2026</span><span class="badge badge-caution">Required</span></span>
              <h2 class="node-title" id="${BIOLOGY_ID}-title" tabindex="-1">Robert Sapolsky, Human Behavioral Biology</h2>
              <p class="node-summary">Watch and understand this 2026 playlist before anything else on this map. It is the basis of human behavior. Without that basis in human biology, it is safe to assume you know nothing about psychology, and that everything you say about it is folly. Robert Sapolsky has the same lecture series on YouTube from about fifteen years ago. That older recording is outdated and not worth watching.</p>
              <p class="node-note">Topic names are placeholders. This is not clinical training, supervision, or medical advice.</p>
            </a>
          </section>
        </div>
        <div class="tree-paths">${lanes}</div>
      </div>
    </div>`;
    const viewport = document.getElementById("treeViewport");
    viewport.addEventListener("scroll", () => {
      if (tipTarget && tooltip.matches(":popover-open")) placeTip(tipTarget);
      updateStageCurrent();
    }, { passive: true });
    viewport.addEventListener("wheel", (event) => {
      if (event.ctrlKey || event.shiftKey) return;
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      const maxX = viewport.scrollWidth - viewport.clientWidth;
      if (maxX <= 1) return;
      const atStart = viewport.scrollLeft <= 0 && event.deltaY < 0;
      const atEnd = viewport.scrollLeft >= maxX - 1 && event.deltaY > 0;
      if (atStart || atEnd) return;
      event.preventDefault();
      viewport.scrollLeft += event.deltaY;
    }, { passive: false });
    drawWires();
  }

  function drawWires() {
    const tree = document.getElementById("map");
    const svg = document.getElementById("treeWires");
    if (!tree || !svg) return;
    const width = tree.scrollWidth;
    const height = tree.scrollHeight;
    svg.setAttribute("viewBox", "0 0 " + width + " " + height);
    svg.setAttribute("width", String(width));
    svg.setAttribute("height", String(height));
    const treeRect = tree.getBoundingClientRect();
    const round = (value) => Math.round(value * 2) / 2;
    const box = (el) => {
      const rect = el.getBoundingClientRect();
      return {
        right: round(rect.right - treeRect.left),
        x: round(rect.left - treeRect.left),
        cy: round(rect.top - treeRect.top + rect.height / 2)
      };
    };
    const bundle = (source, targets) => {
      if (!targets.length) return "";
      const mid = round(source.right + (targets[0].x - source.right) / 2);
      const ys = targets.map((target) => target.cy);
      let d = "M " + source.right + " " + source.cy + " H " + mid;
      const minY = Math.min(source.cy, ...ys);
      const maxY = Math.max(source.cy, ...ys);
      if (maxY - minY > 0.5) d += " M " + mid + " " + minY + " V " + maxY;
      targets.forEach((target) => { d += " M " + mid + " " + target.cy + " H " + target.x; });
      return "<path d=\"" + d + "\"/>";
    };
    const bus = (sources, targets) => {
      if (!sources.length || !targets.length) return "";
      const x1 = Math.max(...sources.map((source) => source.right));
      const x2 = Math.min(...targets.map((target) => target.x));
      const mid = round((x1 + x2) / 2);
      const ys = sources.concat(targets).map((item) => item.cy);
      let d = "";
      sources.forEach((source) => { d += " M " + source.right + " " + source.cy + " H " + mid; });
      d += " M " + mid + " " + Math.min(...ys) + " V " + Math.max(...ys);
      targets.forEach((target) => { d += " M " + mid + " " + target.cy + " H " + target.x; });
      return "<path d=\"" + d + "\"/>";
    };
    const parts = [];
    const root = document.querySelector(".node-root");
    const pathNodes = [...document.querySelectorAll(".path-node")];
    if (root && pathNodes.length) parts.push(bundle(box(root), pathNodes.map(box)));
    document.querySelectorAll(".path-lane").forEach((lane) => {
      const pathNode = lane.querySelector(".path-node");
      const stages = [...lane.querySelectorAll(".stage-lane")];
      stages.forEach((stage, index) => {
        const stageNode = stage.querySelector(".stage-node");
        const from = index === 0 ? pathNode : stages[index - 1].querySelector(".stage-node");
        parts.push(bundle(box(from), [box(stageNode)]));
        const columns = [...stage.querySelectorAll(".topic-col")];
        columns.forEach((column, columnIndex) => {
          const nodes = [...column.querySelectorAll(".node")].map(box);
          if (!nodes.length) return;
          if (columnIndex === 0) parts.push(bundle(box(stageNode), nodes));
          else parts.push(bus([...columns[columnIndex - 1].querySelectorAll(".node")].map(box), nodes));
        });
      });
    });
    svg.innerHTML = "<g class=\"tree-wire\">" + parts.join("") + "</g>";
  }

  function linkItem(id, label) {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.className = "nav-link";
    link.href = "#" + id;
    link.dataset.target = id;
    link.textContent = label;
    item.append(link);
    return item;
  }

  function renderContents() {
    pathList.replaceChildren();
    pathList.append(linkItem(BIOLOGY_ID, "Human behavioral biology"));
    roadmap.paths.forEach((path) => {
      const item = linkItem(path.id, path.title);
      const nested = document.createElement("ul");
      nested.className = "nav-list";
      path.stages.forEach((stage) => nested.append(linkItem(stage.id, stage.title)));
      item.append(nested);
      pathList.append(item);
    });
  }

  function headingVisible(id) {
    const viewport = document.getElementById("treeViewport");
    const heading = document.getElementById(id)?.querySelector("h1, h2, h3");
    if (!heading || !viewport) return false;
    const rect = heading.getBoundingClientRect();
    const box = viewport.getBoundingClientRect();
    return rect.bottom > box.top && rect.top < box.bottom && rect.right > box.left && rect.left < box.right;
  }

  function updateStageCurrent() {
    const viewport = document.getElementById("treeViewport");
    const sections = [...document.querySelectorAll("#view section")];
    if (!sections.length || !viewport) return;
    let current = sections[0];
    if (pinnedId && (holdPin || headingVisible(pinnedId))) {
      const pinned = document.getElementById(pinnedId);
      if (pinned) current = pinned;
    } else {
      pinnedId = null;
      const box = viewport.getBoundingClientRect();
      const origin = box.left + 32;
      let best = Infinity;
      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        if (rect.right < box.left || rect.left > box.right || rect.bottom < box.top || rect.top > box.bottom) return;
        const distance = Math.abs(rect.left - origin);
        if (distance < best) {
          best = distance;
          current = section;
        }
      });
    }
    navRoot.querySelectorAll("a[data-target]").forEach((link) => {
      if (link.dataset.target === current.id) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }

  function scrollToSection(id, behavior) {
    const section = document.getElementById(id);
    if (!section) return;
    pinnedId = id;
    holdPin = true;
    section.scrollIntoView({ block: "nearest", inline: "start", behavior: behavior || motion() });
    const heading = section.querySelector("h1, h2, h3");
    if (heading) heading.focus({ preventScroll: true });
    updateStageCurrent();
    window.setTimeout(() => {
      holdPin = false;
      updateStageCurrent();
    }, motion() === "smooth" ? 700 : 0);
  }

  function resolve(hash) {
    const id = decodeURIComponent((hash || "").replace(/^#/, ""));
    if (!id || id === "all" || id === "map") return { sectionId: "map", valid: id === "" || id === "all" || id === "map" };
    if (id === BIOLOGY_ID || index.pathsById.has(id) || index.stages.has(id)) return { sectionId: id, valid: true };
    return { sectionId: "map", valid: false };
  }

  function applyLocation(target, options) {
    if (options.scroll && options.topicId) {
      const section = document.getElementById(target.sectionId);
      pinnedId = target.sectionId;
      holdPin = true;
      if (section) section.scrollIntoView({ block: "nearest", inline: "start", behavior: motion() });
      const node = document.getElementById("node-" + options.topicId);
      if (node) node.scrollIntoView({ block: "nearest", inline: "nearest", behavior: motion() });
      updateStageCurrent();
      window.setTimeout(() => {
        holdPin = false;
        updateStageCurrent();
      }, motion() === "smooth" ? 700 : 0);
    } else if (options.scroll) {
      scrollToSection(target.sectionId);
    } else {
      updateStageCurrent();
    }
    if (options.topicId) {
      if (!topicDialog.open) dialogInvoker = document.getElementById("node-" + options.topicId);
      openTopic(options.topicId);
    } else if (topicDialog.open) {
      topicDialog.close();
    }
  }

  function setHash(id) {
    const next = "#" + id;
    if (location.hash === next) {
      applyLocation(resolve(next), { scroll: true });
      return;
    }
    location.hash = id;
  }

  function showTopic(topicId) {
    const loc = index.topics.get(topicId);
    const next = "#" + loc.stage.id;
    if (location.hash !== next) {
      applying = true;
      location.hash = loc.stage.id;
      window.setTimeout(() => { applying = false; }, 0);
    }
    applyLocation({ sectionId: loc.stage.id }, { scroll: true, topicId });
  }

  function fillRelated(container, ids, currentPathId) {
    container.replaceChildren();
    ids.forEach((id) => {
      const loc = index.topics.get(id);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "btn btn-quiet related";
      button.dataset.topicJump = id;
      const name = document.createElement("span");
      name.textContent = loc.topic.title;
      button.append(name);
      if (loc.path.id !== currentPathId) {
        const aside = document.createElement("span");
        aside.className = "related-path";
        aside.textContent = loc.path.title;
        button.append(aside);
      }
      container.append(button);
    });
  }

  function fillTopic(topicId) {
    const loc = index.topics.get(topicId);
    const topic = loc.topic;
    topicTitle.textContent = topic.title;
    topicCode.textContent = topic.code;
    topicRole.textContent = ROLE_LABEL[topic.role || "core"];
    topicAbout.textContent = topic.about;
    topicCovers.replaceChildren();
    topic.covers.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      topicCovers.append(li);
    });
    const prereqs = topic.prereqs || [];
    const leads = index.followers.get(topic.id);
    fillRelated(topicFollows, prereqs, loc.path.id);
    fillRelated(topicLeads, leads, loc.path.id);
    topicFollowsBlock.hidden = prereqs.length === 0;
    topicLeadsBlock.hidden = leads.length === 0;
    if (topic.bridgeTo) {
      const dest = index.pathsById.get(topic.bridgeTo);
      bridgeBtn.dataset.path = dest.id;
      bridgeBtn.textContent = "Show " + dest.title;
      topicFooter.hidden = false;
    } else {
      topicFooter.hidden = true;
    }
  }

  function openTopic(topicId) {
    fillTopic(topicId);
    if (!topicDialog.open) {
      topicDialog.showModal();
      topicClose.focus();
    } else {
      topicTitle.focus();
    }
  }

  function syncThemeControls() {
    const light = document.documentElement.dataset.theme === "light";
    themeIconUse.setAttribute("href", light ? "#lucide-moon" : "#lucide-sun");
    const label = light ? "Switch to dark theme" : "Switch to light theme";
    themeToggleBtn.setAttribute("aria-label", label);
    themeToggleBtn.dataset.tooltip = label;
    if (tipTarget === themeToggleBtn && tooltip.matches(":popover-open")) tooltip.textContent = label;
  }

  function toggleTheme() {
    const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("psych-roadmap-theme", next); } catch (error) { /* storage may be blocked */ }
    syncThemeControls();
  }

  function hideTip() {
    window.clearTimeout(tipTimer);
    tipTimer = 0;
    tipTarget = null;
    if (tooltip.matches(":popover-open")) tooltip.hidePopover();
    document.querySelectorAll("[aria-describedby='tooltip']").forEach((el) => el.removeAttribute("aria-describedby"));
  }

  function placeTip(target) {
    const maxWidth = Math.min(360, window.innerWidth - 24);
    tooltip.style.maxWidth = maxWidth + "px";
    if (!tooltip.matches(":popover-open")) tooltip.showPopover();
    const rect = target.getBoundingClientRect();
    const tipRect = tooltip.getBoundingClientRect();
    const margin = 12;
    let top = rect.top - 8 - tipRect.height;
    if (top < margin) top = Math.min(rect.bottom + 8, window.innerHeight - tipRect.height - margin);
    let left = rect.left + rect.width / 2 - tipRect.width / 2;
    left = Math.max(margin, Math.min(left, window.innerWidth - tipRect.width - margin));
    tooltip.style.top = Math.max(margin, top) + "px";
    tooltip.style.left = left + "px";
  }

  function scheduleTip(target) {
    window.clearTimeout(tipTimer);
    tipTarget = target;
    tipTimer = window.setTimeout(() => {
      const text = target.getAttribute("data-tooltip");
      if (!text || tipTarget !== target) return;
      tooltip.textContent = text;
      target.setAttribute("aria-describedby", "tooltip");
      placeTip(target);
    }, 150);
  }

  function fillKeys(container, keys) {
    container.replaceChildren();
    keys.forEach((key) => {
      const kbd = document.createElement("kbd");
      kbd.textContent = key;
      container.append(kbd);
    });
  }

  function makeOption(spec) {
    const option = document.createElement("li");
    option.className = "spotlight-option";
    option.id = spec.id;
    option.setAttribute("role", "option");
    option.setAttribute("aria-selected", "false");
    option.dataset.mode = spec.mode;
    option.dataset.action = spec.action;
    option.dataset.search = spec.search;
    if (spec.target) option.dataset.target = spec.target;
    if (spec.keyshortcuts) option.setAttribute("aria-keyshortcuts", spec.keyshortcuts);
    const label = document.createElement("span");
    label.className = "spotlight-option-label";
    label.textContent = spec.label;
    option.append(label);
    if (spec.keys) {
      const shortcut = document.createElement("span");
      shortcut.className = "spotlight-shortcut";
      shortcut.setAttribute("aria-hidden", "true");
      fillKeys(shortcut, spec.keys);
      option.append(shortcut);
    }
    if (spec.aside) {
      const aside = document.createElement("span");
      aside.className = "spotlight-aside";
      aside.textContent = spec.aside;
      option.append(aside);
    }
    return option;
  }

  const spotlightEmpty = document.createElement("li");
  spotlightEmpty.className = "spotlight-empty";
  spotlightEmpty.setAttribute("role", "presentation");
  spotlightEmpty.hidden = true;

  function buildSpotlight() {
    const options = [
      makeOption({
        id: "spot-jump",
        mode: "commands",
        action: "mode",
        target: "jump",
        label: "Jump to…",
        search: "jump go navigate path section",
        keys: [altName, "J"],
        keyshortcuts: "Alt+J"
      }),
      makeOption({
        id: "spot-find",
        mode: "commands",
        action: "mode",
        target: "topics",
        label: "Find a topic…",
        search: "find search topic lesson",
        keys: [altName, "Shift", "F"],
        keyshortcuts: "Alt+Shift+F"
      }),
      makeOption({
        id: "spot-theme",
        mode: "commands",
        action: "theme",
        label: "Toggle theme",
        search: "toggle switch dark light theme appearance",
        keys: [altName, "Shift", "T"],
        keyshortcuts: "Alt+Shift+T"
      }),
      makeOption({
        id: "spot-shortcuts",
        mode: "commands",
        action: "shortcuts",
        label: "Keyboard shortcuts",
        search: "keyboard shortcuts keys commands help",
        keys: [altName, "/"],
        keyshortcuts: "Alt+/"
      })
    ];
    destinations.forEach((dest, destIndex) => {
      options.push(makeOption({
        id: "spot-dest-" + dest.id,
        mode: "jump",
        action: "navigate",
        target: dest.id,
        label: ordinal(destIndex + 1) + " " + dest.title,
        search: ordinal(destIndex + 1) + " " + dest.title + " " + dest.search,
        keys: [altName, String(destIndex + 1)],
        keyshortcuts: "Alt+" + (destIndex + 1)
      }));
    });
    index.topics.forEach(({ path, stage, topic }) => {
      options.push(makeOption({
        id: "spot-topic-" + topic.id,
        mode: "topics",
        action: "topic",
        target: topic.id,
        label: topic.title,
        aside: path.title,
        search: [topic.code, topic.title, topic.summary, topic.about, topic.covers.join(" "), path.title, stage.title].join(" ")
      }));
    });
    spotlightResults.replaceChildren(...options, spotlightEmpty);
  }

  function visibleOptions() {
    return [...spotlightResults.querySelectorAll("[role='option']")].filter((option) => !option.hidden);
  }

  function selectOption(option) {
    spotlightResults.querySelectorAll("[role='option']").forEach((item) => {
      const selected = item === option;
      item.classList.toggle("active", selected);
      item.setAttribute("aria-selected", selected ? "true" : "false");
    });
    if (option) {
      spotlightInput.setAttribute("aria-activedescendant", option.id);
      const listRect = spotlightResults.getBoundingClientRect();
      const optionRect = option.getBoundingClientRect();
      if (optionRect.top < listRect.top) spotlightResults.scrollTop += optionRect.top - listRect.top;
      else if (optionRect.bottom > listRect.bottom) spotlightResults.scrollTop += optionRect.bottom - listRect.bottom;
    } else {
      spotlightInput.removeAttribute("aria-activedescendant");
    }
  }

  function applyFilter() {
    const query = spotlightInput.value.trim().toLocaleLowerCase();
    let first = null;
    let count = 0;
    spotlightResults.querySelectorAll("[role='option']").forEach((option) => {
      const matches = option.dataset.mode === spotMode && (!query || option.dataset.search.toLocaleLowerCase().includes(query));
      option.hidden = !matches;
      if (matches) {
        count += 1;
        if (!first) first = option;
      }
    });
    spotlightEmpty.hidden = count !== 0;
    spotlightEmpty.textContent = MODE_COPY[spotMode].empty;
    selectOption(first);
    return count;
  }

  function announceFilter() {
    const count = visibleOptions().length;
    spotlightStatus.textContent = count === 0 ? MODE_COPY[spotMode].empty : count + " " + MODE_COPY[spotMode].noun;
  }

  function setMode(mode, clear) {
    spotMode = mode;
    const copy = MODE_COPY[mode];
    spotlightDialog.setAttribute("aria-label", copy.dialog);
    spotlightInput.setAttribute("aria-label", copy.input);
    spotlightInput.placeholder = copy.placeholder;
    spotlightResults.setAttribute("aria-label", copy.list);
    if (clear) spotlightInput.value = "";
    applyFilter();
    if (spotAnnounce) announceFilter();
  }

  function openSpotlight(mode) {
    if (shortcutsDialog.open) shortcutsDialog.close();
    if (!spotlightDialog.open) spotlightDialog.showModal();
    spotlightTrigger.setAttribute("aria-expanded", "true");
    spotlightInput.setAttribute("aria-expanded", "true");
    spotAnnounce = false;
    setMode(mode, true);
    spotAnnounce = true;
    spotlightInput.focus();
  }

  function closeSpotlight(suppressReturn) {
    if (!spotlightDialog.open) return;
    if (suppressReturn) suppressSpotlightReturn = true;
    spotlightDialog.close();
    if (suppressReturn) suppressSpotlightReturn = false;
  }

  function runOption(option) {
    const action = option.dataset.action;
    if (action === "mode") {
      setMode(option.dataset.target, true);
      spotlightInput.focus();
      return;
    }
    if (action === "theme") {
      toggleTheme();
      closeSpotlight(false);
      return;
    }
    if (action === "shortcuts") {
      closeSpotlight(true);
      openShortcuts(spotlightTrigger);
      return;
    }
    if (action === "navigate") {
      closeSpotlight(true);
      setHash(option.dataset.target);
      return;
    }
    if (action === "topic") {
      closeSpotlight(true);
      showTopic(option.dataset.target);
    }
  }

  function moveActive(delta) {
    const options = visibleOptions();
    if (!options.length) return;
    const current = options.findIndex((option) => option.classList.contains("active"));
    const next = current === -1 ? 0 : (current + delta + options.length) % options.length;
    selectOption(options[next]);
  }

  function fillShortcuts() {
    const rows = [
      ["Open search and commands", apple ? [["Ctrl", "K"], ["⌘", "K"], ["Ctrl", "Space"]] : [["Ctrl", "K"], ["Ctrl", "Space"]]],
      ["Jump to a path", [[altName, "J"]]],
      ["Find a topic", [[altName, "Shift", "F"]]],
      ["Toggle theme", [[altName, "Shift", "T"]]],
      ["Keyboard shortcuts", [[altName, "/"]]],
      ["Previous section", [[altName, "Up"]]],
      ["Next section", [[altName, "Down"]]]
    ];
    destinations.forEach((dest, destIndex) => {
      rows.push([ordinal(destIndex + 1) + " " + dest.title, [[altName, String(destIndex + 1)]]]);
    });
    shortcutList.replaceChildren();
    rows.forEach(([label, groups]) => {
      const row = document.createElement("div");
      row.className = "shortcut-row";
      const term = document.createElement("dt");
      term.textContent = label;
      const detail = document.createElement("dd");
      groups.forEach((group, groupIndex) => {
        if (groupIndex > 0) {
          const or = document.createElement("span");
          or.className = "shortcut-alternative";
          or.textContent = "or";
          detail.append(or);
        }
        const keys = document.createElement("span");
        keys.className = "shortcut-keys";
        fillKeys(keys, group);
        detail.append(keys);
      });
      row.append(term, detail);
      shortcutList.append(row);
    });
  }

  function openShortcuts(invoker) {
    shortcutsInvoker = invoker && invoker.isConnected ? invoker : spotlightTrigger;
    fillShortcuts();
    if (!shortcutsDialog.open) shortcutsDialog.showModal();
    shortcutsDialog.querySelector(".modal-close").focus();
  }

  function shortcutsSuspended() {
    if (tocDrawer.open || topicDialog.open || shortcutsDialog.open) return true;
    const el = document.activeElement;
    if (!el) return false;
    if (spotlightDialog.open && spotlightDialog.contains(el)) return false;
    if (el.closest && el.closest("dialog")) return true;
    return el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable;
  }

  function traverse(delta) {
    const sections = [...document.querySelectorAll("#view section")];
    if (!sections.length) return;
    const marked = navRoot.querySelector("[aria-current='location']");
    const id = marked ? marked.dataset.target : (pinnedId || sections[0].id);
    let currentIndex = sections.findIndex((section) => section.id === id);
    if (currentIndex < 0) currentIndex = 0;
    const next = currentIndex + delta;
    if (next < 0 || next >= sections.length) return;
    setHash(sections[next].id);
  }

  function placeNav() {
    tocDrawerBody.append(navRoot);
  }

  function openToc() {
    if (tocDrawer.open) return;
    tocDrawer.showModal();
    document.documentElement.classList.add("toc-open");
    tocTrigger.setAttribute("aria-expanded", "true");
    const current = navRoot.querySelector("[aria-current='location']") || navRoot.querySelector("[aria-current='page']");
    if (current) {
      current.focus({ preventScroll: true });
      current.scrollIntoView({ block: "nearest" });
    }
  }

  themeToggleBtn.addEventListener("click", toggleTheme);
  tocTrigger.addEventListener("click", openToc);
  document.getElementById("tocClose").addEventListener("click", () => tocDrawer.close());
  spotlightTrigger.addEventListener("click", () => openSpotlight("commands"));

  [tocDrawer, spotlightDialog, shortcutsDialog, topicDialog].forEach((dialog) => {
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
  });

  tocDrawer.addEventListener("close", () => {
    document.documentElement.classList.remove("toc-open");
    tocTrigger.setAttribute("aria-expanded", "false");
    if (!suppressTocReturn) tocTrigger.focus({ preventScroll: true });
  });

  spotlightDialog.addEventListener("close", () => {
    spotlightTrigger.setAttribute("aria-expanded", "false");
    spotlightInput.setAttribute("aria-expanded", "false");
    if (!suppressSpotlightReturn) spotlightTrigger.focus({ preventScroll: true });
  });

  shortcutsDialog.addEventListener("close", () => {
    if (shortcutsInvoker && shortcutsInvoker.isConnected) shortcutsInvoker.focus({ preventScroll: true });
  });
  shortcutsDialog.querySelector(".modal-close").addEventListener("click", () => shortcutsDialog.close());

  topicDialog.addEventListener("close", () => {
    if (dialogInvoker && dialogInvoker.isConnected) dialogInvoker.focus({ preventScroll: true });
    else {
      const heading = document.querySelector("#view h1, #view h2");
      if (heading) heading.focus({ preventScroll: true });
    }
  });
  topicClose.addEventListener("click", () => topicDialog.close());
  bridgeBtn.addEventListener("click", () => {
    const pathId = bridgeBtn.dataset.path;
    topicDialog.close();
    setHash(pathId);
  });
  document.getElementById("topicBody").addEventListener("click", (event) => {
    const button = event.target.closest("[data-topic-jump]");
    if (!button) return;
    showTopic(button.dataset.topicJump);
  });

  navRoot.addEventListener("click", (event) => {
    const link = event.target.closest("a[href^='#']");
    if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (tocDrawer.open) {
      suppressTocReturn = true;
      tocDrawer.close();
      suppressTocReturn = false;
    }
    setHash(link.dataset.target);
  });

  view.addEventListener("click", (event) => {
    const topicButton = event.target.closest("[data-open-topic]");
    if (topicButton) showTopic(topicButton.dataset.openTopic);
  });

  spotlightInput.addEventListener("input", () => {
    applyFilter();
    announceFilter();
  });
  spotlightInput.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveActive(1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      moveActive(-1);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const active = spotlightResults.querySelector("[role='option'].active");
      if (active) runOption(active);
    } else if (event.key === "Escape") {
      event.preventDefault();
      closeSpotlight(false);
    }
  });
  spotlightResults.addEventListener("mousemove", (event) => {
    const option = event.target.closest("[role='option']");
    if (option && !option.hidden) selectOption(option);
  });
  spotlightResults.addEventListener("click", (event) => {
    const option = event.target.closest("[role='option']");
    if (option && !option.hidden) runOption(option);
  });

  document.addEventListener("pointerover", (event) => {
    const target = event.target.closest("[data-tooltip]");
    if (target) scheduleTip(target);
  });
  document.addEventListener("pointerout", (event) => {
    const target = event.target.closest("[data-tooltip]");
    if (target && tipTarget === target) hideTip();
  });
  document.addEventListener("focusin", (event) => {
    const target = event.target.closest("[data-tooltip]");
    if (target) scheduleTip(target);
  });
  document.addEventListener("focusout", (event) => {
    const target = event.target.closest("[data-tooltip]");
    if (target && tipTarget === target) hideTip();
  });
  window.addEventListener("scroll", () => {
    if (tipTarget && tooltip.matches(":popover-open")) placeTip(tipTarget);
    updateStageCurrent();
  }, true);
  window.addEventListener("resize", () => {
    if (tipTarget && tooltip.matches(":popover-open")) placeTip(tipTarget);
    drawWires();
    updateStageCurrent();
  });
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", () => {
      if (tipTarget && tooltip.matches(":popover-open")) placeTip(tipTarget);
    });
    window.visualViewport.addEventListener("scroll", () => {
      if (tipTarget && tooltip.matches(":popover-open")) placeTip(tipTarget);
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && tooltip.matches(":popover-open")) hideTip();
    const modK = (event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey && event.key.toLowerCase() === "k";
    const ctrlSpace = event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey && event.code === "Space";
    if ((modK || ctrlSpace) && !shortcutsSuspended()) {
      event.preventDefault();
      if (spotlightDialog.open) closeSpotlight(false);
      else openSpotlight("commands");
      return;
    }
    if (shortcutsSuspended() || !event.altKey || event.ctrlKey || event.metaKey) return;
    if (!event.shiftKey && event.code === "KeyJ") {
      event.preventDefault();
      openSpotlight("jump");
    } else if (event.shiftKey && event.code === "KeyF") {
      event.preventDefault();
      openSpotlight("topics");
    } else if (event.shiftKey && event.code === "KeyT") {
      event.preventDefault();
      toggleTheme();
    } else if (!event.shiftKey && event.code === "Slash") {
      event.preventDefault();
      const fromSpotlight = spotlightDialog.open;
      const invoker = fromSpotlight
        ? spotlightTrigger
        : (document.activeElement && document.activeElement !== document.body ? document.activeElement : spotlightTrigger);
      if (fromSpotlight) closeSpotlight(true);
      openShortcuts(invoker);
    } else if (!event.shiftKey && (event.code === "ArrowUp" || event.code === "ArrowDown")) {
      event.preventDefault();
      traverse(event.code === "ArrowDown" ? 1 : -1);
    } else if (!event.shiftKey) {
      const digit = ["Digit1", "Digit2", "Digit3", "Digit4", "Digit5"].indexOf(event.code);
      if (digit >= 0) {
        event.preventDefault();
        if (spotlightDialog.open) closeSpotlight(true);
        setHash(destinations[digit].id);
      }
    }
  });

  window.addEventListener("hashchange", () => {
    if (applying) return;
    const target = resolve(location.hash);
    if (!target.valid) {
      history.replaceState(null, "", "#map");
      applyLocation(resolve("#map"), { scroll: false });
      return;
    }
    applyLocation(target, { scroll: true });
  });

  mobileQuery.addEventListener("change", placeNav);

  syncThemeControls();
  renderTree();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawWires);
  renderContents();
  buildSpotlight();
  placeNav();

  let start = resolve(location.hash);
  if (!start.valid) {
    history.replaceState(null, "", "#map");
    start = resolve("#map");
  }
  const shouldScroll = start.sectionId !== "map";
  applyLocation(start, { scroll: shouldScroll });
  if (shouldScroll) {
    const sectionId = start.sectionId;
    const correct = () => scrollToSection(sectionId, "auto");
    if (document.readyState === "complete") correct();
    else window.addEventListener("load", correct, { once: true });
  }
})();
