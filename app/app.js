// Leonida Trophy Atlas: an offline guide and tracker for the 55 GTA VI trophies.
// Data comes from data/trophies.json beside this file. Progress lives in
// localStorage only; nothing is fetched from the network beyond that data file.

const EARNED_KEY = 'leonida-atlas-earned-v1';
const SHIELD_KEY = 'leonida-atlas-shield-v1';

const KIND_LABELS = {
  all: 'All kinds',
  story: 'Story',
  activities: 'Activities',
  collectibles: 'Collectibles',
  exploration: 'Exploration',
  combat: 'Combat & crime',
  economy: 'Money & property',
};

const ROADMAP_STAGES = [
  {
    title: 'Stage 1 — The story spine',
    body: 'Play the campaign straight through: Gone Fishing, Chapters 1 to 4, the named story missions (Breakfast Run, The Cartel Heist, Child\u2019s Play, Headliners, VCIA Takedown, Operation Savage Glory) and the final mission. This unlocks the whole map, both protagonists and every activity family.',
    names: ['Just Like Paradise', 'Paradise Lost', 'T**s Ass Drug Money', 'Vice City, Baby!', 'Top Of The World, Ma', 'Trust', 'Break the Bank', 'Family Matters', 'DWNFALL', 'Hi-Jacked', 'Snow Storm', 'You Gotta Know When to Get Off'],
  },
  {
    title: 'Stage 2 — Strangers and their strands',
    body: 'Finish the stranger strands as they appear: Andy, Kenton, Billy, Randy and Tyrone each end in a final mission trophy, and any eight completed strands earn the Strangers & Freaks silver. Add Bret\u2019s unique animal hunt here too.',
    names: ['Road to Rehabilitation', 'This Was No Boat Accident', 'The Lone Rider', 'Supply & Demand', 'Spin On This!', 'Strangers & Freaks', 'Fair Game'],
  },
  {
    title: 'Stage 3 — The missable sweep, before the finale',
    body: 'Before you start the final mission, clear the one missable trophy: meditate at all 18 spots for Positive Mental Attitude. Later story events close off the areas holding two spots, so this stage must come before the endgame. Pair it with the full Leonida exploration sweep.',
    names: ['Positive Mental Attitude', 'The Goodtime State'],
  },
  {
    title: 'Stage 4 — Counted grinds and collections',
    body: 'The long counters: 250 stunts, gold in all 42 Shooting Range challenges, drone wins at 14 locations, 20 different race wins, 50 challenges, 3 card sets, 100 WAiNK locations, 100 discovered vehicles and a sample of all 9 activity types.',
    names: ['Cunning Stunts', 'The Shootist', 'Top Fun', 'Earn Cash, Not Kudos', 'One Last Thing', "Don't Touch My Deck", 'You WAiNKer!', 'Whip It Good', 'Master of None'],
  },
  {
    title: 'Stage 5 — Crime, partners and the money game',
    body: 'Free roam set pieces and the economy: partner wanted level escapes, shop chains, stealth and vault robberies, gang operations, laundering $250,000 of Marked Bills, spending $100,000, buying all 8 garages and registering 10 vehicles on the Scooter Bros app.',
    names: ['Hot Together', 'Retail Therapy', 'Sneakthief', 'Maximum Withdrawal', 'A Classic Blitz Play', 'Pest Control', 'Gunslinger', 'Ten Pin', 'Dime on the Dollar', 'Treat Yo Self', 'Little Boxes', 'On the Spot'],
  },
  {
    title: 'Stage 6 — Odd jobs, then 100 percent',
    body: 'Mop up the one-off moments (arcade game, fishing win over Cal, bowling at Kolt & Associates, the showroom smash and the cryptic event trophies, whose methods this atlas honestly marks unconfirmed), then close out 100 percent completion and let the platinum award itself.',
    names: ['Stick Fiddler', 'Baited My Tackle', 'Let\u2019s Go Bowling', 'Capital Offense', 'Catch Me If You Can', 'Challenging Tank', 'In The Beginning\u2026', 'Personal Best', 'Actions Speak Louder', 'Bad Luck, I Guess', 'The Truth Is Out There', 'A Long Road', 'Vice Got a Price!'],
  },
];

