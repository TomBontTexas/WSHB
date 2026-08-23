// Calculation core for the Warp Space Hero Builder, ported from the Hero Creation rules in
// Warp Space: Heroes & Combat 2e (Section 2.5) plus Addendum 2 (Defending).
// Mirrors the structure of WSVB's model.js: a single data class with plain fields the UI
// binds to directly, and getters for every derived/computed value.

const ATTRIBUTE_FIELD_BY_NAME = {
  Agility: "agility", Awareness: "awareness", Charisma: "charisma", Coordination: "coordination",
  Intelligence: "intelligence", Might: "might", Willpower: "willpower",
};

function generateId() {
  return "h-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
}

// ---------------------------------------------------------------------------
// HeroData
// ---------------------------------------------------------------------------
class HeroData {
  constructor() {
    this.dirty = false;
    this.id = generateId();
    this.fileName = "";

    // Step 1-3: Culture / Languages / Profession
    this.heroName = "";
    this.culture = "";
    this.languages = "";
    this.profession = "";

    // Character Sheet header (not part of Hero Creation steps - printed on the
    // official Hero Display sheet's header row alongside Hero Name/Archetype)
    this.playerName = "";
    this.campaign = "";

    // Step 4: Attributes (15 points, max 5 each)
    this.agility = 0;
    this.awareness = 0;
    this.charisma = 0;
    this.coordination = 0;
    this.intelligence = 0;
    this.might = 0;
    this.willpower = 0;
    // Situational/gear/ability modifiers layered on top of the purchased Value,
    // keyed by the same field name (e.g. "agility"). Not part of the 15-point budget.
    this.attributeBonuses = {};

    // Step 5: Archetype + purchased Abilities
    this.archetype = "";
    this.selectedAbilities = []; // { archetypeName, abilityName, level }

    // Step 6: Skills
    this.skillLevels = {}; // skillName -> level
    // Situational/gear/ability modifiers layered on top of a Skill's computed
    // Score, keyed by skillName. Not part of the Skill's Development Point cost.
    this.skillBonuses = {};

    // Step 7: Generic Abilities
    this.selectedGenericAbilities = []; // { name, level }

    // Step 9: Equipment
    this.selectedEquipment = []; // { kind: "weapon"|"armor"|"shield"|"gear", name, quantity, worn }

    // Step 8/10: Disability / Backstory (each grants +5 Development Points)
    this.hasDisability = false;
    this.disabilityText = "";
    this.hasBackstory = false;
    this.backstoryText = "";

    // Development Point budget (GM-assigned; 50 is the value shown on the official sheet example)
    this.startingDevPoints = 50;

    this.wealth = 1000;
    this.description = "";

    // Live play tracking for the Character Sheet tab. null = "at full, not yet
    // touched" so these stay in sync with Health/Resolve until the player
    // starts taking damage/stress. SR has no in-app source (special abilities/
    // gear only), so it's a plain manual value.
    this.currentHealth = null;
    this.currentResolve = null;
    this.stressReduction = 0;
  }

  // -------------------------------------------------------------------------
  // Attributes
  // -------------------------------------------------------------------------
  attributeValue(attributeName) {
    const field = ATTRIBUTE_FIELD_BY_NAME[attributeName];
    return field ? (this[field] || 0) : 0;
  }

  attributeBonus(attributeName) {
    const field = ATTRIBUTE_FIELD_BY_NAME[attributeName];
    return field ? (this.attributeBonuses[field] || 0) : 0;
  }
  setAttributeBonus(attributeName, value) {
    const field = ATTRIBUTE_FIELD_BY_NAME[attributeName];
    if (!field) return;
    if (value) this.attributeBonuses[field] = value;
    else delete this.attributeBonuses[field];
  }
  attributeTotal(attributeName) {
    return this.attributeValue(attributeName) + this.attributeBonus(attributeName);
  }

  get attributePointsSpent() {
    return this.agility + this.awareness + this.charisma + this.coordination +
      this.intelligence + this.might + this.willpower;
  }
  get attributePointsMax() { return 15; }
  get attributePointsRemaining() { return this.attributePointsMax - this.attributePointsSpent; }

  // -------------------------------------------------------------------------
  // Skills
  // -------------------------------------------------------------------------
  getSkillLevel(skillName) { return this.skillLevels[skillName] || 0; }
  setSkillLevel(skillName, level) {
    if (level > 0) this.skillLevels[skillName] = level;
    else delete this.skillLevels[skillName];
  }

  getSkillBonus(skillName) { return this.skillBonuses[skillName] || 0; }
  setSkillBonus(skillName, value) {
    if (value) this.skillBonuses[skillName] = value;
    else delete this.skillBonuses[skillName];
  }

