// Leonida Trophy Atlas — GTA VI (PS5) trophy guide and tracker.
// Plain browser script, no libraries: fetches data/trophies.json, renders the
// checklist and detail panel, keeps progress in localStorage, and offers
// export/import of that progress. It loads nothing beyond its own files.

const STORE = "leonida-atlas-progress-v1";

const ROADMAP = [
  { n: 1, title: "Arrival — Chapter 1", note: "The opening mission and Chapter 1. Meditate at the Chapter 1 balcony spot before the chapter ends: that spot does not come back, and there is no mission replay." },
  { n: 2, title: "The partnership — Chapters 2 to 4", note: "Both protagonists are playable from Chapter 2. The partner feats, the VCIA airport mission and the bowling alley visit all live in these chapters." },
  { n: 3, title: "Endings — the finale and the strand finales", note: "The final mission plus the last mission of every stranger strand. Save before the finale: its choices feed the 500-choice counter." },
  { n: 4, title: "The sweep — collectibles and the map", note: "Card sets, WAiNK spots, discovered vehicles, every area of Leonida and the garage properties: a district-by-district pass." },
  { n: 5, title: "The grind — activities, feats and money", note: "Stunts, shooting ranges, races, robberies and the money trophies. Repeatable at leisure; only the one flagged missable needs care, and it sits in stage 1." },
  { n: 6, title: "100 percent — and the platinum", note: "Top the in-game completion checklist off at 100 percent. The platinum is awarded on its own when the 54th other trophy lands." }
];

const ui = {
  trophies: [],
  earned: readSaved(),
  kind: "all",
  grade: "all",
  status: "all",
  query: "",
  shield: false,
  selected: null
};

function readSaved() {
  try {
    const raw = localStorage.getItem(STORE);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    const list = Array.isArray(parsed) ? parsed : parsed.earned;
    return new Set(Array.isArray(list) ? list.filter((id) => Number.isInteger(id)) : []);
  } catch (err) {
    return new Set();
  }
}

function persist() {
  const payload = { app: "leonida-atlas", version: 1, earned: [...ui.earned].sort((a, b) => a - b) };
  localStorage.setItem(STORE, JSON.stringify(payload));
}

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
}

function shielded(t) {
  return ui.shield && t.kind === "story" && !ui.earned.has(t.id);
}

function shownName(t) {
  return shielded(t) ? "Hidden story trophy" : t.name;
}

function shownDesc(t) {
  return shielded(t)
    ? "Name and description hidden by the spoiler shield until this trophy is earned."
    : t.description;
}

function passes(t) {
  if (ui.kind === "online") return false; // the official list holds no online trophies
  if (ui.kind === "missable" && !t.missable) return false;
  if (ui.kind !== "all" && ui.kind !== "missable" && t.kind !== ui.kind) return false;
  if (ui.grade !== "all" && t.grade !== ui.grade) return false;
  if (ui.status === "earned" && !ui.earned.has(t.id)) return false;
  if (ui.status === "unearned" && ui.earned.has(t.id)) return false;
  if (ui.query) {
    const hay = (t.name + " " + t.description + " " + (t.guide || "")).toLowerCase();
    if (!hay.includes(ui.query)) return false;
  }
  return true;
}

function badge(t) {
  const span = el("span", "tag " + t.grade, t.grade);
  return span;
}

function buildCard(t) {
  const earned = ui.earned.has(t.id);
  const card = el("li", "trophy-card" + (earned ? " earned" : "") + (ui.selected === t.id ? " selected" : ""));
  card.dataset.id = String(t.id);

  const box = document.createElement("input");
  box.type = "checkbox";
  box.checked = earned;
  box.setAttribute("aria-label", "Mark " + t.name + " as earned");
  box.dataset.check = String(t.id);
  card.appendChild(box);

  const main = el("div");
  main.appendChild(el("div", "trophy-name", shownName(t)));
  main.appendChild(el("div", "trophy-desc", shownDesc(t)));
  const meta = el("div", "trophy-meta");
  meta.appendChild(badge(t));
  if (t.kind !== t.grade) meta.appendChild(el("span", "tag", t.kind));
  if (t.hidden) meta.appendChild(el("span", "tag hidden", "Hidden on PSN"));
  if (t.missable) meta.appendChild(el("span", "tag missable", "Missable"));
  if (t.unconfirmed) meta.appendChild(el("span", "tag unconfirmed", "Trigger unconfirmed"));
  if (shielded(t)) meta.appendChild(el("span", "tag", "Shielded"));
  main.appendChild(meta);
  card.appendChild(main);

  const right = el("div", "trophy-count", typeof t.count === "number" ? "Target: " + t.count.toLocaleString("en-US") : "");
  card.appendChild(right);
  return card;
}

