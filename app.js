// UI controller - wires the HeroData model (model.js) and repository data (data.js) to the DOM.
"use strict";

const STORAGE_KEY = "wshb.heroes.v1";

const state = {
  heroes: [],
  selectedId: null,
};

let persistTimer = null;

const supportsFileSystemAccess = typeof window.showSaveFilePicker === "function";
const fileHandles = new Map(); // hero.id -> FileSystemFileHandle

const ATTRIBUTE_NAMES = ["Agility", "Awareness", "Charisma", "Coordination", "Intelligence", "Might", "Willpower"];

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------
function el(id) { return document.getElementById(id); }

function init() {
  state.heroes = loadPersisted();

  populateArchetypeSelect();
  populateProfessionSelect();
  buildSkillsTable();
  renderAbilityRepository();
  renderAllEquipmentRepositories();

  bindToolbar();
  bindTabs();
  bindInfoFields();
  bindAbilities();
  bindEquipment();
  bindBackground();
  bindCharacterSheet();
  enhanceNumberInputs();

  renderHeroList();
  if (state.heroes.length > 0) {
    selectHero(state.heroes[0].id);
  } else {
    showEmptyState();
  }
}

function toInt(value) {
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? 0 : n;
}

function escHtml(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

// ---------------------------------------------------------------------------
// Spinner buttons (same as WSVB)
// ---------------------------------------------------------------------------
function enhanceNumberInputs(root = document) {
  const inputs = root.querySelectorAll('input[type="number"]:not(.spinner-enhanced)');
  inputs.forEach((input) => {
    input.classList.add("spinner-enhanced");

    const wrap = document.createElement("div");
    wrap.className = "spinner-wrap";
    input.parentNode.insertBefore(wrap, input);

    const minus = document.createElement("button");
    minus.type = "button";
    minus.className = "spin-btn spin-minus";
    minus.textContent = "−";
    minus.setAttribute("aria-label", "Decrease");
    minus.tabIndex = -1;

    const plus = document.createElement("button");
    plus.type = "button";
    plus.className = "spin-btn spin-plus";
    plus.textContent = "+";
    plus.setAttribute("aria-label", "Increase");
    plus.tabIndex = -1;

    wrap.appendChild(minus);
    wrap.appendChild(input);
    wrap.appendChild(plus);

    const step = () => parseFloat(input.step) || 1;
    const applyDelta = (delta) => {
      let current = parseFloat(input.value);
      if (Number.isNaN(current)) current = input.min !== "" ? parseFloat(input.min) : 0;
      let next = current + delta;
      if (input.min !== "") next = Math.max(next, parseFloat(input.min));
      if (input.max !== "") next = Math.min(next, parseFloat(input.max));
      input.value = next;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    };

    minus.addEventListener("click", () => applyDelta(-step()));
    plus.addEventListener("click", () => applyDelta(step()));
  });
}

// ---------------------------------------------------------------------------
// Toolbar
// ---------------------------------------------------------------------------
function bindToolbar() {
  el("btnNew").addEventListener("click", createNewHero);

  el("btnOpen").addEventListener("click", () => el("fileOpenInput").click());
  el("fileOpenInput").addEventListener("change", async (e) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      await importFile(file);
    }
    e.target.value = "";
    renderHeroList();
    schedulePersist();
  });

  el("btnOpenFolder").addEventListener("click", () => el("folderOpenInput").click());
  el("folderOpenInput").addEventListener("change", async (e) => {
    const files = Array.from(e.target.files || []).filter((f) => /\.json$/i.test(f.name));
    e.target.value = "";
    if (files.length === 0) {
      alert("No .json hero files were found in that folder.");
      return;
    }

    const before = state.heroes.length;
    const failedNames = [];
    for (const file of files) {
      const result = await importFile(file, { select: false, quiet: true });
      if (!result) failedNames.push(file.webkitRelativePath || file.name);
    }
    const imported = state.heroes.length - before;

    renderHeroList();
    if (state.heroes.length > 0) selectHero(state.heroes[state.heroes.length - 1].id);
    schedulePersist();

    let summary = `Imported ${imported} hero${imported === 1 ? "" : "es"} from ${files.length} file${files.length === 1 ? "" : "s"}.`;
    if (failedNames.length > 0) {
      summary += `\n\n${failedNames.length} file${failedNames.length === 1 ? "" : "s"} failed (see browser console for details):\n` +
        failedNames.slice(0, 10).join("\n") + (failedNames.length > 10 ? `\n...and ${failedNames.length - 10} more` : "");
    }
    alert(summary);
  });

  el("btnClone").addEventListener("click", () => {
    const hero = getSelectedHero();
    if (!hero) { alert("No hero is currently selected to clone."); return; }
    const clone = hero.clone();
    state.heroes.push(clone);
    renderHeroList();
    selectHero(clone.id);
    schedulePersist();
  });

  el("btnSaveAs").addEventListener("click", async () => {
    const hero = getSelectedHero();
    if (!hero) { alert("No hero is currently selected."); return; }
    const saved = await saveHeroToFile(hero);
    if (!saved) return;
    hero.dirty = false;
    renderHeroList();
  });

  el("btnSaveAll").addEventListener("click", () => {
    state.heroes.forEach((h, i) => {
      setTimeout(() => { downloadHero(h); h.dirty = false; renderHeroList(); }, i * 300);
    });
  });

  el("btnClose").addEventListener("click", () => {
    const hero = getSelectedHero();
    if (!hero) { alert("No hero is currently selected."); return; }
    if (hero.dirty) {
      const proceed = confirm(`"${hero.heroTitle}" has unsaved changes.\n\nClose anyway? (It will remain in your browser's autosave until you close it - this just removes it from the open list.)`);
      if (!proceed) return;
    }
    const idx = state.heroes.findIndex((h) => h.id === hero.id);
    state.heroes.splice(idx, 1);
    fileHandles.delete(hero.id);
    renderHeroList();
    if (state.heroes.length > 0) {
      selectHero(state.heroes[Math.max(0, idx - 1)].id);
    } else {
      state.selectedId = null;
      showEmptyState();
    }
    schedulePersist();
  });
}

function createNewHero() {
  const hero = HeroData.createNew();
  state.heroes.push(hero);
  renderHeroList();
  selectHero(hero.id);
  schedulePersist();
}

async function saveHeroToFile(hero) {
  const content = JSON.stringify(hero.toJSON(), null, 2);
  const mime = "application/json";
  const suggestedName = sanitizeFilename(hero.heroTitle) + ".json";

  if (supportsFileSystemAccess) {
    try {
      let handle = fileHandles.get(hero.id);

      if (handle) {
        const havePermission =
          (await handle.queryPermission({ mode: "readwrite" })) === "granted" ||
          (await handle.requestPermission({ mode: "readwrite" })) === "granted";
        if (!havePermission) handle = null;
      }

      if (!handle) {
        handle = await window.showSaveFilePicker({
          suggestedName,
          types: [{ description: "WSHB hero file", accept: { [mime]: [".json"] } }],
        });
        fileHandles.set(hero.id, handle);
      }

      const writable = await handle.createWritable();
      await writable.write(content);
      await writable.close();
      return true;
    } catch (err) {
      if (err.name === "AbortError") return false;
      console.error("File System Access save failed, falling back to plain download", err);
    }
  }

  downloadBlob(content, mime, suggestedName);
  return true;
}

function downloadBlob(content, mime, filename) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function downloadHero(hero) {
  downloadBlob(JSON.stringify(hero.toJSON(), null, 2), "application/json", sanitizeFilename(hero.heroTitle) + ".json");
}

function sanitizeFilename(name) {
  return name.replace(/[\\/:*?"<>|]/g, "_");
}

async function importFile(file, { select = true, quiet = false } = {}) {
  const name = file.name || "";
  if (!/\.json$/i.test(name)) return null;

  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const items = Array.isArray(parsed) ? parsed : [parsed];
    let last = null;
    for (const item of items) {
      const hero = HeroData.fromJSON(item);
      hero.dirty = false;
      state.heroes.push(hero);
      last = hero;
    }
    if (last && select) selectHero(last.id);
    return last;
  } catch (err) {
    console.error(`Error opening ${name}:`, err);
    if (!quiet) alert(`Error opening ${name}:\n${err.message}`);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Hero list / selection
// ---------------------------------------------------------------------------
function getSelectedHero() {
  return state.heroes.find((h) => h.id === state.selectedId) || null;
}

function renderHeroList() {
  const list = el("heroList");
  list.innerHTML = "";
  for (const hero of state.heroes) {
    const li = document.createElement("li");
    li.textContent = hero.heroTitle;
    if (hero.dirty) {
      const dot = document.createElement("span");
      dot.className = "dirty-dot";
      dot.textContent = "●";
      li.appendChild(dot);
    }
    if (hero.id === state.selectedId) li.classList.add("selected");
    li.addEventListener("click", () => selectHero(hero.id));
    list.appendChild(li);
  }
}

function selectHero(id) {
  state.selectedId = id;
  const hero = getSelectedHero();
  if (!hero) { showEmptyState(); return; }
  showEditor();
  fillFormFromHero(hero);
  updateComputedUI(hero);
  renderHeroList();
}

function showEmptyState() {
  el("emptyState").hidden = false;
  el("editorBody").hidden = true;
  el("summaryPanel").hidden = true;
}
function showEditor() {
  el("emptyState").hidden = true;
  el("editorBody").hidden = false;
  el("summaryPanel").hidden = false;
  el("editorSection").scrollTop = 0;
  window.scrollTo(0, 0);
}

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------
function bindTabs() {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      el("tab-" + btn.dataset.tab).classList.add("active");
    });
  });
}

