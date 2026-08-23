// Equipment catalog ported from Warp Space: Heroes & Combat 2e, Section 2.5.9 (Purchase
// Equipment). Costs are in Moneroj (Bc). Where the source lists a range or "Variable"/"Special"
// price instead of a fixed one, cost/lbs is left as a descriptive string and the item is not
// deducted from Wealth automatically - see the Equipment tab's handling of non-numeric cost.
//
// Field notes:
//   cell   - cost to buy one replacement power cell ("-" if the item doesn't use one)
//   ammo   - cost of one full reload ("-" if the item doesn't use ammunition)
//   range  - Rng column, kept in the book's compact notation (T = thrown, V = varies by ammo)
//   parry  - bonus/penalty to Parry Skill Score when parrying with this weapon ("-"/"None" if it can't Parry)
//   ap     - Armor Piercing: deducted from a target's DR before final damage
//   hands  - hands required (B = needs a fixed mount, e.g. bipod/pintle)
//   auto   - true if the weapon can fire fully automatic (marked with * in the book)

// ---------------------------------------------------------------------------
// Weapons (2.5.9.3 Melee Weapons, 2.5.9.4 Missile Weapons)
// ---------------------------------------------------------------------------
const WEAPONS_REPOSITORY = [
  // Unarmed
  { name: "Fist", group: "Unarmed", cost: "-", cell: "-", ammo: "-", lbs: 0, range: "0/1", damage: "1", toHit: "5", parry: "-", ap: "-", hands: "-", reload: "-", auto: false, description: "Unarmed strike." },
  { name: "Kick", group: "Unarmed", cost: "-", cell: "-", ammo: "-", lbs: 0, range: "0/1", damage: "1", toHit: "4", parry: "-", ap: "-", hands: "-", reload: "-", auto: false, description: "Unarmed strike." },
  { name: "Grapple", group: "Unarmed", cost: "-", cell: "-", ammo: "-", lbs: 0, range: "0/1", damage: "0", toHit: "5", parry: "-", ap: "-", hands: "-", reload: "-", auto: false, description: "Unarmed grapple attempt." },

  // Light Melee Weapons
  { name: "Dagger", group: "Light Melee", cost: 10, cell: "-", ammo: "-", lbs: 1, range: "T/0/1", damage: "3", toHit: "4", parry: "-", ap: "-", hands: "1", reload: "-", auto: false, description: "Can be thrown and easily hidden on a person. Gives Advantage on Disguise if hiding it or throwing it." },
  { name: "Hatchet", group: "Light Melee", cost: 10, cell: "-", ammo: "-", lbs: 1, range: "T/0/1", damage: "4", toHit: "3", parry: "-", ap: "-", hands: "1", reload: "-", auto: false, description: "Can be thrown. Gives Advantage if throwing it." },
  { name: "Knife", group: "Light Melee", cost: 10, cell: "-", ammo: "-", lbs: 1, range: "T/0/1", damage: "4", toHit: "3", parry: "-", ap: "-", hands: "1", reload: "-", auto: false, description: "Can be hidden on a person. Gives Advantage on Disguise if hiding it." },
  { name: "Main Gauche", group: "Light Melee", cost: 10, cell: "-", ammo: "-", lbs: 1, range: "0/1", damage: "3", toHit: "3", parry: "2", ap: "-", hands: "1", reload: "-", auto: false, description: "Fencing weapon often used for parrying." },
  { name: "Molecular Blade", group: "Light Melee", cost: 100, cell: "-", ammo: "-", lbs: 1, range: "0/1", damage: "5", toHit: "4", parry: "-", ap: "2", hands: "1", reload: "-", auto: false, description: "Equipped with a molecular edge honed to atomic precision. Can slice through virtually any material with minimal effort." },
  { name: "Pulse Knife", group: "Light Melee", cost: 500, cell: 8, ammo: "-", lbs: 1, range: "T/0/1", damage: "5", toHit: "4", parry: "-", ap: "2", hands: "1", reload: "1", auto: false, description: "A fencing weapon with armor-piercing capabilities. Ideal for precision strikes." },
  { name: "Shock Gloves", group: "Light Melee", cost: 300, cell: 8, ammo: "-", lbs: 1, range: "0/1", damage: "5", toHit: "2", parry: "-", ap: "-", hands: "1", reload: "1", auto: false, description: "Delivers a high-voltage shock in addition to physical impact, neutralizing threats with both blunt force and electrical incapacitation." },
  { name: "Stunner", group: "Light Melee", cost: 300, cell: 8, ammo: "-", lbs: 2, range: "0/1", damage: "5", toHit: "2", parry: "-", ap: "-", hands: "1", reload: "1", auto: false, description: "Designed to incapacitate instead of kill. Target is stunned a number of turns equal to the damage that penetrates DR. Single shot." },
  { name: "Tactical Baton", group: "Light Melee", cost: 300, cell: 8, ammo: "-", lbs: 2, range: "0/1", damage: "5", toHit: "2", parry: "-", ap: "-", hands: "1", reload: "1", auto: false, description: "Collapsible tool with an integrated stunner delivering a paralyzing electric shock. Target is stunned a number of turns equal to the damage that penetrates DR." },

  // Medium Melee Weapons (Reach 1)
  { name: "Battle Axe", group: "Medium Melee", cost: 100, cell: "-", ammo: "-", lbs: 4, range: "T/1", damage: "7", toHit: "1", parry: "-", ap: "-", hands: "1", reload: "-", auto: false, description: "Heavy axe designed for cleaving through armor and shields. Requires strength to wield effectively." },
  { name: "Club", group: "Medium Melee", cost: 1, cell: "-", ammo: "-", lbs: 3, range: "1", damage: "4", toHit: "3", parry: "-", ap: "-", hands: "1", reload: "-", auto: false, description: "A simple bludgeoning weapon often improvised from heavy, sturdy objects." },
  { name: "Force Sword", group: "Medium Melee", cost: 25000, cell: 50, ammo: "-", lbs: 2, range: "1", damage: "10", toHit: "2", parry: "-", ap: "5", hands: "1", reload: "2", auto: false, description: "High-tech fencing weapon utilizing an advanced force field emitter. Capable of inflicting massive damage and piercing heavy armor with ease." },
  { name: "Kettenmorgenstern", group: "Medium Melee", cost: 100, cell: "-", ammo: "-", lbs: 3, range: "1", damage: "8", toHit: "-1", parry: "None", ap: "2", hands: "1", reload: "-", auto: false, description: "A chained Morningstar designed to bypass shields. Difficult to control; cannot be used to Parry effectively." },
  { name: "Mace", group: "Medium Melee", cost: 10, cell: "-", ammo: "-", lbs: 4, range: "1", damage: "6", toHit: "1", parry: "-", ap: "2", hands: "1", reload: "-", auto: false, description: "Blunt weapon designed to crush armor and bones. Features enhanced armor-piercing capabilities." },
  { name: "Molecular Sword", group: "Medium Melee", cost: 200, cell: "-", ammo: "-", lbs: 3, range: "1", damage: "6", toHit: "2", parry: "-", ap: "4", hands: "1", reload: "-", auto: false, description: "A fencing weapon with a molecular edge capable of slicing through nearly any material. Designed for precision and maximum cutting efficiency without requiring power cells." },
  { name: "Short Spear", group: "Medium Melee", cost: 10, cell: "-", ammo: "-", lbs: 5, range: "T/1", damage: "5", toHit: "2", parry: "-", ap: "1", hands: "1", reload: "-", auto: false, description: "A versatile weapon that can be used for thrusting or throwing at opponents from a distance. Light armor-piercing capabilities." },
  { name: "Pulse Sword", group: "Medium Melee", cost: 1000, cell: 8, ammo: "-", lbs: 3, range: "1", damage: "6", toHit: "2", parry: "-", ap: "4", hands: "1", reload: "2", auto: false, description: "Fencing weapon that utilizes focused energy fields for superior armor penetration. Requires a power source." },
  { name: "Rapier", group: "Medium Melee", cost: 100, cell: "-", ammo: "-", lbs: 3, range: "1", damage: "5", toHit: "3", parry: "1", ap: "-", hands: "1", reload: "-", auto: false, description: "A fencing weapon with a long, narrow blade designed for thrusting attacks." },
  { name: "Sword", group: "Medium Melee", cost: 300, cell: "-", ammo: "-", lbs: 4, range: "1", damage: "6", toHit: "2", parry: "-", ap: "-", hands: "1", reload: "-", auto: false, description: "A balanced melee weapon suitable for cutting and thrusting. Versatile and reliable in various combat situations." },

  // Heavy Melee Weapons (Reach 1-2)
  { name: "Blast Pike, R-49", group: "Heavy Melee", cost: 3000, cell: 50, ammo: "-", lbs: 16, range: "2", damage: "30", toHit: "-", parry: "-", ap: "-", hands: "2", reload: "2", auto: false, description: "A high-powered tactical weapon combining the reach and lethality of a traditional pike with advanced energy projectile technology. Favored by elite security forces and municipal crowd control." },
  { name: "Doppelhänder", group: "Heavy Melee", cost: 500, cell: "-", ammo: "-", lbs: 9, range: "1", damage: "8", toHit: "2", parry: "-", ap: "-", hands: "2", reload: "-", auto: false, description: "Long-bladed, two-handed sword designed for strong, sweeping strikes. Offers good reach and cutting power." },
  { name: "Doppelkettenmorgenstern", group: "Heavy Melee", cost: 150, cell: "-", ammo: "-", lbs: 12, range: "1", damage: "10", toHit: "-1", parry: "None", ap: "2", hands: "2", reload: "-", auto: false, description: "A two-handed chain-linked weapon designed to bypass shields and armor. Cannot be used for parrying." },
  { name: "Great Battle Axe", group: "Heavy Melee", cost: 300, cell: "-", ammo: "-", lbs: 9, range: "1", damage: "9", toHit: "1", parry: "-", ap: "-", hands: "2", reload: "-", auto: false, description: "Large, double-bladed axe ideal for powerful, sweeping attacks. Heavy and requires great strength to wield." },
  { name: "Halberd", group: "Heavy Melee", cost: 300, cell: "-", ammo: "-", lbs: 10, range: "2", damage: "9", toHit: "1", parry: "-", ap: "-", hands: "2", reload: "-", auto: false, description: "Polearm combining a spear point, axe blade, and hook. Excellent for versatile combat, allowing thrusting and cutting." },
  { name: "Lance", group: "Heavy Melee", cost: 50, cell: "-", ammo: "-", lbs: 8, range: "2", damage: "9", toHit: "1", parry: "-", ap: "-", hands: "2", reload: "-", auto: false, description: "Designed for mounted combat. One-handed on horseback or two-handed on foot for powerful charging attacks. Warhorse with combat saddle and stirrup gives a +8 Might Damage bonus." },
  { name: "Large Hammer", group: "Heavy Melee", cost: 20, cell: "-", ammo: "-", lbs: 8, range: "1", damage: "8", toHit: "1", parry: "-", ap: "1", hands: "2", reload: "-", auto: false, description: "Heavy two-handed hammer designed for crushing through armor. Can deliver devastating blows." },
  { name: "Long Spear", group: "Heavy Melee", cost: 25, cell: "-", ammo: "-", lbs: 7, range: "T/2", damage: "8", toHit: "2", parry: "-", ap: "1", hands: "2", reload: "-", auto: false, description: "Versatile 11+ foot spear designed for thrusting, with good reach and light armor-piercing capabilities." },
  { name: "Pike", group: "Heavy Melee", cost: 50, cell: "-", ammo: "-", lbs: 14, range: "2", damage: "9", toHit: "1", parry: "-", ap: "-", hands: "2", reload: "-", auto: false, description: "Long polearm ideal for keeping opponents at bay. Requires two hands to use effectively." },
  { name: "Staff, Bo", group: "Heavy Melee", cost: 10, cell: "-", ammo: "-", lbs: 4, range: "1", damage: "6", toHit: "2", parry: "2", ap: "-", hands: "2", reload: "-", auto: false, description: "Simple, sturdy wooden quarterstaff used for striking and blocking. Effective in Martial Arts and defensive combat." },
  { name: "Staff, Photon", group: "Heavy Melee", cost: 3000, cell: 50, ammo: "-", lbs: 16, range: "2/10", damage: "30", toHit: "-", parry: "2", ap: "-", hands: "2", reload: "2", auto: false, description: "An ancient artifact merging tradition with advanced technology, perfectly balanced for Martial Arts. Emits powerful energy blasts comparable to an R-49 Blast Pike but at short range instead of melee contact." },

  // Light Missile Weapons
  { name: "Bow", group: "Light Missile", cost: 50, cell: "-", ammo: 6, lbs: 5, range: "30", damage: "6", toHit: "2", parry: "-", ap: "1", hands: "2", reload: "1", auto: false, description: "Can be used from horseback." },
  { name: "Pistol, Blaster", group: "Light Missile", cost: 5000, cell: 20, ammo: "-", lbs: 3, range: "80", damage: "15", toHit: "-", parry: "-", ap: "2", hands: "1", reload: "1", auto: false, description: "Imperial elite energy sidearm, single shot." },
  { name: "Pistol, Concealed", group: "Light Missile", cost: 300, cell: "-", ammo: 10, lbs: 1, range: "40", damage: "8", toHit: "-", parry: "-", ap: "1", hands: "1", reload: "1", auto: false, description: "Standard civilian-grade, ballistic, personal defense weapon, single shot. Ten shots." },
  { name: "Pistol, Higgins Mk1 Laser", group: "Light Missile", cost: 2500, cell: 20, ammo: "-", lbs: 1, range: "150", damage: "10", toHit: "1", parry: "-", ap: "3", hands: "1", reload: "2", auto: false, description: "A compact holdout weapon designed for stealth and quick deployment - lightweight and reliable, the preferred backup for operatives who need precise laser shots in covert operations." },
  { name: "Pistol, Large Frame", group: "Light Missile", cost: 200, cell: "-", ammo: 10, lbs: 2, range: "50", damage: "10", toHit: "1", parry: "-", ap: "2", hands: "1", reload: "1", auto: false, description: "Standard military-grade, ballistic sidearm, single shot. 15 shots." },
  { name: "Pistol, Laser", group: "Light Missile", cost: 2000, cell: 20, ammo: "-", lbs: 3, range: "150", damage: "10", toHit: "2", parry: "-", ap: "3", hands: "1", reload: "1", auto: false, description: "Imperial military-grade, energy sidearm, single shot." },
  { name: "Pistol, Valther P-38L Laser", group: "Light Missile", cost: 1500, cell: 20, ammo: "-", lbs: 3, range: "150", damage: "10", toHit: "1", parry: "-", ap: "3", hands: "1", reload: "1", auto: false, description: "An upgraded version of the classic Valther P-38 integrating high-efficiency laser technology while preserving its original ergonomic design. Favored by security forces and collectors." },
  { name: "Pistol, P-48 Side Action Blaster", group: "Light Missile", cost: 7500, cell: 20, ammo: "-", lbs: 3, range: "80", damage: "15", toHit: "-", parry: "-", ap: "2", hands: "1", reload: "-", auto: false, description: "A close-quarters variant of the M-48, combining powerful energy output with a compact frame and a high-efficiency side-loading mechanism for quick reloads. Ideal for security personnel and personal defense." },
  { name: "Pistol, Stun", group: "Light Missile", cost: 500, cell: 8, ammo: "-", lbs: 1, range: "30", damage: "4", toHit: "1", parry: "-", ap: "-", hands: "1", reload: "1", auto: false, description: "Civilian-grade, energy sidearm. Target is stunned a number of turns equal to the damage that penetrates DR. Single shot." },
  { name: "Sling", group: "Light Missile", cost: 1, cell: "-", ammo: "-", lbs: 1, range: "30", damage: "7", toHit: "1", parry: "-", ap: "1", hands: "1", reload: "1", auto: false, description: "Deadly weapon of warfare used to throw blunt projectiles like stones, clay, or lead \"sling-bullets.\"" },
  { name: "Submachinegun", group: "Light Missile", cost: 500, cell: "-", ammo: 15, lbs: 5, range: "80", damage: "10", toHit: "-", parry: "-", ap: "3", hands: "1", reload: "1", auto: true, description: "Standard military-grade, ballistic, close assault weapon, single shot and automatic. 30 shots." },

  // Medium Missile Weapons
  { name: "Carbine, Accelerator", group: "Medium Missile", cost: 1500, cell: 50, ammo: 30, lbs: 8, range: "300", damage: "15", toHit: "2", parry: "-", ap: "7", hands: "2", reload: "1", auto: true, description: "Imperial military-grade squad weapon, single shot and automatic. 50 shots." },
  { name: "Carbine, Blaster", group: "Medium Missile", cost: 10000, cell: 100, ammo: "-", lbs: 7, range: "150", damage: "15", toHit: "1", parry: "-", ap: "3", hands: "2", reload: "1", auto: true, description: "Imperial elite squad weapon, single shot and automatic." },
  { name: "Carbine, M-48C Side Action Blaster", group: "Medium Missile", cost: 12000, cell: 100, ammo: "-", lbs: 7, range: "150", damage: "15", toHit: "1", parry: "-", ap: "3", hands: "2", reload: "-", auto: true, description: "Carbine variant of the M-48, designed for short-range assaults and easy maneuvering in tight spaces. Perfect for special forces and shipboard security." },
  { name: "Carbine, Laser", group: "Medium Missile", cost: 2500, cell: 100, ammo: "-", lbs: 6, range: "200", damage: "10", toHit: "3", parry: "-", ap: "3", hands: "2", reload: "1", auto: true, description: "Imperial military-grade squad weapon, single shot and automatic." },
  { name: "Carbine, Standard", group: "Medium Missile", cost: 500, cell: "-", ammo: 15, lbs: 6, range: "100", damage: "12", toHit: "1", parry: "-", ap: "4", hands: "2", reload: "1", auto: true, description: "Standard military-grade squad weapon, single shot and automatic. 30 shots." },
  { name: "Carbine, Stun", group: "Medium Missile", cost: 750, cell: 10, ammo: "-", lbs: 3, range: "50", damage: "6", toHit: "2", parry: "-", ap: "-", hands: "2", reload: "1", auto: false, description: "Target is stunned a number of turns equal to the damage that penetrates DR. Single shot." },
  { name: "Pistol, Heavy", group: "Medium Missile", cost: 300, cell: "-", ammo: 10, lbs: 3, range: "50", damage: "12", toHit: "1", parry: "-", ap: "3", hands: "1", reload: "1", auto: false, description: "Standard civilian-grade hunting sidearm, single shot. Ten shots." },
  { name: "Pistol, Desert Phoenix 5.2mm MagLin", group: "Medium Missile", cost: 5000, cell: 50, ammo: 30, lbs: 6, range: "225", damage: "10", toHit: "1", parry: "-", ap: "7", hands: "1", reload: "1", auto: false, description: "Utilizes magnetic linear acceleration to deliver pinpoint accuracy and devastating impact with a recoilless design. Favored by sharpshooters and tactical units for harsh desert combat." },
  { name: "Rifle, Accelerator", group: "Medium Missile", cost: 2000, cell: 50, ammo: 30, lbs: 15, range: "375", damage: "20", toHit: "3", parry: "-", ap: "8", hands: "2", reload: "1", auto: true, description: "Imperial military-grade sniper weapon, single shot and automatic. 50 shots." },
  { name: "Rifle, Battle", group: "Medium Missile", cost: 750, cell: "-", ammo: 30, lbs: 10, range: "500", damage: "15", toHit: "2", parry: "-", ap: "5", hands: "2B", reload: "1", auto: true, description: "Standard military-grade sniper weapon, single shot and automatic. 30 shots." },
  { name: "Rifle, Laser", group: "Medium Missile", cost: 5000, cell: 100, ammo: "-", lbs: 10, range: "250", damage: "15", toHit: "4", parry: "-", ap: "5", hands: "2", reload: "1", auto: true, description: "Imperial military-grade sniper weapon, single shot and automatic. Collapsible shoulder stock." },
  { name: "Rifle, Standard", group: "Medium Missile", cost: 500, cell: "-", ammo: 30, lbs: 8, range: "150", damage: "12", toHit: "2", parry: "-", ap: "5", hands: "2", reload: "1", auto: true, description: "Standard military-grade sniper weapon, single shot and automatic. 30 shots." },
  { name: "Shotgun, Slugs", group: "Medium Missile", cost: 100, cell: "-", ammo: 10, lbs: 3, range: "50", damage: "10", toHit: "-", parry: "-", ap: "4", hands: "2", reload: "1", auto: false, description: "Loaded with solid slugs for armor-piercing punch at the cost of spread." },
  { name: "Shotgun, Standard", group: "Medium Missile", cost: 100, cell: "-", ammo: 10, lbs: 3, range: "20", damage: "10", toHit: "4", parry: "-", ap: "-", hands: "2", reload: "1", auto: false, description: "Loaded with shot for a wide spread at close range." },

  // Heavy Missile Weapons
  { name: "Arbalest", group: "Heavy Missile", cost: 300, cell: "-", ammo: 10, lbs: 24, range: "60", damage: "13", toHit: "3", parry: "-", ap: "4", hands: "2B", reload: "5/20", auto: false, description: "Takes five Actions to Reload with a Goat's Foot. Without it, it takes 20 Actions to Reload." },
  { name: "Crossbow", group: "Heavy Missile", cost: 100, cell: "-", ammo: 5, lbs: 8, range: "20", damage: "9", toHit: "3", parry: "-", ap: "3", hands: "2", reload: "1", auto: false, description: "Takes an Action to Reload." },
  { name: "Launcher, Grenade", group: "Heavy Missile", cost: 300, cell: "-", ammo: "V", lbs: 2, range: "100", damage: "V", toHit: "-", parry: "-", ap: "V", hands: "2", reload: "2", auto: false, description: "Can be fired separately or mounted to the bottom of military-grade rifles, single shot. Three shots." },
  { name: "Launcher, Heavy", group: "Heavy Missile", cost: 2000, cell: "-", ammo: "V", lbs: 30, range: "200", damage: "V", toHit: "5", parry: "-", ap: "V", hands: "2B", reload: "3", auto: false, description: "Standard military-grade company rocket launcher, single shot. Takes one Action to get a weapon lock." },
  { name: "Launcher, Rocket", group: "Heavy Missile", cost: 800, cell: "-", ammo: "V", lbs: 15, range: "300", damage: "V", toHit: "5", parry: "-", ap: "V", hands: "2B", reload: "2", auto: false, description: "Standard military-grade platoon rocket launcher, single shot. Takes one Action to get a weapon lock." },
  { name: "Rifle, Blaster", group: "Heavy Missile", cost: 20000, cell: 100, ammo: "-", lbs: 12, range: "200", damage: "30", toHit: "2", parry: "-", ap: "4", hands: "2", reload: "1", auto: true, description: "Imperial elite anti-material weapon, single shot and automatic." },
  { name: "Rifle, Heavy", group: "Heavy Missile", cost: 1000, cell: "-", ammo: 30, lbs: 15, range: "150", damage: "30", toHit: "1", parry: "-", ap: "10", hands: "2B", reload: "1", auto: false, description: "Standard military-grade anti-material weapon, single shot. Ten shots." },
  { name: "Rifle, Heavy Accelerator", group: "Heavy Missile", cost: 3000, cell: 100, ammo: 30, lbs: 30, range: "375", damage: "40", toHit: "2", parry: "-", ap: "15", hands: "2B", reload: "2", auto: false, description: "Imperial military-grade anti-material weapon, single shot. 20 shots." },
  { name: "Rifle, Heavy Blaster", group: "Heavy Missile", cost: 40000, cell: 200, ammo: "-", lbs: 20, range: "200", damage: "60", toHit: "1", parry: "-", ap: "10", hands: "2B", reload: "2", auto: true, description: "Imperial elite military-grade anti-material weapon, single shot and automatic, typically fired from a bi-pod or tripod." },
  { name: "Rifle, Heavy Laser", group: "Heavy Missile", cost: 10000, cell: 200, ammo: "-", lbs: 20, range: "250", damage: "30", toHit: "3", parry: "-", ap: "10", hands: "2B", reload: "2", auto: true, description: "Imperial military-grade anti-material weapon, single shot and automatic, typically fired from a bi-pod, tripod, or anti-gravity mount." },
  { name: "Rifle, M-48 Side Action Blaster", group: "Heavy Missile", cost: 25000, cell: 100, ammo: "-", lbs: 12, range: "200", damage: "30", toHit: "2", parry: "-", ap: "4", hands: "2", reload: "-", auto: true, description: "Built for sustained firefights; high-intensity energy pulses capable of breaching advanced armor. Robust side-loading mechanism enables rapid cartridge exchanges." },

  // Grenades/Rockets - damage shown Ground Zero only; see book for ring falloff. Range is Blast Ring diameter.
  { name: "Fragmentation Grenade", group: "Grenades/Rockets", cost: 150, cell: "-", ammo: "-", lbs: 1, range: "3", damage: "20", toHit: "-", parry: "-", ap: "-", hands: "-", reload: "-", auto: false, description: "A standard combat grenade designed to disperse deadly shrapnel upon detonation. Ideal for disrupting infantry formations and clearing tight spaces." },
  { name: "Flash/Bang Grenade", group: "Grenades/Rockets", cost: 150, cell: "-", ammo: "-", lbs: 1, range: "5", damage: "10", toHit: "-", parry: "-", ap: "-", hands: "-", reload: "-", auto: false, description: "An old-school stun grenade that emits a blinding flash and deafening bang, disorienting anyone within its range. One Blast Ring Only. Limited effectiveness against armored targets." },
  { name: "Smoke Grenade", group: "Grenades/Rockets", cost: 50, cell: "-", ammo: "-", lbs: 1, range: "5", damage: "-", toHit: "-", parry: "-", ap: "-", hands: "-", reload: "-", auto: false, description: "Creates a thick cloud of smoke, giving Disadvantage to Observation checks within the affected area. Shooting a laser through smoke gives two levels of Disadvantage." },
  { name: "Stun Grenade", group: "Grenades/Rockets", cost: 150, cell: "-", ammo: "-", lbs: 1, range: "3", damage: "5", toHit: "-", parry: "-", ap: "-", hands: "-", reload: "-", auto: false, description: "Delivers a blast that stuns the nervous system without lethal force. Target(s) is stunned a number of turns equal to the damage that penetrates DR." },
  { name: "HE Rocket", group: "Grenades/Rockets", cost: 100, cell: "-", ammo: "-", lbs: 5, range: "1", damage: "30", toHit: "-", parry: "-", ap: "-", hands: "-", reload: "-", auto: false, description: "A powerful anti-personnel and anti-material weapon detonating with a high-yield explosion." },
  { name: "Heavy HE Rocket", group: "Grenades/Rockets", cost: 200, cell: "-", ammo: "-", lbs: 5, range: "2", damage: "40", toHit: "-", parry: "-", ap: "-", hands: "-", reload: "-", auto: false, description: "A larger version of the standard HE Rocket, delivering an even more destructive blast with an increased radius." },
  { name: "HEAT Rocket", group: "Grenades/Rockets", cost: 150, cell: "-", ammo: "-", lbs: 5, range: "1", damage: "20", toHit: "-", parry: "-", ap: "10", hands: "-", reload: "-", auto: false, description: "Designed to pierce through thick armor plating using a focused explosion." },
  { name: "Heavy HEAT Rocket", group: "Grenades/Rockets", cost: 300, cell: "-", ammo: "-", lbs: 5, range: "1", damage: "40", toHit: "-", parry: "-", ap: "15", hands: "-", reload: "-", auto: false, description: "An upgraded HEAT Rocket with a larger warhead, capable of breaching the heaviest armor." },
];

