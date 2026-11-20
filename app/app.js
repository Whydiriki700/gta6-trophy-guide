// Leonida Trophy Atlas — tracker state, rendering, filters, roadmap, detail.
// Plain ES module, no dependencies, no network calls beyond the bundled data file.

const STORAGE_KEY = 'leonida-trophy-atlas-v1';
const GRADE_ORDER = ['platinum', 'gold', 'silver', 'bronze'];
const GRADE_LETTER = { platinum: 'P', gold: 'G', silver: 'S', bronze: 'B' };
const KIND_FILTERS = [
  ['all', 'All'],
  ['story', 'Story'],
  ['missable', 'Missable'],
  ['collectibles', 'Collectibles'],
  ['activities', 'Activities'],
  ['online', 'Online'],
];

let atlas = null; // parsed trophies.json
let state = loadState();
let activeKind = 'all';
let openTrophyId = null;

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        earned: parsed.earned || {},
        counts: parsed.counts || {},
        revealed: parsed.revealed || {},
        shield: parsed.shield !== false,
      };
    }
  } catch (err) { /* corrupted storage falls through to a fresh state */ }
  return { earned: {}, counts: {}, revealed: {}, shield: true };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function trophyById(id) {
  return atlas.trophies.find((t) => t.id === id);
}

function isSealed(trophy) {
  return Boolean(
    trophy.hidden && state.shield && !state.earned[trophy.id] && !state.revealed[trophy.id],
  );
}

function visibleName(trophy) {
  return isSealed(trophy) ? 'Hidden Trophy' : trophy.name;
}

function searchableText(trophy) {
  if (isSealed(trophy)) return '';
  const steps = (trophy.steps || []).join(' ');
  return `${trophy.name} ${trophy.description} ${trophy.guide} ${steps}`.toLowerCase();
}

function matchesFilters(trophy) {
  if (activeKind === 'missable') {
    if (!trophy.missable) return false;
  } else if (activeKind !== 'all' && trophy.kind !== activeKind) {
    return false;
  }
  const grade = document.getElementById('grade-filter').value;
  if (grade !== 'all' && trophy.grade !== grade) return false;
  const status = document.getElementById('status-filter').value;
  if (status === 'earned' && !state.earned[trophy.id]) return false;
  if (status === 'open' && state.earned[trophy.id]) return false;
  const query = document.getElementById('search').value.trim().toLowerCase();
  if (query && !searchableText(trophy).includes(query)) return false;
  return true;
}

function renderProgress() {
  const total = atlas.trophies.length;
  const earned = atlas.trophies.filter((t) => state.earned[t.id]).length;
  document.getElementById('earned-count').textContent = String(earned);
  document.getElementById('progress-fill').style.width = `${(earned / total) * 100}%`;
  const tally = GRADE_ORDER.map((grade) => {
    const inGrade = atlas.trophies.filter((t) => t.grade === grade);
    const got = inGrade.filter((t) => state.earned[t.id]).length;
    return `<span><b>${got}/${inGrade.length}</b> ${grade}</span>`;
  }).join('');
  document.getElementById('grade-tally').innerHTML = tally;
}

function renderRoadmap() {
  const wrap = document.getElementById('roadmap-stages');
  wrap.innerHTML = '';
  for (const stage of atlas.roadmap) {
    const members = atlas.trophies.filter((t) => t.stage === stage.stage);
    const done = members.filter((t) => state.earned[t.id]).length;
    const section = document.createElement('article');
    section.className = 'roadmap-stage';
    const chips = members.map((t) => {
      const cls = ['stage-chip'];
      if (state.earned[t.id]) cls.push('done');
      if (isSealed(t)) cls.push('sealed');
      return `<button type="button" class="${cls.join(' ')}" data-open="${t.id}">${escapeHtml(visibleName(t))}</button>`;
    }).join('');
    section.innerHTML = `
      <h3>${escapeHtml(stage.title)} <span class="stage-progress">${done}/${members.length}</span></h3>
      <p>${escapeHtml(stage.advice)}</p>
      <div class="stage-chips">${chips}</div>`;
    wrap.appendChild(section);
  }
}

function tagRow(trophy) {
  const tags = [`<span class="tag kind">${escapeHtml(trophy.kind)}</span>`];
  tags.push(`<span class="tag">${escapeHtml(trophy.grade)}</span>`);
  if (trophy.missable) tags.push('<span class="tag missable">Missable</span>');
  if (trophy.unconfirmed) tags.push('<span class="tag unconfirmed">Unconfirmed</span>');
  if (trophy.count) {
    const current = state.counts[trophy.id] || 0;
    tags.push(`<span class="tag count">${current}/${trophy.count}</span>`);
  }
  if (trophy.hidden && !isSealed(trophy)) tags.push('<span class="tag">Hidden</span>');
  return tags.join('');
}

