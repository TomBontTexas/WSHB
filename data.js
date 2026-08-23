// Repository data ported from Warp Space: Heroes & Combat 2e, Section 2.5 (Hero Creation),
// plus Addendum 2 (Defending) updates. Phase 1 scope: Attributes, Skills, Archetypes/Abilities,
// Generic Abilities, and Development Point tracking. Equipment catalog and the Psionoj (psi
// power) repository are deferred to a later pass.

const ATTRIBUTES_REPOSITORY = [
  { name: "Agility", description: "Physical and manual dexterity, sense of balance, and body control. Governs Melee, Martial Arts, and Stealth." },
  { name: "Awareness", description: "Perception and sensory acuity across all five senses. Governs Herbalism, Insight, Observation, Navigation, Piloting, Survival, and Thievery. Adds bonus damage to Ranged Attacks." },
  { name: "Charisma", description: "Personality, ease in social interactions, and ability to charm or deceive. Governs Animal Handling, Command, Counsel, Persuade, and Society." },
  { name: "Coordination", description: "Hand-eye coordination, aim, and maneuvering effectively. Governs Acrobatics, Driving, Poisons, Parry, and Ranged Weapons." },
  { name: "Intelligence", description: "Wit, intellect, and academic/streetwise knowledge. Governs Liberal Arts, Medicine, Merchant, Science, Technician, Psionikaj, and Warfare." },
  { name: "Might", description: "Strength, endurance, and physical toughness. Governs Athletics and Resistance. Determines bonus melee damage, contributes to Health, and affects Load." },
  { name: "Willpower", description: "Force of will and mental resolve. Governs Discipline and Intimidate. Contributes to Resolve and adds damage to mental/Psionika attacks." },
];

// name -> governing Attribute, grouped in the same order as the official Hero Display sheet.
const SKILLS_REPOSITORY = [
  { skillName: "Melee", attribute: "Agility", description: "The skill of engaging in melee combat with any weapon, improvised or otherwise." },
  { skillName: "Martial Arts", attribute: "Agility", description: "Covers unarmed Melee Attacks, such as boxing and other striking forms. Grappling and wrestling are covered by Athletics." },
  { skillName: "Stealth", attribute: "Agility", description: "The ability to move unseen and remain hidden. Governs camouflage, disguise, and hiding tracks. Medium/heavy armor and excessive Load cause Disadvantage." },

  { skillName: "Herbalism", attribute: "Awareness", description: "Identify and combine natural ingredients into salves, teas, and healing poultices. Also covers kitchen cooking." },
  { skillName: "Insight", attribute: "Awareness", description: "The ability to detect when someone is lying or being deceitful." },
  { skillName: "Navigation", attribute: "Awareness", description: "Navigate in 2D and 3D space, plot courses for vehicles/aircraft/starships, and pilot through a space warp." },
  { skillName: "Observation", attribute: "Awareness", description: "Notice details and subtle environmental cues. Search rooms, detect ambushes, analyze evidence." },
  { skillName: "Piloting", attribute: "Awareness", description: "Pilot craft in 3D environments, including aircraft, submarines, spaceships, and starships." },
  { skillName: "Survival", attribute: "Awareness", description: "Hunt, fish, recognize tracks, and survive in wilderness environments, including alien or zero-G environments." },
  { skillName: "Thievery", attribute: "Awareness", description: "Criminal tricks: lock picking, picking pockets, bypassing traps, forgery, and assessing criminal risk." },

  { skillName: "Animal Handling", attribute: "Charisma", description: "Ride, care for, train, and work with domesticated animals." },
  { skillName: "Command", attribute: "Charisma", description: "Manipulate groups of people, including subordinates of lower rank or social status." },
  { skillName: "Counsel", attribute: "Charisma", description: "Offering wise advice and support, often provided by a priest or faithful church member." },
  { skillName: "Persuade", attribute: "Charisma", description: "Convincing others using charm, deception, coercion, bribery, or seduction." },
  { skillName: "Society", attribute: "Charisma", description: "Connect, network, and obtain resources through social contacts." },

  { skillName: "Acrobatics", attribute: "Coordination", description: "Body control: jumping, tumbling, diving. Dodging enemy attacks and overcoming obstacles. All non-light armor imposes Disadvantage." },
  { skillName: "Driving", attribute: "Coordination", description: "Operate a vehicle in 2D environments, such as cars and boats." },
  { skillName: "Parry", attribute: "Coordination", description: "Deflecting physical attacks (melee, missile, and some Area of Effect) barehanded, with a melee weapon, or with a shield." },
  { skillName: "Poisons", attribute: "Coordination", description: "Create blade venoms, poison gases, and various other toxins." },
  { skillName: "Ranged Weapons", attribute: "Coordination", description: "Use of ranged weaponry: rifles, pistols, bows, crossbows, slings, and thrown weapons." },

  { skillName: "Liberal Arts", attribute: "Intelligence", description: "Education in history, politics, geography, philosophy, and theology. A +1 indicates literacy." },
  { skillName: "Medicine", attribute: "Intelligence", description: "Knowledge of various medical treatment methods." },
  { skillName: "Merchant", attribute: "Intelligence", description: "The skill of commerce: buying, selling, trading, assessing value, banking, and loans." },
  { skillName: "Psionikaj", attribute: "Intelligence", description: "The ability to consciously manipulate reality through mental power, wielding Psionoj." },
  { skillName: "Science", attribute: "Intelligence", description: "Biology, chemistry, cosmology, geology, physics, psychology, sociology. Also used to operate sensors." },
  { skillName: "Technician", attribute: "Intelligence", description: "Operate and repair complex systems: programming, system development, hacking." },
  { skillName: "Warfare", attribute: "Intelligence", description: "War tactics and strategy: logistics, army maneuvers, war machines, fortifications, explosives." },

  { skillName: "Athletics", attribute: "Might", description: "Lifting weights, bending bars, climbing, swimming, running. In combat: wrestling and grappling. Load = Athletics Score x 10 + 20 lbs." },
  { skillName: "Resistance", attribute: "Might", description: "Shrug off pain and endure physical challenges. Each Skill Level adds 1 point to the Health Pool." },

  { skillName: "Discipline", attribute: "Willpower", description: "Aids in resisting persuasion and other mind-influencing effects. Each Skill Level adds 1 point to the Resolve Pool." },
  { skillName: "Intimidate", attribute: "Willpower", description: "Make threatening displays and coerce others into compliance. The aggressive counterpart to Persuade." },
];

// Triangular cost table straight from the rulebook (Skill Level -> total Development Points).
// Same "n(n+1)/2" shape as WSVB's feature CP cost.
function skillLevelCost(level) {
  if (level <= 0) return 0;
  return (level * (level + 1)) / 2;
}

// ---------------------------------------------------------------------------
// Skill Advantage/Disadvantage flags - best-effort scan of an Ability/
// Equipment description's free text for "Advantage/Disadvantage on/to <Skill>"
// phrasing, so a Skill Score can be flagged (see HeroData.skillAdvantageFlags
// in model.js). This is prose pattern-matching, not structured data: it will
// miss unusual wording and can occasionally flag a Skill name that's
// incidental to the sentence rather than the actual target.
// ---------------------------------------------------------------------------

// Real-text variants that show up in descriptions but don't match a Skill's
// own name exactly.
const SKILL_NAME_SYNONYMS = {
  "Intimidation": "Intimidate",
  "Persuasion": "Persuade",
  "Ranged Attacks": "Ranged Weapons",
  "Ranged Attack": "Ranged Weapons",
  "Melee Attacks": "Melee",
  "Melee Attack": "Melee",
  "Parry/Block": "Parry",
  "Counseling": "Counsel",
};

// Words that mark an Advantage/Disadvantage as situational rather than a
// flat, always-on bonus.
const CONDITIONAL_WORDS_RE = /\b(when|if|while|during|unless|against|versus|vs\.?|once per|after|before|only)\b/i;