// ---------------------------------------------------------------------------
// Armor (2.5.9.5) - dr is Damage Reduction. Accessories don't provide DR on
// their own (dr: "-") but stack with worn armor.
// ---------------------------------------------------------------------------
const ARMOR_REPOSITORY = [
  { name: "Cloth/Padding", group: "Light", dr: 1, cost: 5, lbs: 1, description: "Basic padded armor provides minimal protection and is often used under armor or for civilian protection in low-risk environments." },
  { name: "Leather Armor", group: "Light", dr: 2, cost: 7, lbs: 15, description: "Standard leather armor offering decent protection for its weight, popular among scouts and light infantry." },
  { name: "Synth", group: "Light", dr: 2, cost: 50, lbs: 2, description: "A synthetic leather jacket or bodysuit that is lightweight and stylish, offering basic protection without sacrificing mobility." },
  { name: "Weave", group: "Light", dr: 4, cost: 150, lbs: 4, description: "Woven metal or polymer bodysuit that balances weight and protection effectively, ideal for covert operatives needing discreet protection. Popular among Rangers." },
  { name: "Duratex", group: "Light", dr: 7, cost: 500, lbs: 4, description: "Ballistic cloth jacket offers excellent protection and is only detectable upon close examination, making it a top choice for undercover agents." },
  { name: "Environment Suit", group: "Light", dr: 7, cost: 1500, lbs: 5, description: "Standard emergency suit that provides basic protection from short-term space exposure to temperature and radiation hazards. Good for 96 hours." },

  { name: "Chainmail Armor", group: "Medium", dr: 3, cost: 4, lbs: 30, description: "Heavy chainmail provides solid defense without restricting movement as much as plate armor, favored by guards and frontline soldiers." },
  { name: "Scale Mail", group: "Medium", dr: 4, cost: 5, lbs: 45, description: "Layered metal armor offers increased protection compared to chainmail but at a higher weight, suitable for warriors needing more defense." },
  { name: "Ballistic Vest", group: "Medium", dr: 10, cost: 250, lbs: 4, description: "A bulky but reliable jacket that offers high-level protection at a reasonable cost and is commonly used by security personnel." },
  { name: "EVA Suit", group: "Medium", dr: 10, cost: 13000, lbs: 8, description: "A standard space suit equipped with a computer, used for extended operations in space, providing both protection and essential life support. Good for 96 hours." },
  { name: "Combat Armor", group: "Medium", dr: 14, cost: 25000, lbs: 8, description: "Military-grade EVA suit with reinforced articulated plating, offering enhanced defense for ground troops and frontline operatives. Good for 96 hours." },

  { name: "Plate Armor", group: "Heavy", dr: 5, cost: 20, lbs: 60, description: "Full metal armor that maximizes defense at the cost of agility and speed, worn by elite knights and heavy infantry." },
  { name: "Epic Plate", group: "Heavy", dr: 6, cost: 30, lbs: 75, description: "Superior plate armor with reinforced plating, providing exceptional protection, often reserved for the most formidable warriors." },
  { name: "Battle Suit", group: "Heavy", dr: 20, cost: 600000, lbs: 12, description: "Heavily armored space suit with integrated computer systems, designed for combat in hazardous environments and providing exceptional protection. Good for 48 hours." },
  { name: "Drop Suit", group: "Heavy", dr: 30, cost: 3500000, lbs: 25, description: "This elite, powered armor suit enhances melee and unarmed damage when powered on, ideal for specialized military units conducting orbital drops. Good for 48 hours and one orbital drop." },

  { name: "Anti-Garrote Strap", group: "Accessories", dr: 5, cost: 5, lbs: 0.5, description: "A protective neck strap providing +5 DR against strangling and garroting attacks. Can be worn with armor without penalties." },
  { name: "Auto-Doc", group: "Accessories", dr: "-", cost: 10000, lbs: 10, description: "A health scanner and drug injector system that can automatically administer first aid. AI Medicine Skill Score = TL. Good for five uses. (TL4-TL7)" },
  { name: "Extended Life Support", group: "Accessories", dr: "-", cost: 10000, lbs: 5, description: "Doubles the base life support time on any suit with an existing system." },
  { name: "Gravitics", group: "Accessories", dr: "-", cost: 120000, lbs: 10, description: "An anti-gravity system that enables speeds up to 200 mph in significant gravity wells, providing unmatched mobility on planetary surfaces. (3 lbs. Powered)" },
  { name: "Mag-Boots", group: "Accessories", dr: "-", cost: 100, lbs: 2, description: "Magnetized boots that enable walking on metal surfaces in zero-G environments, a staple for shipboard and space station operations." },
  { name: "Sensor Glasses", group: "Accessories", dr: "-", cost: 300, lbs: 0.25, description: "High-tech glasses that integrate with a HUD and offer various optical enhancements such as Infrared, Low-light, and Telescopic vision." },
  { name: "Stealth Field", group: "Accessories", dr: "-", cost: 50000, lbs: 5, description: "A high-tech system that masks EM and sonic signatures, providing stealth capabilities against most conventional detection methods." },
  { name: "Thruster Pack", group: "Accessories", dr: "-", cost: 500, lbs: 5, description: "Reactionless thrust system enabling 0.1G acceleration for up to 48 hours, suitable for maneuvering in zero-G environments. (0 lbs. Powered)" },
];