  getSkillScore(skillName) {
    const def = SKILLS_REPOSITORY.find((s) => s.skillName === skillName);
    if (!def) return 0;
    return this.attributeTotal(def.attribute) + this.getSkillLevel(skillName) + this.getSkillBonus(skillName);
  }

  get totalSkillDevPoints() {
    return SKILLS_REPOSITORY.reduce((sum, s) => sum + skillLevelCost(this.getSkillLevel(s.skillName)), 0);
  }

  // Skill -> "A"/"a"/"D"/"d" flag, scanned from every currently-selected
  // Archetype Ability, Generic Ability, and Equipment item's description (see
  // scanTextForSkillFlags in data.js). An unconditional grant (uppercase)
  // always wins over a situational one (lowercase) for the same Skill.
  get skillAdvantageFlags() {
    const rank = { A: 2, D: 2, a: 1, d: 1 };
    const flags = {};
    const consider = (skill, letter) => {
      if (!flags[skill] || rank[letter] >= rank[flags[skill]]) flags[skill] = letter;
    };

    const descriptions = [];
    for (const sel of this.selectedAbilities) {
      const def = HeroData.findAbilityDef(sel.archetypeName, sel.abilityName);
      if (def) descriptions.push(def.description);
    }
    for (const sel of this.selectedGenericAbilities) {
      const def = HeroData.findGenericAbilityDef(sel.name);
      if (def) descriptions.push(def.description);
    }
    for (const sel of this.selectedEquipment) {
      const def = HeroData.findEquipmentDef(sel.kind, sel.name);
      if (def) descriptions.push(def.description);
    }

    for (const description of descriptions) {
      for (const { skill, letter } of scanTextForSkillFlags(description)) consider(skill, letter);
    }
    return flags;
  }

  getSkillAdvantageFlag(skillName) { return this.skillAdvantageFlags[skillName] || ""; }

  // -------------------------------------------------------------------------
  // Archetype Abilities
  // -------------------------------------------------------------------------
  static findArchetype(archetypeName) {
    return ARCHETYPES_REPOSITORY.find((a) => a.name === archetypeName) || null;
  }

  static findAbilityDef(archetypeName, abilityName) {
    const archetype = HeroData.findArchetype(archetypeName);
    if (!archetype) return null;
    return archetype.abilities.find((ab) => ab.name === abilityName) || null;
  }

  // "Option: If choosing an ability from a non-selected Archetype, the cost is
  // double." This is about the ability's own source Archetype, not whether an
  // ability of the same name also happens to appear under the Hero's own
  // Archetype - e.g. buying Tough from Enforcer is cross-Archetype (double
  // cost) even though Tough is also a Barbarian ability, if the Hero's own
  // Archetype is Barbarian.
  isAbilityCrossArchetype(sourceArchetypeName) {
    if (!this.archetype) return true;
    return sourceArchetypeName !== this.archetype;
  }

  // The book only bars re-buying the exact same (Archetype, Ability) pair. Since
  // several Abilities (Tough, Two-Weapon Fighting, Longstrider, etc.) appear
  // verbatim under multiple Archetypes, a Hero can "cross-train" into a second
  // Archetype's copy of an Ability he already owns. The first entry with a given
  // Ability name (by purchase order) is the primary copy; every later entry with
  // that same name is a cross-trained copy.
  isAbilityCrossTrained(selected) {
    const idx = this.selectedAbilities.indexOf(selected);
    if (idx <= 0) return false;
    return this.selectedAbilities.slice(0, idx).some((s) => s.abilityName === selected.abilityName);
  }

  // Cost basis before any cross-training discount: the Archetype's listed cost
  // (per level), doubled if this specific entry's source Archetype isn't the
  // Hero's own chosen Archetype.
  abilityNormalCost(selected) {
    const def = HeroData.findAbilityDef(selected.archetypeName, selected.abilityName);
    if (!def) return 0;
    const level = Math.max(1, selected.level || 1);
    const base = def.cost * level;
    return this.isAbilityCrossArchetype(selected.archetypeName) ? base * 2 : base;
  }

  abilityCost(selected) {
    const normalCost = this.abilityNormalCost(selected);
    if (!this.isAbilityCrossTrained(selected)) return normalCost;

    // A cross-trained copy is discounted by whatever was already paid for every
    // earlier same-named copy, floored at 0 (it can be free, never negative).
    const alreadyPaid = this.selectedAbilities
      .filter((s) => s !== selected && s.abilityName === selected.abilityName)
      .reduce((sum, s) => sum + this.abilityNormalCost(s), 0);
    return Math.max(0, normalCost - alreadyPaid);
  }