// Skill names sorted longest-first so multi-word names (e.g. "Ranged Weapons")
// match before any shorter overlapping name (e.g. "Ranged").
const SKILL_MATCH_TERMS = [
  ...SKILLS_REPOSITORY.map((s) => ({ term: s.skillName, skill: s.skillName })),
  ...Object.entries(SKILL_NAME_SYNONYMS).map(([term, skill]) => ({ term, skill })),
].sort((a, b) => b.term.length - a.term.length);

// Returns [{ skill, letter }] for every Skill name found in a sentence
// alongside "Advantage"/"Disadvantage". letter is "A"/"D" for an unconditional
// grant, "a"/"d" if the sentence reads as situational.
//
// A conditional word directly qualifies the grant it's phrased next to (e.g.
// "Advantage on Stealth Task Checks when in darkness" -> conditional). But
// when it's introduced by " and " (e.g. "Advantage on Merchant Task Checks
// AND WHEN resisting scams..."), that's a second, additional clause rather
// than a qualifier on what came before - the earlier Skill mention(s) stay
// unconditional, and only Skills mentioned at/after that point are situational.
function scanTextForSkillFlags(text) {
  if (!text) return [];
  const out = [];
  const sentences = String(text).split(/(?<=[.!?])\s+/);
  for (const sentence of sentences) {
    const advMatch = /\b(Advantage|Disadvantage)\b/i.exec(sentence);
    if (!advMatch) continue;
    const baseLetter = advMatch[1][0].toUpperCase(); // "A" or "D"

    const condMatch = CONDITIONAL_WORDS_RE.exec(sentence);
    let wholeSentenceConditional = false;
    let andClauseSplitIndex = -1;
    if (condMatch) {
      const precedingText = sentence.slice(0, condMatch.index).trimEnd();
      if (/\band$/i.test(precedingText)) andClauseSplitIndex = condMatch.index;
      else wholeSentenceConditional = true;
    }

    const matchedRanges = [];
    for (const { term, skill } of SKILL_MATCH_TERMS) {
      const re = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
      const m = re.exec(sentence);
      if (!m) continue;
      const start = m.index, end = m.index + m[0].length;
      if (matchedRanges.some(([s, e]) => start < e && end > s)) continue; // already matched by a longer term
      matchedRanges.push([start, end]);
      const isConditional = wholeSentenceConditional || (andClauseSplitIndex !== -1 && start >= andClauseSplitIndex);
      out.push({ skill, letter: isConditional ? baseLetter.toLowerCase() : baseLetter });
    }
  }
  return out;
}

// Every Skill name mentioned anywhere in a block of text (not just next to
// "Advantage"/"Disadvantage" like scanTextForSkillFlags). Used by the Hero
// Creation Wizard to gauge how relevant a Skill is to an Archetype/Profession
// from their free-text descriptions.
function findSkillMentions(text) {
  if (!text) return [];
  const found = [];
  const matchedRanges = [];
  for (const { term, skill } of SKILL_MATCH_TERMS) {
    const re = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    const m = re.exec(text);
    if (!m) continue;
    const start = m.index, end = m.index + m[0].length;
    if (matchedRanges.some(([s, e]) => start < e && end > s)) continue;
    matchedRanges.push([start, end]);
    found.push(skill);
  }
  return found;
}