function paintList() {
  const list = document.getElementById("catalog");
  const visible = ui.trophies.filter(passes);
  list.replaceChildren(...visible.map(buildCard));
  document.getElementById("no-match").hidden = visible.length > 0;
  document.getElementById("match-count").textContent =
    "Showing " + visible.length + " of " + ui.trophies.length + " trophies" +
    (ui.kind === "online" ? " — the official list has no online trophies." : ".");
}

function paintMeter() {
  const total = ui.trophies.length;
  const done = ui.earned.size;
  const pct = total ? Math.round((done / total) * 100) : 0;
  document.getElementById("meter-pct").textContent = pct + "%";
  document.getElementById("meter-count").textContent = done + " of " + total + " earned";
  document.getElementById("meter-fill").style.width = pct + "%";
  const parts = ["platinum", "gold", "silver", "bronze"].map((g) => {
    const all = ui.trophies.filter((t) => t.grade === g);
    const have = all.filter((t) => ui.earned.has(t.id)).length;
    return g + ": " + have + "/" + all.length;
  });
  document.getElementById("meter-grades").textContent = parts.join(" · ");
}

function paintPanel() {
  const panel = document.getElementById("panel");
  const t = ui.trophies.find((x) => x.id === ui.selected);
  panel.replaceChildren();
  if (!t) {
    panel.appendChild(el("p", "panel-empty", "Pick a trophy from the list to read its guide, steps and sources."));
    return;
  }
  const earned = ui.earned.has(t.id);
  if (shielded(t)) {
    panel.appendChild(el("h2", null, "Hidden story trophy"));
    panel.appendChild(el("p", "official", "The spoiler shield is on. This story trophy's name, description and guide stay hidden until you earn it."));
    const meta = el("div", "trophy-meta");
    meta.appendChild(badge(t));
    panel.appendChild(meta);
    const line = el("p", "earned-line");
    const btn = el("button", null, earned ? "Earned — tap to unmark" : "Mark as earned");
    btn.type = "button";
    btn.addEventListener("click", () => flipEarned(t.id));
    line.appendChild(btn);
    panel.appendChild(line);
    return;
  }
  panel.appendChild(el("h2", null, t.name));
  panel.appendChild(el("p", "official", "“" + t.description + "” — official PlayStation description"));
  const stageInfo = ROADMAP.find((s) => s.n === t.stage);
  if (stageInfo) {
    panel.appendChild(el("p", "official", "Roadmap stage " + stageInfo.n + " — " + stageInfo.title + "."));
  }
  const meta = el("div", "trophy-meta");
  meta.appendChild(badge(t));
  if (t.kind !== t.grade) meta.appendChild(el("span", "tag", t.kind));
  if (t.hidden) meta.appendChild(el("span", "tag hidden", "Hidden on PSN"));
  if (t.missable) meta.appendChild(el("span", "tag missable", "Missable"));
  if (t.unconfirmed) meta.appendChild(el("span", "tag unconfirmed", "Trigger unconfirmed"));
  if (typeof t.count === "number") meta.appendChild(el("span", "tag", "Target: " + t.count.toLocaleString("en-US")));
  panel.appendChild(meta);
  if (t.missable && t.missableReason) {
    const warn = el("p", "warn");
    warn.appendChild(el("strong", null, "Missable — read before you play on. "));
    warn.appendChild(document.createTextNode(t.missableReason));
    panel.appendChild(warn);
  }
  if (t.unconfirmed) {
    panel.appendChild(el("p", "caveat", "Trigger unconfirmed: no trophy tracker confirms the exact trigger for this hidden trophy. The guide below is the best-supported reading of the official description, stated as such."));
  }
  panel.appendChild(el("h3", null, "Guide"));
  panel.appendChild(el("p", "guide", t.guide));
  panel.appendChild(el("h3", null, "Steps"));
  const steps = el("ol", "steps");
  for (const s of t.steps) steps.appendChild(el("li", null, s));
  panel.appendChild(steps);
  panel.appendChild(el("h3", null, "Sources"));
  const srcs = el("ul", "sources");
  for (const s of t.sources) {
    const li = el("li");
    if (s.url) {
      const a = el("a", null, s.label);
      a.href = s.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      li.appendChild(a);
    } else {
      li.textContent = s.label;
    }
    srcs.appendChild(li);
  }
  panel.appendChild(srcs);
  const line = el("p", "earned-line");
  const btn = el("button", null, earned ? "Earned — tap to unmark" : "Mark as earned");
  btn.type = "button";
  btn.addEventListener("click", () => flipEarned(t.id));
  line.appendChild(btn);
  panel.appendChild(line);
}

