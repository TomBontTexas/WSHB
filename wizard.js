// Hero Creation Wizard - auto-generates a complete, playable Hero from just a
// Total Development Points budget, an Archetype, a Profession, and a
// "Creation Level" describing how narrow or broad the build should be:
//   Dedicated   - concentrates in just a few absolutely required Attributes/Skills.
//   Specialized - spreads out into a secondary specialty as well.
//   Practical   - a well-rounded build meant to be played long-term.
//
// This is a local heuristic ("the little AI"), not a call to an actual AI
// model - everything here runs offline from the game's own data. It scores
// each Skill by how often it's mentioned in the Archetype's own Ability
// descriptions (and, with less weight, the Profession's description) to infer
// what the Archetype is "about", then spends the Attribute budget, the Total
// Points (across Archetype Abilities / Skills / Generic Abilities), and the
// Hero's starting Wealth (on a small Equipment loadout) accordingly - reusing
// the same cost/prerequisite functions the rest of the app uses, so nothing
// generated here is a special case the UI doesn't already understand.
// ---------------------------------------------------------------------------

const WIZARD_LEVELS = ["Dedicated", "Specialized", "Practical"];

// Archetype Abilities are capped at 20% of the budget for every Creation
// Level - the point of the Level is how the *rest* of the budget (Skills vs.
// Generic Abilities) gets spread, not how many Abilities get bought. Dedicated
// pours the freed-up budget into a couple of Skills (its whole point is being
// excellent at a few things); Practical leans more on Generic Abilities for
// broad, long-term utility.
const WIZARD_BUDGET_SPLIT = {
  Dedicated: { ability: 0.20, skills: 0.60, generic: 0.20 },
  Specialized: { ability: 0.20, skills: 0.50, generic: 0.30 },
  Practical: { ability: 0.20, skills: 0.45, generic: 0.35 },
};

// How many levels a Skill in each tier may be bought to, per Creation Level.
const WIZARD_SKILL_CAPS = {
  Dedicated: { core: 8, secondary: 3, broad: 0 },
  Specialized: { core: 6, secondary: 4, broad: 1 },
  Practical: { core: 4, secondary: 3, broad: 2 },
};

const WIZARD_PRACTICAL_GENERIC_PRIORITY = ["Healthy", "Strong-Willed", "Alertness", "Hard to Kill", "Lucky", "Fast Healer", "Unfazeable"];
const WIZARD_MUTUALLY_EXCLUSIVE_GENERICS = [["Nobility", "Merchant Prince", "Wealthy"]];

// A Hero built by the Wizard always takes the free +5/+5 Development Points
// for a Disability and a Backstory (see HeroData.totalDevPoints) - a real
// player planning a build would almost always take those, and it gives the
// generator more budget to work with. Text is templated, not "real" prose -
// clearly a placeholder meant to be rewritten on the Background tab.
const WIZARD_DISABILITIES = [
  "Code of Honor - refuses to break a given word, even when it costs him.",
  "Haunted by a past failure that resurfaces under pressure.",
  "A chronic old injury that flares up in cold or damp conditions.",
  "Overconfident - consistently underestimates danger.",
  "Distrustful of authority, including his own chain of command.",
  "Superstitious - won't act against certain omens, even at a cost.",
  "Reckless with money - can't hold onto Wealth for long.",
  "A quick temper that's gotten him in trouble before.",
];

function wizardPickDisability() {
  return WIZARD_DISABILITIES[Math.floor(Math.random() * WIZARD_DISABILITIES.length)];
}

const WIZARD_LEVEL_FLAVOR = {
  Dedicated: "single-minded devotion to that craft",
  Specialized: "a broader command of related skills",
  Practical: "a well-rounded set of skills built to last",
};

function wizardArticleFor(word) {
  return /^[aeiou]/i.test(word) ? "an" : "a";
}

function wizardGenerateBackstory(archetype, profession, level) {
  const professionLabel = profession ? profession.name : "wanderer";
  const roleLabel = archetype.subtitle ? archetype.subtitle.split(",")[0].trim() : archetype.name;
  const flavor = WIZARD_LEVEL_FLAVOR[level] || "a hard-won set of skills";
  return `Once ${wizardArticleFor(professionLabel)} ${professionLabel}, now walks the path of the ${roleLabel}, having built ${flavor} through years in the field. (Placeholder backstory from the Hero Creation Wizard - replace with the Hero's real story.)`;
}