const state = {
  trophies: [],
  earned: new Set(loadEarned()),
  shield: loadShield(),
  kind: 'all',
  grade: 'all',
  status: 'all',
  query: '',
  selectedId: null,
  roadmapOpen: false,
};

function loadEarned() {
  try {
    const raw = localStorage.getItem(EARNED_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((n) => typeof n === 'string') : [];
  } catch {
    return [];
  }
}

function loadShield() {
  const raw = localStorage.getItem(SHIELD_KEY);
  return raw === null ? true : raw === 'on';
}

function saveEarned() {
  localStorage.setItem(EARNED_KEY, JSON.stringify([...state.earned]));
}

function saveShield() {
  localStorage.setItem(SHIELD_KEY, state.shield ? 'on' : 'off');
}

function isSealed(trophy) {
  return state.shield && trophy.hidden && !state.earned.has(trophy.name);
}

function visibleName(trophy) {
  return isSealed(trophy) ? 'Sealed trophy' : trophy.name;
}

function visibleDescription(trophy) {
  return isSealed(trophy) ? 'Hidden until earned. Lift the spoiler shield to reveal it.' : trophy.description;
}

function matchesFilters(trophy) {
  if (state.kind !== 'all' && trophy.kind !== state.kind) return false;
  if (state.grade !== 'all' && trophy.grade !== state.grade) return false;
  if (state.status === 'earned' && !state.earned.has(trophy.name)) return false;
  if (state.status === 'missing' && state.earned.has(trophy.name)) return false;
  if (state.status === 'missable' && !trophy.missable) return false;
  if (state.status === 'hidden' && !trophy.hidden) return false;
  if (state.query) {
    if (isSealed(trophy)) return false;
    const haystack = (trophy.name + ' ' + trophy.description + ' ' + trophy.kind).toLowerCase();
    if (!haystack.includes(state.query.toLowerCase())) return false;
  }
  return true;
}

function gradeMark(grade) {
  return { platinum: 'PLAT', gold: 'GOLD', silver: 'SILV', bronze: 'BRNZ' }[grade] || grade.toUpperCase();
}

function renderProgress() {
  const total = state.trophies.length;
  const done = state.earned.size;
  document.getElementById('progress-count').textContent = done + ' / ' + total + ' earned';
  const pct = total ? Math.round((done / total) * 100) : 0;
  document.getElementById('progress-pct').textContent = pct + '%';
  document.getElementById('progress-fill').style.width = pct + '%';
  const counts = { platinum: [0, 0], gold: [0, 0], silver: [0, 0], bronze: [0, 0] };
  for (const trophy of state.trophies) {
    counts[trophy.grade][1] += 1;
    if (state.earned.has(trophy.name)) counts[trophy.grade][0] += 1;
  }
  document.getElementById('grade-counts').textContent =
    'Platinum ' + counts.platinum[0] + '/' + counts.platinum[1] +
    ' · Gold ' + counts.gold[0] + '/' + counts.gold[1] +
    ' · Silver ' + counts.silver[0] + '/' + counts.silver[1] +
    ' · Bronze ' + counts.bronze[0] + '/' + counts.bronze[1];
}

function renderKindChips() {
  const holder = document.getElementById('kind-chips');
  holder.textContent = '';
  for (const key of Object.keys(KIND_LABELS)) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip' + (state.kind === key ? ' active' : '');
    chip.textContent = KIND_LABELS[key];
    chip.dataset.kind = key;
    chip.addEventListener('click', () => {
      state.kind = key;
      renderKindChips();
      renderList();
    });
    holder.appendChild(chip);
  }
}

