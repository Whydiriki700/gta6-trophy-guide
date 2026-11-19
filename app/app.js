// Leonida Ledger — trophy guide and tracker for GTA VI (PS5).
// Plain browser script: loads data/trophies.json, renders the checklist,
// keeps progress in localStorage, and offers export/import of that progress.
// No network calls beyond the app's own data file; no libraries.

const STORAGE_KEY = "leonida-ledger-progress-v1";

const STAGES = [
  { n: 1, title: "Arrival — Chapter 1", note: "The opening mission and Chapter 1. Meditate at the Chapter 1 balcony spot before the chapter ends: it does not come back, and there is no mission replay." },
  { n: 2, title: "The partnership — Chapters 2 to 4", note: "Both protagonists are playable from Chapter 2. The partner feats, the VCIA airport mission and the bowling alley visit all live in these chapters." },
  { n: 3, title: "Endings — the finale and the strand finales", note: "The final mission plus the last mission of every stranger strand. Save before the finale: its choices feed the 500-choice counter." },
  { n: 4, title: "The sweep — collectibles and the map", note: "Card sets, WAiNK spots, discovered vehicles, every area of Leonida and the garage properties: a district-by-district pass." },
  { n: 5, title: "The grind — activities, feats and money", note: "Stunts, shooting ranges, races, robberies and the money trophies. Repeatable at leisure; only the flagged one-off moments need care." },
  { n: 6, title: "100 percent — and the platinum", note: "Top the in-game completion checklist off at 100 percent. The platinum is awarded on its own when the 54th other trophy lands." }
];

const state = {
  trophies: [],
  earned: loadProgress(),
  kind: "all",
  grade: "all",
  query: "",
  onlyUnearned: false,
  shield: false,
  selectedId: null
};

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    const list = Array.isArray(parsed) ? parsed : parsed.earned;
    return new Set(Array.isArray(list) ? list : []);
  } catch (err) {
    return new Set();
  }
}