  get totalArchetypeAbilitiesDevPoints() {
    return this.selectedAbilities.reduce((sum, sel) => sum + this.abilityCost(sel), 0);
  }

  // -------------------------------------------------------------------------
  // Generic Abilities
  // -------------------------------------------------------------------------
  static findGenericAbilityDef(name) {
    return GENERIC_ABILITIES_REPOSITORY.find((g) => g.name === name) || null;
  }

  genericAbilityCostFor(selected) {
    const def = HeroData.findGenericAbilityDef(selected.name);
    if (!def) return 0;
    return genericAbilityCost(def, selected.level || 1);
  }

  get totalGenericAbilitiesDevPoints() {
    return this.selectedGenericAbilities.reduce((sum, sel) => sum + this.genericAbilityCostFor(sel), 0);
  }

  get hasMasterGenericAbility() {
    return this.selectedGenericAbilities.some((sel) => sel.name === "Master");
  }

  // -------------------------------------------------------------------------
  // Equipment (2.5.9) - purchases spend Wealth (Moneroj) and add to carried
  // Load, rather than Development Points. Neither is hard-blocked when
  // exceeded - both are just flagged, the same way DP overspend is.
  // -------------------------------------------------------------------------
  static equipmentRepositoryFor(kind) {
    if (kind === "weapon") return WEAPONS_REPOSITORY;
    if (kind === "armor") return ARMOR_REPOSITORY;
    if (kind === "shield") return SHIELDS_REPOSITORY;
    return GEAR_REPOSITORY;
  }

  static findEquipmentDef(kind, name) {
    return HeroData.equipmentRepositoryFor(kind).find((e) => e.name === name) || null;
  }

  // Fixed-price items (cost is a number) are deducted from Wealth; items whose
  // book price is a range/"Variable"/"Special" (cost is a string) are left for
  // the GM to price and don't affect the Wealth total.
  equipmentCostFor(selected) {
    const def = HeroData.findEquipmentDef(selected.kind, selected.name);
    if (!def || typeof def.cost !== "number") return 0;
    return def.cost * (selected.quantity || 1);
  }

  // "All gear that is worn or carried in a backpack or belt pouch is treated
  // as half-weight." (2.5.9.1 Load and Equipment)
  equipmentWeightFor(selected) {
    const def = HeroData.findEquipmentDef(selected.kind, selected.name);
    if (!def || typeof def.lbs !== "number") return 0;
    const raw = def.lbs * (selected.quantity || 1);
    return selected.worn ? raw / 2 : raw;
  }

  get totalEquipmentCost() {
    return this.selectedEquipment.reduce((sum, sel) => sum + this.equipmentCostFor(sel), 0);
  }
  get totalEquipmentWeight() {
    return this.selectedEquipment.reduce((sum, sel) => sum + this.equipmentWeightFor(sel), 0);
  }
  get wealthRemaining() { return this.wealth - this.totalEquipmentCost; }
  get loadRemaining() { return this.load - this.totalEquipmentWeight; }
  get isOverloaded() { return this.totalEquipmentWeight > this.load; }

  // -------------------------------------------------------------------------
  // Development Points (the Hero-creation equivalent of WSVB's CP)
  // -------------------------------------------------------------------------
  get totalDevPoints() {
    return this.startingDevPoints + (this.hasDisability ? 5 : 0) + (this.hasBackstory ? 5 : 0);
  }
  get spentDevPoints() {
    return this.totalSkillDevPoints + this.totalArchetypeAbilitiesDevPoints + this.totalGenericAbilitiesDevPoints;
  }
  get unspentDevPoints() { return this.totalDevPoints - this.spentDevPoints; }

  // -------------------------------------------------------------------------
  // Combat-derived statistics (Section 2.6.2 / 2.6.3)
  // -------------------------------------------------------------------------
  get resistanceScore() { return this.might + this.getSkillLevel("Resistance"); }
  get disciplineScore() { return this.willpower + this.getSkillLevel("Discipline"); }
  get health() { return this.resistanceScore + 10; }
  get resolve() { return this.disciplineScore + 10; }

  get athleticsScore() { return this.might + this.getSkillLevel("Athletics"); }
  get load() { return this.athleticsScore * 10 + 20; }

  get meleeDamageBonus() { return this.might; }
  get rangedDamageBonus() { return this.awareness; }
  get mentalDamageBonus() { return this.willpower; }

  get actionPoints() { return 3; }
  get baseMove() { return 30; }