function renderList() {
  const holder = document.getElementById('rows');
  holder.textContent = '';
  const visible = state.trophies.filter(matchesFilters);
  document.getElementById('empty-msg').hidden = visible.length > 0;
  for (const trophy of visible) {
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'row' + (state.earned.has(trophy.name) ? ' earned' : '') + (state.selectedId === trophy.id ? ' selected' : '');
    row.style.borderLeftColor = 'var(--' + trophy.grade + ')';

    const dot = document.createElement('span');
    dot.className = 'grade-dot grade-' + trophy.grade;
    dot.textContent = gradeMark(trophy.grade);

    const main = document.createElement('span');
    main.className = 'main';
    const name = document.createElement('span');
    name.className = 'name';
    name.textContent = visibleName(trophy);
    const desc = document.createElement('span');
    desc.className = 'desc';
    desc.textContent = visibleDescription(trophy);
    const meta = document.createElement('span');
    meta.className = 'meta';
    const kindBadge = document.createElement('span');
    kindBadge.className = 'badge';
    kindBadge.textContent = KIND_LABELS[trophy.kind] || trophy.kind;
    meta.appendChild(kindBadge);
    if (trophy.hidden) {
      const hiddenBadge = document.createElement('span');
      hiddenBadge.className = 'badge' + (isSealed(trophy) ? ' sealed' : '');
      hiddenBadge.textContent = isSealed(trophy) ? 'Sealed' : 'Hidden';
      meta.appendChild(hiddenBadge);
    }
    if (trophy.missable) {
      const missableBadge = document.createElement('span');
      missableBadge.className = 'badge missable';
      missableBadge.textContent = 'Missable';
      meta.appendChild(missableBadge);
    }
    if (trophy.unconfirmed) {
      const uncBadge = document.createElement('span');
      uncBadge.className = 'badge';
      uncBadge.textContent = 'Method unconfirmed';
      meta.appendChild(uncBadge);
    }
    main.append(name, desc, meta);

    const check = document.createElement('span');
    check.className = 'check';
    check.textContent = state.earned.has(trophy.name) ? '\u2611' : '\u2610';

    row.append(dot, main, check);
    row.addEventListener('click', () => {
      state.selectedId = trophy.id;
      renderList();
      renderDetail();
    });
    holder.appendChild(row);
  }
}

function renderDetail() {
  const pane = document.getElementById('detail');
  pane.textContent = '';
  const trophy = state.trophies.find((t) => t.id === state.selectedId) || state.trophies[0];
  if (!trophy) return;
  state.selectedId = trophy.id;

  const heading = document.createElement('h2');
  heading.textContent = visibleName(trophy);
  pane.appendChild(heading);

  const official = document.createElement('p');
  official.className = 'official';
  official.textContent = '\u201C' + visibleDescription(trophy) + '\u201D — official description · ' + trophy.grade + ' trophy';
  pane.appendChild(official);

  if (isSealed(trophy)) {
    const note = document.createElement('p');
    note.className = 'unconfirmed';
    note.textContent = 'This trophy is hidden on PlayStation and the spoiler shield is on, so its name, description and guide stay covered here until you earn it or lift the shield from the toolbar.';
    pane.appendChild(note);
  } else {
    if (trophy.unconfirmed) {
      const unc = document.createElement('p');
      unc.className = 'unconfirmed';
      unc.textContent = 'Honest note: this trophy\u2019s exact method is not publicly confirmed yet. The guide below gives the best supported reading of its official description and says so openly.';
      pane.appendChild(unc);
    }
    if (trophy.missable && trophy.missableReason) {
      const reason = document.createElement('p');
      reason.className = 'missable-reason';
      reason.textContent = 'Missable: ' + trophy.missableReason;
      pane.appendChild(reason);
    }
    const guideHeading = document.createElement('h3');
    guideHeading.textContent = 'Guide, in this atlas\u2019s own words';
    pane.appendChild(guideHeading);
    const guide = document.createElement('p');
    guide.textContent = trophy.guide;
    pane.appendChild(guide);

    const stepsHeading = document.createElement('h3');
    stepsHeading.textContent = 'Steps';
    pane.appendChild(stepsHeading);
    const steps = document.createElement('ol');
    for (const step of trophy.steps || []) {
      const item = document.createElement('li');
      item.textContent = step;
      steps.appendChild(item);
    }
    pane.appendChild(steps);

    const sourcesHeading = document.createElement('h3');
    sourcesHeading.textContent = 'Sources';
    pane.appendChild(sourcesHeading);
    const sources = document.createElement('ul');
    for (const source of trophy.sources || []) {
      const item = document.createElement('li');
      item.textContent = source;
      sources.appendChild(item);
    }
    pane.appendChild(sources);
  }

  const toggle = document.createElement('button');
  toggle.type = 'button';
  const earnedNow = state.earned.has(trophy.name);
  toggle.className = 'earn-toggle' + (earnedNow ? ' earned' : '');
  toggle.textContent = earnedNow ? 'Earned \u2014 tap to unmark' : 'Mark as earned';
  toggle.addEventListener('click', () => {
    if (state.earned.has(trophy.name)) state.earned.delete(trophy.name);
    else state.earned.add(trophy.name);
    saveEarned();
    renderProgress();
    renderList();
    renderDetail();
    if (state.roadmapOpen) renderRoadmap();
  });
  pane.appendChild(toggle);
}