// ---------------------------------------------------------------------------
// Info tab
// ---------------------------------------------------------------------------
// "Both" Archetypes/Professions may be used in either the Contemporary or
// Archaic category. "Reptaur" ones are written for the Reptaur alien species
// (see data.js) and are NOT for human Heroes - the label makes that obvious
// in the dropdown instead of silently mixing them in with human options.
function categoryDisplayLabel(category) {
  if (category === "Both") return "Contemporary or Archaic";
  if (category === "Reptaur") return "Reptaur Only - NOT for Human Heroes";
  return category;
}

function populateArchetypeSelect() {
  const select = el("fArchetype");
  select.innerHTML = "";
  const blank = document.createElement("option");
  blank.value = "";
  blank.textContent = "(None chosen)";
  select.appendChild(blank);

  for (const category of ["Contemporary", "Archaic", "Both", "Reptaur"]) {
    const group = document.createElement("optgroup");
    group.label = categoryDisplayLabel(category);
    for (const archetype of ARCHETYPES_REPOSITORY.filter((a) => a.category === category)) {
      const opt = document.createElement("option");
      opt.value = archetype.name;
      opt.textContent = archetype.subtitle ? `${archetype.name} (${archetype.subtitle})` : archetype.name;
      group.appendChild(opt);
    }
    select.appendChild(group);
  }

  select.addEventListener("change", () => withHero((hero) => {
    hero.archetype = select.value;
    // Every purchased Ability's cross-Archetype [x2] flag, X-Train discount, and
    // Bypassed-prereq status are all relative to the Hero's chosen Archetype.
    // Rather than recompute all of that across a switch, clear the Selected list -
    // the Abilities can simply be re-bought under the new Archetype.
    hero.selectedAbilities = [];
    selectedAbilityRepoKey = null;
    selectedAbilitySelKey = null;
    renderAbilityRepository();
    renderSelectedAbilities(hero);
  }));
}

function populateProfessionSelect() {
  const select = el("fProfession");
  select.innerHTML = "";
  const blank = document.createElement("option");
  blank.value = "";
  blank.textContent = "(None chosen)";
  select.appendChild(blank);

  for (const category of ["Contemporary", "Archaic", "Both"]) {
    const group = document.createElement("optgroup");
    group.label = categoryDisplayLabel(category);
    const profs = PROFESSIONS_REPOSITORY.filter((p) => p.category === category).sort((a, b) => a.name.localeCompare(b.name));
    for (const prof of profs) {
      const opt = document.createElement("option");
      opt.value = prof.name;
      opt.textContent = prof.name;
      group.appendChild(opt);
    }
    select.appendChild(group);
  }

  select.addEventListener("change", () => withHero((hero) => { hero.profession = select.value; }));
}

// The parenthetical after each Archetype's name (e.g. "Enforcer (Police, Government
// Agent)") lists its suggested real-world Professions. Highlight any Profession
// option that matches one of those terms - by exact name, or by substring in either
// direction (so "Military" suggests the existing "Military Training" Profession
// instead of needing a separate near-duplicate entry).
function suggestedProfessionTermsForArchetype(archetypeName) {
  if (!archetypeName) return [];
  const archetype = HeroData.findArchetype(archetypeName);
  if (!archetype || !archetype.subtitle) return [];
  return archetype.subtitle.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
}

function suggestedProfessionTerms(hero) {
  return hero ? suggestedProfessionTermsForArchetype(hero.archetype) : [];
}

function isSuggestedProfession(name, terms) {
  const p = name.toLowerCase();
  return terms.some((t) => p === t || p.includes(t) || t.includes(p));
}

function updateProfessionHighlighting(hero) {
  const terms = suggestedProfessionTerms(hero);
  el("fProfession").querySelectorAll("option[value]").forEach((opt) => {
    if (!opt.value) return;
    const suggested = terms.length > 0 && isSuggestedProfession(opt.value, terms);
    opt.classList.toggle("suggested-profession", suggested);
    opt.textContent = suggested ? `★ ${opt.value}` : opt.value;
  });
}

function bindInfoFields() {
  el("fHeroName").addEventListener("input", (e) => withHero((h) => { h.heroName = e.target.value; }));
  el("fCulture").addEventListener("input", (e) => withHero((h) => { h.culture = e.target.value; }));
  el("fLanguages").addEventListener("input", (e) => withHero((h) => { h.languages = e.target.value; }));
  el("fStartingDevPoints").addEventListener("input", (e) => withHero((h) => { h.startingDevPoints = toInt(e.target.value); }));
  el("fWealth").addEventListener("input", (e) => withHero((h) => { h.wealth = toInt(e.target.value); }));
}

function withHero(fn) {
  const hero = getSelectedHero();
  if (!hero) return;
  fn(hero);
  onHeroChanged(hero);
}

function updateArchetypeDescription(hero) {
  const box = el("archetypeDescription");
  if (!hero.archetype) { box.textContent = "No Archetype chosen yet."; return; }
  const archetype = HeroData.findArchetype(hero.archetype);
  if (!archetype) { box.textContent = ""; return; }
  const categoryLabel = categoryDisplayLabel(archetype.category);
  const lines = [`${archetype.name}${archetype.subtitle ? " (" + archetype.subtitle + ")" : ""} - ${categoryLabel}`, ""];
  if (archetype.note) lines.push(archetype.note, "");
  for (const ab of archetype.abilities) {
    lines.push(`${ab.name} (Cost: ${ab.cost}${ab.maxLevel > 1 ? "/level, max " + ab.maxLevel : ""}) [Prereq: ${ab.prerequisite}]`);
    lines.push(ab.description);
    lines.push("");
  }
  box.textContent = lines.join("\n");
}