  // Remaining Health/Resolve for live play tracking, clamped to current max
  // (in case Attributes/Skills changed after damage was already recorded).
  get displayHealth() { return this.currentHealth === null ? this.health : Math.min(this.currentHealth, this.health); }
  get displayResolve() { return this.currentResolve === null ? this.resolve : Math.min(this.currentResolve, this.resolve); }

  // Damage Reduction from any worn Armor/Shield (Equipment items marked Worn
  // that have a numeric dr - weapons and other Gear simply don't have one).
  get equippedDR() {
    return this.selectedEquipment
      .filter((sel) => sel.worn)
      .reduce((sum, sel) => {
        const def = HeroData.findEquipmentDef(sel.kind, sel.name);
        return sum + (def && typeof def.dr === "number" ? def.dr : 0);
      }, 0);
  }

  // -------------------------------------------------------------------------
  // Titles / display
  // -------------------------------------------------------------------------
  get heroTitle() {
    const name = this.heroName || "Unnamed Hero";
    const arch = this.archetype ? ` - ${this.archetype}` : "";
    return `${name}${arch}`;
  }

  get statisticsHTML() {
    const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const lines = [];

    if (this.profession) lines.push(`Profession: ${this.profession}${this.hasMasterGenericAbility ? " (Master)" : ""}.`);

    const attrParts = Object.entries(ATTRIBUTE_FIELD_BY_NAME)
      .map(([name, field]) => (this[field] > 0 ? `${name}-${this.attributeTotal(name)}` : null))
      .filter(Boolean);
    lines.push("Attributes: " + (attrParts.length ? attrParts.join(", ") : "none") + ".");

    const skillFlags = this.skillAdvantageFlags;
    const skillParts = SKILLS_REPOSITORY
      .filter((s) => this.getSkillLevel(s.skillName) > 0)
      .map((s) => `${s.skillName}-${this.getSkillScore(s.skillName)}${skillFlags[s.skillName] || ""} (${skillLevelCost(this.getSkillLevel(s.skillName))})`);
    if (skillParts.length) lines.push("Skills: " + skillParts.join(", ") + ".");

    if (this.selectedAbilities.length) {
      // Group by Archetype so the (often-repeated) Archetype name is stated
      // once per group instead of after every single Ability.
      const byArchetype = new Map();
      for (const sel of this.selectedAbilities) {
        if (!byArchetype.has(sel.archetypeName)) byArchetype.set(sel.archetypeName, []);
        const suffix = sel.level > 1 ? `-${sel.level}` : "";
        const cross = this.isAbilityCrossArchetype(sel.archetypeName) ? " [x2]" : "";
        byArchetype.get(sel.archetypeName).push(`${sel.abilityName}${suffix}${cross} (${this.abilityCost(sel)})`);
      }
      const groupParts = Array.from(byArchetype.entries()).map(([archetypeName, abilities]) => `${archetypeName}: ${abilities.join(", ")}`);
      lines.push("Archetype Abilities: " + groupParts.join("; ") + ".");
    }

    if (this.selectedGenericAbilities.length) {
      const gaParts = this.selectedGenericAbilities.map((sel) => {
        const suffix = sel.level > 1 ? `-${sel.level}` : "";
        return `${sel.name}${suffix} (${this.genericAbilityCostFor(sel)})`;
      });
      lines.push("Generic Abilities: " + gaParts.join(", ") + ".");
    }

    if (this.selectedEquipment.length) {
      const eqParts = this.selectedEquipment.map((sel) => {
        const qtySuffix = (sel.quantity || 1) > 1 ? ` x${sel.quantity}` : "";
        const wornSuffix = sel.worn ? " (Worn)" : "";
        return `${sel.name}${qtySuffix}${wornSuffix}`;
      });
      lines.push("Equipment: " + eqParts.join(", ") + ".");
    }

    const combatParts = [
      `Health ${this.health}`, `Resolve ${this.resolve}`, `Load ${this.totalEquipmentWeight}/${this.load} lbs`,
      `Move ${this.baseMove} ft`, `Action Points ${this.actionPoints}`,
      `Melee Dmg +${this.meleeDamageBonus}`, `Ranged Dmg +${this.rangedDamageBonus}`, `Mental Dmg +${this.mentalDamageBonus}`,
    ];
    lines.push("Combat: " + combatParts.join(", ") + ".");

    const bgParts = [];
    if (this.culture) bgParts.push(`Culture: ${this.culture}`);
    if (this.languages) bgParts.push(`Languages: ${this.languages}`);
    bgParts.push(`Wealth: ${this.wealthRemaining}/${this.wealth}`);
    if (bgParts.length) lines.push(bgParts.join(". ") + ".");

    if (this.hasDisability && this.disabilityText) lines.push("Disability: " + this.disabilityText);
    if (this.hasBackstory && this.backstoryText) lines.push("Backstory: " + this.backstoryText);

    const bodyHTML =
      `<div class="stats-title">${esc(this.heroTitle)}</div>` +
      lines.map((l) => `<div class="stats-line">${esc(l)}</div>`).join("") +
      (this.description ? `<div class="stats-description">${esc(this.description).replace(/\n/g, "<br>")}</div>` : "");

    return bodyHTML;
  }