// ---------------------------------------------------------------------------
// Shields (2.5.9.6) - power-cell shields deplete on a Defense roll of 1 that
// wasn't a Fumble; takes one Action to replace the cell.
// ---------------------------------------------------------------------------
const SHIELDS_REPOSITORY = [
  { name: "Small Shield", group: "Archaic", dr: 6, cost: 25, cell: "-", lbs: 1, parry: 2, description: "A small, lightweight shield - also known as a buckler. Provides moderate protection while maintaining agility, ideal for fencers and agile fighters." },
  { name: "Shield", group: "Archaic", dr: 10, cost: 50, cell: "-", lbs: 5, parry: 3, description: "A standard infantry shield offering a solid defense. A reliable choice for balanced protection from melee and Ranged Attacks." },
  { name: "Wall Shield", group: "Archaic", dr: 20, cost: 100, cell: "-", lbs: 20, parry: 4, description: "A large, heavy shield providing significant protection at the cost of mobility and stealth. Best suited for defensive positions where movement is minimal." },
  { name: "Force Buckler", group: "Contemporary", dr: 12, cost: 1000, cell: 30, lbs: 2, parry: 3, description: "A small energy shield that offers good front-facing protection, effective against both melee and Ranged Attacks, but limited in coverage." },
  { name: "Force Shield", group: "Contemporary", dr: 10, cost: 8000, cell: 100, lbs: 5, parry: 4, description: "An advanced energy shield providing full-body protection, useful for those needing comprehensive Defense in both melee and ranged combat." },
  { name: "Force Wall", group: "Contemporary", dr: 30, cost: 2000, cell: 100, lbs: 10, parry: 5, description: "A massive energy barrier shield providing unparalleled front-facing protection but severely hampers movement and stealth. Can defend two people." },
];

