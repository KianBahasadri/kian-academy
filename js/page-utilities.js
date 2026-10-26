"use strict";

(() => {
  // Vendored Lucide paths. See licenses/LUCIDE-LICENSE.txt.
  const paths = {
    book: '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
    play: '<path d="M9 9.003a1 1 0 0 1 1.517-.859l4.997 2.997a1 1 0 0 1 0 1.718l-4.997 2.997A1 1 0 0 1 9 14.996z"/><circle cx="12" cy="12" r="10"/>',
    pencil: '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>',
    reflect: '<path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z"/>',
    check: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
    arrow: '<path d="M7 7h10v10M7 17 17 7"/>',
    forward: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
    chevron: '<path d="m9 18 6-6-6-6"/>',
    search: '<path d="m21 21-4.34-4.34"/><circle cx="11" cy="11" r="8"/>',
    x: '<path d="M18 6 6 18m0-12 12 12"/>',
    plus: '<path d="M5 12h14M12 5v14"/>',
    minus: '<path d="M5 12h14"/>',
    moon: '<path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>'
  };
  const icon = (name) => `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths[name]}</svg>`;

  function mount({ resources, resourcePath, navigate, addResource, exportProgress, restoreProgress }) {
    const $ = (id) => document.getElementById(id);
    const palette = $("command-palette"), query = $("command-query"), list = $("command-options");
    const launcher = $("search-launcher"), themeButton = $("theme-toggle"), shortcuts = $("keyboard-shortcuts");
    const apple = /Mac|iPhone|iPad/.test(navigator.platform);
    let mode = "commands", active = 0, visible = [], shortcutsInvoker;

    function updateTheme() {
      const dark = document.documentElement.dataset.theme === "dark";
      const label = `Switch to ${dark ? "light" : "dark"} theme`;
      themeButton.innerHTML = icon(dark ? "sun" : "moon");
      themeButton.setAttribute("aria-label", label);
      themeButton.dataset.tooltip = label;
    }
    function toggleTheme() {
      const theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = theme;
      try { localStorage.setItem("psych-curriculum-theme", theme); } catch {}
      hideTooltip(); updateTheme();
    }
    function keycaps(keys) {
      const group = document.createElement("span"); group.className = "key-group"; group.setAttribute("aria-hidden", "true");
      for (const key of keys) {
        const cap = document.createElement("kbd");
        cap.textContent = apple && key === "Alt" ? "⌥" : apple && key === "Meta" ? "⌘" : key === "Control" ? "Ctrl" : key;
        group.append(cap);
      }
      return group;
    }
    const destinations = [
      { label: "Home", path: "#home" }, { label: "Resources", path: "#curriculum" },
      { label: "Resource map", path: "#map" }, { label: "My progress", path: "#progress" }
    ].map((item, index) => ({ ...item, keys: ["Alt", String(index + 1)], code: `Digit${index + 1}`, run: () => navigate(item.path) }));
    const commands = [
      { label: "Jump to…", keys: ["Alt", "J"], code: "KeyJ", run: () => openPalette("destinations") },
      { label: "Add a resource", keys: ["Alt", "N"], code: "KeyN", run: addResource },
      { label: "Download progress", keys: ["Alt", "E"], code: "KeyE", run: exportProgress },
      { label: "Restore progress", keys: ["Alt", "I"], code: "KeyI", run: restoreProgress },
      { label: "Toggle theme", keys: ["Alt", "Shift", "T"], code: "KeyT", run: toggleTheme },
      { label: "Keyboard shortcuts", keys: ["Alt", "/"], code: "Slash", run: openShortcuts }
    ];
    for (const item of destinations) document.querySelector(`.primary-nav a[href="${item.path}"]`).setAttribute("aria-keyshortcuts", item.keys.join("+"));

    function setActive(index, scroll = false) {
      active = Math.max(0, Math.min(visible.length - 1, index));
      [...list.querySelectorAll('[role="option"]')].forEach((row, i) => row.setAttribute("aria-selected", String(i === active)));
      if (visible.length) query.setAttribute("aria-activedescendant", `command-option-${active}`);
      else query.removeAttribute("aria-activedescendant");
      if (scroll) $("command-option-" + active)?.scrollIntoView({ block: "nearest" });
    }
    function renderOptions() {
      const options = mode === "commands" ? commands : [...destinations, ...resources().map((resource) => ({
        label: resource.title,
        searchText: `${resource.title} ${resource.author} ${resource.tags.join(" ")}`,
        run: () => navigate(resourcePath(resource))
      }))];
      const term = query.value.trim().toLocaleLowerCase();
      visible = options.filter((option) => (option.searchText || option.label).toLocaleLowerCase().includes(term));
      list.replaceChildren();
      visible.forEach((option, index) => {
        const row = document.createElement("div"); row.className = "command-option"; row.id = `command-option-${index}`;
        row.setAttribute("role", "option");
        if (option.keys) row.setAttribute("aria-keyshortcuts", option.keys.join("+"));
        const label = document.createElement("span"); label.textContent = option.label; row.append(label);
        if (option.keys) row.append(keycaps(option.keys));
        row.addEventListener("pointermove", () => setActive(index));
        row.addEventListener("pointerdown", (event) => event.preventDefault());
        row.addEventListener("click", () => execute(index));
        list.append(row);
      });
      if (!visible.length) {
        const empty = document.createElement("p"); empty.className = "command-empty";
        empty.textContent = `No matching ${mode === "commands" ? "commands" : "resources or pages"}`; list.append(empty);
      }
      $("command-status").textContent = `${visible.length} results`;
      setActive(0); list.scrollTop = 0;
    }
    function openPalette(nextMode = "commands") {
      hideTooltip(); mode = nextMode; query.value = "";
      const title = mode === "commands" ? "Search and commands" : "Jump to a resource or page";
      const inputName = mode === "commands" ? "Search commands" : "Search resources and pages";
      $("command-title").textContent = title;
      document.querySelector('label[for="command-query"]').textContent = inputName;
      query.placeholder = `${inputName}…`;
      list.setAttribute("aria-label", mode === "commands" ? "Commands" : "Resources and pages");
      renderOptions();
      if (!palette.open) palette.showModal();
      query.setAttribute("aria-expanded", "true"); query.focus();
    }
    function execute(index) {
      const option = visible[index]; if (!option) return;
      if (option === commands[0]) { option.run(); return; }
      palette.close(); option.run();
    }
    function openShortcuts() {
      hideTooltip(); shortcutsInvoker = palette.open ? launcher : document.activeElement;
      if (palette.open) palette.close();
      const rows = [
        { label: "Open search and commands", alternatives: [["Control", "K"], ["Meta", "K"], ["Control", "Space"]] },
        ...commands, ...destinations,
        { label: "Move through search results", alternatives: [["↑"], ["↓"]] },
        { label: "Open selected result", keys: ["Enter"] }, { label: "Close dialog", keys: ["Escape"] },
        { label: "Pan map (with map focused)", alternatives: [["↑"], ["↓"], ["←"], ["→"]] },
        { label: "Zoom map (with map focused)", alternatives: [["+"], ["−"]] },
        { label: "Fit map (with map focused)", keys: ["0"] },
        { label: "Select map resource (with node focused)", alternatives: [["Enter"], ["Space"]] }
      ];
      $("shortcut-list").replaceChildren();
      for (const item of rows) {
        const row = document.createElement("div"), label = document.createElement("dt"), keys = document.createElement("dd");
        label.textContent = item.label;
        for (const combination of item.alternatives || [item.keys]) keys.append(keycaps(combination));
        // Shortcut keys are part of this dialog's accessible text.
        keys.querySelectorAll('[aria-hidden]').forEach((group) => group.removeAttribute("aria-hidden"));
        row.append(label, keys); $("shortcut-list").append(row);
      }
      shortcuts.showModal(); shortcuts.querySelector("button").focus();
    }
    launcher.addEventListener("click", () => openPalette());
    themeButton.addEventListener("click", toggleTheme);
    query.addEventListener("input", renderOptions);
    query.addEventListener("keydown", (event) => {
      if (event.isComposing) return;
      if (["ArrowDown", "ArrowUp"].includes(event.key)) { event.preventDefault(); setActive(active + (event.key === "ArrowDown" ? 1 : -1), true); }
      if (event.key === "Enter") { event.preventDefault(); execute(active); }
      if (event.key === "Escape") { event.preventDefault(); palette.close(); }
    });
    palette.addEventListener("close", () => {
      query.setAttribute("aria-expanded", "false"); query.removeAttribute("aria-activedescendant");
      if (!document.querySelector("dialog[open]")) launcher.focus({ preventScroll: true });
    });
    shortcuts.addEventListener("click", (event) => { if (event.target.closest("[data-close-shortcuts]")) shortcuts.close(); });
    shortcuts.addEventListener("close", () => { if (shortcutsInvoker?.isConnected) shortcutsInvoker.focus({ preventScroll: true }); });
    document.querySelectorAll("dialog").forEach((dialog) => {
      dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
      dialog.addEventListener("keydown", (event) => {
        if (event.key !== "Tab") return;
        const controls = [...dialog.querySelectorAll('button, input, select, textarea, a[href], [tabindex]')]
          .filter((control) => control.tabIndex >= 0 && !control.matches(":disabled") && control.getClientRects().length);
        const first = controls[0], last = controls.at(-1);
        if (first && (event.shiftKey && document.activeElement === first || !event.shiftKey && document.activeElement === last)) {
          event.preventDefault(); (event.shiftKey ? last : first).focus();
        }
      });
    });
    document.addEventListener("keydown", (event) => {
      if (event.isComposing || event.defaultPrevented) return;
      if ((event.ctrlKey || event.metaKey) && (event.code === "KeyK" || event.ctrlKey && event.code === "Space")) {
        if (document.querySelector("dialog[open]") && !palette.open) return;
        event.preventDefault(); if (palette.open) palette.close(); else openPalette(); return;
      }
      if (!event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.target !== query && (event.target.closest("input, textarea, select, [role='combobox'], [contenteditable='true']") || document.querySelector("dialog[open]"))) return;
      const command = [...commands, ...destinations].find((item) => event.code === item.code && event.shiftKey === item.keys.includes("Shift"));
      if (command) { event.preventDefault(); if (palette.open && command !== commands[0]) palette.close(); command.run(); }
    });

    const tooltip = $("utility-tooltip");
    let tooltipTrigger, tooltipTimer;
    function hideTooltip() {
      clearTimeout(tooltipTimer); tooltip.hidden = true;
      tooltipTrigger?.removeAttribute("aria-describedby"); tooltipTrigger = null;
    }
    function placeTooltip() {
      if (!tooltipTrigger?.isConnected) { hideTooltip(); return; }
      const bounds = tooltipTrigger.getBoundingClientRect(), view = window.visualViewport;
      const left = view?.offsetLeft || 0, top = view?.offsetTop || 0;
      const width = view?.width || window.innerWidth, height = view?.height || window.innerHeight;
      tooltip.style.maxWidth = `${Math.min(360, width - 24)}px`;
      const box = tooltip.getBoundingClientRect();
      tooltip.style.left = `${Math.max(left + 12, Math.min(bounds.left + (bounds.width - box.width) / 2, left + width - box.width - 12))}px`;
      const above = bounds.top - box.height - 8;
      tooltip.style.top = `${Math.max(top + 12, Math.min(above >= top + 12 ? above : bounds.bottom + 8, top + height - box.height - 12))}px`;
    }
    function showTooltip(trigger) {
      if (tooltipTrigger === trigger) return;
      hideTooltip(); tooltipTrigger = trigger;
      tooltipTimer = setTimeout(() => {
        if (!trigger.isConnected) { hideTooltip(); return; }
        tooltip.textContent = trigger.dataset.tooltip;
        (trigger.closest("dialog") || document.body).append(tooltip);
        tooltip.hidden = false; trigger.setAttribute("aria-describedby", tooltip.id); placeTooltip();
      }, 150);
    }
    document.addEventListener("pointerover", (event) => { const trigger = event.target.closest("[data-tooltip]"); if (trigger) showTooltip(trigger); });
    document.addEventListener("pointerout", (event) => { if (tooltipTrigger && !tooltipTrigger.contains(event.relatedTarget)) hideTooltip(); });
    document.addEventListener("focusin", (event) => { const trigger = event.target.closest("[data-tooltip]"); if (trigger) showTooltip(trigger); });
    document.addEventListener("focusout", (event) => { if (event.target === tooltipTrigger) hideTooltip(); });
    document.addEventListener("pointerdown", hideTooltip);
    document.addEventListener("keydown", (event) => { if (event.key === "Escape") hideTooltip(); });
    window.addEventListener("scroll", () => { if (!tooltip.hidden) placeTooltip(); }, true);
    window.addEventListener("resize", () => { if (!tooltip.hidden) placeTooltip(); });
    window.visualViewport?.addEventListener("resize", () => { if (!tooltip.hidden) placeTooltip(); });
    window.visualViewport?.addEventListener("scroll", () => { if (!tooltip.hidden) placeTooltip(); });
    updateTheme();
  }
  window.PageUtilities = { icon, mount };
})();