function paintRoadmap() {
  const wrap = document.getElementById("stages");
  wrap.replaceChildren();
  for (const stage of ROADMAP) {
    const members = ui.trophies.filter((t) => t.stage === stage.n);
    const done = members.filter((t) => ui.earned.has(t.id)).length;
    const card = el("li", "stage");
    const h = el("h3");
    h.appendChild(el("span", "num", String(stage.n)));
    h.appendChild(document.createTextNode(" " + stage.title));
    card.appendChild(h);
    card.appendChild(el("p", null, stage.note));
    const names = members.map((t) => shownName(t)).join(", ");
    card.appendChild(el("p", "stage-trophies", done + "/" + members.length + " earned — " + names));
    wrap.appendChild(card);
  }
}

function paintAll() {
  paintMeter();
  paintList();
  paintPanel();
  paintRoadmap();
}

function flipEarned(id) {
  if (ui.earned.has(id)) ui.earned.delete(id); else ui.earned.add(id);
  persist();
  paintAll();
}

function downloadProgress() {
  const payload = {
    app: "leonida-atlas",
    version: 1,
    exportedAt: new Date().toISOString(),
    earned: [...ui.earned].sort((a, b) => a - b)
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "leonida-atlas-progress.json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function uploadProgress(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      const list = Array.isArray(parsed) ? parsed : parsed.earned;
      if (!Array.isArray(list)) throw new Error("no earned list");
      const valid = new Set(ui.trophies.map((t) => t.id));
      ui.earned = new Set(list.filter((id) => valid.has(id)));
      persist();
      paintAll();
    } catch (err) {
      alert("That file does not look like a Leonida Trophy Atlas progress export.");
    }
  };
  reader.readAsText(file);
}

function bindControls() {
  document.getElementById("q").addEventListener("input", (ev) => {
    ui.query = ev.target.value.trim().toLowerCase();
    paintList();
  });
  document.getElementById("kind-row").addEventListener("click", (ev) => {
    const btn = ev.target.closest("[data-kind]");
    if (!btn) return;
    ui.kind = btn.dataset.kind;
    for (const b of document.querySelectorAll("#kind-row .kind-btn")) b.classList.toggle("on", b === btn);
    document.getElementById("online-note").hidden = ui.kind !== "online";
    paintList();
  });
  document.getElementById("grade").addEventListener("change", (ev) => {
    ui.grade = ev.target.value;
    paintList();
  });
  document.getElementById("status").addEventListener("change", (ev) => {
    ui.status = ev.target.value;
    paintList();
  });
  document.getElementById("shield").addEventListener("change", (ev) => {
    ui.shield = ev.target.checked;
    paintAll();
  });
  document.getElementById("btn-export").addEventListener("click", downloadProgress);
  const fileInput = document.getElementById("file-import");
  document.getElementById("btn-import").addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", () => {
    if (fileInput.files && fileInput.files[0]) uploadProgress(fileInput.files[0]);
    fileInput.value = "";
  });
  document.getElementById("catalog").addEventListener("click", (ev) => {
    const check = ev.target.closest("[data-check]");
    if (check) {
      flipEarned(Number(check.dataset.check));
      return;
    }
    const card = ev.target.closest("[data-id]");
    if (card) {
      ui.selected = Number(card.dataset.id);
      paintList();
      paintPanel();
    }
  });
}

async function start() {
  try {
    const res = await fetch("data/trophies.json");
    const data = await res.json();
    ui.trophies = Array.isArray(data) ? data : data.trophies;
  } catch (err) {
    document.getElementById("catalog").innerHTML =
      "<li class=\"trophy-card\">The trophy data could not be loaded. Serve the app folder over HTTP (for example with the kit's serve.ts) rather than opening the file directly.</li>";
    return;
  }
  ui.selected = 28; // open on the missable guide players most need to see first
  bindControls();
  paintAll();
}

start();