function renderList() {
  const list = document.getElementById('trophy-list');
  list.innerHTML = '';
  const visible = atlas.trophies.filter(matchesFilters);
  document.getElementById('result-count').textContent =
    `${visible.length} of ${atlas.trophies.length} shown`;
  document.getElementById('empty-state').hidden = visible.length > 0;
  for (const trophy of visible) {
    const row = document.createElement('article');
    row.className = 'trophy-row' + (state.earned[trophy.id] ? ' earned' : '');
    row.dataset.open = String(trophy.id);
    const sealed = isSealed(trophy);
    const counter = trophy.count ? `
      <label class="counter-box">Progress
        <input type="number" min="0" max="${trophy.count}" step="1"
               value="${state.counts[trophy.id] || 0}" data-count="${trophy.id}">
        / ${trophy.count}
      </label>` : '';
    row.innerHTML = `
      <input type="checkbox" data-earn="${trophy.id}" ${state.earned[trophy.id] ? 'checked' : ''}
             aria-label="Mark ${escapeHtml(visibleName(trophy))} as earned">
      <div class="grade-badge grade-${trophy.grade}" aria-hidden="true">${GRADE_LETTER[trophy.grade]}</div>
      <div class="trophy-main">
        <div class="trophy-name">${escapeHtml(visibleName(trophy))}${sealed ? '<span class="sealed-note">sealed by spoiler shield</span>' : ''}</div>
        <div class="trophy-desc">${sealed ? 'Earn it, or open it and choose reveal, to read its name, description and guide.' : escapeHtml(trophy.description)}</div>
        ${counter}
      </div>
      <div class="trophy-meta">${tagRow(trophy)}</div>`;
    list.appendChild(row);
  }
}

function renderDetail() {
  const panel = document.getElementById('detail');
  if (openTrophyId === null) { panel.hidden = true; panel.innerHTML = ''; return; }
  const trophy = trophyById(openTrophyId);
  if (!trophy) { panel.hidden = true; return; }
  panel.hidden = false;
  if (isSealed(trophy)) {
    panel.innerHTML = `
      <h3>Hidden Trophy</h3>
      <p class="official-desc">This trophy is hidden on PlayStation, and the spoiler shield is on.</p>
      <p>Its grade is <b>${escapeHtml(trophy.grade)}</b> and it belongs to roadmap stage ${trophy.stage}.
         Earning it in game and ticking it here will unseal it, or you can reveal it now.</p>
      <div class="detail-actions">
        <button type="button" class="primary" data-reveal="${trophy.id}">Reveal this trophy</button>
        <button type="button" data-close="1">Close</button>
      </div>`;
    return;
  }
  const steps = (trophy.steps || []).map((s) => `<li>${escapeHtml(s)}</li>`).join('');
  const sources = (trophy.sources || []).map((s) => escapeHtml(s)).join(' · ');
  const missable = trophy.missable ? `
    <div class="missable-box"><b>Missable.</b> ${escapeHtml(trophy.missableReason || '')}</div>` : '';
  const unconfirmed = trophy.unconfirmed ? `
    <div class="unconfirmed-box"><b>Unconfirmed trigger.</b> No official source documents exactly what
    unlocks this trophy yet; the guide below gives the best-supported community reading and is marked as such.</div>` : '';
  const earned = Boolean(state.earned[trophy.id]);
  panel.innerHTML = `
    <h3>${escapeHtml(trophy.name)}</h3>
    <p class="official-desc">“${escapeHtml(trophy.description)}”</p>
    <div class="trophy-meta">${tagRow(trophy)}</div>
    ${missable}
    ${unconfirmed}
    <h4>Guide</h4>
    <p>${escapeHtml(trophy.guide)}</p>
    <h4>Steps</h4>
    <ol>${steps}</ol>
    <h4>Sources</h4>
    <p class="sources">${sources}. Trophy names, descriptions and grades are the official PlayStation list as published by Exophase and PSNProfiles.</p>
    <div class="detail-actions">
      <button type="button" class="primary" data-toggle-earn="${trophy.id}">${earned ? 'Mark as not earned' : 'Mark as earned'}</button>
      <button type="button" data-close="1">Close</button>
    </div>`;
}

function renderAll() {
  renderProgress();
  renderRoadmap();
  renderList();
  renderDetail();
}

function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function setEarned(id, value) {
  state.earned[id] = value;
  if (!value) delete state.earned[id];
  saveState();
  renderAll();
}

function exportProgress() {
  const payload = JSON.stringify({
    app: 'leonida-trophy-atlas',
    version: 1,
    exportedAt: new Date().toISOString(),
    state,
  }, null, 2);
  const blob = new Blob([payload], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'leonida-trophy-progress.json';
  link.click();
  URL.revokeObjectURL(url);
}

function importProgress(file) {
  const reader = new FileReader();
  reader.addEventListener('load', () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      const incoming = parsed.state || parsed;
      if (typeof incoming !== 'object' || incoming === null) throw new Error('bad file');
      state = {
        earned: incoming.earned || {},
        counts: incoming.counts || {},
        revealed: incoming.revealed || {},
        shield: incoming.shield !== false,
      };
      document.getElementById('shield-toggle').checked = state.shield;
      saveState();
      renderAll();
    } catch (err) {
      alert('That file is not a Leonida Trophy Atlas progress export.');
    }
  });
  reader.readAsText(file);
}