// ---------------------------------------------------------------------------
// Archetypes & Abilities
// ---------------------------------------------------------------------------
// Each archetype has a list of Abilities. A Hero picks one Archetype; buying an
// Ability that only appears under a *different* Archetype costs double (unless
// the same-named ability also appears under the Hero's own Archetype).
const ARCHETYPES_REPOSITORY = [
  {
    name: "Enforcer", category: "Contemporary", subtitle: "Police, Government Agent",
    abilities: [
      { name: "Agent", cost: 10, prerequisite: "None", description: "The Enforcer operates at Advantage when dealing with other officials within his government." },
      { name: "Investigator", cost: 10, prerequisite: "Agent", description: "The Enforcer has Advantage in Insight, Observation, and Society." },
      { name: "Inquisitor", cost: 10, prerequisite: "Agent", description: "The Enforcer has Advantage in Intimidation and Persuasion." },
      { name: "Two-Weapon Fighting", cost: 10, prerequisite: "Agent", description: "Can wield a medium and a light weapon, or two light weapons. With either, make an extra Attack without Disadvantage. Requires an Action." },
      { name: "Ranged Mastery", cost: 10, prerequisite: "Agent", description: "Can make an extra Ranged Attack without Disadvantage. Requires an Action." },
      { name: "Longstrider", cost: 15, prerequisite: "Agent", description: "Can take the Move Action as a Free Action once per turn." },
      { name: "Tough", cost: 5, prerequisite: "Agent", description: "Gain three extra Health." },
    ],
  },
  {
    name: "Entertainer", category: "Contemporary", subtitle: "Singer, Musician, Stand-Up Comic",
    abilities: [
      { name: "Beguile", cost: 10, prerequisite: "None", description: "Can charm or persuade a hostile person or creature through words or music. Best outside combat; Disadvantage if attempted in combat." },
      { name: "All the World's a Stage", cost: 5, prerequisite: "Beguile", description: "Can charm a crowd or mob if he has access to his music or can speak their language. Lasts 1 hour." },
      { name: "Everyone Loves a Clown", cost: 5, prerequisite: "Beguile", description: "Never suffers a hostile reaction when dealing with NPCs for the first time. The worst result is neutral." },
      { name: "Student of the Human Condition", cost: 5, prerequisite: "Beguile", description: "Has Advantage on all Insight checks." },
      { name: "Born Entertainer", cost: 5, prerequisite: "Beguile", description: "Has Advantage on Persuade when performing in front of a crowd or during one-on-one interactions." },
      { name: "Vicious Mockery", cost: 10, prerequisite: "Beguile and Born Entertainer", description: "Mocks any one creature with an Ego that understands the language, inflicting Resolve damage (1 + Willpower) and Dazing the target for one turn. Not an Attack. Range 50 ft. Requires an Action. Costs 0 Resolve." },
    ],
  },
  {
    name: "Psionisto", category: "Contemporary", subtitle: "Psionic",
    abilities: [
      { name: "Psionika Aptitude", cost: 15, prerequisite: "None", description: "Can learn Psionikaj and cast 1st Level Psionoj (normally not possible). Psionoj are cast using the Psionikaj skill." },
      { name: "2nd Level Psiono Use", cost: 15, prerequisite: "Psionika Aptitude", description: "Allows casting 2nd Level Psionoj." },
      { name: "3rd Level Psiono Use", cost: 15, prerequisite: "2nd Level Psiono Use", description: "Allows casting 3rd Level Psionoj." },
      { name: "4th Level Psiono Use", cost: 15, prerequisite: "3rd Level Psiono Use", description: "Allows casting 4th Level Psionoj." },
      { name: "5th Level Psiono Use", cost: 15, prerequisite: "4th Level Psiono Use", description: "Allows casting 5th Level Psionoj." },
    ],
  },
  {
    name: "Racer Crewman", category: "Contemporary", subtitle: "Pilot, Driver, Navigator, Spotter, Engineer",
    abilities: [
      { name: "Shipmate", cost: 10, prerequisite: "None", description: "Has experience working aboard spaceships. Operates without Disadvantage in generic spaceborne operations (donning a spacesuit, sealing hatches, etc.)." },
      { name: "Racer", cost: 5, prerequisite: "Shipmate", description: "Can work under the brutal acceleration and constant maneuvering of racing vessels. Gains Advantage on Uncompensated G-Force Resistance Task Checks." },
      { name: "Race Driver", cost: 10, prerequisite: "None", description: "Gains Advantage on Driving Task Checks made during high-speed maneuvering in groundcraft, including anti-gravity surfacecraft." },
      { name: "Race Pilot", cost: 10, prerequisite: "Shipmate", description: "Gains Advantage on Piloting Task Checks made during high-speed maneuvering that includes slingshot passes, atmospheric skimming, and other maneuvers." },
      { name: "Race Navigator", cost: 10, prerequisite: "Shipmate", description: "Gains Advantage on Navigation Task Checks made to plot race legs, gravitational slingshots, checkpoint approaches, and other course calculations." },
      { name: "Race Spotter", cost: 10, prerequisite: "Shipmate", description: "Gains Advantage on Science Task Checks when using sensors to detect navigational dangers such as debris, gravitational anomalies, and traffic." },
      { name: "Race Engineer", cost: 10, prerequisite: "Shipmate", description: "Gains Advantage on Technician Task Checks related to the engines, reactor, or hull." },
      { name: "Ace Racer", cost: 10, prerequisite: "Racer, and Race Pilot or Race Navigator", description: "The Hero is recognized as an elite competitor in one racing division. Once per race, he may treat any race-related Task Check as a Critical Success… after he rolls." },
    ],
  },
  {
    name: "Ranger", category: "Contemporary", subtitle: "Scout, Imperial Investigator",
    abilities: [
      { name: "Scout", cost: 10, prerequisite: "None", description: "Advantage in Scanning, Tracking, and Survival. Also Advantage when using Stealth." },
      { name: "Two-Weapon Fighting", cost: 10, prerequisite: "Scout", description: "Can wield a medium and a light weapon, or two light weapons. With either, make an extra Attack without Disadvantage. Requires an Action." },
      { name: "Ranged Mastery", cost: 10, prerequisite: "Scout", description: "Can make an extra Ranged Attack without Disadvantage. Requires an Action." },
      { name: "Longstrider", cost: 15, prerequisite: "Scout", description: "Can take the Move Action as a Free Action once per turn." },
      { name: "Tough", cost: 5, prerequisite: "Scout", description: "Gain three extra Health." },
      { name: "Investigator", cost: 10, prerequisite: "Scout", description: "Advantage on Insight, Observation, and Society." },
      { name: "Diplomacy by Force", cost: 10, prerequisite: "Investigator", description: "Advantage in Persuasion and Intimidation." },
      // From Warp Space: One Riot. One Ranger.
      { name: "Reserve Ranger", cost: 10, prerequisite: "Scout, Investigator, Diplomacy by Force", description: "The Hero has personal use of a Ranger Corps asset." },
      { name: "Trusted Reserve Ranger", cost: 10, prerequisite: "Reserve Ranger", description: "The Hero has personal use of a Silver-class Ranger, subject to the same responsibilities as found in Reserve Ranger above." },
    ],
  },
  {
    name: "Rogue", category: "Contemporary", subtitle: "Thief, Con-Man, Criminologist",
    abilities: [
      { name: "Sneak", cost: 10, prerequisite: "None", description: "Advantage on all Stealth checks." },
      { name: "Sneaky Bastard", cost: 10, prerequisite: "Sneak", description: "Grants Advantage with Melee Attacks if wearing Light armor." },
      { name: "Burglar", cost: 5, prerequisite: "Sneak", description: "Advantage on all attempts to detect and disarm traps." },
      { name: "Second Story Man", cost: 5, prerequisite: "Sneak", description: "Advantage on all Climb checks." },
      { name: "Light Touch", cost: 5, prerequisite: "Sneak", description: "Advantage on all checks relating to Pickpocketing, Lock Picking, and Sleight of Hand." },
      { name: "Streetwise", cost: 5, prerequisite: "Sneak", description: "Advantage on all Society checks." },
      { name: "Two-Weapon Fighting", cost: 10, prerequisite: "Sneak", description: "Can wield a medium and a light weapon, or two light weapons. With either, make an extra Attack without Disadvantage. Requires an Action." },
      { name: "Cunning Action", cost: 15, prerequisite: "Sneak", description: "Granted an extra Action each combat turn to use Stealth or Escape." },
      { name: "Slippery", cost: 5, prerequisite: "None", description: "Advantage on any Escape Action, including using Persuasion to talk his way out of a situation (fast-talk)." },
    ],
  },
  {
    name: "Scholar", category: "Contemporary", subtitle: "Scientist, Doctor, Engineer, Diplomat",
    abilities: [
      { name: "Scientist", cost: 10, prerequisite: "None", description: "Advantage on Science checks." },
      { name: "MacGiver", cost: 10, prerequisite: "Scientist", description: "Advantage on rolls involving ad-hoc scientific creations." },
      { name: "Genius", cost: 5, prerequisite: "Scientist", description: "Knows how to optimize materials and forces. All scientific creations are half-cost." },
      { name: "Healer", cost: 10, prerequisite: "None", description: "Advantage on Medicine checks." },
      { name: "Mad Scientist", cost: 5, prerequisite: "Scientist", description: "Rumored to be dangerous. Advantage in Intimidation when carrying or wearing his scientific gear." },
      { name: "My Son is a Doctor", cost: 5, prerequisite: "Scientist", description: "Advantage on all Society rolls." },
      { name: "Bedside Manner", cost: 5, prerequisite: "Healer", description: "Advantage on Persuasion and Counsel rolls when working with patients." },
      { name: "Endowed Chair", cost: 10, prerequisite: "My Son is a Doctor", description: "Advantage on Persuasion rolls involving funding, administration, and diplomacy." },
    ],
  },
  {
    name: "Soldier", category: "Contemporary", subtitle: "Military, Paramilitary",
    abilities: [
      { name: "Grunt", cost: 10, prerequisite: "None", description: "Can operate in an organized fighting unit in generic military operations without Disadvantage." },
      { name: "Battle Master", cost: 10, prerequisite: "Grunt", description: "Advantage on Warfare rolls." },
      { name: "Melee Weapon Mastery", cost: 10, prerequisite: "Grunt", description: "Can make an extra Melee Attack Action without Disadvantage." },
      { name: "Ranged Weapon Mastery", cost: 10, prerequisite: "Grunt", description: "Can make an extra Ranged Attack Action without Disadvantage." },
      { name: "Armor Mastery", cost: 5, maxLevel: 2, prerequisite: "Grunt", description: "Gain two extra DR when wearing any armor, per level (max 2 levels)." },
      { name: "Shield Mastery", cost: 10, prerequisite: "Grunt", description: "Can Block with Advantage." },
      { name: "Tough", cost: 5, prerequisite: "Grunt", description: "Gain three extra Health." },
      { name: "Gunner", cost: 10, prerequisite: "Grunt", description: "Advantage on all Ranged Attacks when direct-firing a mounted weapon." },
      { name: "Second Wind", cost: 15, prerequisite: "Grunt", description: "Can take a Recover Action as a Free Action once per turn." },
      { name: "Great Captain", cost: 10, prerequisite: "Battle Master", description: "Advantage on Command rolls within his assigned command." },
    ],
  },
  {
    name: "Spacer", category: "Contemporary", subtitle: "Captain, Pilot, Astrogator, Ship's Crew",
    abilities: [
      { name: "Shipmate", cost: 10, prerequisite: "None", description: "Can operate on a space vessel without Disadvantage in generic spaceborne operations (donning a pressure suit, sealing hatches, etc.)" },
      { name: "Squid", cost: 5, prerequisite: "Shipmate", description: "Can make Survival rolls in the context of shipboard life with Advantage." },
      { name: "Helmsman", cost: 10, prerequisite: "Shipmate", description: "Can pilot a ship at Advantage." },
      { name: "Navigator", cost: 10, prerequisite: "Shipmate", description: "Can perform Navigation at Advantage." },
      { name: "Gunner", cost: 10, prerequisite: "Shipmate", description: "Advantage on all Ranged Attacks when shooting a mounted weapon." },
      { name: "Great Captain", cost: 10, prerequisite: "Squid, and Helmsman or Navigator", description: "Advantage on Command rolls within his assigned command." },
    ],
  },
  {
    name: "Technician", category: "Contemporary", subtitle: "Mechanic, Electrician, Nurse",
    abilities: [
      { name: "Gearhead", cost: 10, prerequisite: "None", description: "Can operate basic devices and simple systems (not weapons or complex systems) with Advantage." },
      { name: "Operations Mastery", cost: 10, prerequisite: "Gearhead", description: "Can operate a complex system with Advantage (e.g., computer, engine, shield, or scanner). Not weapon attacks. Requires an Action." },
      { name: "Mr. Fix-it", cost: 10, prerequisite: "Gearhead", description: "Can make repair checks with Advantage. Includes Spaceframe & Powerplant Mechanic License; can certify all ship maintenance records." },
      { name: "Repair Mastery", cost: 10, prerequisite: "Gearhead", description: "Can make an extra repair attempt without Disadvantage. Requires an Action." },
      { name: "Hacker", cost: 10, prerequisite: "Operations Mastery", description: "Can make security intrusion attempts (mechanical, electronic, computer, or Quantatronic) with Advantage." },
    ],
  },
  {
    name: "Barbarian", category: "Archaic", subtitle: "",
    abilities: [
      { name: "Strong", cost: 15, prerequisite: "None", description: "Advantage on all feats of strength using Might (bending bars, lifting gates). Might + 1; Max Might Attribute + 1." },
      { name: "Native Son", cost: 10, prerequisite: "Strong", description: "Gain two extra DR and two extra SR." },
      { name: "Riddle of Steel", cost: 5, prerequisite: "Strong", description: "Gains +2 damage with two-handed and heavy weapons." },
      { name: "Survivalist", cost: 5, prerequisite: "None", description: "Resistant to extremes of heat and cold. Advantage when enduring wilderness extremes or using the Survival skill." },
      { name: "Light Armor", cost: 5, prerequisite: "Strong", description: "Encumbrance reduced one category for worn armor. Heavy treated as medium, medium treated as light." },
      { name: "Rock Climber", cost: 5, prerequisite: "Strong", description: "Advantage on all Climb checks." },
      { name: "Melee Weapon Mastery", cost: 10, prerequisite: "Strong", description: "Can make an extra Melee Attack without Disadvantage. Still requires an Action." },
      { name: "Tough", cost: 5, prerequisite: "Strong", description: "Gain three extra Health." },
    ],
  },
  {
    name: "Duelist", category: "Archaic", subtitle: "",
    abilities: [
      { name: "Dancer", cost: 15, prerequisite: "None", description: "While wielding a fencing weapon and wearing light armor, can Move/retreat without drawing attacks of opportunity, and Move through enemies on an Acrobatics success." },
      { name: "Flashy Swordplay", cost: 30, prerequisite: "Dancer", description: "Can Attack and Parry with Advantage when using a fencing weapon and wearing light armor." },
      { name: "Expert Fencer", cost: 10, prerequisite: "Dancer", description: "Never takes penalties for being flanked, prone, having a height Disadvantage, or from Mobs." },
      { name: "Dashing Swordplay", cost: 10, prerequisite: "Dancer", description: "No Disadvantage when making an extra Attack in a combat turn if using a fencing weapon and wearing light armor." },
      { name: "Evasion", cost: 10, prerequisite: "Dancer", description: "Advantage on all Acrobatics Task Checks versus area-of-effect attacks or similar." },
      { name: "Longstrider", cost: 15, prerequisite: "Dancer", description: "Can take the Move Action as a Free Action once per turn." },
      { name: "Two-Weapon Fighting", cost: 10, prerequisite: "Dancer", description: "Can wield a medium and a light weapon, or two light weapons. With either, make an extra Attack without Disadvantage. Requires an Action." },
    ],
  },
  {
    name: "Monk", category: "Archaic", subtitle: "",
    abilities: [
      { name: "Martial Arts Training", cost: 20, prerequisite: "None", description: "Inflicts two extra points of damage with hands, feet, and Monk weapons (fists/kicks base damage now 4). Can make an extra Attack using Melee, Martial Arts, or Athletics without Disadvantage." },
      { name: "Stunning Blow", cost: 10, prerequisite: "Martial Arts Training", description: "Can Daze a target at no additional cost with any Melee Attack. With Disadvantage on the Attack, can Stun the opponent instead." },
      { name: "On a Wire", cost: 20, prerequisite: "Martial Arts Training", description: "Advantage on all jumps, leaps, and dives. Can take the Move Action as a Free Action once per turn." },
      { name: "Evasion", cost: 10, prerequisite: "Martial Arts Training", description: "Advantage using Acrobatics Task Checks against area-of-effect attacks and similar effects." },
      { name: "Clear Mind", cost: 10, prerequisite: "Martial Arts Training", description: "Advantage on all Discipline Task Checks." },
      { name: "Healthy Body", cost: 10, prerequisite: "Martial Arts Training", description: "Advantage on all Resistance checks." },
      { name: "Meditative Healing", cost: 5, prerequisite: "Martial Arts Training", description: "Can cure all Health and Resolve Points, without a Healer, in one hour of rest. With a Healer's assistance, Advantage on Medicine Task Checks." },
      { name: "Second Wind", cost: 15, prerequisite: "Martial Arts Training", description: "Can take a Recover Action as a Free Action once per turn." },
      { name: "Quivering Palm", cost: 30, prerequisite: "All Monk Abilities", description: "Touches an enemy in the chest; if successful, the enemy dies at a time of the Monk's choosing (immediately or up to a week later). Resolve spent is lost either way (half the Attack's TN). Bypasses all DR. Once per day." },
    ],
  },
  // "Both" Archetypes may be selected in either the Contemporary or Archaic category.
  {
    name: "Trader", category: "Both", subtitle: "Merchant, Caravan Master",
    abilities: [
      { name: "Market Sense", cost: 10, prerequisite: "None", description: "Can identify a fair price for most goods at a glance and detect when someone is hiding the true value of an item or service. Advantage on Merchant Task Checks and when resisting scams or swindles." },
      { name: "Silver Tongue", cost: 5, prerequisite: "Market Sense", description: "In settings with formal merchant guilds, caravans, or corporate trade networks, assumed to have basic professional recognition. Advantage on Persuade Task Checks when conducting business or brokering deals." },
      { name: "Supply Chain", cost: 10, prerequisite: "Market Sense", description: "Once per session, may secure a needed item or minor service \"off the books\" - hidden caches, friendly vendors, caravan ties, logistical favors, or network connections." },
      { name: "Risk Broker", cost: 10, prerequisite: "Silver Tongue", description: "Advantage on Insight checks for detecting lies or hidden motives during deals, auctions, wagers, or negotiations. Once per encounter, may grant a Hero ally Advantage on a Merchant or Society Task Check." },
      { name: "Caravan Master", cost: 10, prerequisite: "Supply Chain", description: "Manages groups, routes, and transport with uncanny efficiency. Advantage on Navigation and Survival Task Checks for long overland journeys; when traveling with a party, overland travel time is reduced by 20%." },
      { name: "Trade Wind", cost: 10, prerequisite: "Supply Chain", description: "Once per session, may declare a Windfall Opportunity - a sudden buyer, seller, or short-term market shift. Grants Advantage on the next three commerce-related checks (Merchant or Society)." },
      { name: "Market Mover", cost: 5, prerequisite: "Trade Wind", description: "Can manipulate the flow of local commerce via insider knowledge, timing, and subtle influence. When acquiring trade goods, may choose the specific category without Disadvantage." },
      { name: "Corner the Market", cost: 10, prerequisite: "Market Mover", description: "Knows exactly which buttons to push and who to influence. When acquiring trade goods, may choose the specific good instead of rolling randomly." },
    ],
  },
  {
    name: "Smuggler", category: "Both", subtitle: "Blockade Runner, Customs Officer",
    abilities: [
      { name: "Dirty Hands", cost: 10, prerequisite: "None", description: "Instinctively identifies weak inspection points, inattentive guards, bribable officials, and blind spots - but only when trying to sneak in illicit cargo. Advantage on Persuade and Technician Task Checks when hiding illicit cargo." },
      { name: "Unrefusable Offer", cost: 5, prerequisite: "Dirty Hands", description: "Has a reputation dangerous or useful enough to open doors in the underworld. Advantage on Intimidation Task Checks when dealing with criminals, informants, black-market traders, and corrupt bureaucrats." },
      { name: "Shadow Chain", cost: 10, prerequisite: "Dirty Hands", description: "Once per session, may secure an illicit favor, illegal item, restricted tool, or covert service \"off the record\" - hidden trails, bribed gatekeepers, outlaw caravans, corrupt dockmasters, forged tags, or masked transponder codes." },
      { name: "Instinct for Trouble", cost: 10, prerequisite: "Unrefusable Offer", description: "Advantage on Insight checks to detect traps, sting operations, double-crosses, or hidden agendas during any deal or cargo exchange. Once per encounter, may give an ally Advantage on a Society or smuggling-related Task Check." },
      { name: "Blockade Runner", cost: 10, prerequisite: "Shadow Chain", description: "Moves people and cargo along dangerous paths with uncanny precision. Advantage on Navigation, Survival, and Stealth Task Checks when crossing borders, bypassing patrols, or using covert routes. Overland travel time for the party is reduced by 20% when leading." },
      { name: "Black Wind", cost: 10, prerequisite: "Shadow Chain", description: "Once per session, may declare a Black Wind Opportunity - a sudden opening in patrol patterns, a bribed inspector, a rival's distraction, or a moment of market chaos. Advantage on the next three illicit-commerce or smuggling-related Task Checks." },
      { name: "This is My Town", cost: 10, prerequisite: "Black Wind", description: "Manipulates underworld supply lines, quietly ensuring the goods wanted appear where needed. May choose the exact illicit good instead of rolling randomly." },
    ],
  },
  {
    name: "Beastmaster", category: "Both", subtitle: "Animal Handler, Xenotamer",
    abilities: [
      { name: "Beast Bond", cost: 5, prerequisite: "None", description: "Advantage on Animal Handling Task Checks. Gets an Easy Tier-4 or less creature for a pet, knowing four basic commands. Also Advantage on Survival checks when tracking prey or evading predators." },
      { name: "Wild Empathy", cost: 5, prerequisite: "Beast Bond", description: "Advantage on Insight and Persuasion checks with primitive cultures that revere beasts." },
      { name: "Pack Tactics", cost: 10, prerequisite: "Beast Bond", description: "The pet is trained for combat, providing Advantage on Attack and Defense." },
      { name: "Xenotamer", cost: 10, prerequisite: "Beast Bond", description: "Can attempt to Bond with untrainable fauna (no further training possible). Task Check (Survival) vs. TN (Creature's Discipline + 10)." },
      { name: "Animal Companion", cost: 10, prerequisite: "Pack Tactics", description: "May choose a Normal Tier-4 or lesser beast for a pet. It obeys eight commands without a check." },
      { name: "Bestial Fury", cost: 10, prerequisite: "Animal Companion", description: "Once per encounter, can drive his companion into a frenzy, gaining +2 damage and Advantage on Melee Attacks for three turns." },
      { name: "Symbiosis", cost: 15, maxLevel: 3, prerequisite: "Animal Companion and Xenotamer", description: "The Beastmaster and a bonded beast share instincts over a dedicated telepathic connection. Once per turn, may re-roll a failed Attack, Defense, or Survival check if the companion is within 30 feet. Cost is per bonded beast - buy an additional level to extend this to another beast." },
    ],
  },

  // =========================================================================
  // REPTAUR-ONLY ARCHETYPES - from Warp Space: Alien Race 1 - Reptaurs.
  // These are written for the Reptaur alien species (an NPC/antagonist race
  // with its own attribute modifiers, natural weapons, and caste culture) and
  // are NOT intended for ordinary human Heroes. category: "Reptaur" keeps
  // them in their own clearly-labeled dropdown group, separate from the
  // Contemporary/Archaic/Both Archetypes available to human Heroes.
  // =========================================================================
  {
    name: "Predator", category: "Reptaur",
    note: "Only a Blooded caste member may choose this Archetype.",
    abilities: [
      { name: "Hunter's Discipline", cost: 10, prerequisite: "None", description: "The Predator has Advantage on Tracking, Survival, and Stealth Task Checks. This reflects trained patience, environmental reading, and deliberate movement rather than speed alone." },
      { name: "Measured Advance", cost: 10, prerequisite: "Hunter's Discipline", description: "The Predator may Move and make one Ranged Attack without Disadvantage, provided he moved no more than half his base movement." },
      { name: "Close the Kill", cost: 10, prerequisite: "Hunter's Discipline", description: "When the Predator makes a Melee Attack against a target he has already damaged during the encounter, the Attack is made with Advantage. This ability may be used once per turn." },
      { name: "Weapon Integration", cost: 10, prerequisite: "Hunter's Discipline", description: "The Predator may simultaneously make Ranged Weapon and Melee Attacks. He may wield any weapon appropriate to his Might and physiology without Disadvantage, including heavy or two-handed weapons." },
      { name: "Predatory Flow", cost: 15, prerequisite: "Close the Kill", description: "Once per turn, after hitting a target in melee, the Predator may immediately take a Free Move Action of up to half his base movement. This movement does not provoke reactions." },
      { name: "Unyielding Focus", cost: 10, prerequisite: "Hunter's Discipline", description: "The Predator has Advantage on Discipline Task Checks made to resist Fear, Collapse, or a distraction during combat." },
      { name: "Single Prey", cost: 10, prerequisite: "Close the Kill", description: "At the start of an encounter, or as a Free Action once per encounter, the Predator may designate a visible enemy as his prey, bestowing +2 damage. This bonus ends if the Predator disengages or switches targets." },
      { name: "Endurance", cost: 5, prerequisite: "Hunter's Discipline", description: "Gain three extra Health. This stacks with similar abilities." },
      { name: "Dominance Strike", cost: 15, prerequisite: "Predatory Flow", description: "Once an encounter, the Predator may declare a Melee Attack as a Dominance Strike for +4 damage. The target must resolve a Discipline Task Check or be Dazed for one turn due to overwhelming physical and psychological pressure, not finesse." },
      { name: "Apex Presence", cost: 10, prerequisite: "Unyielding Focus", description: "The Predator has Advantage on Intimidation Task Checks against wounded enemies, isolated targets, or those who have witnessed him kill or cripple another combatant during the encounter." },
    ],
  },
  {
    name: "Forge Warden", category: "Reptaur",
    abilities: [
      { name: "Forge Discipline", cost: 10, prerequisite: "None", description: "The Forge Warden has Advantage on Technician and Science Task Checks when working on ships, weapons, armor, stealth systems, or power plants." },
      { name: "Systems Architect", cost: 10, prerequisite: "Forge Discipline", description: "The Forge Warden can operate complex ship systems with Advantage and may diagnose system interactions, cascading failures, or design flaws. This includes engines, sensors, stealth systems, shields, and heavy weapons, but not weapon attacks themselves." },
      { name: "Blood-Tested Design", cost: 10, prerequisite: "Forge Discipline", description: "When the Forge Warden builds, modifies, tunes, or repairs equipment prior to combat, one selected system gains Advantage on its first relevant Operations Task Check during that encounter (Gamemaster discretion). If the system Fumbles, the Forge Warden's reputation suffers." },
      { name: "Ritual Certification", cost: 5, prerequisite: "Blood-Tested Design", description: "The Forge Warden can certify armor, weapons, or vessels as hunt-worthy. Certified equipment is recognized culturally and mechanically as valid for trophy claims and ritual use. Improvised or uncertified equipment may incur narrative or social penalties at the Gamemaster's discretion." },
      { name: "Failure Analysis", cost: 5, prerequisite: "Systems Architect", description: "When examining damaged equipment, wreckage, or battlefield debris, the Forge Warden has Advantage on Science, Technician, and Insight Task Checks to determine cause of failure, misuse, or enemy adaptation." },
      { name: "Measured Innovation", cost: 10, prerequisite: "Systems Architect", description: "The Forge Warden may attempt experimental modifications, removing any one Level of Disadvantage. On Success or better, the modification functions as intended. On Failure or worse, it does not catastrophically fail - but no one will use the Forge Warden's equipment without new data or justification." },
      { name: "Denied the Upgrade", cost: 5, prerequisite: "Ritual Certification", description: "The Forge Warden has Advantage verses Intimidation and Persuade when dealing with warriors, hunters, or crews who rely on his work. Among Reptaurs, denial of maintenance, upgrades, or certification carries real social weight." },
      { name: "Ritual Smith", cost: 10, prerequisite: "Ritual Certification", description: "The Forge Warden may integrate a verified trophy into a functional item - such as armor, a melee weapon, a ranged weapon housing, a ship hull section, or a control interface. When integrated, the item gains a minor mechanical or situational benefit appropriate to its function (Gamemaster discretion), reflecting improved balance, lethality, resilience, or system responsiveness. Suggest a +2 to +4 Psionika bonus. Ritual Smith work must be both sound and culturally correct - an inappropriate, falsified, or mismatched trophy provides no benefit and may incur social or ritual penalties." },
    ],
  },
  {
    name: "Warm Well Tender", category: "Reptaur",
    abilities: [
      { name: "Biological Custodian", cost: 10, prerequisite: "None", description: "The Warm Well Tender has Advantage on Medicine and Science Task Checks involving physiology, regeneration, hormones, fertility cycles, and long-term biological stability." },
      { name: "Flesh-Binder", cost: 10, prerequisite: "Biological Custodian", description: "The Tender has Advantage on Medicine Task Checks made to treat critical injuries, restore combat viability, or Stabilize a Dying creature. Once per encounter, when treating an ally, the Tender may negate one Level of Disadvantage caused by injury or stress." },
      { name: "Enduring Frame", cost: 10, prerequisite: "None", description: "The Warm Well Tender gains Might +1 (to a maximum of +1 above species limits) and Advantage on Resistance Task Checks. This reflects reinforced bone density, conditioned musculature, and biological hardening." },
      { name: "Warden's Authority", cost: 10, prerequisite: "Biological Custodian", description: "The Warm Well Tender has Advantage on Intimidation and Command Task Checks when issuing medical, biological, or quarantine-related orders. Reptaurs recognize this authority." },
      { name: "Systems Familiarity", cost: 10, prerequisite: "Biological Custodian", description: "The Tender may operate medical bays, life-support systems, regeneration tanks, and Warm Well infrastructure with Advantage, including diagnosing failures or contamination. This does not include weapon systems." },
      { name: "Brutal Restraint", cost: 5, prerequisite: "Enduring Frame", description: "The Warm Well Tender has Advantage on Athletics and Grapple-related Task Checks when restraining unwilling subjects. Pain compliance is permitted and culturally sanctioned when necessary." },
      { name: "Living Asset Handling", cost: 10, prerequisite: "Biological Custodian", description: "The Tender has Advantage on Animal Handling Task Checks when dealing with Reptaur young, non-sapient Warm Well fauna, or engineered organisms. See Warp Space: Galactic Bestiary for advanced rules on Animal Handling." },
      { name: "Pack Biology", cost: 5, prerequisite: "Living Asset Handling", description: "When working alongside allies, the Warm Well Tender gains Advantage on Insight Task Checks related to stress, hormonal instability, aggression spikes, or imminent biological failure." },
      { name: "Sanctioned Intervention", cost: 15, prerequisite: "Flesh-Binder and Warden's Authority", description: "Once per session, the Warm Well Tender may declare a Sanctioned Intervention. For the duration of one scene, his medical or biological actions cannot be overruled by social pressure, dominance challenges, or Intimidation. Any attempt to interfere grants the Tender Advantage on all relevant Task Checks to enforce compliance." },
    ],
  },
  {
    name: "Kill Adjudicator", category: "Reptaur",
    abilities: [
      { name: "Adjudicator's Eye", cost: 10, prerequisite: "None", description: "The Kill Adjudicator has Advantage on Insight, Observation, and Investigation Task Checks when examining trophies, remains, weapons, battlefields, or kill records." },
      { name: "Forensic Method", cost: 10, prerequisite: "Adjudicator's Eye", description: "The Adjudicator has Advantage on Science and criminology-related Task Checks to reconstruct events, determine sequence of actions, identify false evidence, or expose tampering. This includes biological, mechanical, and environmental analyzes." },
      { name: "Quiet Authority", cost: 10, prerequisite: "Adjudicator's Eye", description: "The Kill Adjudicator has Advantage on Persuade and Intimidate Task Checks when questioning hunters, witnesses, or crews regarding disputed hunts. This authority does not rely on threats; it derives from cultural inevitability." },
      { name: "Lineage-Binder", cost: 10, prerequisite: "Forensic Method", description: "The Adjudicator maintains genetic records, ancestry chains, and trophy-to-bloodline mappings. He has Advantage on Science and Society Task Checks involving lineage, reproductive eligibility, inheritance of trophies, or bloodline legitimacy. His determinations affect status and continuation rights." },
      { name: "Psychic Residue Reading", cost: 15, prerequisite: "None", description: "The Kill Adjudicator may learn Psionoj and cast 1st Level Psionoj at Advantage using the Psionikaj skill, but only on those related to memory, impression, emotional residue, or lingering intent (Gamemaster discretion). These abilities are used for verification and insight, not combat." },
      { name: "Hunter of the Lie", cost: 10, prerequisite: "Adjudicator's Eye", description: "When investigating a false claim, altered evidence, or deception related to a hunt, the Kill Adjudicator gains Advantage on all Task Checks related to that inquiry for the duration of the scene." },
      { name: "Permanent Record", cost: 5, prerequisite: "Lineage-Binder", description: "Once per session, the Adjudicator may declare an action, trophy, or claim entered into the record. From that point forward, it cannot be casually denied, erased, or reinterpreted without extraordinary evidence. Social attempts to dispute it suffer Disadvantage." },
      { name: "Unchallenged Verdict", cost: 15, prerequisite: "Quiet Authority and Lineage-Binder", description: "Once per session, the Kill Adjudicator may issue a formal verdict regarding a disputed hunt. For the remainder of the scene, all parties must treat the ruling as final. Attempts to ignore or override it grant the Adjudicator Advantage on all relevant Task Checks to enforce compliance." },
    ],
  },
];