// ---------------------------------------------------------------------------
// General Gear (2.5.9.7 - 2.5.9.19) - everything that isn't a weapon, armor,
// or shield. category groups them for the Equipment tab's Gear sub-tab.
// ---------------------------------------------------------------------------
const GEAR_REPOSITORY = [
  // Combat Accessories
  { name: "Bandoleer", category: "Combat Accessories", cost: 50, lbs: 1, description: "A convenient accessory for quick access to multiple thrown weapons, keeping them organized and within easy reach during combat." },
  { name: "Crossbow Mount", category: "Combat Accessories", cost: 30, lbs: 3, description: "Provides a stable aiming platform for crossbow users, greatly improving accuracy by reducing strain during targeting. Gives Advantage." },
  { name: "Gear Belt", category: "Combat Accessories", cost: 1, lbs: 0.5, description: "A sturdy, multi-purpose belt designed to carry multiple weapons, allowing for versatile armament arrangements and easy access." },
  { name: "Hobnail Attachment", category: "Combat Accessories", cost: 2, lbs: 1, description: "Footwear attachments that significantly improve traction on icy surfaces. Negates any Disadvantages for moving or fighting on ice." },
  { name: "Lanyard", category: "Combat Accessories", cost: 2, lbs: 0.5, description: "A durable leather or chain strap that secures weapons, preventing accidental loss during chaotic encounters." },
  { name: "Quiver", category: "Combat Accessories", cost: 2, lbs: 2, description: "Various designs hold from 5 to 50 arrows or bolts. Comes in small, hip, and back-mounted versions." },
  { name: "Whetstone", category: "Combat Accessories", cost: 1, lbs: 0.5, description: "A simple yet essential tool for maintaining the sharpness of blades, ensuring they remain effective in battle." },
  { name: "HUD", category: "Combat Accessories", cost: 500, lbs: 1, description: "A high-tech targeting system that enhances ranged Attack precision when installed in advanced suits or sensor-equipped headgear. Gives Advantage to Ranged Attacks." },
  { name: "HEAP Ammo", category: "Combat Accessories", cost: "4x Standard Ammo", lbs: "-", description: "Specialized munitions that maximize penetration against armored targets, increasing effectiveness by enhancing armor piercing. Compatible with most projectile weapons." },
  { name: "Homing Ammo", category: "Combat Accessories", cost: "10x Standard Ammo", lbs: "-", description: "Cutting-edge self-guiding ammunition with onboard sensors and propulsion systems that independently track and hit targets. Highly effective but restricted by legal regulations." },

  // Adventure Gear and Wearings
  { name: "Artisan's Ward", category: "Adventure Gear", cost: 5, lbs: 4, description: "A treated apron, facemask, and gloves designed to prevent harm from hazardous substances when rinsing off slime, collecting bio-acid, etc." },
  { name: "Backpack, Framed", category: "Adventure Gear", cost: 11, lbs: 2, description: "A sturdy backpack frame capable of holding up to 100 lbs. of gear, distributing weight evenly for extended carrying." },
  { name: "Backpack, Compact", category: "Adventure Gear", cost: 2, lbs: 1, description: "Designed to carry up to 40 lbs. of equipment, ideal for short trips or those who travel light. Double the cost for a quick-release model; dropping it is a Free Action." },
  { name: "Canteen", category: "Adventure Gear", cost: 2, lbs: 0.5, description: "A robust liquid container with a strap capable of holding 1 quart of liquid. Designed to withstand rough use in combat or the wilderness." },
  { name: "Chain Hoist", category: "Adventure Gear", cost: 5, lbs: 4, description: "A system of pulleys, blocks, and a rope, cable, or chain that can multiply force to lift heavy loads. Lifts 25 times load at one foot per Action. Multiply cost and weight by 10 if electro-mechanically powered." },
  { name: "Collapsible Pole", category: "Adventure Gear", cost: 1, lbs: 1, description: "A versatile pole that extends from one foot to 15 feet. Used for lifting, pitching tents, or probing suspicious areas. Cost/weight scale with length (1-3 lbs.)." },
  { name: "Compass", category: "Adventure Gear", cost: 10, lbs: 1, description: "Simple magnetic navigation aid." },
  { name: "Environmental Mask", category: "Adventure Gear", cost: 150, lbs: "-", description: "Combines a filter and respirator to protect against harmful atmospheric contaminants." },
  { name: "Filter", category: "Adventure Gear", cost: 100, lbs: "-", description: "A breathing mask that filters out dangerous particles from the air. The Imperial standard model can be fitted in the nose or used as a lung implant." },
  { name: "Fishing Gear", category: "Adventure Gear", cost: 1, lbs: 0.5, description: "Essential gear for fishing, including small hooks and a lightweight line, providing a basic Survival skill toolset." },
  { name: "Gill Mask", category: "Adventure Gear", cost: 4000, lbs: 8, description: "A specialized mask that extracts breathable atmosphere from water, functional only on worlds with a breathable atmosphere." },
  { name: "Ladder, 10'", category: "Adventure Gear", cost: 15, lbs: 15, description: "A standard wooden ladder for scaling walls or crossing small gaps." },
  { name: "Line, 10 yards", category: "Adventure Gear", cost: 1, lbs: 0.5, description: "Different types made from silk, nylon, carbon fibers, or even horsehair. Supports up to 500 lbs. (large ones twice that) per 10 yards. Cost 1-25, weight 1/2-3 lbs. depending on material." },
  { name: "Mapping Toolkit", category: "Adventure Gear", cost: 20, lbs: 1, description: "Includes specialized tools and rulers, providing Advantage to Liberal Arts rolls when making maps." },
  { name: "Meals Ready to Eat", category: "Adventure Gear", cost: 1, lbs: 0.75, description: "A man-day of nutritious, if sometimes unpalatable, food. Has a chemical heater for cooking and other camping sundries. Lasts 25 years." },
  { name: "Micro-Fusion Reactor", category: "Adventure Gear", cost: 10000, lbs: 20, description: "A small fusion reactor designed to provide power for man-portable equipment for up to 30 days with a single refilling of ACME Handy Fusion Reactor Fuel." },
  { name: "Modular Generator", category: "Adventure Gear", cost: 100000, lbs: 800, description: "A moveable fusion reactor designed to provide power for equipment, weapons, and other modules for up to 30 days with a single refilling of ACME Handy Fusion Reactor Fuel." },
  { name: "Modular Hab", category: "Adventure Gear", cost: 10000, lbs: 2000, description: "An unpressurized shelter module for up to six individuals, resistant to extreme weather. The Imperial standard model includes life support, making it suitable for long-term habitation." },
  { name: "Ranger Lattice", category: "Adventure Gear", cost: 5, lbs: 2, description: "Belt and suspender setup with multiple pouches, capable of carrying up to 25 lbs. of gear such as small weapons, grenades, or whisky flasks. Comes with fire/waterproof cylinders to hold maps or scrolls. Protects up to 5 points of fire damage." },
  { name: "Rebreather", category: "Adventure Gear", cost: 250, lbs: 5, description: "A backpack unit with a face mask that reprocesses exhaled gases into breathable air, providing up to 6 hours of safe atmosphere in non-toxic environments. Adds one Tier of difficulty to any swimming checks." },
  { name: "Respirator", category: "Adventure Gear", cost: 100, lbs: 1, description: "A facemask equipped with a device that concentrates and enriches oxygen for planets with thin atmospheres. The Imperial model offers a discreet internal installation." },
  { name: "Steel Chain, 1 yard", category: "Adventure Gear", cost: 10, lbs: 5, description: "Used for anchoring traps and binding strong creatures, supporting up to 2,000 lbs. per yard." },
  { name: "Steel Spike", category: "Adventure Gear", cost: 1, lbs: 0.25, description: "Multipurpose tool for securing doors, setting traps, and other anchoring tasks." },
  { name: "Sundial, Miniature", category: "Adventure Gear", cost: 4, lbs: 1, description: "A compact timekeeping tool using the sun's position." },
  { name: "Survival Kit", category: "Adventure Gear", cost: 2, lbs: 1, description: "A small survival kit containing utensils, a tinderbox, flint, and steel, ensuring a minimum level of preparedness." },
  { name: "Tent, 1-Person", category: "Adventure Gear", cost: 2, lbs: 4, description: "A compact shelter for one. Light and easy to carry, suitable for solo adventurers." },
  { name: "Tent, 2-Person", category: "Adventure Gear", cost: 5, lbs: 10, description: "A medium-sized tent. The Imperial tech model is pressurized for controlled environments but has no airlock." },
  { name: "Tent, 4-Person", category: "Adventure Gear", cost: 15, lbs: 25, description: "A larger tent suitable for a group of four. Multiple modules can be connected to form a larger structure. One-person airlock included." },
  { name: "Textbook", category: "Adventure Gear", cost: 30, lbs: 5, description: "Provides a one-time Advantage on any relevant Task Check where knowledge from the book could help, such as Liberal Arts, Medicine, or Counseling. Must spend one hour studying the text first." },
  { name: "Travel Blanket", category: "Adventure Gear", cost: 1, lbs: 0.25, description: "A warm, compact bedroll providing basic comfort and insulation in various environments." },
  { name: "Troop Gear", category: "Adventure Gear", cost: 10, lbs: 25, description: "A shared kit containing basic camping essentials for 3-10 people. Weight can be divided among multiple carriers." },

  // Communications Gear
  { name: "Anti-Psi Helmet", category: "Communications", cost: 20000, lbs: 2, description: "A reinforced helmet lined with psionika-dampening mesh, blocking external psychic influence. Extended use causes headaches and mild disorientation. Gives Advantage to Discipline checks." },
  { name: "Bone Phone", category: "Communications", cost: 1000, lbs: 1, description: "Works similar to an Implant communicator but at much lower tech levels, using the resonance of the wearer's own skull to transmit sound and mounting a mike directly on the throat for very quiet vocalizations." },
  { name: "Implant Communicator", category: "Communications", cost: "-", lbs: "-", description: "Functions like a standard personal communicator but can transmit sub-vocalized speech directly to the user's inner ear, providing Advantage on stealth rolls when used discreetly." },
  { name: "Personal Communicator", category: "Communications", cost: 1200, lbs: 0.25, description: "Imperial tech light-speed communications device for personal transmissions up to 4,000 miles. Double range for each doubling of weight and cost." },
  { name: "Quantum Telegraph (Short Range)", category: "Communications", cost: 10000, lbs: 3, description: "Imperial tech instantaneous communication device. Covers up to 1 light-second (186,282 miles)." },
  { name: "Quantum Telegraph (Medium Range)", category: "Communications", cost: 40000, lbs: 30, description: "Imperial tech instantaneous communication device. Extends up to 10 light-seconds." },
  { name: "Quantum Telegraph (Long Range)", category: "Communications", cost: 400000, lbs: 300, description: "Imperial tech instantaneous communication device. Covers up to 100 light-seconds (0.2 AU)." },
  { name: "Telepathic Communicator (pair)", category: "Communications", cost: 50000, lbs: 5, description: "Paired helmets allowing instantaneous communication, ignoring language barriers between same-species users. Must be connected to a transceiver such as a QT or radio." },
  { name: "Telepathic Translator", category: "Communications", cost: 5000, lbs: 2, description: "A small computer that reads and analyzes brain waves and translates speech into any known language. Works best when participants take turns speaking. Range 50 feet." },

  // Computers/Data Storage
  { name: "Computer", category: "Computers", cost: 1000, lbs: 1, description: "At Imperial tech levels, FTL computers are standard, assuming a QT network or built-in QT. SI and full AI systems widely available where legal. Cost 1,000-10,000, weight 1-5 lbs. depending on capability." },
  { name: "Crystal Memory", category: "Computers", cost: 200, lbs: 0.1, description: "High-capacity Imperial tech storage medium holding millions of hours of holorecordings. Frequently used for critical data requiring long-term preservation and high durability." },
  { name: "Memory Disks, Qty 10", category: "Computers", cost: 20, lbs: 0.1, description: "Mass-market, inexpensive data storage devices capable of holding thousands of hours of holorecordings or countless pages of text." },
  { name: "Neural Interface", category: "Computers", cost: 1000, lbs: 1, description: "A direct link between the brain and a computer, surgically implanted or worn as a sensor net. Can record experiences and, with the right software, serve as a neural translator." },

  // Containers
  { name: "Barrel", category: "Containers", cost: 10, lbs: 10, description: "Designed to hold 5 gallons of liquid, typically water, with basic durability for standard storage and transport." },
  { name: "Bottle", category: "Containers", cost: 1, lbs: 1, description: "From small crystal vials to quart-sized glass jars. Frequently used for consumables or small quantities of valuable substances or corrosive alien goo." },
  { name: "Chest", category: "Containers", cost: 10, lbs: 10, description: "A basic chest with reinforced brackets for easier lifting. Available in small and large sizes. Cost and weight 10-20 depending on size." },
  { name: "Iron Strongbox", category: "Containers", cost: 250, lbs: 25, description: "Highly durable iron container designed to store 50 lbs. of valuable items. Double cost to give Disadvantage to breaking in." },

  // Light Sources
  { name: "Candle", category: "Light Sources", cost: 5, lbs: 1, description: "Burns steadily and brightly enough to read by, providing a stable light source for up to 12-24 hours. Eliminates darkness Disadvantages up to two hexes in diameter." },
  { name: "Lantern", category: "Light Sources", cost: 10, lbs: 1, description: "Handheld or shield/helmet-mounted light source that illuminates a 30-degree arc for up to 50 yards. Eliminates darkness Disadvantages along the arc." },

  // Medical Gear
  { name: "Autodoctor", category: "Medical Gear", cost: 2000000, lbs: 15000, description: "A large robotic device with advanced software intelligence that can encapsulate a patient and provide comprehensive medical treatment independently. Grants Advantage on healing checks; treat as a doctor with Medicine skill equal to TL+2." },
  { name: "Cryo-Bed", category: "Medical Gear", cost: 100000, lbs: 900, description: "Freezes a patient safely when standard stasis methods would fail, preserving him for up to their Resistance in days. Must roll with Disadvantage upon revival unless revived within this period." },
  { name: "Diagnostic Computer", category: "Medical Gear", cost: 12000, lbs: 4, description: "A high-tech device used alongside a medscanner to diagnose and prescribe treatments, providing Advantage on Medicine Evaluation checks (additional Advantage with a complete medical history)." },
  { name: "Doctor's Black Bag", category: "Medical Gear", cost: 150, lbs: 10, description: "A complete set of medical tools necessary for performing surgeries and advanced medical procedures. Grants Advantage on Medicine checks to Stabilize and treat wounds in the field." },
  { name: "Field Life Support", category: "Medical Gear", cost: 5000, lbs: 3, description: "Provides critical life support functions to Stabilize a patient in the field, ensuring safe transport to a medical facility." },
  { name: "First Aid Kit", category: "Medical Gear", cost: 20, lbs: 1, description: "Contains essential tools for performing first aid and treating injuries. Grants Advantage on Medicine checks to Stabilize and treat wounds in the field. Contains bandages, smelling salts, aspirin, etc." },
  { name: "IV-Dispenser", category: "Medical Gear", cost: 2000, lbs: 1, description: "A portable medical device allowing controlled administration of medications over time. Can be programmed to administer drugs on preset physiological conditions for double the cost." },
  { name: "Litter", category: "Medical Gear", cost: 25, lbs: 25, description: "A carrying frame used by two or more individuals to transport a wounded ally or heavy loot. Supports up to 300 lbs. Some have anti-gravity assistance: double cost for each load doubling." },
  { name: "Medscanner", category: "Medical Gear", cost: 8500, lbs: 4, description: "A versatile sensor that scans for vital signs and abnormalities in known species. Provides raw diagnostic data but is ineffective on unclassified or unknown species." },
  { name: "Stasis-Bed", category: "Medical Gear", cost: 250000, lbs: 1000, description: "A medical bed designed to put a patient into suspended animation, drastically slowing the effects of injury or disease until proper medical care is available." },

  // Medicine (drugs) - (Addictive) requires an addiction roll unless doses are spaced >= 1 week apart; (Military only) restricted to military personnel, black market up to 10x cost.
  { name: "Addrenal-X", category: "Medicine", cost: 200, lbs: "-", description: "(Addictive, Military only) A combat stimulant that temporarily grants an additional Action each round for four rounds." },
  { name: "Andro-X", category: "Medicine", cost: 550, lbs: "-", description: "(Addictive, Military only) A military-grade booster that temporarily increases Resistance (and associated health pool) by 5 points for up to 1 minute." },
  { name: "Bacterial-X", category: "Medicine", cost: 25, lbs: "-", description: "An antibacterial solution that grants Advantage on Resistance rolls against bacterial infections." },
  { name: "Bend-X", category: "Medicine", cost: 60, lbs: "-", description: "(Addictive) A treatment for decompression sickness (\"the bends\") that safely restores normal function." },
  { name: "Bleed-X", category: "Medicine", cost: 25, lbs: "-", description: "A hemostatic agent that stops all active bleeding, aiding in wound closure and preventing blood loss." },
  { name: "Bloodbank", category: "Medicine", cost: 120, lbs: "-", description: "(Addictive) A specialized regenerative serum that replenishes all blood loss within 2 hours, stabilizing patients suffering from severe hemorrhage." },
  { name: "Endure", category: "Medicine", cost: 120, lbs: "-", description: "(Addictive) A resilience booster that enables the Hero to ignore one level of Disadvantage caused by physical wounds, or used to Stabilize someone in Shock." },
  { name: "Nerve-X", category: "Medicine", cost: 230, lbs: "-", description: "(Addictive) An antidote to counteract nerve agents, offering up to 12 hours of protection (Advantage) against nerve-based attacks or toxins." },
  { name: "Percept-X", category: "Medicine", cost: 25, lbs: "-", description: "(Addictive, Military only) An enhancement drug that sharpens sensory perception, allowing all sense-related Task Checks with Advantage." },
  { name: "Poison-X", category: "Medicine", cost: 100, lbs: "-", description: "(Addictive) An anti-poison compound that grants Advantage on Resistance rolls against poison." },
  { name: "Regen-X", category: "Medicine", cost: 100, lbs: "-", description: "(Addictive) A regenerative agent that heals 3 points of health per turn over 10 rounds. Can be used to Stabilize the Dying." },
  { name: "Regen-X2", category: "Medicine", cost: 100, lbs: "-", description: "(Addictive) An advanced regenerative compound that instantly restores 10 points of health. Can be used to Stabilize the Dying." },
  { name: "Regen-X3", category: "Medicine", cost: 250, lbs: "-", description: "A powerful regenerative agent capable of regrowing lost body parts: 10 days for a finger/toe, 60 days for an arm, 90 days for a leg." },
  { name: "Sedate-X", category: "Medicine", cost: 10, lbs: "-", description: "(Addictive) A strong sedative that induces sleep in most life forms. Resist at Disadvantage: Task Check (Resistance) vs. TN (15)." },
  { name: "Speed-X", category: "Medicine", cost: 40, lbs: "-", description: "(Addictive, Military only) A stimulant that makes the Hero immune to Stun and provides Advantage on Initiative rolls for five rounds (or reroll if already rolled)." },
  { name: "Stun-X", category: "Medicine", cost: 250, lbs: "-", description: "(Addictive) A potent stimulant designed to relieve stun effects, rapidly restoring the user's combat effectiveness." },
  { name: "Suspend-X", category: "Medicine", cost: 100, lbs: "-", description: "A compound that suspends life functions for 1 hour, placing the user in temporary suspended animation." },
  { name: "Suspend-X2", category: "Medicine", cost: 150, lbs: "-", description: "(Addictive) A recovery agent designed to safely remove a Hero from suspended animation, restoring normal function with Advantage on revival rolls." },
  { name: "Tox-X", category: "Medicine", cost: 600, lbs: "-", description: "(Addictive) A biologically engineered microorganism that actively hunts down and neutralizes known toxins and harmful microorganisms within the body." },
  { name: "Viral-X", category: "Medicine", cost: 100, lbs: "-", description: "(Addictive) A targeted antiviral treatment allowing a Resistance roll against viral infections with Advantage." },

  // Mounted Animals and Gear
  { name: "Animal Barding", category: "Animals", cost: "Special", lbs: "Special", description: "Specialized armor for animals with the same protective capabilities as humanoid armor: same cost but twice the weight." },
  { name: "Bird of Prey", category: "Animals", cost: 40, lbs: "-", description: "Trained birds of prey, highly effective at scouting and hunting. Can also relay messages or Attack small targets." },
  { name: "Horse, Draft", category: "Animals", cost: 50, lbs: "-", description: "Heavy-duty workhorse, 1,400-2,000 lbs., capable of carrying up to 25% of its body weight. Perfect for pulling heavy loads or carts. Cost 50+." },
  { name: "Horse, Riding", category: "Animals", cost: 75, lbs: "-", description: "A lighter, faster horse, 900-1,200 lbs. Can carry up to 25% of its body weight, ideal for long-distance travel. Cost 75+." },
  { name: "Horse, War", category: "Animals", cost: 200, lbs: "-", description: "A specially trained combat steed, 1,000-2,000 lbs., with a Might Damage bonus of +8. Carries up to 25% of its body weight. Cost 200+." },
  { name: "Pack Donkey", category: "Animals", cost: 10, lbs: "-", description: "Smaller but intelligent pack animal, 200-1,300 lbs., capable of carrying 25%-35% of its body weight. Cost 10+." },
  { name: "Pack Mule", category: "Animals", cost: 10, lbs: "-", description: "Sturdy and sure-footed, 900-1,400 lbs., capable of carrying up to 35% of its body weight. Cost 10+." },
  { name: "Saddle Bags", category: "Animals", cost: 2, lbs: 8, description: "Sturdy pouches that attach to either side of the saddle, holding up to 50 lbs. of equipment without over-encumbering the mount." },
  { name: "Saddle Rig", category: "Animals", cost: 20, lbs: 25, description: "Standard saddle designed for riding, providing a secure seat and control for the rider." },
  { name: "Saddle Rig, War", category: "Animals", cost: 50, lbs: 30, description: "Reinforced saddle specifically made for combat scenarios, offering better stability and protection for both rider and mount." },
  { name: "War Dog", category: "Animals", cost: 25, lbs: "-", description: "A large, powerful dog trained for guard duty, capable of pinning and incapacitating intruders." },

  // Musical Instruments
  { name: "Percussion", category: "Musical Instruments", cost: 1, lbs: 0.5, description: "Percussion instruments from drums to zills to tambourines. Some can echo for miles when struck. Some require both hands to play. Cost 1-50, weight 1/2-5 lbs." },
  { name: "Stringed", category: "Musical Instruments", cost: 10, lbs: 2, description: "String-based instruments such as harps and guitars, low-volume to face-melting melodies. Generally requires both hands. Cost 10-500, weight 2-25 lbs." },
  { name: "Wind-Driven", category: "Musical Instruments", cost: 1, lbs: 0.5, description: "From bagpipes to horns to whistles. Loud and heard over long distances; causes Disadvantage on Hearing Task Checks within 10 yards. Mostly two-handed; all prevent speaking while in use. Cost 1-50, weight 1/2-5 lbs." },

  // Optics
  { name: "Bull's-Eye Lantern", category: "Optics", cost: 5, lbs: 2, description: "A low-tech handheld lantern with a shuttered lens focusing light into a concentrated 9-yard beam. Burns for extended periods on a small amount of fuel." },
  { name: "Contact Lenses (Anti-Glare)", category: "Optics", cost: 10, lbs: "-", description: "Instantly reduces intense light levels, making sudden flashes or harsh sunlight manageable. Gives Advantage." },
  { name: "Contact Lenses (Infrared)", category: "Optics", cost: 10, lbs: "-", description: "Extends visual perception into the infrared spectrum, allowing the wearer to see heat signatures in complete darkness. Gives Advantage." },
  { name: "Contact Lenses (Low-light)", category: "Optics", cost: 60, lbs: "-", description: "Amplifies ambient light, providing Advantage in low-light conditions without sacrificing clarity." },
  { name: "Contact Lenses (Magnifying)", category: "Optics", cost: 50, lbs: "-", description: "Magnifies vision up to 100 times, allowing precise observations with zoom functionality through a neural interface. Gives Advantage." },
  { name: "Contact Lenses (Combo)", category: "Optics", cost: 300, lbs: "-", description: "Combines Anti-Glare, Infrared, Low-Light, and Telescopic lenses into a single unit. Gives Advantage." },
  { name: "Holocamera", category: "Optics", cost: 500, lbs: 0.2, description: "An advanced visual capture device capable of recording high-resolution holographic images and video, adjustable to environment and preferences." },
  { name: "Holoprojector", category: "Optics", cost: 500, lbs: 30, description: "A device capable of projecting three-dimensional holographic recordings in vivid detail. Useful for displaying maps, messages, and complex visuals." },
  { name: "Magnifying Glass", category: "Optics", cost: 5, lbs: 0.25, description: "A small optical tool capable of focusing sunlight to set small fires under ideal conditions. Enhances the view of tiny objects." },
  { name: "Panoramic Night Vision Goggles", category: "Optics", cost: 1000, lbs: 1, description: "Specialized goggles with four optics granting a 120-degree field of view, converting available light into a digital display for near-total darkness." },

  // Security Gear
  { name: "Boring Tool", category: "Security Gear", cost: 2, lbs: 3, description: "A compact hand drill ideal for creating small peepholes in walls, doors, or other structures. Often used for covert surveillance setups." },
  { name: "Breaking and Entering Kit", category: "Security Gear", cost: 100, lbs: 0.1, description: "Essential gear for lockpicking and trap disarming. Required for bypassing most security measures without triggering alarms." },
  { name: "Bug", category: "Security Gear", cost: 500, lbs: 0.125, description: "A tiny, ultra-compact listening device with a range of up to 1 mile. Capable of discreet audio surveillance. Larger models may include visual capabilities." },
  { name: "Bug Detector", category: "Security Gear", cost: 500, lbs: 1, description: "A handheld device that scans for electronic surveillance equipment within a one-yard radius. More effective against high-tech devices but still functional against simpler bugs." },
  { name: "Bug Suppressor", category: "Security Gear", cost: 1200, lbs: 1, description: "An electronic device that emits jamming signals, neutralizing bugs within a one-yard radius. Detectable by those monitoring - a temporary countermeasure rather than a permanent solution." },
  { name: "Caltrops", category: "Security Gear", cost: 1, lbs: 0.5, description: "Sharp spikes scattered across the ground. Inflicts five points of damage to a random foot if unnoticed. Takes one Action to deploy." },
  { name: "Collapsible Ladder, 30'", category: "Security Gear", cost: 10, lbs: 8, description: "A flexible, compact ladder made of wooden slats and hooked ropes. Requires no climbing roll once secured and can be stored in a pack." },
  { name: "Collapsible Snorkel", category: "Security Gear", cost: 30, lbs: 1, description: "A hollow tube designed for underwater breathing, allowing the user to remain submerged with minimal visibility above the surface. Extends up to six feet." },
  { name: "Countermeasure Belt", category: "Security Gear", cost: 22000, lbs: 0.5, description: "A covert device that projects a false scanner signature, concealing the true identity or presence of the wearer. Only effective against low-complexity security systems." },
  { name: "Electronic Handcuffs", category: "Security Gear", cost: 500, lbs: 5, description: "Restraints with electronic locks that can be opened remotely with a laser key, operable from up to 3 yards away." },
  { name: "Grapnel", category: "Security Gear", cost: 80, lbs: 2, description: "A sturdy hook used for securing ropes to ledges, walls, or other surfaces. Supports up to 500 lbs., ideal for climbing or rapid ascents." },
  { name: "Grapnel Gun", category: "Security Gear", cost: 2000, lbs: 5, description: "A compressed air launcher that fires a grappling hook up to 150 feet. Includes a motorized winch with a 400 lbs. capacity and 150 feet of high-tensile synthcord." },
  { name: "Identity Card", category: "Security Gear", cost: "-", lbs: "-", description: "An Imperial standard identification device with biometrics, a memory crystal, and a layered data structure, linked to a central database for verification. Replacements available at any Imperial office." },
  { name: "Magno-Grips", category: "Security Gear", cost: 400, lbs: 2, description: "Attachments for hands and feet that provide secure grips on vertical surfaces. Gives Advantage to Athletics when climbing." },
  { name: "Multi-Tool", category: "Security Gear", cost: 50, lbs: 0.5, description: "A compact folding tool with pliers, screwdrivers, blades, and wrenches. Provides basic utility in the absence of dedicated toolsets." },
  { name: "Padlock (Cheap)", category: "Security Gear", cost: 2, lbs: 1, description: "Keeps honest people honest." },
  { name: "Padlock (Average)", category: "Security Gear", cost: 4, lbs: 2, description: "One level of Disadvantage to picking." },
  { name: "Padlock (Fine)", category: "Security Gear", cost: 6, lbs: 3, description: "Two levels of Disadvantage to picking." },
  { name: "Persona Pack", category: "Security Gear", cost: 450, lbs: 5, description: "A combination of biological and cosmetic paint and tools for altering appearance. Advanced kits grant Advantage to Stealth when disguised as the same species." },
  { name: "Quantum Scrambler", category: "Security Gear", cost: 5000, lbs: 2, description: "A high-powered field generator designed to disrupt complex computer systems, particularly AI and androids. The Attack is made with a Technician check at Advantage." },
  { name: "Security Scanner", category: "Security Gear", cost: 1000, lbs: 0.5, description: "A handheld device for reading Imperial identity cards across five access levels, from Public Access Data to Crown Intelligence Data." },
  { name: "Stealth Suit", category: "Security Gear", cost: 18500, lbs: 10, description: "A specialized suit that minimizes the wearer's sensory and electromagnetic signatures. Retains body heat, making it less ideal for extended use in warm climates." },

  // Tools
  { name: "Backpack Thruster", category: "Tools", cost: 20000, lbs: 5, description: "A propulsion device that straps onto a vacuum suit, providing a delta-V of 300 yards per second for up to 250 lbs. of mass." },
  { name: "Camp Spade", category: "Tools", cost: 1, lbs: 6, description: "A sturdy tool used for digging, clearing debris, and similar tasks." },
  { name: "Composition Scanner", category: "Tools", cost: 2000, lbs: 2, description: "A high-precision scanner identifying the physical and chemical makeup of substances, detecting flaws and circuit architecture. Range scales from 10 yards (1/10 oz.) to 10 miles (1/2 lb.)." },
  { name: "Drones", category: "Tools", cost: "Variable", lbs: "Variable", description: "Various drones (aerial, underwater, space, etc.) tailored to specific tasks from surveillance to transport and combat support. Availability and cost vary significantly." },
  { name: "Drop Thruster", category: "Tools", cost: 25000, lbs: 2, description: "An anti-gravity descent device that can hover up to 600 lbs. in 2 Gs or act as a parachute for up to 1,500 lbs. in 1 G." },
  { name: "Electronic Lockpick", category: "Tools", cost: 1500, lbs: 0.5, description: "A compact electronic tool for bypassing low-level electronic locks and camera systems. For advanced systems, use with a computer and appropriate software." },
  { name: "Extendo-Grip", category: "Tools", cost: 1, lbs: 2, description: "A basic gripping tool for handling hot or hazardous materials or objects. Extends out to three feet." },
  { name: "Flight Belt", category: "Tools", cost: 35000, lbs: 4, description: "A compact propulsion system worn at the waist, enabling flight at speeds up to 50 mph for up to 5 hours. Supports up to 600 lbs." },
  { name: "Handheld Thruster", category: "Tools", cost: 500, lbs: 1, description: "A small, handheld propulsion device for maneuvering in zero-G, providing a delta-V of up to 30 yards per second for 250 lbs. of mass." },
  { name: "Heavy Cutter", category: "Tools", cost: 250, lbs: 2, description: "A powerful cutting tool similar to a Laser Torch but with greater cutting capacity - can slice through up to 3 cm of steel alloy." },
  { name: "Iron Crowbar, 3'", category: "Tools", cost: 1, lbs: 4, description: "A versatile tool for prying open doors or crates. Can also be used as an improvised weapon, functioning like a small mace in combat." },
  { name: "Laser Cutter", category: "Tools", cost: 150, lbs: 1, description: "A handheld laser tool for precision cutting and welding, useful for engineering tasks requiring fine control and minimal heat spread." },
  { name: "Life Scanner", category: "Tools", cost: 2000, lbs: 2, description: "A specialized sensor that detects animal life up to 800 yards away along a 45-degree arc, differentiating basic types within 40 yards." },
  { name: "Load Lifter", category: "Tools", cost: 3, lbs: 10, description: "Covers everything from a wheelbarrow to an anti-grav pallet. Holds up to 350 lbs. Cost 3-1,000, weight 10-25 lbs. depending on model." },
  { name: "Mallet", category: "Tools", cost: 1, lbs: 3, description: "A heavy wooden hammer used for driving stakes, breaking barriers, or dealing blunt damage to obstacles or adversaries." },
  { name: "Metal File", category: "Tools", cost: 2, lbs: 1, description: "A metal-cutting tool capable of sawing through metal. Gives Advantage to Thievery when picking a lock." },
  { name: "Mirror", category: "Tools", cost: 1, lbs: 1, description: "Small mirrors for discreet observation around corners; large ones can deflect a space Medusa's gaze. Cost and weight 1-10 depending on size." },
  { name: "Mobile Machine Shop", category: "Tools", cost: 10000, lbs: 1000, description: "A comprehensive toolset commonly found on starships and space stations, including tools for complex repairs, metallurgy, and electronics work. Can manufacture replacement parts and circuit boards." },
  { name: "Pickaxe", category: "Tools", cost: 2, lbs: 10, description: "A heavy-duty tool used for digging through rock and other hard materials. Also useful for breaking through stone barriers." },
  { name: "Piton Gun", category: "Tools", cost: 50, lbs: 0.5, description: "A handheld device that fires pitons into rock or concrete surfaces, providing secure anchor points for climbing." },
  { name: "Radiation Scanner", category: "Tools", cost: 2000, lbs: 2, description: "Detects radiation of all types, including tight-beam comms and nuclear reactors. Range: 80 yards for tight-beam comms, 8 miles for nuclear reactors." },
  { name: "Repair Scanner", category: "Tools", cost: 7000, lbs: 4, description: "Scans for circuits, power flow, and stress flaws. Requires relevant schematics for detailed analysis; capable of general power and structural scans." },
  { name: "Saw-Toothed Blade", category: "Tools", cost: 1, lbs: 2, description: "A basic cutting tool for severing wooden objects or harvesting valuable materials from carcasses." },
  { name: "Scanner Plate", category: "Tools", cost: 200, lbs: 1, description: "A device that adheres to surfaces and provides a 3D image of whatever is on the opposite side. Useful for identifying hidden compartments." },
  { name: "Scribe Kit", category: "Tools", cost: 5, lbs: 3, description: "A complete set of writing tools, including quills, ink bottles, and penknives, designed for field documentation." },
  { name: "Skyhook", category: "Tools", cost: 50, lbs: 100, description: "A teardrop-shaped balloon that carries a high-strength cord aloft, allowing a flying vehicle to capture and lift the user for aerial extraction." },
  { name: "Tac-Scanner", category: "Tools", cost: 3000, lbs: 3, description: "A military-grade scanner that detects life, motion, and potential threats, providing limited mapping and ignoring most physical barriers." },
  { name: "Telescope", category: "Tools", cost: 10, lbs: 1, description: "A long-range optical device with x100 magnification, enabling a Hero to see distant objects clearly. Ideal for scouting or detailed observation." },
  { name: "Thermal Breaching Charge", category: "Tools", cost: 2, lbs: 1, description: "A compact, thermite-based charge designed to burn through virtually any lock or barrier except TL7 carbon crystal." },
  { name: "Tool Kit, AFV", category: "Tools", cost: 1500, lbs: 8, description: "A specialized toolset designed to diagnose and repair armored fighting vehicles, including heavy-duty tools and replacement parts for field repairs." },
  { name: "Tool Kit, Basic", category: "Tools", cost: 800, lbs: 5, description: "A comprehensive toolkit suitable for emergency repairs in engineering, mechanical, and electronic fields." },
  { name: "Tool Kit, Mini", category: "Tools", cost: 40, lbs: 3, description: "A compact tool belt tailored for specific repair tasks. Effective for field repairs, but using it outside its specialty incurs a Disadvantage." },
  { name: "Tool Kit, Spacecraft", category: "Tools", cost: 2000, lbs: 8, description: "A specialized set of tools designed for diagnosing and repairing spacecraft, including advanced diagnostic gear for complex ship systems." },
  { name: "Tri-Scanner", category: "Tools", cost: 8000, lbs: 4, description: "Operates similarly to the Composition Scanner but combines the functionality of the composition, life, and radiation scanners." },
];

const GEAR_CATEGORIES = [
  "Combat Accessories", "Adventure Gear", "Communications", "Computers", "Containers",
  "Light Sources", "Medical Gear", "Medicine", "Animals", "Musical Instruments",
  "Optics", "Security Gear", "Tools",
];