// ---------------------------------------------------------------------------
// Skills tab (Attributes are merged in as colored rows - Development Points
// for Skills and the 15-point Attribute budget stay tracked separately even
// though they now share one table; see the Cost column, which is always "-"
// for an Attribute row since Attributes aren't bought with Skill DP.)
// ---------------------------------------------------------------------------
function buildSkillsTable() {
  const table = el("skillsTable");
  table.innerHTML = `<thead><tr>
    <th>Skill</th>
    <th class="col-center">Cost</th>
    <th class="col-center">Level</th>
    <th class="col-center">Bonus</th>
    <th class="col-center">Score</th>
    <th>Description</th>
  </tr></thead><tbody></tbody>`;
  const tbody = table.querySelector("tbody");

  for (const attrName of ATTRIBUTE_NAMES) {
    const attr = ATTRIBUTES_REPOSITORY.find((a) => a.name === attrName);
    const field = ATTRIBUTE_FIELD_BY_NAME[attrName];
    const attrRow = document.createElement("tr");
    attrRow.className = "attribute-row";
    attrRow.innerHTML = `
      <td class="feature-name">${attrName}</td>
      <td class="readonly-cell col-center">-</td>
      <td class="col-center"><input type="number" min="0" max="5" step="1" id="attr-${field}"></td>
      <td class="col-center"><input type="number" step="1" id="attr-${field}-bonus"></td>
      <td class="readonly-cell col-center" id="attr-${field}-total">0</td>
      <td class="feature-notes">${attr.description}</td>
    `;
    tbody.appendChild(attrRow);

    el(`attr-${field}`).addEventListener("input", (e) => withHero((hero) => {
      hero[field] = clamp(toInt(e.target.value), 0, 5);
      el(`attr-${field}-total`).textContent = hero.attributeTotal(attrName);
    }));
    el(`attr-${field}-bonus`).addEventListener("input", (e) => withHero((hero) => {
      hero.setAttributeBonus(attrName, toInt(e.target.value));
      el(`attr-${field}-total`).textContent = hero.attributeTotal(attrName);
    }));

    for (const skill of SKILLS_REPOSITORY.filter((s) => s.attribute === attrName)) {
      const key = skill.skillName.replace(/[^a-zA-Z0-9]/g, "");
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="feature-name">${skill.skillName}</td>
        <td class="readonly-cell col-center" id="skill-${key}-cost">0</td>
        <td class="col-center"><input type="number" min="0" max="10" step="1" id="skill-${key}"></td>
        <td class="col-center"><input type="number" step="1" id="skill-${key}-bonus"></td>
        <td class="readonly-cell col-center" id="skill-${key}-score">0</td>
        <td class="feature-notes">${skill.description}</td>
      `;
      tbody.appendChild(tr);

      el(`skill-${key}`).addEventListener("input", (e) => withHero((hero) => {
        hero.setSkillLevel(skill.skillName, clamp(toInt(e.target.value), 0, 10));
      }));
      el(`skill-${key}-bonus`).addEventListener("input", (e) => withHero((hero) => {
        hero.setSkillBonus(skill.skillName, toInt(e.target.value));
      }));
    }
  }
}

// ---------------------------------------------------------------------------
// Archetype & Generic Abilities picker - Repository and Selected are both
// sortable 4-column tables (Archetype / Ability / Prereq / Cost). Generic
// Abilities (not tied to any Archetype) are merged into the same Repository/
// Selected tables under their own group node, "Generic Abilities" - it plays
// the same structural role as a real Archetype name for grouping/keying
// purposes, but every row keeps kind: "generic" so cost/prereq/purchase logic
// (which differs a lot from Archetype Abilities - no cross-Archetype
// doubling or X-Train, a flat/perLevel/table cost model instead) branches
// correctly.
// ---------------------------------------------------------------------------
const GENERIC_NODE_NAME = "Generic Abilities";

function flattenAbilities() {
  const out = [];
  for (const archetype of ARCHETYPES_REPOSITORY) {
    for (const ability of archetype.abilities) {
      out.push({ kind: "archetype", archetypeName: archetype.name, ...ability });
    }
  }
  for (const generic of GENERIC_ABILITIES_REPOSITORY) {
    out.push({
      kind: "generic",
      archetypeName: GENERIC_NODE_NAME,
      name: generic.name,
      prerequisite: generic.prerequisite || "None",
      description: generic.description,
      maxLevel: generic.maxLevel || (generic.costTable ? generic.costTable.length : 1),
      genericDef: generic,
    });
  }
  return out;
}
const ABILITY_FLAT_LIST = flattenAbilities();

// Evaluates an Archetype Ability's free-text Prerequisite (e.g. "None",
// "Agent", "Beguile and Born Entertainer", "Squid, and Helmsman or Navigator",
// "All Monk Abilities") against the Hero's currently-selected Abilities. The
// app never blocks purchases missing their prerequisite - this only powers the
// "Bypassed" flag shown in the Selected table.
function isAbilityPrereqMet(hero, entry) {
  const prereq = (entry.prerequisite || "").trim();
  if (!prereq || prereq.toLowerCase() === "none") return true;

  const archetype = HeroData.findArchetype(entry.archetypeName);
  if (!archetype) return true; // can't evaluate - don't flag

  const siblingNames = archetype.abilities.map((a) => a.name).filter((n) => n !== entry.name);
  const ownedNames = new Set(hero.selectedAbilities.map((s) => s.abilityName));

  if (/^all .*abilities$/i.test(prereq)) {
    return siblingNames.length > 0 && siblingNames.every((n) => ownedNames.has(n));
  }

  const findSibling = (text) => {
    const t = text.trim().toLowerCase();
    return siblingNames.find((n) => n.toLowerCase() === t) ||
      siblingNames.find((n) => t.includes(n.toLowerCase()));
  };

  const segmentSatisfied = (raw) => {
    const text = raw.replace(/^\s*(and|or)\s+/i, "").trim();
    if (/\bor\b/i.test(text)) {
      return text.split(/\bor\b/i).some((p) => {
        const name = findSibling(p);
        return name ? ownedNames.has(name) : true;
      });
    }
    if (/\band\b/i.test(text)) {
      return text.split(/\band\b/i).every((p) => {
        const name = findSibling(p);
        return name ? ownedNames.has(name) : true;
      });
    }
    const name = findSibling(text);
    return name ? ownedNames.has(name) : true;
  };

  // Top-level comma segments are AND'd together (e.g. "Squid, and Helmsman or
  // Navigator" -> Squid AND (Helmsman OR Navigator)).
  return prereq.split(",").every((seg) => segmentSatisfied(seg));
}

const ABILITY_REPO_COLUMNS = [
  { key: "archetypeName", label: "Archetype" },
  { key: "name", label: "Ability" },
  { key: "prerequisite", label: "Prereq" },
  { key: "effectiveCost", label: "Cost" },
];

const abilityRepoSort = { key: "archetypeName", dir: 1 };
let selectedAbilityRepoKey = null;
// Archetype names currently expanded when the repository table is grouped by
// Archetype (i.e. sorted on that column). Empty by default - groups start collapsed.
const expandedAbilityRepoGroups = new Set();

const SELECTED_ABILITY_COLUMNS = [
  { key: "archetypeName", label: "Archetype" },
  { key: "name", label: "Ability" },
  { key: "prerequisite", label: "Prereq" },
  { key: "cost", label: "Cost" },
];

const abilitySelectedSort = { key: "archetypeName", dir: 1 };
let selectedAbilitySelKey = null;

function abilityKey(entry) { return `${entry.archetypeName}::${entry.name}`; }
function findAbilityByKey(key) {
  if (!key) return null;
  const sep = key.indexOf("::");
  const archetypeName = key.slice(0, sep);
  const name = key.slice(sep + 2);
  return ABILITY_FLAT_LIST.find((e) => e.archetypeName === archetypeName && e.name === name) || null;
}

function getAbilityRepoRows(hero) {
  const rows = ABILITY_FLAT_LIST.map((entry) => {
    if (entry.kind === "generic") {
      const ownedExact = !!(hero && hero.selectedGenericAbilities.some((s) => s.name === entry.name));
      const effectiveCost = genericAbilityCost(entry.genericDef, 1); // level-1 cost; also used to sort
      return { ...entry, cross: false, ownedExact, ownedElsewhere: false, effectiveCost };
    }

    const cross = !!(hero && hero.archetype && hero.isAbilityCrossArchetype(entry.archetypeName));
    const normalCost = entry.cost * (cross ? 2 : 1);
    const ownedExact = !!(hero && hero.selectedAbilities.some((s) => s.archetypeName === entry.archetypeName && s.abilityName === entry.name));
    // Same-named Ability already owned from a *different* Archetype - adding this
    // row would be a cross-training pick, discounted by what was already paid.
    const ownedElsewhere = !ownedExact && !!(hero && hero.selectedAbilities.some((s) => s.abilityName === entry.name));
    let effectiveCost = normalCost;
    if (ownedElsewhere) {
      const alreadyPaid = hero.selectedAbilities
        .filter((s) => s.abilityName === entry.name)
        .reduce((sum, s) => sum + hero.abilityNormalCost(s), 0);
      effectiveCost = Math.max(0, normalCost - alreadyPaid);
    }
    return { ...entry, cross, ownedExact, ownedElsewhere, effectiveCost };
  });

  const { key, dir } = abilityRepoSort;
  rows.sort((a, b) => {
    let av = a[key], bv = b[key];
    if (typeof av === "string") { av = av.toLowerCase(); bv = bv.toLowerCase(); }
    if (av < bv) return -1 * dir;
    if (av > bv) return 1 * dir;
    return a.name.localeCompare(b.name);
  });
  return rows;
}

function renderAbilityRepository() {
  const hero = getSelectedHero();
  const rows = getAbilityRepoRows(hero);
  const table = el("abilitiesRepositoryTable");

  table.innerHTML = `<thead><tr>${ABILITY_REPO_COLUMNS.map((c) => {
    const arrow = c.key === abilityRepoSort.key ? (abilityRepoSort.dir === 1 ? " ▲" : " ▼") : "";
    return `<th class="sortable" data-sort-key="${c.key}">${c.label}${arrow}</th>`;
  }).join("")}</tr></thead><tbody></tbody>`;

  const tbody = table.querySelector("tbody");
  if (rows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="listbox-empty">No abilities found.</td></tr>`;
    return;
  }

  // Sorting by Archetype groups the rows under collapsible headers (collapsed
  // by default) since that ordering naturally clusters each Archetype's
  // abilities together. Sorting by any other column spreads all rows out flat.
  if (abilityRepoSort.key !== "archetypeName") {
    for (const row of rows) tbody.appendChild(buildAbilityRepoRow(row));
    return;
  }

  let currentGroup = null;
  let groupRows = [];
  const flushGroup = () => {
    if (currentGroup === null) return;
    const expanded = expandedAbilityRepoGroups.has(currentGroup);
    const groupTr = document.createElement("tr");
    groupTr.className = "repo-group-row";
    groupTr.dataset.group = currentGroup;
    groupTr.innerHTML = `<td colspan="4">${expanded ? "▾" : "▸"} ${currentGroup} (${groupRows.length})</td>`;
    tbody.appendChild(groupTr);
    if (expanded) {
      for (const row of groupRows) tbody.appendChild(buildAbilityRepoRow(row));
    }
  };

  for (const row of rows) {
    if (row.archetypeName !== currentGroup) {
      flushGroup();
      currentGroup = row.archetypeName;
      groupRows = [];
    }
    groupRows.push(row);
  }
  flushGroup();
}

function buildAbilityRepoRow(row) {
  const key = abilityKey(row);
  const tr = document.createElement("tr");
  tr.className = "repo-row" + (row.ownedExact ? " repo-row-owned" : "") + (key === selectedAbilityRepoKey ? " selected" : "");
  tr.dataset.key = key;
  const costLabel = row.kind === "generic"
    ? (row.genericDef.costMode === "table" ? "varies" : `${row.effectiveCost}${row.genericDef.costMode === "perLevel" ? "/lvl" : ""}`)
    : `${row.effectiveCost}${row.maxLevel > 1 ? "/lvl" : ""}${row.cross ? " [x2]" : ""}`;
  const nameSuffix = row.ownedExact ? " (owned)" : row.ownedElsewhere ? " (x-train)" : "";
  tr.innerHTML = `
    <td>${row.archetypeName}</td>
    <td>${row.name}${nameSuffix}</td>
    <td class="feature-notes">${row.prerequisite}</td>
    <td class="readonly-cell">${costLabel}</td>
  `;
  return tr;
}

function showAbilityRepoInfo(key) {
  const hero = getSelectedHero();
  const entry = findAbilityByKey(key);
  if (!hero || !entry) return;
  const level = toInt(el("fAbilityLevel").value) || 1;

  if (entry.kind === "generic") {
    const def = entry.genericDef;
    const ownedExact = hero.selectedGenericAbilities.some((s) => s.name === entry.name);
    const cost = genericAbilityCost(def, level);
    const levelNote = def.levelNames ? ` (${def.levelNames[Math.min(level, def.levelNames.length) - 1]})` : "";
    el("abilityInformation").textContent =
      `${entry.name} (${GENERIC_NODE_NAME})${ownedExact ? " - already owned" : ""}\n` +
      `Cost to Buy at Level ${level}${levelNote}: ${cost}\n` +
      `Max Level: ${entry.maxLevel}\n` +
      `Prerequisites: ${entry.prerequisite}\n` +
      `${entry.description}`;
    return;
  }

  const cross = hero.archetype && hero.isAbilityCrossArchetype(entry.archetypeName);
  const normalCost = entry.cost * level * (cross ? 2 : 1);

  const ownedExact = hero.selectedAbilities.some((s) => s.archetypeName === entry.archetypeName && s.abilityName === entry.name);
  const ownedElsewhere = !ownedExact && hero.selectedAbilities.some((s) => s.abilityName === entry.name);

  let costLine = `Cost to Buy: ${normalCost}${cross ? " (x2, not this Hero's Archetype)" : ""}`;
  if (ownedElsewhere) {
    const alreadyPaid = hero.selectedAbilities
      .filter((s) => s.abilityName === entry.name)
      .reduce((sum, s) => sum + hero.abilityNormalCost(s), 0);
    const discounted = Math.max(0, normalCost - alreadyPaid);
    costLine = `Cost to Buy: ${discounted} (X-Train: ${normalCost} minus ${alreadyPaid} already paid for ${entry.name})`;
  }

  el("abilityInformation").textContent =
    `${entry.name} (${entry.archetypeName})${ownedExact ? " - already owned" : ownedElsewhere ? " - cross-training pick" : ""}\n` +
    `${costLine}\n` +
    `Max Level: ${entry.maxLevel || 1}\n` +
    `Prerequisites: ${entry.prerequisite}\n` +
    `${entry.description}`;
}

function bindAbilities() {
  el("abilitiesRepositoryTable").addEventListener("click", (e) => {
    const th = e.target.closest("th.sortable");
    if (th) {
      const key = th.dataset.sortKey;
      if (abilityRepoSort.key === key) abilityRepoSort.dir *= -1;
      else { abilityRepoSort.key = key; abilityRepoSort.dir = 1; }
      renderAbilityRepository();
      return;
    }
    const groupTr = e.target.closest("tr.repo-group-row");
    if (groupTr) {
      const group = groupTr.dataset.group;
      if (expandedAbilityRepoGroups.has(group)) expandedAbilityRepoGroups.delete(group);
      else expandedAbilityRepoGroups.add(group);
      renderAbilityRepository();
      return;
    }
    const tr = e.target.closest("tr.repo-row");
    if (!tr) return;
    selectedAbilityRepoKey = tr.dataset.key;
    renderAbilityRepository();
    showAbilityRepoInfo(selectedAbilityRepoKey);
  });

  el("btnAddAbility").addEventListener("click", () => {
    const hero = getSelectedHero();
    if (!hero) { alert("No hero selected."); return; }
    if (!selectedAbilityRepoKey) { alert("Select an ability from the repository first."); return; }
    const entry = findAbilityByKey(selectedAbilityRepoKey);
    if (!entry) return;

    if (entry.kind === "generic") {
      if (hero.selectedGenericAbilities.some((s) => s.name === entry.name)) {
        alert(`${entry.name} has already been purchased.`);
        return;
      }
      const maxLevel = entry.maxLevel || 1;
      const level = clamp(toInt(el("fAbilityLevel").value) || 1, 1, maxLevel);
      hero.selectedGenericAbilities.push({ name: entry.name, level });
      onHeroChanged(hero);
      renderSelectedAbilities(hero);
      renderAbilityRepository();
      return;
    }

    if (hero.selectedAbilities.some((s) => s.archetypeName === entry.archetypeName && s.abilityName === entry.name)) {
      alert(`${entry.name} (${entry.archetypeName}) has already been purchased.`);
      return;
    }
    const maxLevel = entry.maxLevel || 1;
    const level = clamp(toInt(el("fAbilityLevel").value) || 1, 1, maxLevel);
    hero.selectedAbilities.push({ archetypeName: entry.archetypeName, abilityName: entry.name, level });
    onHeroChanged(hero);
    renderSelectedAbilities(hero);
    renderAbilityRepository();
  });

  el("abilitiesSelectedTable").addEventListener("click", (e) => {
    const hero = getSelectedHero();
    if (!hero) return;
    const th = e.target.closest("th.sortable");
    if (th) {
      const key = th.dataset.sortKey;
      if (abilitySelectedSort.key === key) abilitySelectedSort.dir *= -1;
      else { abilitySelectedSort.key = key; abilitySelectedSort.dir = 1; }
      renderSelectedAbilities(hero);
      return;
    }
    const tr = e.target.closest("tr.repo-row");
    if (!tr) return;
    selectedAbilitySelKey = tr.dataset.key;
    renderSelectedAbilities(hero);
    showSelectedAbilityInfo(hero, selectedAbilitySelKey);
  });

  el("btnRemoveAbility").addEventListener("click", () => {
    const hero = getSelectedHero();
    if (!hero) { alert("No hero selected."); return; }
    if (!selectedAbilitySelKey) { alert("Select an ability to remove."); return; }

    const genericIdx = hero.selectedGenericAbilities.findIndex((s) => abilityKey({ archetypeName: GENERIC_NODE_NAME, name: s.name }) === selectedAbilitySelKey);
    if (genericIdx !== -1) {
      hero.selectedGenericAbilities.splice(genericIdx, 1);
    } else {
      const idx = hero.selectedAbilities.findIndex((s) => abilityKey({ archetypeName: s.archetypeName, name: s.abilityName }) === selectedAbilitySelKey);
      if (idx === -1) { alert("Select an ability to remove."); return; }
      hero.selectedAbilities.splice(idx, 1);
    }
    selectedAbilitySelKey = null;
    onHeroChanged(hero);
    renderSelectedAbilities(hero);
    renderAbilityRepository();
  });
}

function getSelectedAbilityRows(hero) {
  const archetypeRows = hero.selectedAbilities.map((sel) => {
    const def = HeroData.findAbilityDef(sel.archetypeName, sel.abilityName);
    const cross = hero.isAbilityCrossArchetype(sel.archetypeName);
    const crossTrained = hero.isAbilityCrossTrained(sel);
    const rawPrereq = def ? def.prerequisite : "";
    const prereqMet = isAbilityPrereqMet(hero, { archetypeName: sel.archetypeName, name: sel.abilityName, prerequisite: rawPrereq });

    // Both flags are independent and can apply at once: X-Train marks this as a
    // discounted 2nd+ copy of an Ability owned under another Archetype; Bypassed
    // marks that *this entry's own* prerequisite chain isn't satisfied.
    const flags = [];
    if (crossTrained) flags.push("X-Train");
    if (!prereqMet) flags.push("Bypassed");
    const prerequisite = flags.length > 0 ? `${flags.join(", ")}: ${rawPrereq}` : rawPrereq;

    return {
      kind: "archetype",
      archetypeName: sel.archetypeName,
      name: sel.abilityName,
      prerequisite,
      prereqBypassed: !prereqMet,
      crossTrained,
      description: def ? def.description : "",
      level: sel.level,
      cross,
      cost: hero.abilityCost(sel),
    };
  });

  const genericRows = hero.selectedGenericAbilities.map((sel) => {
    const def = HeroData.findGenericAbilityDef(sel.name);
    const rawPrereq = (def && def.prerequisite) || "None";
    // Generic Ability prerequisites (only "Parry Modern Missile Weapon" has
    // one right now) just name another Generic Ability - no AND/OR parsing
    // needed like the Archetype version.
    const prereqMet = !def || !def.prerequisite || hero.selectedGenericAbilities.some((s) => s.name === def.prerequisite);
    const prerequisite = !prereqMet ? `Bypassed: ${rawPrereq}` : rawPrereq;

    return {
      kind: "generic",
      archetypeName: GENERIC_NODE_NAME,
      name: sel.name,
      prerequisite,
      prereqBypassed: !prereqMet,
      crossTrained: false,
      description: def ? def.description : "",
      level: sel.level,
      cross: false,
      cost: hero.genericAbilityCostFor(sel),
    };
  });

  const rows = [...archetypeRows, ...genericRows];
  const { key, dir } = abilitySelectedSort;
  rows.sort((a, b) => {
    let av = a[key], bv = b[key];
    if (typeof av === "string") { av = av.toLowerCase(); bv = bv.toLowerCase(); }
    if (av < bv) return -1 * dir;
    if (av > bv) return 1 * dir;
    return a.name.localeCompare(b.name);
  });
  return rows;
}

function showSelectedAbilityInfo(hero, key) {
  const row = getSelectedAbilityRows(hero).find((r) => abilityKey(r) === key);
  if (!row) return;
  el("abilityInformation").textContent =
    `${row.name} (${row.archetypeName})\n` +
    `Selected Level: ${row.level}\n` +
    `Cost: ${row.cost}${row.cross ? " (x2, not this Hero's Archetype)" : ""}\n` +
    `Prerequisites: ${row.prerequisite}\n` +
    `${row.description}`;
  el("fAbilityLevel").value = row.level;
}

function renderSelectedAbilities(hero) {
  const rows = getSelectedAbilityRows(hero);
  const table = el("abilitiesSelectedTable");

  table.innerHTML = `<thead><tr>${SELECTED_ABILITY_COLUMNS.map((c) => {
    const arrow = c.key === abilitySelectedSort.key ? (abilitySelectedSort.dir === 1 ? " ▲" : " ▼") : "";
    return `<th class="sortable" data-sort-key="${c.key}">${c.label}${arrow}</th>`;
  }).join("")}</tr></thead><tbody></tbody>`;

  const tbody = table.querySelector("tbody");
  if (rows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="listbox-empty">No abilities selected yet.</td></tr>`;
    return;
  }

  for (const row of rows) {
    const key = abilityKey(row);
    const tr = document.createElement("tr");
    tr.className = "repo-row" + (key === selectedAbilitySelKey ? " selected" : "");
    tr.dataset.key = key;
    const nameLabel = row.level > 1 ? `${row.name} (Lvl ${row.level})` : row.name;
    const costLabel = `${row.cost}${row.cross ? " [x2]" : ""}`;
    const prereqClass = "feature-notes" + (row.prereqBypassed ? " prereq-bypassed" : row.crossTrained ? " prereq-xtrain" : "");
    tr.innerHTML = `
      <td>${row.archetypeName}</td>
      <td>${nameLabel}</td>
      <td class="${prereqClass}">${row.prerequisite}</td>
      <td class="readonly-cell">${costLabel}</td>
    `;
    tbody.appendChild(tr);
  }
}


// ---------------------------------------------------------------------------
// Equipment tab - Weapons / Armor & Shields / Gear sub-tabs. Each sub-tab is
// a Repository table with every book stat as its own column, the matching
// Selected table stacked directly below it (same set of columns, plus
// Qty/Worn/Total Cost/Total Lbs), sortable and grouped-and-collapsed-by-
// default when sorted on the Group/Category column (reuses the Archetype
// Ability tables' .repo-group-row mechanism). Unlike Abilities, the same item
// can be bought more than once - a repeat purchase (with the same Worn state)
// increments the existing Selected row's quantity instead of adding a
// duplicate row.
// ---------------------------------------------------------------------------
function equipKey(kind, name) { return `${kind}::${name}`; }
// Selected rows are keyed by kind+name+worn, since the same item can appear
// twice - once worn (half weight), once not - as separate purchased lines.
function equipSelectedRowKey(kind, name, worn) { return `${kind}::${name}::${worn ? "worn" : "packed"}`; }
function findEquipEntry(flatList, key) {
  if (!key) return null;
  const [kind, name] = key.split("::");
  return flatList.find((e) => e.kind === kind && e.name === name) || null;
}

function equipmentGroupLabel(kind, def) {
  if (!def) return "";
  if (kind === "gear") return def.category;
  if (kind === "armor") return def.group === "Accessories" ? "Armor Accessories" : `${def.group} Armor`;
  if (kind === "shield") return `${def.group} Shield`;
  return def.group; // weapon
}

const WEAPONS_FLAT_LIST = WEAPONS_REPOSITORY.map((w) => ({
  ...w, kind: "weapon", groupLabel: equipmentGroupLabel("weapon", w), autoLabel: w.auto ? "Yes" : "No",
}));
const ARMOR_SHIELD_FLAT_LIST = [
  ...ARMOR_REPOSITORY.map((a) => ({ ...a, kind: "armor", groupLabel: equipmentGroupLabel("armor", a), cell: "-", parry: "-" })),
  ...SHIELDS_REPOSITORY.map((s) => ({ ...s, kind: "shield", groupLabel: equipmentGroupLabel("shield", s) })),
];
const GEAR_FLAT_LIST = GEAR_REPOSITORY.map((g) => ({ ...g, kind: "gear", groupLabel: equipmentGroupLabel("gear", g) }));

const WEAPON_STAT_COLUMNS = [
  { key: "cost", label: "Cost", numeric: true },
  { key: "cell", label: "Cell", numeric: true },
  { key: "ammo", label: "Ammo", numeric: true },
  { key: "lbs", label: "Lbs", numeric: true },
  { key: "range", label: "Rng", numeric: true },
  { key: "damage", label: "Dmg", numeric: true },
  { key: "toHit", label: "To Hit", numeric: true },
  { key: "parry", label: "Parry", numeric: true },
  { key: "ap", label: "AP", numeric: true },
  { key: "hands", label: "Hands", numeric: true },
  { key: "reload", label: "Reload", numeric: true },
  { key: "autoLabel", label: "Auto", numeric: true },
];
const ARMOR_STAT_COLUMNS = [
  { key: "dr", label: "DR", numeric: true },
  { key: "cost", label: "Cost", numeric: true },
  { key: "cell", label: "Cell", numeric: true },
  { key: "lbs", label: "Lbs", numeric: true },
  { key: "parry", label: "Parry", numeric: true },
];
const GEAR_STAT_COLUMNS = [
  { key: "cost", label: "Cost", numeric: true },
  { key: "lbs", label: "Lbs", numeric: true },
];

const PURCHASE_COLUMNS = [
  { key: "quantity", label: "Qty", numeric: true },
  { key: "wornLabel", label: "Worn", numeric: true },
  { key: "totalCost", label: "Total Cost", numeric: true },
  { key: "totalLbs", label: "Total Lbs", numeric: true },
];

function nameGroupColumns(groupHeaderLabel) {
  return [{ key: "groupLabel", label: groupHeaderLabel }, { key: "name", label: "Name" }];
}

// Explicit group order (rather than alphabetical) so Light/Medium/Heavy tiers
// stay in their natural progression instead of "Heavy, Light, Medium".
// Groups not listed here fall back to alphabetical order, after any listed ones.
const EQUIPMENT_KIND_CONFIG = {
  weapon: {
    flatList: WEAPONS_FLAT_LIST, kinds: ["weapon"],
    repoColumns: [...nameGroupColumns("Group"), ...WEAPON_STAT_COLUMNS],
    selectedColumns: [...nameGroupColumns("Group"), ...PURCHASE_COLUMNS, ...WEAPON_STAT_COLUMNS],
    repoTableId: "weaponsRepositoryTable", selectedTableId: "weaponsSelectedTable",
    qtyInputId: "fWeaponQty", wornInputId: "fWeaponWorn", addBtnId: "btnAddWeapon", removeBtnId: "btnRemoveWeapon",
    infoBoxId: "weaponInformation",
    groupOrder: ["Unarmed", "Light Melee", "Medium Melee", "Heavy Melee", "Light Missile", "Medium Missile", "Heavy Missile", "Grenades/Rockets"],
  },
  armor: {
    flatList: ARMOR_SHIELD_FLAT_LIST, kinds: ["armor", "shield"],
    repoColumns: [...nameGroupColumns("Group"), ...ARMOR_STAT_COLUMNS],
    selectedColumns: [...nameGroupColumns("Group"), ...PURCHASE_COLUMNS, ...ARMOR_STAT_COLUMNS],
    repoTableId: "armorRepositoryTable", selectedTableId: "armorSelectedTable",
    qtyInputId: "fArmorQty", wornInputId: "fArmorWorn", addBtnId: "btnAddArmor", removeBtnId: "btnRemoveArmor",
    infoBoxId: "armorInformation",
    groupOrder: ["Light Armor", "Medium Armor", "Heavy Armor", "Armor Accessories", "Archaic Shield", "Contemporary Shield"],
  },
  gear: {
    flatList: GEAR_FLAT_LIST, kinds: ["gear"],
    repoColumns: [...nameGroupColumns("Category"), ...GEAR_STAT_COLUMNS],
    selectedColumns: [...nameGroupColumns("Category"), ...PURCHASE_COLUMNS, ...GEAR_STAT_COLUMNS],
    repoTableId: "gearRepositoryTable", selectedTableId: "gearSelectedTable",
    qtyInputId: "fGearQty", wornInputId: "fGearWorn", addBtnId: "btnAddGear", removeBtnId: "btnRemoveGear",
    infoBoxId: "gearInformation",
    groupOrder: GEAR_CATEGORIES,
  },
};

const equipmentUI = {
  weapon: { sort: { key: "groupLabel", dir: 1 }, selSort: { key: "groupLabel", dir: 1 }, expandedGroups: new Set(), repoKey: null, selKey: null },
  armor: { sort: { key: "groupLabel", dir: 1 }, selSort: { key: "groupLabel", dir: 1 }, expandedGroups: new Set(), repoKey: null, selKey: null },
  gear: { sort: { key: "groupLabel", dir: 1 }, selSort: { key: "groupLabel", dir: 1 }, expandedGroups: new Set(), repoKey: null, selKey: null },
};

// Shared renderer for both the Repository and Selected tables of every
// sub-tab: sortable columns, and (when groupable and currently sorted on the
// first column) grouped-and-collapsed rows.
function renderEquipmentTable(tableId, columns, rows, sortState, opts) {
  const table = el(tableId);
  table.innerHTML = `<thead><tr>${columns.map((c) => {
    const arrow = c.key === sortState.key ? (sortState.dir === 1 ? " ▲" : " ▼") : "";
    return `<th class="sortable" data-sort-key="${c.key}">${c.label}${arrow}</th>`;
  }).join("")}</tr></thead><tbody></tbody>`;

  const sorted = [...rows].sort((a, b) => {
    // The Group/Category column follows the book's own section order (e.g.
    // Light/Medium/Heavy) rather than alphabetical, when one is configured.
    if (sortState.key === columns[0].key && opts.groupOrder) {
      const rank = (label) => {
        const i = opts.groupOrder.indexOf(label);
        return i === -1 ? opts.groupOrder.length : i;
      };
      const diff = rank(a.groupLabel) - rank(b.groupLabel);
      if (diff !== 0) return diff * sortState.dir;
      return String(a.name).localeCompare(String(b.name));
    }
    let av = a[sortState.key], bv = b[sortState.key];
    if (typeof av !== "number" || typeof bv !== "number") { av = String(av ?? "").toLowerCase(); bv = String(bv ?? "").toLowerCase(); }
    if (av < bv) return -1 * sortState.dir;
    if (av > bv) return 1 * sortState.dir;
    return String(a.name).localeCompare(String(b.name));
  });

  const tbody = table.querySelector("tbody");
  if (sorted.length === 0) {
    tbody.innerHTML = `<tr><td colspan="${columns.length}" class="listbox-empty">${opts.emptyText}</td></tr>`;
    return;
  }

  const buildRow = (row) => {
    const key = opts.rowKeyFn(row);
    const tr = document.createElement("tr");
    tr.className = "repo-row" + (key === opts.selectedKey ? " selected" : "");
    tr.dataset.key = key;
    tr.innerHTML = columns.map((c) => {
      const val = row[c.key];
      const display = (val === undefined || val === null || val === "") ? "-" : val;
      return `<td${c.numeric ? ' class="readonly-cell"' : ""}>${display}</td>`;
    }).join("");
    return tr;
  };

  if (!opts.groupable || columns[0].key !== sortState.key) {
    for (const row of sorted) tbody.appendChild(buildRow(row));
    return;
  }

  let currentGroup = null;
  let groupRows = [];
  const flushGroup = () => {
    if (currentGroup === null) return;
    const expanded = opts.expandedGroups.has(currentGroup);
    const groupTr = document.createElement("tr");
    groupTr.className = "repo-group-row";
    groupTr.dataset.group = currentGroup;
    groupTr.innerHTML = `<td colspan="${columns.length}">${expanded ? "▾" : "▸"} ${currentGroup} (${groupRows.length})</td>`;
    tbody.appendChild(groupTr);
    if (expanded) for (const row of groupRows) tbody.appendChild(buildRow(row));
  };
  for (const row of sorted) {
    if (row.groupLabel !== currentGroup) { flushGroup(); currentGroup = row.groupLabel; groupRows = []; }
    groupRows.push(row);
  }
  flushGroup();
}

function renderEquipmentRepository(kindTag) {
  const cfg = EQUIPMENT_KIND_CONFIG[kindTag];
  const ui = equipmentUI[kindTag];
  renderEquipmentTable(cfg.repoTableId, cfg.repoColumns, cfg.flatList, ui.sort, {
    groupable: true,
    groupOrder: cfg.groupOrder,
    expandedGroups: ui.expandedGroups,
    selectedKey: ui.repoKey,
    rowKeyFn: (row) => equipKey(row.kind, row.name),
    emptyText: "No items found.",
  });
}

function getEquipmentSelectedRows(hero, kinds, flatList) {
  return hero.selectedEquipment
    .filter((sel) => kinds.includes(sel.kind))
    .map((sel) => {
      const def = flatList.find((e) => e.kind === sel.kind && e.name === sel.name) || {};
      return {
        ...def,
        quantity: sel.quantity || 1,
        worn: !!sel.worn,
        wornLabel: sel.worn ? "Yes" : "No",
        totalCost: hero.equipmentCostFor(sel),
        totalLbs: hero.equipmentWeightFor(sel),
      };
    });
}

function renderEquipmentSelectedTable(kindTag, hero) {
  const cfg = EQUIPMENT_KIND_CONFIG[kindTag];
  const ui = equipmentUI[kindTag];
  const rows = getEquipmentSelectedRows(hero, cfg.kinds, cfg.flatList);
  renderEquipmentTable(cfg.selectedTableId, cfg.selectedColumns, rows, ui.selSort, {
    groupable: false,
    groupOrder: cfg.groupOrder,
    expandedGroups: ui.expandedGroups,
    selectedKey: ui.selKey,
    rowKeyFn: (row) => equipSelectedRowKey(row.kind, row.name, row.worn),
    emptyText: "No items selected yet.",
  });
}

function showEquipmentInfo(kindTag, key) {
  const cfg = EQUIPMENT_KIND_CONFIG[kindTag];
  const entry = findEquipEntry(cfg.flatList, key);
  if (!entry) return;
  el(cfg.infoBoxId).textContent = `${entry.name} (${entry.groupLabel})\n\n${entry.description}`;
}

function bindEquipmentSubTab(kindTag) {
  const cfg = EQUIPMENT_KIND_CONFIG[kindTag];
  const ui = equipmentUI[kindTag];

  el(cfg.repoTableId).addEventListener("click", (e) => {
    const th = e.target.closest("th.sortable");
    if (th) {
      const key = th.dataset.sortKey;
      if (ui.sort.key === key) ui.sort.dir *= -1;
      else { ui.sort.key = key; ui.sort.dir = 1; }
      renderEquipmentRepository(kindTag);
      return;
    }
    const groupTr = e.target.closest("tr.repo-group-row");
    if (groupTr) {
      const g = groupTr.dataset.group;
      if (ui.expandedGroups.has(g)) ui.expandedGroups.delete(g);
      else ui.expandedGroups.add(g);
      renderEquipmentRepository(kindTag);
      return;
    }
    const tr = e.target.closest("tr.repo-row");
    if (!tr) return;
    ui.repoKey = tr.dataset.key;
    renderEquipmentRepository(kindTag);
    showEquipmentInfo(kindTag, ui.repoKey);
  });

  el(cfg.addBtnId).addEventListener("click", () => {
    const hero = getSelectedHero();
    if (!hero) { alert("No hero selected."); return; }
    if (!ui.repoKey) { alert("Select an item from the repository first."); return; }
    const entry = findEquipEntry(cfg.flatList, ui.repoKey);
    if (!entry) return;
    const qty = Math.max(1, toInt(el(cfg.qtyInputId).value) || 1);
    const worn = el(cfg.wornInputId).checked;
    const existing = hero.selectedEquipment.find((s) => s.kind === entry.kind && s.name === entry.name && !!s.worn === worn);
    if (existing) existing.quantity = (existing.quantity || 1) + qty;
    else hero.selectedEquipment.push({ kind: entry.kind, name: entry.name, quantity: qty, worn });
    onHeroChanged(hero);
    renderEquipmentSelectedTable(kindTag, hero);
  });

  el(cfg.selectedTableId).addEventListener("click", (e) => {
    const hero = getSelectedHero();
    if (!hero) return;
    const th = e.target.closest("th.sortable");
    if (th) {
      const key = th.dataset.sortKey;
      if (ui.selSort.key === key) ui.selSort.dir *= -1;
      else { ui.selSort.key = key; ui.selSort.dir = 1; }
      renderEquipmentSelectedTable(kindTag, hero);
      return;
    }
    const tr = e.target.closest("tr.repo-row");
    if (!tr) return;
    ui.selKey = tr.dataset.key;
    renderEquipmentSelectedTable(kindTag, hero);
    showEquipmentInfo(kindTag, ui.selKey);
  });

  el(cfg.removeBtnId).addEventListener("click", () => {
    const hero = getSelectedHero();
    if (!hero) { alert("No hero selected."); return; }
    if (!ui.selKey) { alert("Select an item to remove."); return; }
    const [kind, name, wornTag] = ui.selKey.split("::");
    const worn = wornTag === "worn";
    const idx = hero.selectedEquipment.findIndex((s) => s.kind === kind && s.name === name && !!s.worn === worn);
    if (idx === -1) { alert("Select an item to remove."); return; }
    hero.selectedEquipment.splice(idx, 1);
    ui.selKey = null;
    onHeroChanged(hero);
    renderEquipmentSelectedTable(kindTag, hero);
  });
}

function bindEquipmentSubTabNav() {
  document.querySelectorAll(".subtab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const nav = btn.closest(".subtabs");
      const container = nav.parentElement;
      nav.querySelectorAll(".subtab-btn").forEach((b) => b.classList.remove("active"));
      container.querySelectorAll(".subtab-panel").forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      el("subtab-" + btn.dataset.subtab).classList.add("active");
    });
  });
}

function bindEquipment() {
  bindEquipmentSubTabNav();
  for (const kindTag of Object.keys(EQUIPMENT_KIND_CONFIG)) bindEquipmentSubTab(kindTag);
}

function renderAllEquipmentRepositories() {
  for (const kindTag of Object.keys(EQUIPMENT_KIND_CONFIG)) renderEquipmentRepository(kindTag);
}

function renderAllEquipmentSelected(hero) {
  for (const kindTag of Object.keys(EQUIPMENT_KIND_CONFIG)) renderEquipmentSelectedTable(kindTag, hero);
}

// ---------------------------------------------------------------------------
// Background tab
// ---------------------------------------------------------------------------
function bindBackground() {
  el("fHasDisability").addEventListener("change", (e) => withHero((h) => { h.hasDisability = e.target.checked; }));
  el("fDisabilityText").addEventListener("input", (e) => withHero((h) => { h.disabilityText = e.target.value; }));
  el("fHasBackstory").addEventListener("change", (e) => withHero((h) => { h.hasBackstory = e.target.checked; }));
  el("fBackstoryText").addEventListener("input", (e) => withHero((h) => { h.backstoryText = e.target.value; }));
  el("fDescription").addEventListener("input", (e) => withHero((h) => { h.description = e.target.value; }));
}

// ---------------------------------------------------------------------------
// Character Sheet tab - a read-only print/reference view mirroring the
// official "Hero Display" quick-reference sheet, laid over data already
// entered on the other tabs. Player/Campaign, current Health/Resolve, and SR
// are the only things actually editable here (static inputs, bound once -
// see bindCharacterSheet); everything else is regenerated on every render.
// ---------------------------------------------------------------------------
const SHEET_LEFT_ATTRS = ["Agility", "Awareness", "Charisma", "Might"];
const SHEET_RIGHT_ATTRS = ["Coordination", "Intelligence", "Willpower"];

function bindCharacterSheet() {
  el("fPlayerName").addEventListener("input", (e) => withHero((h) => { h.playerName = e.target.value; }));
  el("fCampaign").addEventListener("input", (e) => withHero((h) => { h.campaign = e.target.value; }));
  el("fCurrentHealth").addEventListener("input", (e) => withHero((h) => {
    h.currentHealth = e.target.value === "" ? null : clamp(toInt(e.target.value), 0, h.health);
  }));
  el("fCurrentResolve").addEventListener("input", (e) => withHero((h) => {
    h.currentResolve = e.target.value === "" ? null : clamp(toInt(e.target.value), 0, h.resolve);
  }));
  el("fStressReduction").addEventListener("input", (e) => withHero((h) => { h.stressReduction = Math.max(0, toInt(e.target.value)); }));

  el("btnPrintSheet").addEventListener("click", () => window.print());
}

function renderSheetOptionsTable(hero) {
  const rows = [];
  if (hero.culture) rows.push([escHtml(hero.culture), "Culture", "", ""]);
  if (hero.languages) rows.push([escHtml(hero.languages), "Languages", "", ""]);
  if (hero.profession) rows.push([escHtml(hero.profession) + (hero.hasMasterGenericAbility ? " (Master)" : ""), "Profession", "", ""]);
  if (hero.hasDisability) rows.push([escHtml(hero.disabilityText) || "Disability", "Disability", 1, -5]);
  if (hero.hasBackstory) rows.push([escHtml(hero.backstoryText) || "Backstory", "Backstory", 1, -5]);
  for (const sel of hero.selectedAbilities) {
    rows.push([sel.abilityName, sel.archetypeName, sel.level, hero.abilityCost(sel)]);
  }
  for (const sel of hero.selectedGenericAbilities) {
    rows.push([sel.name, "Generic Ability", sel.level, hero.genericAbilityCostFor(sel)]);
  }

  const table = el("sheetOptionsTable");
  table.innerHTML = `<thead><tr><th>Option</th><th>Notes</th><th class="col-center">Level</th><th class="col-center">Cost</th></tr></thead><tbody></tbody>`;
  const tbody = table.querySelector("tbody");
  if (rows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="listbox-empty">Nothing selected yet.</td></tr>`;
    return;
  }
  for (const [name, notes, level, cost] of rows) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td class="feature-name">${name}</td><td class="feature-notes">${notes}</td><td class="readonly-cell col-center">${level}</td><td class="readonly-cell col-center">${cost}</td>`;
    tbody.appendChild(tr);
  }
}

// Weapons/Armor Carried reuse the exact same row shape and columns as the
// Equipment tab's Selected tables - this is a static, non-interactive
// snapshot of that same data, so sorting/grouping/selection are irrelevant.
function renderSheetEquipmentTable(kindTag, tableId) {
  return (hero) => {
    const cfg = EQUIPMENT_KIND_CONFIG[kindTag];
    const rows = getEquipmentSelectedRows(hero, cfg.kinds, cfg.flatList);
    renderEquipmentTable(tableId, cfg.selectedColumns, rows, { key: "groupLabel", dir: 1 }, {
      groupable: false,
      expandedGroups: new Set(),
      selectedKey: null,
      rowKeyFn: (row) => equipSelectedRowKey(row.kind, row.name, row.worn),
      emptyText: kindTag === "weapon" ? "No weapons carried." : "No armor or shields carried.",
    });
  };
}
const renderSheetWeaponsTable = renderSheetEquipmentTable("weapon", "sheetWeaponsTable");
const renderSheetArmorTable = renderSheetEquipmentTable("armor", "sheetArmorTable");

function buildAttrSkillRows(hero, attrNames) {
  const skillFlags = hero.skillAdvantageFlags;
  const rows = [];
  for (const attrName of attrNames) {
    rows.push({
      header: true, name: attrName.toUpperCase(), cost: "-",
      level: hero.attributeValue(attrName), bonus: hero.attributeBonus(attrName), total: hero.attributeTotal(attrName),
    });
    for (const skill of SKILLS_REPOSITORY.filter((s) => s.attribute === attrName)) {
      const level = hero.getSkillLevel(skill.skillName);
      rows.push({
        header: false, name: skill.skillName,
        cost: skillLevelCost(level), level, bonus: hero.getSkillBonus(skill.skillName),
        total: `${hero.getSkillScore(skill.skillName)}${skillFlags[skill.skillName] || ""}`,
      });
    }
  }
  return rows;
}

function renderSheetAttrSkillSide(tableId, hero, attrNames, trailerRows) {
  const table = el(tableId);
  table.innerHTML = `<thead><tr><th>Attribute/Skill</th><th class="col-center">Cost</th><th class="col-center">Level</th><th class="col-center">Bonus</th><th class="col-center">Total</th></tr></thead><tbody></tbody>`;
  const tbody = table.querySelector("tbody");
  for (const row of buildAttrSkillRows(hero, attrNames)) {
    const tr = document.createElement("tr");
    const nameCell = row.header
      ? `<td class="skill-group-header">${row.name}</td>`
      : `<td class="feature-name">${row.name}</td>`;
    tr.innerHTML = `${nameCell}<td class="readonly-cell col-center">${row.cost}</td><td class="readonly-cell col-center">${row.level}</td><td class="readonly-cell col-center">${row.bonus}</td><td class="readonly-cell col-center">${row.total}</td>`;
    tbody.appendChild(tr);
  }
  for (const [label, value] of trailerRows) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td class="feature-name">${label}</td><td colspan="4" class="readonly-cell">${value}</td>`;
    tbody.appendChild(tr);
  }
}