// ---------------------------------------------------------------------------
// Generic Abilities (not tied to an Archetype - available to all Heroes)
// ---------------------------------------------------------------------------
// costMode: "flat" (single cost, maxLevel usually 1), "perLevel" (cost x level,
// up to maxLevel), or "table" (costTable[level-1] is the total cost of owning
// that level - used where per-level cost isn't linear, e.g. Gizmo, Languages).
const GENERIC_ABILITIES_REPOSITORY = [
  { name: "Absolute Direction", costMode: "flat", cost: 1, maxLevel: 1, description: "Always knows which way is north and how far below or above the planet's surface he is." },
  { name: "Alertness", costMode: "flat", cost: 5, maxLevel: 1, description: "Advantage on Initiative rolls." },
  { name: "Appearance", costMode: "flat", cost: 5, maxLevel: 1, description: "Gain Advantage with Seduction (a type of Persuasion) and general reaction rolls." },
  { name: "Call of the Wild", costMode: "flat", cost: 1, maxLevel: 1, description: "If a Hero smells something (via his Survival skill), he will never forget it." },
  { name: "Can't Keep a Good Man Down", costMode: "perLevel", cost: 2, maxLevel: 3, description: "Recovers from unconsciousness faster than normal. Lvl1: 1 hour. Lvl2: 5 minutes. Lvl3: 1 combat turn." },
  { name: "Counselor", costMode: "flat", cost: 5, maxLevel: 1, description: "Advantage on Counsel to cure Stress." },
  { name: "Cybernetics (Agility)", costMode: "perLevel", cost: 5, maxLevel: 2, description: "Cybernetic augmentation granting a +1 bonus to Agility, increasing its maximum by 1. Can be combined with Eugenics (Agility)." },
  { name: "Cybernetics (Awareness)", costMode: "perLevel", cost: 5, maxLevel: 2, description: "Cybernetic augmentation granting a +1 bonus to Awareness, increasing its maximum by 1. Can be combined with Eugenics (Awareness)." },
  { name: "Cybernetics (Charisma)", costMode: "perLevel", cost: 5, maxLevel: 2, description: "Cybernetic augmentation granting a +1 bonus to Charisma, increasing its maximum by 1. Can be combined with Eugenics (Charisma)." },
  { name: "Cybernetics (Coordination)", costMode: "perLevel", cost: 5, maxLevel: 2, description: "Cybernetic augmentation granting a +1 bonus to Coordination, increasing its maximum by 1. Can be combined with Eugenics (Coordination)." },
  { name: "Cybernetics (Intelligence)", costMode: "perLevel", cost: 5, maxLevel: 2, description: "Cybernetic augmentation granting a +1 bonus to Intelligence, increasing its maximum by 1. Can be combined with Eugenics (Intelligence)." },
  { name: "Cybernetics (Might)", costMode: "perLevel", cost: 5, maxLevel: 2, description: "Cybernetic augmentation granting a +1 bonus to Might, increasing its maximum by 1. Can be combined with Eugenics (Might)." },
  { name: "Cybernetics (Willpower)", costMode: "perLevel", cost: 5, maxLevel: 2, description: "Cybernetic augmentation granting a +1 bonus to Willpower, increasing its maximum by 1. Can be combined with Eugenics (Willpower)." },
  { name: "Eidetic Memory", costMode: "flat", cost: 1, maxLevel: 1, description: "Player can ask the GM for any details the Hero has experienced that the player has forgotten." },
  { name: "Eugenics (Agility)", costMode: "perLevel", cost: 5, maxLevel: 2, description: "Born with a genetic advantage or procured genetic treatment granting a +1 bonus to Agility, increasing its maximum by 1. Can combine with Cybernetics (Agility)." },
  { name: "Eugenics (Awareness)", costMode: "perLevel", cost: 5, maxLevel: 2, description: "Born with a genetic advantage or procured genetic treatment granting a +1 bonus to Awareness, increasing its maximum by 1. Can combine with Cybernetics (Awareness)." },
  { name: "Eugenics (Charisma)", costMode: "perLevel", cost: 5, maxLevel: 2, description: "Born with a genetic advantage or procured genetic treatment granting a +1 bonus to Charisma, increasing its maximum by 1. Can combine with Cybernetics (Charisma)." },
  { name: "Eugenics (Coordination)", costMode: "perLevel", cost: 5, maxLevel: 2, description: "Born with a genetic advantage or procured genetic treatment granting a +1 bonus to Coordination, increasing its maximum by 1. Can combine with Cybernetics (Coordination)." },
  { name: "Eugenics (Intelligence)", costMode: "perLevel", cost: 5, maxLevel: 2, description: "Born with a genetic advantage or procured genetic treatment granting a +1 bonus to Intelligence, increasing its maximum by 1. Can combine with Cybernetics (Intelligence)." },
  { name: "Eugenics (Might)", costMode: "perLevel", cost: 5, maxLevel: 2, description: "Born with a genetic advantage or procured genetic treatment granting a +1 bonus to Might, increasing its maximum by 1. Can combine with Cybernetics (Might)." },
  { name: "Eugenics (Willpower)", costMode: "perLevel", cost: 5, maxLevel: 2, description: "Born with a genetic advantage or procured genetic treatment granting a +1 bonus to Willpower, increasing its maximum by 1. Can combine with Cybernetics (Willpower)." },
  { name: "Fast Healer", costMode: "flat", cost: 3, maxLevel: 1, description: "Each successful Medicine Task Check on the Hero doubles Health Pool Points Healed." },
  { name: "Gizmo", costMode: "table", costTable: [2, 5], description: "Can pull one item from his pocket or backpack once per game session per level bought. Must be something reasonably made/bought locally, weighing less than 2 lbs." },
  { name: "Hard to Kill", costMode: "perLevel", cost: 5, maxLevel: 3, description: "Gains one Level of Advantage per level on Criticality Task Checks." },
  { name: "Healthy", costMode: "flat", cost: 5, maxLevel: 1, description: "Gain 2 Health points plus 2 points on Criticality Task Checks." },
  { name: "Heirloom", costMode: "flat", cost: 5, maxLevel: 1, description: "Gain a relic inherited from your family or clan - usually a masterwork item with unique powers and uses." },
  { name: "Languages", costMode: "table", costTable: [1, 2, 3], levelNames: ["Broken", "Accented", "Native"], description: "Learn an additional language. A Hero with Liberal Arts-1+ is literate in all languages he speaks." },
  { name: "Lucky", costMode: "flat", cost: 5, maxLevel: 1, description: "Can reroll any single die roll (or any two+ if made with Advantage/Disadvantage) he doesn't like. The second result must be kept. Once per game session." },
  { name: "Master", costMode: "flat", cost: 5, maxLevel: 1, description: "Can take promotion to Master in his chosen profession." },
  { name: "Merchant Prince", costMode: "perLevel", cost: 3, maxLevel: 2, description: "A scion of a merchant family, with contacts and trade route access. Only one of Nobility, Merchant Prince, or Wealthy may be chosen." },
  { name: "Nobility", costMode: "perLevel", cost: 5, maxLevel: 2, description: "A scion of a noble family - a knight, eventually with a fief and manor holding. Only one of Nobility, Merchant Prince, or Wealthy may be chosen." },
  { name: "Parry Archaic Missile Weapon", costMode: "flat", cost: 2, maxLevel: 1, description: "Trained to deflect archaic missile weapon attacks with bare hands - but not bullets or energy weapon attacks. (Addendum 2)" },
  { name: "Parry Modern Missile Weapon", costMode: "flat", cost: 3, maxLevel: 1, prerequisite: "Parry Archaic Missile Weapon", description: "Trained to deflect modern missile weapon attacks (bullets, energy) with energy-based melee weapons. (Addendum 2)" },
  { name: "Poisoner", costMode: "flat", cost: 5, maxLevel: 1, description: "Cannot be poisoned by accident. Advantage with Observation in recognizing poisons and their effects." },
  { name: "Profession", costMode: "flat", cost: 5, maxLevel: 1, description: "Can choose an additional Profession at Journeyman level." },
  { name: "Resistant to Disease", costMode: "flat", cost: 5, maxLevel: 1, description: "Roll with Advantage to resist disease." },
  { name: "Resistant to Poison", costMode: "flat", cost: 5, maxLevel: 1, description: "Roll with Advantage to resist poison." },
  { name: "Righteous", costMode: "flat", cost: 5, maxLevel: 1, description: "Roll with Advantage to resist corruption." },
  { name: "Sensitive", costMode: "flat", cost: 5, maxLevel: 1, description: "Sensitive to background psychic forces (possession, residual horrors). Passive, typically triggered through touch or sleep." },
  { name: "Smart Mount, Pet, or Familiar", costMode: "flat", cost: 5, maxLevel: 1, description: "A smart, loyal animal companion. Can be trained/programmed for combat (Advantage on Attack/Defense). Combat Upgrade costs 10 points instead." },
  { name: "Strong-Willed", costMode: "flat", cost: 5, maxLevel: 1, description: "Gain 2 Resolve points plus 2 points on Criticality Task Checks." },
  { name: "Unfazeable", costMode: "flat", cost: 3, maxLevel: 1, description: "Each successful Counsel Task Check on the Hero doubles Stress cured." },
  { name: "Wealthy", costMode: "perLevel", cost: 1, maxLevel: 2, description: "Additional starting money. Only one of Nobility, Merchant Prince, or Wealthy may be chosen." },
  { name: "Well-Traveled", costMode: "perLevel", cost: 2, maxLevel: 10, description: "Familiar with different cultures and customs, per foreign culture bought. Gain one language at Broken." },
  { name: "Willful", costMode: "flat", cost: 5, maxLevel: 1, description: "Gain 2 Resolve points." },
];