function buildKindChips() {
  const wrap = document.getElementById('kind-chips');
  wrap.innerHTML = '';
  for (const [value, label] of KIND_FILTERS) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip';
    chip.textContent = label;
    chip.dataset.kind = value;
    chip.setAttribute('aria-pressed', String(value === activeKind));
    wrap.appendChild(chip);
  }
}

function applyHash() {
  const hash = new URLSearchParams(location.hash.replace(/^#/, ''));
  const kind = hash.get('kind');
  if (kind && KIND_FILTERS.some(([value]) => value === kind)) {
    activeKind = kind;
    buildKindChips();
  }
  const query = hash.get('q');
  if (query) document.getElementById('search').value = query;
  if (kind || query) renderList();
  const trophyId = Number(hash.get('t'));
  if (Number.isInteger(trophyId) && trophyById(trophyId)) {
    openTrophyId = trophyId;
    renderAll();
    document.getElementById('detail').scrollIntoView({ block: 'start' });
    return;
  }
  if (hash.get('view') === 'roadmap') {
    document.getElementById('roadmap').scrollIntoView({ block: 'start' });
  }
  if (hash.get('view') === 'list' || kind || query) {
    document.querySelector('.tracker').scrollIntoView({ block: 'start' });
  }
}

function wireEvents() {
  document.getElementById('search').addEventListener('input', renderList);
  document.getElementById('grade-filter').addEventListener('change', renderList);
  document.getElementById('status-filter').addEventListener('change', renderList);
  document.getElementById('shield-toggle').addEventListener('change', (event) => {
    state.shield = event.target.checked;
    saveState();
    renderAll();
  });
  document.getElementById('export-btn').addEventListener('click', exportProgress);
  document.getElementById('import-file').addEventListener('change', (event) => {
    if (event.target.files[0]) importProgress(event.target.files[0]);
    event.target.value = '';
  });
  document.getElementById('reset-btn').addEventListener('click', () => {
    if (confirm('Clear all saved progress, counters and reveals?')) {
      state = { earned: {}, counts: {}, revealed: {}, shield: state.shield };
      saveState();
      renderAll();
    }
  });
  document.getElementById('kind-chips').addEventListener('click', (event) => {
    const chip = event.target.closest('[data-kind]');
    if (!chip) return;
    activeKind = chip.dataset.kind;
    buildKindChips();
    renderList();
  });
  document.body.addEventListener('click', (event) => {
    const counter = event.target.closest('[data-count]');
    if (counter) { event.stopPropagation(); return; }
    const earnBox = event.target.closest('[data-earn]');
    if (earnBox) { event.stopPropagation(); return; }
    const reveal = event.target.closest('[data-reveal]');
    if (reveal) {
      state.revealed[Number(reveal.dataset.reveal)] = true;
      saveState();
      renderAll();
      return;
    }
    const toggleEarn = event.target.closest('[data-toggle-earn]');
    if (toggleEarn) {
      const id = Number(toggleEarn.dataset.toggleEarn);
      setEarned(id, !state.earned[id]);
      return;
    }
    if (event.target.closest('[data-close]')) {
      openTrophyId = null;
      renderDetail();
      return;
    }
    const opener = event.target.closest('[data-open]');
    if (opener) {
      openTrophyId = Number(opener.dataset.open);
      renderDetail();
      document.getElementById('detail').scrollIntoView({ block: 'nearest' });
    }
  });
  document.body.addEventListener('change', (event) => {
    const earnBox = event.target.closest('[data-earn]');
    if (earnBox) {
      setEarned(Number(earnBox.dataset.earn), earnBox.checked);
      return;
    }
    const counter = event.target.closest('[data-count]');
    if (counter) {
      const id = Number(counter.dataset.count);
      const trophy = trophyById(id);
      let value = Math.max(0, Math.floor(Number(counter.value) || 0));
      if (trophy.count) value = Math.min(value, trophy.count);
      state.counts[id] = value;
      // A counter that reaches its target has earned the trophy: tick it off
      // automatically so the checklist never disagrees with the counters.
      if (trophy.count && value >= trophy.count && !state.earned[id]) {
        state.earned[id] = true;
      }
      saveState();
      renderAll();
    }
  });
}

async function boot() {
  const response = await fetch('data/trophies.json');
  atlas = await response.json();
  document.getElementById('shield-toggle').checked = state.shield;
  buildKindChips();
  wireEvents();
  renderAll();
  applyHash();
  // Deep links also work when the hash changes while the page is open.
  window.addEventListener('hashchange', applyHash);
}

boot();