// Health/Resolve max (Resistance/Discipline) can change from other tabs while
// the Character Sheet is open. Refresh the Remaining fields to track that,
// unless the field is the one currently being typed into.
function setDerivedInputValue(id, value) {
  const input = el(id);
  if (document.activeElement !== input) input.value = value;
}

function renderCharacterSheetDerived(hero) {
  el("sheetHeroName").value = hero.heroName || "(unnamed)";
  el("sheetArchetype").value = hero.archetype || "(none)";
  el("sheetHealthMax").textContent = hero.health;
  el("sheetResolveMax").textContent = hero.resolve;
  el("sheetMaxLoad").value = `${hero.totalEquipmentWeight} / ${hero.load} lbs`;
  el("sheetDR").value = hero.equippedDR;
  el("sheetMove").value = `${hero.baseMove} ft`;
  setDerivedInputValue("fCurrentHealth", hero.displayHealth);
  setDerivedInputValue("fCurrentResolve", hero.displayResolve);

  renderSheetOptionsTable(hero);
  renderSheetWeaponsTable(hero);
  renderSheetArmorTable(hero);
  renderSheetAttrSkillSide("sheetAttrSkillLeftTable", hero, SHEET_LEFT_ATTRS, []);
  renderSheetAttrSkillSide("sheetAttrSkillRightTable", hero, SHEET_RIGHT_ATTRS, [
    ["Wealth", `${hero.wealthRemaining} / ${hero.wealth}`],
    ["Total Dev Pts", hero.totalDevPoints],
    ["Unspent Dev Pts", hero.unspentDevPoints],
  ]);
}