  // ---------------------------------------------------------------------------
  // GASCAR - a fixed 5-entry reduction of the Hero Sheet: Driving (or Piloting),
  // Navigation, Science, Technician, Resistance. Each entry uses the matching
  // Skill's Score if the Hero has any level in it, otherwise falls back to a
  // default Attribute's total (no flag letter on an Attribute fallback, since
  // only Skills carry Advantage/Disadvantage flags). Situational (a/d) flags
  // are always shown as unconditional (A/D) here, unlike the Hero Sheet above.
  // The parenthesized total is every entry's Score added up, +10 per A and -5
  // per D.
  // ---------------------------------------------------------------------------
  get gascarHTML() {
    const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const flags = this.skillAdvantageFlags;

    // The flag reflects an owned Ability/Equipment granting Advantage/Disadvantage
    // on the named Skill - it's independent of whether the Hero has actually put
    // any Skill Levels into it, so it still applies even when falling back to an
    // Attribute's total.
    const skillOrAttrEntry = (skillName, attrName) => {
      const flag = (flags[skillName] || "").toUpperCase();
      if (this.getSkillLevel(skillName) > 0) {
        return { score: this.getSkillScore(skillName), flag };
      }
      return { score: this.attributeTotal(attrName), flag };
    };

    let drivingLabel, drivingEntry;
    if (this.getSkillLevel("Driving") > 0) {
      drivingLabel = "Driving";
      drivingEntry = { score: this.getSkillScore("Driving"), flag: (flags["Driving"] || "").toUpperCase() };
    } else if (this.getSkillLevel("Piloting") > 0) {
      drivingLabel = "Piloting";
      drivingEntry = { score: this.getSkillScore("Piloting"), flag: (flags["Piloting"] || "").toUpperCase() };
    } else {
      drivingLabel = "Piloting";
      drivingEntry = { score: this.attributeTotal("Awareness"), flag: (flags["Piloting"] || "").toUpperCase() };
    }

    const entries = [
      [drivingLabel, drivingEntry],
      ["Navigation", skillOrAttrEntry("Navigation", "Awareness")],
      ["Science", skillOrAttrEntry("Science", "Intelligence")],
      ["Technician", skillOrAttrEntry("Technician", "Intelligence")],
      ["Resistance", skillOrAttrEntry("Resistance", "Might")],
    ];

    let total = 0;
    const parts = entries.map(([label, e]) => {
      total += e.score + (e.flag === "A" ? 10 : e.flag === "D" ? -5 : 0);
      return `${label}-${e.score}${e.flag}`;
    });

    return `<div class="stats-line">GASCAR (${total}): ${esc(parts.join(", "))}.</div>`;
  }

  // -------------------------------------------------------------------------
  // Serialization
  // -------------------------------------------------------------------------
  toJSON() {
    const plain = { ...this };
    plain.selectedAbilities = this.selectedAbilities.map((a) => ({ ...a }));
    plain.selectedGenericAbilities = this.selectedGenericAbilities.map((g) => ({ ...g }));
    plain.selectedEquipment = this.selectedEquipment.map((e) => ({ ...e }));
    plain.skillLevels = { ...this.skillLevels };
    plain.skillBonuses = { ...this.skillBonuses };
    return plain;
  }

  static fromJSON(data) {
    const hero = new HeroData();
    Object.assign(hero, data);
    hero.selectedAbilities = (data.selectedAbilities || []).map((a) => ({ ...a }));
    hero.selectedGenericAbilities = (data.selectedGenericAbilities || []).map((g) => ({ ...g }));
    hero.selectedEquipment = (data.selectedEquipment || []).map((e) => ({ ...e }));
    hero.skillLevels = { ...(data.skillLevels || {}) };
    hero.skillBonuses = { ...(data.skillBonuses || {}) };
    if (!hero.id) hero.id = generateId();
    return hero;
  }

  static createNew() {
    return new HeroData();
  }

  clone() {
    const copy = HeroData.fromJSON(JSON.parse(JSON.stringify(this.toJSON())));
    copy.id = generateId();
    copy.fileName = "";
    copy.dirty = true;
    return copy;
  }
}