function genericAbilityCost(entry, level) {
  const lvl = Math.max(1, level || 1);
  if (entry.costMode === "table") return entry.costTable[Math.min(lvl, entry.costTable.length) - 1] ?? 0;
  if (entry.costMode === "perLevel") return entry.cost * lvl;
  return entry.cost; // flat
}

// ---------------------------------------------------------------------------
// Professions (Step 3) - freeform pick, no Development Point cost at Journeyman.
// ---------------------------------------------------------------------------
const PROFESSIONS_REPOSITORY = [
  { name: "Accountant", category: "Contemporary", description: "Create, maintain, or audit business financial records." },
  { name: "Actor", category: "Contemporary", description: "Perform assigned roles on stage or in front of a camera." },
  { name: "Architect", category: "Contemporary", description: "Design aesthetically pleasing buildings." },
  { name: "Armor Smith", category: "Contemporary", description: "Fabricate and maintain personal body armor. Combat repairs fall under Technician." },
  { name: "Attorney/Lawyer", category: "Contemporary", description: "Practice law." },
  { name: "Contractor", category: "Contemporary", description: "Manage construction projects and companies." },
  { name: "Cook", category: "Contemporary", description: "Create meals that are pleasing to the senses." },
  { name: "Con-Man", category: "Contemporary", description: "Run scams and confidence schemes, from Three Card Monty to a Ponzi scheme." },
  { name: "Cosmetologist", category: "Contemporary", description: "Enhance people's appearance: hair, makeup, wardrobe, and etiquette." },
  { name: "Dentist", category: "Contemporary", description: "A doctor specializing in the treatment and care of teeth." },
  { name: "Doctor", category: "Contemporary", description: "Diagnose and treat illnesses, prescribe medical treatments. Combat healing falls under Medicine." },
  { name: "Driver", category: "Contemporary", description: "Ability to operate wheeled, tracked, or anti-gravity groundcraft; combat/high-speed driving falls under the Driving skill." },
  { name: "Electrician", category: "Contemporary", description: "Fabricate and maintain electrical and electronic systems. Combat repairs fall under Technician." },
  { name: "Engineer", category: "Contemporary", description: "Design and implement civil, mechanical, and electronic projects, fixed and mobile." },
  { name: "Farmer/Rancher", category: "Contemporary", description: "Planting, harvesting, irrigation, crop rotation, soil management, and raising stock animals." },
  { name: "Forger", category: "Contemporary", description: "Create fake official documents, deeds, and identification." },
  { name: "Steward", category: "Contemporary", description: "Manage and perform hospitality services for events, hotels, households, museums, restaurants, travel, and tours." },
  { name: "Jeweler", category: "Contemporary", description: "Craft rings and necklaces and work with gems." },
  { name: "Mechanic", category: "Contemporary", description: "Fabricate and maintain mechanical systems and equipment. Combat repairs fall under Technician." },
  { name: "Military Training", category: "Contemporary", description: "Knowledge of proper military etiquette, procedures, and operating within a military unit." },
  { name: "Musician", category: "Contemporary", description: "Perform musical pieces for an audience." },
  { name: "Miner", category: "Contemporary", description: "Excavate gems and minerals; build, maintain, and develop mines." },
  { name: "Nurse", category: "Contemporary", description: "Hands-on care for the sick, pharmaceutical treatments, physical therapy. Combat healing falls under Medicine." },
  { name: "Pharmacist", category: "Contemporary", description: "Recommend and administer pharmaceutical treatments." },
  { name: "Priest", category: "Contemporary", description: "Social leader of a religious community; baptisms, marriages, ceremonies. (Druids/Shamans in barbaric/nomadic cultures.)" },
  { name: "Programmer", category: "Contemporary", description: "Write and maintain computer software and systems. Combat repairs fall under Technician." },
  { name: "Psychologist", category: "Contemporary", description: "Study of mental states and processes; diagnose mental disorders, prescribe treatments. Combat Treatment falls under Counsel." },
  { name: "Scribe", category: "Contemporary", description: "Write letters, tomes, and books; prepare them for a library. Enables library research." },
  { name: "Shopkeeper", category: "Contemporary", description: "Run a retail store." },
  { name: "Teacher", category: "Contemporary", description: "Train others in basic skills." },
  { name: "Veterinarian", category: "Contemporary", description: "Diagnose and treat illnesses in animals; prescribe treatments and medicine." },
  { name: "Weapon Smith", category: "Contemporary", description: "Fabricate and maintain weapons. Combat repairs fall under Technician." },
  // Added from the suggested-profession parentheticals next to each Archetype name
  // (Enforcer, Entertainer, Psionisto, Ranger, Rogue, Scholar, Soldier, Spacer) that
  // weren't already covered by an existing Profession.
  { name: "Astrogator", category: "Contemporary", description: "Ability to plot interstellar courses and warp navigation calculations; piloting through warp itself falls under Navigation." },
  { name: "Captain", category: "Contemporary", description: "Ability to command a vessel and its crew, including watch-standing, provisioning, and voyage planning." },
  { name: "Criminologist", category: "Contemporary", description: "Study of criminal behavior and methods, used to profile suspects and analyze crime scenes." },
  { name: "Diplomat", category: "Contemporary", description: "Ability to negotiate and represent interests between Houses, governments, or species." },
  { name: "Government Agent", category: "Contemporary", description: "Investigate and enforce compliance with governmental law and policy on behalf of an official agency." },
  { name: "Imperial Investigator", category: "Contemporary", description: "Ability to investigate crimes and civil matters on behalf of Federation or House authority." },
  { name: "Navigator", category: "Contemporary", description: "Ability to plot courses and read instruments to guide travel by land, sea, air, or space; falls under the Navigation skill." },
  { name: "Paramilitary", category: "Contemporary", description: "Trained and equipped along military lines but operating outside a formal military chain of command." },
  { name: "Pilot", category: "Contemporary", description: "Ability to fly aircraft or spacecraft; combat piloting falls under the Piloting skill." },
  { name: "Police", category: "Contemporary", description: "Enforce local law, investigate crimes, and maintain public order within a jurisdiction." },
  { name: "Psionic", category: "Contemporary", description: "Trained in the disciplined use of psionic ability. This Profession alone grants no mechanical access to Psionoj; see the Psionisto Archetype." },
  { name: "Scientist", category: "Contemporary", description: "Formal education and research ability in one or more scientific disciplines." },
  { name: "Scout", category: "Contemporary", description: "Ability to reconnoiter unfamiliar terrain, track quarry, and report findings accurately." },
  { name: "Ship's Crew", category: "Contemporary", description: "General knowledge of shipboard duties and routines aboard a working vessel." },
  { name: "Singer", category: "Contemporary", description: "Ability to perform vocal music for an audience." },
  { name: "Spotter", category: "Contemporary", description: "Trained to watch instruments, sensors, and surroundings for hazards, traffic, and anomalies; falls under the Observation and Science skills." },
  { name: "Stand-Up Comic", category: "Contemporary", description: "Ability to perform comedic material live for an audience." },
  { name: "Thief", category: "Contemporary", description: "Ability to steal, pick locks, and case a target without detection." },
  // Added from the "Both" Archetypes (Trader, Smuggler, Beastmaster) that may be
  // selected in either the Contemporary or Archaic category.
  { name: "Merchant", category: "Both", description: "The trade of buying, selling, and moving goods for profit, whether by caravan, ship, or storefront." },
  { name: "Caravan Master", category: "Both", description: "Ability to organize, provision, and lead a caravan or convoy safely over long overland journeys." },
  { name: "Blockade Runner", category: "Both", description: "Ability to move people and cargo past patrols, checkpoints, or interdiction lines undetected." },
  { name: "Customs Officer", category: "Both", description: "Ability to inspect cargo and travelers, enforce tariffs and import law, and detect smuggling." },
  { name: "Animal Handler", category: "Both", description: "Ability to train, care for, and work alongside domesticated or bonded animals professionally." },
  { name: "Xenotamer", category: "Both", description: "Ability to study and attempt to bond with wild or alien fauna that resist conventional training." },
  { name: "Blacksmith", category: "Archaic", description: "Create and maintain all items necessary for a horse, including tack, bridles, and horseshoes." },
  { name: "Executioner", category: "Archaic", description: "Construct gallows, guillotines, and other execution devices; efficiently carry out executions." },
  { name: "Fisherman", category: "Archaic", description: "Fish at a commercial level, including techniques for large-scale catches." },
  { name: "Fletcher", category: "Archaic", description: "Craft and maintain bows and their ammunition, such as arrows and bolts." },
  { name: "Gravedigger", category: "Archaic", description: "Dig graves efficiently and maintain cemeteries." },
  { name: "Hunter", category: "Archaic", description: "Hunt, track, and prepare game for commercial purposes." },
  { name: "Sailing", category: "Archaic", description: "Operate, maintain, and pilot a variety of watercraft." },
];