// ---------------------------------------------------------------------------
// Fill form from hero (on selection change only - never during typing)
// ---------------------------------------------------------------------------
function fillFormFromHero(hero) {
  el("fHeroName").value = hero.heroName;
  el("fCulture").value = hero.culture;
  el("fLanguages").value = hero.languages;
  el("fArchetype").value = hero.archetype;
  el("fProfession").value = hero.profession;
  el("fStartingDevPoints").value = hero.startingDevPoints;
  el("fWealth").value = hero.wealth;

  for (const attrName of ATTRIBUTE_NAMES) {
    const field = ATTRIBUTE_FIELD_BY_NAME[attrName];
    el(`attr-${field}`).value = hero[field];
    el(`attr-${field}-bonus`).value = hero.attributeBonus(attrName);
    el(`attr-${field}-total`).textContent = hero.attributeTotal(attrName);
  }

  for (const skill of SKILLS_REPOSITORY) {
    const key = skill.skillName.replace(/[^a-zA-Z0-9]/g, "");
    el(`skill-${key}`).value = hero.getSkillLevel(skill.skillName);
    el(`skill-${key}-bonus`).value = hero.getSkillBonus(skill.skillName);
  }

  el("fHasDisability").checked = hero.hasDisability;
  el("fDisabilityText").value = hero.disabilityText;
  el("fHasBackstory").checked = hero.hasBackstory;
  el("fBackstoryText").value = hero.backstoryText;
  el("fDescription").value = hero.description;

  el("fPlayerName").value = hero.playerName;
  el("fCampaign").value = hero.campaign;
  el("fCurrentHealth").value = hero.displayHealth;
  el("fCurrentResolve").value = hero.displayResolve;
  el("fStressReduction").value = hero.stressReduction;

  el("abilityInformation").textContent = "";
  el("weaponInformation").textContent = "";
  el("armorInformation").textContent = "";
  el("gearInformation").textContent = "";
  selectedAbilityRepoKey = null;
  selectedAbilitySelKey = null;
  equipmentUI.weapon.repoKey = null;
  equipmentUI.weapon.selKey = null;
  equipmentUI.armor.repoKey = null;
  equipmentUI.armor.selKey = null;
  equipmentUI.gear.repoKey = null;
  equipmentUI.gear.selKey = null;
  renderSelectedAbilities(hero);
  renderAbilityRepository();
  renderAllEquipmentRepositories();
  renderAllEquipmentSelected(hero);
}