// -------------------------------------------------------------------------
// Skill relevance scoring
// -------------------------------------------------------------------------
function wizardSkillWeights(archetype, profession) {
  const weights = {};
  for (const ability of archetype.abilities) {
    for (const skill of findSkillMentions(ability.description)) weights[skill] = (weights[skill] || 0) + 1;
  }
  if (profession) {
    for (const skill of findSkillMentions(profession.description)) weights[skill] = (weights[skill] || 0) + 0.5;
  }
  return weights;
}

function wizardRankedSkills(weights) {
  const ranked = SKILLS_REPOSITORY.map((s) => s.skillName)
    .filter((name) => (weights[name] || 0) > 0)
    .sort((a, b) => (weights[b] || 0) - (weights[a] || 0));
  return ranked.length > 0 ? ranked : ["Athletics", "Observation", "Persuade"];
}

function wizardTierSkills(rankedSkills, level) {
  if (level === "Dedicated") return { core: rankedSkills.slice(0, 2), secondary: rankedSkills.slice(2, 3), broad: [] };
  if (level === "Specialized") return { core: rankedSkills.slice(0, 2), secondary: rankedSkills.slice(2, 5), broad: rankedSkills.slice(5, 7) };
  return { core: rankedSkills.slice(0, 2), secondary: rankedSkills.slice(2, 5), broad: rankedSkills.slice(5, 12) }; // Practical
}

function wizardAttributesFromSkillNames(names) {
  const attrs = new Set();
  for (const name of names) {
    const def = SKILLS_REPOSITORY.find((s) => s.skillName === name);
    if (def) attrs.add(def.attribute);
  }
  return [...attrs];
}

// -------------------------------------------------------------------------
// Attribute budget (15 points, max 5 each) - proportional to a weight per
// Attribute derived from which tier(s) of Skill depend on it.
// -------------------------------------------------------------------------
function wizardAllocateAttributes(tiers, level) {
  const coreAttrs = wizardAttributesFromSkillNames(tiers.core);
  const secondaryAttrs = wizardAttributesFromSkillNames(tiers.secondary).filter((a) => !coreAttrs.includes(a));

  const weight = {};
  for (const name of ATTRIBUTE_NAMES) weight[name] = 0.3;
  for (const a of secondaryAttrs) weight[a] = level === "Dedicated" ? 0.6 : 1.6;
  for (const a of coreAttrs) weight[a] = level === "Dedicated" ? 4 : level === "Specialized" ? 3 : 2.2;
  if (level === "Practical") {
    weight.Might = Math.max(weight.Might, 1.6);
    weight.Willpower = Math.max(weight.Willpower, 1.4);
  }

  const totalWeight = ATTRIBUTE_NAMES.reduce((s, n) => s + weight[n], 0);
  const raw = {};
  for (const n of ATTRIBUTE_NAMES) raw[n] = (weight[n] / totalWeight) * 15;

  const values = {};
  for (const n of ATTRIBUTE_NAMES) values[n] = Math.min(5, Math.floor(raw[n]));
  let spent = ATTRIBUTE_NAMES.reduce((s, n) => s + values[n], 0);

  // Hand out leftover points (from flooring) to whichever eligible Attribute
  // has the largest fractional remainder, breaking ties by weight.
  let guard = 0;
  while (spent < 15 && guard++ < 200) {
    const eligible = ATTRIBUTE_NAMES.filter((n) => values[n] < 5);
    if (eligible.length === 0) break;
    eligible.sort((a, b) => (raw[b] - Math.floor(raw[b])) - (raw[a] - Math.floor(raw[a])) || weight[b] - weight[a]);
    values[eligible[0]]++;
    spent++;
  }
  return values;
}