function saveProgress() {
  const payload = { app: "leonida-ledger", version: 1, earned: [...state.earned].sort((a, b) => a - b) };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function isMasked(trophy) {
  return state.shield && trophy.kind === "story" && !state.earned.has(trophy.id);
}

function displayName(trophy) {
  return isMasked(trophy) ? "Hidden story trophy" : trophy.name;
}

function displayDesc(trophy) {
  return isMasked(trophy)
    ? "Name and description hidden by the spoiler shield until this trophy is earned."
    : trophy.description;
}

function matchesFilters(trophy) {
  if (state.kind === "online") return false; // the official list has no online trophies
  if (state.kind === "missable" && !trophy.missable) return false;
  if (state.kind !== "all" && state.kind !== "missable" && trophy.kind !== state.kind) return false;
  if (state.grade !== "all" && trophy.grade !== state.grade) return false;
  if (state.onlyUnearned && state.earned.has(trophy.id)) return false;
  if (state.query) {
    const haystack = (trophy.name + " " + trophy.description + " " + trophy.kind).toLowerCase();
    if (!haystack.includes(state.query)) return false;
  }
  return true;
}

function tagHtml(trophy) {
  const tags = [];
  tags.push('<span class="tag grade grade-' + trophy.grade + '">' + escapeHtml(trophy.grade) + "</span>");
  if (trophy.kind !== trophy.grade) {
    tags.push('<span class="tag">' + escapeHtml(trophy.kind) + "</span>");
  }
  if (trophy.hidden) tags.push('<span class="tag hidden-tag">Hidden on PSN</span>');
  if (trophy.missable) tags.push('<span class="tag missable">Missable</span>');
  if (isMasked(trophy)) tags.push('<span class="tag masked">Shielded</span>');
  if (typeof trophy.count === "number") tags.push('<span class="tag">Target: ' + trophy.count.toLocaleString("en-US") + "</span>");
  return tags.join("");
}

function renderList() {
  const list = document.getElementById("trophy-list");
  const visible = state.trophies.filter(matchesFilters);
  document.getElementById("empty-state").hidden = visible.length > 0;
  document.getElementById("result-count").textContent =
    "Showing " + visible.length + " of " + state.trophies.length + " trophies" +
    (state.kind === "online" ? " — the official list has no online trophies." : ".");
  list.innerHTML = visible.map((trophy) => {
    const earned = state.earned.has(trophy.id);
    return (
      '<li class="trophy-row grade-' + trophy.grade + (earned ? " earned" : "") +
      (state.selectedId === trophy.id ? " selected" : "") + '" data-id="' + trophy.id + '">' +
      '<input type="checkbox" data-check="' + trophy.id + '"' + (earned ? " checked" : "") +
      ' aria-label="Mark ' + escapeHtml(trophy.name) + ' as earned">' +
      '<div class="row-main"><div class="row-name">' + escapeHtml(displayName(trophy)) + "</div>" +
      '<div class="row-desc">' + escapeHtml(displayDesc(trophy)) + "</div>" +
      '<div class="row-tags">' + tagHtml(trophy) + "</div></div></li>"
    );
  }).join("");
}

function renderProgress() {
  const total = state.trophies.length;
  const done = state.earned.size;
  const pct = total ? Math.round((done / total) * 100) : 0;
  document.getElementById("progress-pct").textContent = pct + "%";
  document.getElementById("progress-count").textContent = done + " of " + total + " earned";
  document.getElementById("progress-fill").style.width = pct + "%";
  const byGrade = {};
  for (const trophy of state.trophies) {
    byGrade[trophy.grade] = byGrade[trophy.grade] || { have: 0, total: 0 };
    byGrade[trophy.grade].total += 1;
    if (state.earned.has(trophy.id)) byGrade[trophy.grade].have += 1;
  }
  document.getElementById("grade-counts").innerHTML = ["platinum", "gold", "silver", "bronze"]
    .filter((g) => byGrade[g])
    .map((g) => "<span>" + g + ": <b>" + byGrade[g].have + "/" + byGrade[g].total + "</b></span>")
    .join("");
}

function renderDetail() {
  const pane = document.getElementById("detail");
  const trophy = state.trophies.find((t) => t.id === state.selectedId);
  if (!trophy) {
    pane.innerHTML = '<p class="detail-placeholder">Select a trophy to read its guide, steps and sources.</p>';
    return;
  }
  const earned = state.earned.has(trophy.id);
  if (isMasked(trophy)) {
    pane.innerHTML =
      "<h2>Hidden story trophy</h2>" +
      '<p class="detail-desc">The spoiler shield is on. This story trophy\'s name, description and guide stay hidden until you earn it.</p>' +
      '<div class="row-tags">' + tagHtml(trophy) + "</div>" +
      '<label class="detail-check"><input type="checkbox" data-check="' + trophy.id + '"> I earned this trophy</label>';
    return;
  }
  const sources = trophy.sources.map((source) =>
    source.url
      ? '<li><a href="' + escapeHtml(source.url) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(source.label) + "</a></li>"
      : "<li>" + escapeHtml(source.label) + "</li>"
  ).join("");
  const steps = trophy.steps.map((step) => "<li>" + escapeHtml(step) + "</li>").join("");
  pane.innerHTML =
    "<h2>" + escapeHtml(trophy.name) + "</h2>" +
    '<p class="detail-desc">“' + escapeHtml(trophy.description) + '” — official PlayStation description</p>' +
    '<div class="row-tags">' + tagHtml(trophy) + "</div>" +
    (trophy.missable
      ? '<div class="missable-box"><b>Missable — read before you play on</b>' + escapeHtml(trophy.missableReason || "") + "</div>"
      : "") +
    "<h3>Guide</h3><p class=\"detail-guide\">" + escapeHtml(trophy.guide) + "</p>" +
    "<h3>Steps</h3><ol class=\"detail-steps\">" + steps + "</ol>" +
    "<h3>Sources</h3><ul class=\"detail-sources\">" + sources + "</ul>" +
    '<label class="detail-check"><input type="checkbox" data-check="' + trophy.id + '"' + (earned ? " checked" : "") + "> I earned this trophy</label>";
}

function renderRoadmap() {
  const wrap = document.getElementById("roadmap-stages");
  wrap.innerHTML = STAGES.map((stage) => {
    const members = state.trophies.filter((t) => t.stage === stage.n);
    const doneCount = members.filter((t) => state.earned.has(t.id)).length;
    const items = members.map((trophy) =>
      '<li class="' + (state.earned.has(trophy.id) ? "done" : "") + '" data-id="' + trophy.id + '">' +
      '<span class="stage-dot grade-' + trophy.grade + '"></span><span>' + escapeHtml(displayName(trophy)) +
      (trophy.missable ? ' <span class="tag missable">Missable</span>' : "") + "</span></li>"
    ).join("");
    return (
      '<article class="stage-card"><h3><span class="stage-num">Stage ' + stage.n + ".</span> " + escapeHtml(stage.title) +
      ' <span class="tag">' + doneCount + "/" + members.length + " earned</span></h3>" +
      '<p class="stage-note">' + escapeHtml(stage.note) + "</p>" +
      '<ul class="stage-list">' + items + "</ul></article>"
    );
  }).join("");
}

function renderAll() {
  renderProgress();
  renderList();
  renderDetail();
  renderRoadmap();
}

function toggleEarned(id, on) {
  if (on) state.earned.add(id); else state.earned.delete(id);
  saveProgress();
  renderAll();
}

function exportProgress() {
  const payload = {
    app: "leonida-ledger",
    version: 1,
    exportedAt: new Date().toISOString(),
    earned: [...state.earned].sort((a, b) => a - b)
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "leonida-ledger-progress.json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function importProgress(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      const list = Array.isArray(parsed) ? parsed : parsed.earned;
      if (!Array.isArray(list)) throw new Error("no earned list");
      const valid = new Set(state.trophies.map((t) => t.id));
      state.earned = new Set(list.filter((id) => valid.has(id)));
      saveProgress();
      renderAll();
    } catch (err) {
      alert("That file does not look like a Leonida Ledger progress export.");
    }
  };
  reader.readAsText(file);
}