// ---------------------------------------------------------------------------
// Recompute + repaint everything derived (called after every field change)
// ---------------------------------------------------------------------------
function onHeroChanged(hero) {
  hero.dirty = true;
  updateComputedUI(hero);
  renderHeroList();
  schedulePersist();
}

function updateComputedUI(hero) {
  el("lAttributePoints").textContent =
    `Attribute Points: ${hero.attributePointsSpent} / ${hero.attributePointsMax} spent` +
    (hero.attributePointsRemaining < 0 ? ` (${-hero.attributePointsRemaining} over)` : ` (${hero.attributePointsRemaining} remaining)`);

  updateArchetypeDescription(hero);
  updateProfessionHighlighting(hero);

  const skillFlags = hero.skillAdvantageFlags;
  for (const skill of SKILLS_REPOSITORY) {
    const key = skill.skillName.replace(/[^a-zA-Z0-9]/g, "");
    el(`skill-${key}-score`).textContent = `${hero.getSkillScore(skill.skillName)}${skillFlags[skill.skillName] || ""}`;
    el(`skill-${key}-cost`).textContent = skillLevelCost(hero.getSkillLevel(skill.skillName));
  }
  for (const attrName of ATTRIBUTE_NAMES) {
    const field = ATTRIBUTE_FIELD_BY_NAME[attrName];
    el(`attr-${field}-total`).textContent = hero.attributeTotal(attrName);
  }

  el("sTotalDevPoints").textContent = hero.totalDevPoints;
  el("sUnspentDevPoints").textContent = hero.unspentDevPoints;
  el("sUnspentDevPoints").classList.toggle("value-negative", hero.unspentDevPoints < 0);
  el("sUnspentDevPoints").classList.toggle("value-positive", hero.unspentDevPoints > 0);
  el("sSkillsDP").textContent = hero.totalSkillDevPoints;
  el("sAbilitiesDP").textContent = hero.totalArchetypeAbilitiesDevPoints;
  el("sGenericDP").textContent = hero.totalGenericAbilitiesDevPoints;
  el("sAttributePointsRemaining").textContent = hero.attributePointsRemaining;
  el("sAttributePointsRemaining").classList.toggle("value-negative", hero.attributePointsRemaining < 0);

  el("statisticsBlock").innerHTML = hero.statisticsHTML;
  el("gascarBlock").innerHTML = hero.gascarHTML;

  el("lWealthUsed").textContent = `Wealth: ${hero.wealthRemaining} / ${hero.wealth}`;
  el("lWealthUsed").classList.toggle("readout-warn", hero.wealthRemaining < 0);
  el("lLoadUsed").textContent = `Load: ${hero.totalEquipmentWeight} / ${hero.load} lbs`;
  el("lLoadUsed").classList.toggle("readout-warn", hero.isOverloaded);

  renderCharacterSheetDerived(hero);
}

// ---------------------------------------------------------------------------
// Persistence (localStorage autosave)
// ---------------------------------------------------------------------------
function loadPersisted() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const data = JSON.parse(raw);
    return data.map((d) => HeroData.fromJSON(d));
  } catch (err) {
    console.error("Failed to load autosaved heroes", err);
    return [];
  }
}

function schedulePersist() {
  el("autosaveStatus").textContent = "Saving...";
  clearTimeout(persistTimer);
  persistTimer = setTimeout(persist, 400);
}

function persist() {
  const data = state.heroes.map((h) => h.toJSON());
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  const now = new Date();
  el("autosaveStatus").textContent = "Saved locally at " + now.toLocaleTimeString();
}

window.addEventListener("beforeunload", (e) => {
  if (state.heroes.some((h) => h.dirty)) {
    persist();
  }
});

document.addEventListener("DOMContentLoaded", init);