// -------------------------------------------------------------------------
// Skill Dev Points - round-robin one level at a time across the tiered Skill
// list (Core skills listed first each pass), respecting per-tier level caps.
// -------------------------------------------------------------------------
function wizardAllocateSkillLevels(tiers, budget, level) {
  const caps = WIZARD_SKILL_CAPS[level];
  const order = [...tiers.core, ...tiers.secondary, ...tiers.broad];
  const capFor = (name) => (tiers.core.includes(name) ? caps.core : tiers.secondary.includes(name) ? caps.secondary : caps.broad);

  const skillLevels = {};
  let remaining = budget;
  let progress = true;
  while (remaining > 0 && progress) {
    progress = false;
    for (const name of order) {
      const cur = skillLevels[name] || 0;
      if (cur >= capFor(name)) continue;
      const nextCost = cur + 1; // skillLevelCost(cur+1) - skillLevelCost(cur)
      if (nextCost > remaining) continue;
      skillLevels[name] = cur + 1;
      remaining -= nextCost;
      progress = true;
      if (remaining <= 0) break;
    }
  }
  return { skillLevels, remaining };
}

// -------------------------------------------------------------------------
// Archetype Abilities - a lightweight prerequisite graph (built by matching
// each Ability's free-text prerequisite against its siblings' names), used to
// find "root" Abilities and score whole chains by relevance so Dedicated/
// Specialized builds chase one or two coherent chains instead of a random
// scatter of unrelated Abilities.
// -------------------------------------------------------------------------
function wizardBuildAbilityGraph(archetype) {
  const byName = {};
  for (const ab of archetype.abilities) byName[ab.name] = { ability: ab, prereqNames: [], children: [] };
  for (const ab of archetype.abilities) {
    const prereq = (ab.prerequisite || "").trim();
    if (!prereq || /^none$/i.test(prereq) || /^all .*abilities$/i.test(prereq)) continue;
    for (const sib of archetype.abilities) {
      if (sib.name === ab.name) continue;
      const re = new RegExp(`\\b${sib.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
      if (re.test(prereq)) {
        byName[ab.name].prereqNames.push(sib.name);
        byName[sib.name].children.push(ab.name);
      }
    }
  }
  return byName;
}

function wizardAbilityRelevance(ability, skillWeights) {
  let score = 0;
  for (const skill of findSkillMentions(ability.description)) score += skillWeights[skill] || 0;
  if (/extra Health|Health point/i.test(ability.description)) score += 1; // survivability signal
  return score;
}

function wizardChainRelevance(rootName, graph, skillWeights, memo) {
  if (memo[rootName] !== undefined) return memo[rootName];
  const node = graph[rootName];
  let total = wizardAbilityRelevance(node.ability, skillWeights);
  for (const childName of node.children) total += wizardChainRelevance(childName, graph, skillWeights, memo);
  memo[rootName] = total;
  return total;
}

function wizardSelectAllowedAbilities(archetype, graph, skillWeights, level) {
  if (level === "Practical") return new Set(archetype.abilities.map((a) => a.name)); // unrestricted - broad by design

  const memo = {};
  const roots = Object.keys(graph).filter((name) => graph[name].prereqNames.length === 0);
  roots.sort((a, b) => wizardChainRelevance(b, graph, skillWeights, memo) - wizardChainRelevance(a, graph, skillWeights, memo));

  const topN = level === "Dedicated" ? 1 : 2;
  const allowed = new Set();
  const collect = (name) => {
    if (allowed.has(name)) return;
    allowed.add(name);
    for (const child of graph[name].children) collect(child);
  };
  for (const root of roots.slice(0, topN)) collect(root);
  return allowed;
}

function wizardBuyArchetypeAbilities(hero, archetype, allowedNames, skillWeights, budget) {
  let remaining = budget;
  const candidates = archetype.abilities.filter((a) => allowedNames.has(a.name));
  let progress = true;
  while (remaining > 0 && progress) {
    progress = false;
    const eligible = candidates
      .filter((a) => !hero.selectedAbilities.some((s) => s.archetypeName === archetype.name && s.abilityName === a.name))
      .map((a) => {
        const prereqMet = isAbilityPrereqMet(hero, { archetypeName: archetype.name, name: a.name, prerequisite: a.prerequisite });
        const cost = hero.abilityNormalCost({ archetypeName: archetype.name, abilityName: a.name, level: 1 });
        return { a, prereqMet, cost };
      })
      .filter((x) => x.prereqMet && x.cost > 0 && x.cost <= remaining)
      .sort((x, y) => wizardAbilityRelevance(y.a, skillWeights) - wizardAbilityRelevance(x.a, skillWeights) || x.cost - y.cost);

    if (eligible.length === 0) break;
    const pick = eligible[0];
    hero.selectedAbilities.push({ archetypeName: archetype.name, abilityName: pick.a.name, level: 1 });
    remaining -= pick.cost;
    progress = true;
  }
  return remaining;
}

function wizardLevelUpArchetypeAbilities(hero, archetype, budget) {
  let remaining = budget;
  let progress = true;
  while (remaining > 0 && progress) {
    progress = false;
    const options = hero.selectedAbilities
      .filter((s) => s.archetypeName === archetype.name)
      .map((sel) => {
        const def = HeroData.findAbilityDef(sel.archetypeName, sel.abilityName);
        if (!def || sel.level >= (def.maxLevel || 1)) return null;
        const nextCost = hero.abilityNormalCost({ ...sel, level: sel.level + 1 }) - hero.abilityNormalCost(sel);
        return { sel, nextCost };
      })
      .filter(Boolean)
      .filter((x) => x.nextCost > 0 && x.nextCost <= remaining)
      .sort((a, b) => a.nextCost - b.nextCost);

    if (options.length === 0) break;
    options[0].sel.level += 1;
    remaining -= options[0].nextCost;
    progress = true;
  }
  return remaining;
}

// -------------------------------------------------------------------------
// Generic Abilities
// -------------------------------------------------------------------------
function wizardBuyGenericAbilities(hero, skillWeights, budget, level) {
  let remaining = budget;
  const scored = GENERIC_ABILITIES_REPOSITORY.map((def) => {
    let score = WIZARD_PRACTICAL_GENERIC_PRIORITY.includes(def.name) && level === "Practical" ? 5 : 0;
    for (const skill of findSkillMentions(def.description)) score += skillWeights[skill] || 0;
    return { def, score };
  }).sort((a, b) => b.score - a.score || a.def.cost - b.def.cost);

  for (const { def } of scored) {
    if (remaining <= 0) break;
    if (hero.selectedGenericAbilities.some((s) => s.name === def.name)) continue;
    if (def.prerequisite && !hero.selectedGenericAbilities.some((s) => s.name === def.prerequisite)) continue;
    const conflictGroup = WIZARD_MUTUALLY_EXCLUSIVE_GENERICS.find((g) => g.includes(def.name));
    if (conflictGroup && conflictGroup.some((n) => n !== def.name && hero.selectedGenericAbilities.some((s) => s.name === n))) continue;

    const cost = genericAbilityCost(def, 1);
    if (!(cost > 0) || cost > remaining) continue;
    hero.selectedGenericAbilities.push({ name: def.name, level: 1 });
    remaining -= cost;
  }
  return remaining;
}

function wizardLevelUpGenericAbilities(hero, budget) {
  let remaining = budget;
  let progress = true;
  while (remaining > 0 && progress) {
    progress = false;
    const options = hero.selectedGenericAbilities.map((sel) => {
      const def = HeroData.findGenericAbilityDef(sel.name);
      if (!def) return null;
      const maxLevel = def.maxLevel || (def.costTable ? def.costTable.length : 1);
      if (sel.level >= maxLevel) return null;
      const nextCost = genericAbilityCost(def, sel.level + 1) - genericAbilityCost(def, sel.level);
      return { sel, nextCost };
    }).filter(Boolean).filter((x) => x.nextCost > 0 && x.nextCost <= remaining).sort((a, b) => a.nextCost - b.nextCost);

    if (options.length === 0) break;
    options[0].sel.level += 1;
    remaining -= options[0].nextCost;
    progress = true;
  }
  return remaining;
}

// -------------------------------------------------------------------------
// Equipment - spends a portion of starting Wealth on one weapon (melee or
// ranged, based on which Skill the build leans on), a piece of Light armor,
// and a couple of cheap practical basics, leaving a small buffer unspent.
// -------------------------------------------------------------------------
function wizardPickEquipment(hero, skillWeights) {
  let remaining = Math.floor(hero.wealth * 0.85);

  const rangedSignal = skillWeights["Ranged Weapons"] || 0;
  const meleeSignal = (skillWeights.Melee || 0) + (skillWeights["Martial Arts"] || 0);
  const preferRanged = rangedSignal > meleeSignal;

  const weaponPool = WEAPONS_REPOSITORY.filter((w) => {
    if (typeof w.cost !== "number") return false;
    return preferRanged ? (w.group === "Light Missile" || w.group === "Medium Missile") : (w.group === "Light Melee" || w.group === "Medium Melee");
  });
  const weaponBudget = remaining * 0.4;
  const affordableWeapons = weaponPool.filter((w) => w.cost <= weaponBudget).sort((a, b) => b.cost - a.cost);
  const weapon = affordableWeapons[0] || [...weaponPool].sort((a, b) => a.cost - b.cost)[0];
  if (weapon && weapon.cost <= remaining) {
    hero.selectedEquipment.push({ kind: "weapon", name: weapon.name, quantity: 1, worn: true });
    remaining -= weapon.cost;
  }

  const armorPool = ARMOR_REPOSITORY.filter((a) => a.group === "Light" && typeof a.cost === "number");
  const armorBudget = remaining * 0.5;
  const affordableArmor = armorPool.filter((a) => a.cost <= armorBudget).sort((a, b) => b.dr - a.dr);
  const armor = affordableArmor[0] || [...armorPool].sort((a, b) => a.cost - b.cost)[0];
  if (armor && armor.cost <= remaining) {
    hero.selectedEquipment.push({ kind: "armor", name: armor.name, quantity: 1, worn: true });
    remaining -= armor.cost;
  }

  for (const name of ["Backpack, Compact", "Survival Kit", "First Aid Kit"]) {
    const def = GEAR_REPOSITORY.find((g) => g.name === name);
    if (def && typeof def.cost === "number" && def.cost <= remaining) {
      hero.selectedEquipment.push({ kind: "gear", name: def.name, quantity: 1, worn: true });
      remaining -= def.cost;
    }
  }
}

// -------------------------------------------------------------------------
// Top-level generation
// -------------------------------------------------------------------------
function generateWizardHero({ totalPoints, archetypeName, professionName, level }) {
  const archetype = HeroData.findArchetype(archetypeName);
  if (!archetype) throw new Error(`Unknown Archetype: ${archetypeName}`);

  const hero = HeroData.createNew();
  hero.archetype = archetypeName;
  hero.profession = professionName || "";
  hero.startingDevPoints = totalPoints;

  const profession = PROFESSIONS_REPOSITORY.find((p) => p.name === professionName);

  // Always take the free Disability/Backstory Development Points - see
  // HeroData.totalDevPoints. Set before computing the budget below so the
  // split is based on the real, bonus-inclusive total.
  hero.hasDisability = true;
  hero.disabilityText = wizardPickDisability();
  hero.hasBackstory = true;
  hero.backstoryText = wizardGenerateBackstory(archetype, profession, level);

  const skillWeights = wizardSkillWeights(archetype, profession);
  const rankedSkills = wizardRankedSkills(skillWeights);
  const tiers = wizardTierSkills(rankedSkills, level);

  const attrValues = wizardAllocateAttributes(tiers, level);
  for (const name of ATTRIBUTE_NAMES) hero[ATTRIBUTE_FIELD_BY_NAME[name]] = attrValues[name];

  const split = WIZARD_BUDGET_SPLIT[level];
  const totalBudget = hero.totalDevPoints; // startingDevPoints + the Disability/Backstory bonus
  const abilityBudget = Math.round(totalBudget * split.ability);
  const skillBudget = Math.round(totalBudget * split.skills);
  const genericBudget = Math.max(0, totalBudget - abilityBudget - skillBudget);

  const graph = wizardBuildAbilityGraph(archetype);
  const allowedNames = wizardSelectAllowedAbilities(archetype, graph, skillWeights, level);
  let leftover = wizardBuyArchetypeAbilities(hero, archetype, allowedNames, skillWeights, abilityBudget);
  leftover = wizardLevelUpArchetypeAbilities(hero, archetype, leftover);

  const { skillLevels, remaining: skillLeftover } = wizardAllocateSkillLevels(tiers, skillBudget, level);
  hero.skillLevels = skillLevels;

  let genericRemaining = wizardBuyGenericAbilities(hero, skillWeights, genericBudget + leftover + skillLeftover, level);
  genericRemaining = wizardLevelUpGenericAbilities(hero, genericRemaining);

  // Catch-all so a "realistic" Hero doesn't leave more than a couple of
  // Points on the table: dump any last leftover into the top Core Skill.
  if (genericRemaining > 0 && tiers.core[0]) {
    const top = tiers.core[0];
    while (genericRemaining > 0) {
      const cur = hero.getSkillLevel(top);
      const nextCost = cur + 1;
      if (nextCost > genericRemaining) break;
      hero.setSkillLevel(top, cur + 1);
      genericRemaining -= nextCost;
    }
  }

  wizardPickEquipment(hero, skillWeights);

  hero.description = `Auto-generated (${level}) by the Hero Creation Wizard.`;
  return hero;
}

// -------------------------------------------------------------------------
// UI
// -------------------------------------------------------------------------
function populateWizardSelects() {
  const archSelect = el("wizArchetype");
  archSelect.innerHTML = "";
  for (const category of ["Contemporary", "Archaic", "Both"]) {
    const group = document.createElement("optgroup");
    group.label = categoryDisplayLabel(category);
    for (const archetype of ARCHETYPES_REPOSITORY.filter((a) => a.category === category)) {
      const opt = document.createElement("option");
      opt.value = archetype.name;
      opt.textContent = archetype.subtitle ? `${archetype.name} (${archetype.subtitle})` : archetype.name;
      group.appendChild(opt);
    }
    archSelect.appendChild(group);
  }

  const profSelect = el("wizProfession");
  profSelect.innerHTML = "";
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
    profSelect.appendChild(group);
  }
}

// Mirrors updateProfessionHighlighting() on the main Info tab, but keys off
// the Wizard's own Archetype <select> instead of a Hero (none exists yet at
// this point).
function updateWizardProfessionHighlighting() {
  const terms = suggestedProfessionTermsForArchetype(el("wizArchetype").value);
  el("wizProfession").querySelectorAll("option[value]").forEach((opt) => {
    if (!opt.value) return;
    const suggested = terms.length > 0 && isSuggestedProfession(opt.value, terms);
    opt.classList.toggle("suggested-profession", suggested);
    opt.textContent = suggested ? `★ ${opt.value}` : opt.value;
  });
}

function openWizard() {
  el("wizardOverlay").hidden = false;
  updateWizardProfessionHighlighting();
}
function closeWizard() {
  el("wizardOverlay").hidden = true;
}

function bindWizard() {
  populateWizardSelects();
  el("wizArchetype").addEventListener("change", updateWizardProfessionHighlighting);

  el("btnWizard").addEventListener("click", openWizard);
  el("btnWizardCancel").addEventListener("click", closeWizard);
  el("wizardOverlay").addEventListener("click", (e) => { if (e.target.id === "wizardOverlay") closeWizard(); });

  el("btnWizardGenerate").addEventListener("click", () => {
    const totalPoints = toInt(el("wizTotalPoints").value);
    const archetypeName = el("wizArchetype").value;
    const professionName = el("wizProfession").value;
    const levelInput = document.querySelector('input[name="wizLevel"]:checked');
    const level = levelInput ? levelInput.value : "Practical";

    if (!totalPoints || totalPoints <= 0) { alert("Enter a Total Development Points budget first."); return; }
    if (!archetypeName) { alert("Select an Archetype first."); return; }
    if (!professionName) { alert("Select a Profession first."); return; }

    const hero = generateWizardHero({ totalPoints, archetypeName, professionName, level });
    state.heroes.push(hero);
    renderHeroList();
    selectHero(hero.id);
    schedulePersist();
    closeWizard();
  });
}

document.addEventListener("DOMContentLoaded", bindWizard);