function wireControls() {
  document.getElementById("search").addEventListener("input", (event) => {
    state.query = event.target.value.trim().toLowerCase();
    renderList();
  });
  document.getElementById("kind-chips").addEventListener("click", (event) => {
    const button = event.target.closest("[data-kind]");
    if (!button) return;
    state.kind = button.dataset.kind;
    for (const chip of document.querySelectorAll("#kind-chips .chip")) {
      chip.classList.toggle("active", chip === button);
    }
    document.getElementById("online-note").hidden = state.kind !== "online";
    renderList();
  });
  document.getElementById("grade-filter").addEventListener("change", (event) => {
    state.grade = event.target.value;
    renderList();
  });
  document.getElementById("only-unearned").addEventListener("change", (event) => {
    state.onlyUnearned = event.target.checked;
    renderList();
  });
  document.getElementById("spoiler-shield").addEventListener("change", (event) => {
    state.shield = event.target.checked;
    renderAll();
  });
  document.getElementById("export-btn").addEventListener("click", exportProgress);
  const fileInput = document.getElementById("import-file");
  document.getElementById("import-btn").addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", () => {
    if (fileInput.files && fileInput.files[0]) importProgress(fileInput.files[0]);
    fileInput.value = "";
  });
  document.body.addEventListener("click", (event) => {
    const check = event.target.closest("[data-check]");
    if (check) {
      toggleEarned(Number(check.dataset.check), check.checked);
      return;
    }
    const row = event.target.closest("[data-id]");
    if (row) {
      state.selectedId = Number(row.dataset.id);
      renderList();
      renderDetail();
    }
  });
}

async function boot() {
  try {
    const response = await fetch("data/trophies.json");
    const data = await response.json();
    state.trophies = Array.isArray(data) ? data : data.trophies;
  } catch (err) {
    document.getElementById("trophy-list").innerHTML =
      '<li class="trophy-row">The trophy data could not be loaded. Serve the app folder over HTTP (for example with the kit\'s serve.ts) rather than opening the file directly.</li>';
    return;
  }
  state.selectedId = 28; // open on the missable guide players most need to see first
  wireControls();
  renderAll();
}

boot();