function renderRoadmap() {
  const section = document.getElementById('roadmap');
  section.hidden = !state.roadmapOpen;
  document.getElementById('roadmap-toggle').textContent = state.roadmapOpen ? 'Checklist view' : 'Roadmap view';
  const holder = document.getElementById('stages');
  holder.textContent = '';
  for (const stage of ROADMAP_STAGES) {
    const card = document.createElement('article');
    card.className = 'stage';
    const title = document.createElement('h3');
    title.textContent = stage.title;
    const body = document.createElement('p');
    body.textContent = stage.body;
    const list = document.createElement('ul');
    for (const name of stage.names) {
      const item = document.createElement('li');
      const trophyForName = state.trophies.find((t) => t.name === name);
      const shownName = trophyForName && isSealed(trophyForName) ? 'Sealed trophy' : name;
      item.textContent = (state.earned.has(name) ? '\u2611 ' : '\u2610 ') + shownName;
      list.appendChild(item);
    }
    card.append(title, body, list);
    holder.appendChild(card);
  }
}

function renderShield() {
  const button = document.getElementById('spoiler-toggle');
  button.textContent = state.shield ? 'Spoiler shield: ON' : 'Spoiler shield: OFF';
  button.setAttribute('aria-pressed', String(state.shield));
  document.getElementById('shield-note').textContent = state.shield
    ? 'Spoiler shield is on: hidden trophies show as sealed entries, with names, descriptions and guides covered, until you earn them or lift the shield.'
    : 'Spoiler shield is off: hidden trophies are shown with their names, descriptions and guides.';
}

function exportProgress() {
  const payload = JSON.stringify({ atlas: 'leonida-trophy-atlas', earned: [...state.earned] }, null, 2);
  const blob = new Blob([payload], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'leonida-atlas-progress.json';
  link.click();
  URL.revokeObjectURL(link.href);
}

function importProgress(file) {
  const reader = new FileReader();
  reader.addEventListener('load', () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      const names = Array.isArray(parsed) ? parsed : parsed.earned;
      if (!Array.isArray(names)) return;
      const valid = new Set(state.trophies.map((t) => t.name));
      state.earned = new Set(names.filter((n) => valid.has(n)));
      saveEarned();
      renderProgress();
      renderList();
      renderDetail();
      if (state.roadmapOpen) renderRoadmap();
    } catch {
      // A malformed import file simply changes nothing.
    }
  });
  reader.readAsText(file);
}

function wireControls() {
  document.getElementById('search').addEventListener('input', (event) => {
    state.query = event.target.value.trim();
    renderList();
  });
  document.getElementById('grade-filter').addEventListener('change', (event) => {
    state.grade = event.target.value;
    renderList();
  });
  document.getElementById('status-filter').addEventListener('change', (event) => {
    state.status = event.target.value;
    renderList();
  });
  document.getElementById('spoiler-toggle').addEventListener('click', () => {
    state.shield = !state.shield;
    saveShield();
    renderShield();
    renderList();
    renderDetail();
  });
  document.getElementById('roadmap-toggle').addEventListener('click', () => {
    state.roadmapOpen = !state.roadmapOpen;
    renderRoadmap();
    if (state.roadmapOpen) document.getElementById('roadmap').scrollIntoView();
  });
  document.getElementById('export-btn').addEventListener('click', exportProgress);
  document.getElementById('import-file').addEventListener('change', (event) => {
    if (event.target.files && event.target.files[0]) importProgress(event.target.files[0]);
  });
}

async function boot() {
  const response = await fetch('data/trophies.json');
  const data = await response.json();
  state.trophies = Array.isArray(data) ? data : data.trophies;
  const missableDefault = state.trophies.find((t) => t.missable);
  state.selectedId = missableDefault ? missableDefault.id : state.trophies[0].id;
  wireControls();
  renderKindChips();
  renderShield();
  renderProgress();
  renderList();
  renderDetail();
  renderRoadmap();
}

boot();
