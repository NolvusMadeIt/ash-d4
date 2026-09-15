export type AffixStat = {
  kind: "flat" | "percent" | "ranks";
  min: number;
  max: number;
};

export const AFFIX_STATS: Record<string, AffixStat> = {
  max_life: { kind: "flat", min: 489, max: 854 },
  armor: { kind: "flat", min: 92, max: 210 },
  all_res: { kind: "percent", min: 4.0, max: 10.0 },
  fire_res: { kind: "percent", min: 8.0, max: 16.5 },
  cold_res: { kind: "percent", min: 8.0, max: 16.5 },
  lightning_res: { kind: "percent", min: 8.0, max: 16.5 },
  poison_res: { kind: "percent", min: 8.0, max: 16.5 },
  shadow_res: { kind: "percent", min: 8.0, max: 16.5 },
  strength: { kind: "flat", min: 77, max: 180 },
  dexterity: { kind: "flat", min: 77, max: 180 },
  intelligence: { kind: "flat", min: 77, max: 180 },
  willpower: { kind: "flat", min: 77, max: 180 },
  crit_chance: { kind: "percent", min: 5.0, max: 12.0 },
  crit_damage: { kind: "percent", min: 10.0, max: 21.0 },
  attack_speed: { kind: "percent", min: 5.0, max: 11.5 },
  cast_speed: { kind: "percent", min: 5.0, max: 11.5 },
  move_speed: { kind: "percent", min: 8.0, max: 16.0 },
  cdr: { kind: "percent", min: 4.0, max: 10.5 },
  resource_cost: { kind: "percent", min: 4.0, max: 8.5 },
  lucky_hit: { kind: "percent", min: 6.5, max: 14.0 },
  vulnerable: { kind: "percent", min: 12.0, max: 26.0 },
  overpower: { kind: "percent", min: 16.0, max: 35.0 },
  damage: { kind: "percent", min: 8.5, max: 18.5 },
  close_damage: { kind: "percent", min: 10.0, max: 22.5 },
  distant_damage: { kind: "percent", min: 10.0, max: 22.5 },
  life_per_hit: { kind: "flat", min: 18, max: 48 },
  ranks: { kind: "ranks", min: 1, max: 3 },
  essence_on_kill: { kind: "flat", min: 8, max: 22 },
  thorns: { kind: "flat", min: 210, max: 540 },
  block: { kind: "percent", min: 5.0, max: 12.0 },
  dodge: { kind: "percent", min: 3.5, max: 8.0 },
  max_resource: { kind: "flat", min: 8, max: 18 },
};

export const WEAPON_SPEED: Record<string, { aps: number; tag: string; dps: number }> = {
  dagger: { aps: 1.2, tag: "Very Fast", dps: 1.85 },
  sword: { aps: 1.1, tag: "Fast", dps: 2.05 },
  axe: { aps: 1.1, tag: "Fast", dps: 2.1 },
  mace: { aps: 1.0, tag: "Average", dps: 2.15 },
  wand: { aps: 1.2, tag: "Very Fast", dps: 1.9 },
  bow: { aps: 1.1, tag: "Fast", dps: 2.0 },
  crossbow: { aps: 0.9, tag: "Slow", dps: 2.25 },
  scythe: { aps: 1.1, tag: "Fast", dps: 2.05 },
  glaive: { aps: 1.1, tag: "Fast", dps: 2.08 },
  sword2h: { aps: 0.9, tag: "Slow", dps: 2.55 },
  axe2h: { aps: 0.9, tag: "Slow", dps: 2.6 },
  mace2h: { aps: 0.9, tag: "Slow", dps: 2.65 },
  polearm: { aps: 0.95, tag: "Slow", dps: 2.5 },
  staff: { aps: 1.0, tag: "Average", dps: 2.35 },
  scythe2h: { aps: 0.9, tag: "Slow", dps: 2.55 },
  quarterstaff: { aps: 1.1, tag: "Fast", dps: 2.15 },
};

export const ARMOR_MULT: Record<string, number> = {
  helm: 1.25,
  chest: 1.85,
  gloves: 0.72,
  pants: 1.15,
  boots: 0.72,
  shield: 1.08,
};

export const ASPECTS = [
  "Distant enemies take 25%[x] increased damage.",
  "Close enemies take 20%[x] increased damage.",
  "Lucky Hit: Up to a 20% chance to Slow the enemy for 2 seconds.",
  "Gain 0.6% Damage Reduction for every 1% Life you are missing.",
  "Critical Strikes increase your Attack Speed by 10%[+] for 4 seconds.",
  "You restore 15% of your Maximum Life when you use a Defensive Skill.",
  "Core Skills deal 18%[x] increased damage.",
  "After killing an Elite, gain 30%[x] Movement Speed for 4 seconds.",
  "You deal 22%[x] increased damage to Crowd Controlled enemies.",
  "Lucky Hit: Up to a 15% chance to restore 20 Primary Resource.",
  "You gain 25%[+] increased Dodge Chance for 3 seconds after using Evade.",
  "Overpower attacks deal 30%[x] increased damage.",
];

export const TEMPERS = [
  { id: "fire_dmg", text: (n: string) => `+${n}% Fire Damage` },
  { id: "shadow_dmg", text: (n: string) => `+${n}% Shadow Damage` },
  { id: "cold_dmg", text: (n: string) => `+${n}% Cold Damage` },
  { id: "elite_dmg", text: (n: string) => `+${n}% Damage to Elites` },
  { id: "core_ranks", text: (n: string) => `+${n} to Core Skills` },
  { id: "basic_ranks", text: (n: string) => `+${n} to Basic Skills` },
  { id: "vuln_dur", text: (n: string) => `+${n}% Vulnerable Duration` },
  { id: "resource", text: (n: string) => `+${n} Primary Resource on Kill` },
];

export type UniqueLore = {
  affixes: string[];
  power: string;
  flavor: string;
  inherent?: string;
};

export const UNIQUE_LORE: Record<string, UniqueLore> = {
  "Harlequin Crest": {
    affixes: ["max_life", "cdr", "max_resource", "ranks"],
    power:
      "Gain 20% Damage Reduction. In addition, gain +4 Ranks to all Skills.",
    flavor:
      "This headdress was once worn by an assassin of the Viz-Jaq'taar, disguising herself as a court jester. What a surprise it must have been when the laugh died so suddenly.",
  },
  "Shroud of False Death": {
    affixes: ["all_res", "max_life", "move_speed", "armor"],
    power:
      "If you haven't attacked in the last 2 seconds, gain Stealth and 40% Movement Speed.",
    flavor: "There is a grave, but no one in it.",
  },
  "Heir of Perdition": {
    affixes: ["crit_chance", "lucky_hit", "move_speed", "ranks"],
    power:
      "Succumb to hatred and earn Mother's Favor, increasing your damage dealt by 80%[x]. Slaughter enemies to briefly steal Mother's Favor from surrounding allies.",
    flavor:
      "Beware false prophets donned as sheep yet bearing the stench of wolves. Thou shalt know them by their fruits. For a tree of good cannot produce evil, nor thorns yield a harvest sweet and fair.",
  },
  "Tyrael's Might": {
    affixes: ["all_res", "move_speed", "max_life", "damage"],
    power:
      "Incoming damage is reduced and absorbed as Holy. The stored Holy detonates around you, dealing that amount as Holy damage.",
    flavor: "“Thus Tyrael, in his wisdom, chose to walk among us as equals.” —The Book of Lorath",
  },
  "Ring of Starless Skies": {
    affixes: ["crit_chance", "lucky_hit", "attack_speed", "cdr"],
    power:
      "Spending resources reduces your resource costs and increases your damage by 4%[x] for 3 seconds, stacking up to 40%[x].",
    flavor: "“Yours is the power to pluck the stars from the heavens with a thought.” —Unknown",
  },
  "Andariel's Visage": {
    affixes: ["attack_speed", "life_per_hit", "poison_res", "crit_chance"],
    power:
      "Lucky Hit: Up to a 20% chance to trigger a poison nova, dealing Poison damage over 5 seconds to surrounding enemies.",
    flavor: "The Maiden of Anguish still whispers from this helm, promising torment to all who wear it.",
  },
  Doombringer: {
    affixes: ["damage", "lucky_hit", "max_life", "crit_damage"],
    power:
      "Lucky Hit: Up to a 25% chance to deal Shadow damage to surrounding enemies and inflict Fear for 2 seconds.",
    flavor: "Whenever this ancient sword is unsheathed, death follows.",
  },
  "The Grandfather": {
    affixes: ["damage", "max_life", "crit_damage", "overpower"],
    power:
      "Increases your Critical Strike Damage by 100%[x]. The other properties of this weapon can roll higher than normal.",
    flavor:
      "An unbroken lineage of wonders. Each owner leaving their mark. Each mark more profound than the last.",
  },
  "Melted Heart of Selig": {
    affixes: ["all_res", "max_resource", "cdr", "max_life"],
    power:
      "Gain 60 Maximum Resource. In addition, 75% of incoming damage is taken from Resource before Life.",
    flavor: "Do not seek his heart. It is already within you.",
  },
  "Nesekem the Herald": {
    affixes: ["damage", "crit_chance", "vulnerable", "attack_speed"],
    power: "Your Core Skills are now also Incarnate Skills. Gain 30%[x] increased damage.",
    flavor: "The last herald of a forgotten god, still announcing an end that never came.",
  },
  "Ahavarion, Spear of Lycander": {
    affixes: ["damage", "lucky_hit", "cdr", "all_res"],
    power:
      "Gain a random Shrine effect for 20 seconds after killing an Elite. Can only occur every 30 seconds.",
    flavor: "“The angel Lycander left this spear as a gift. Or a warning.” —Lorath Nahr",
  },
  "The Butcher's Cleaver": {
    affixes: ["damage", "crit_damage", "strength", "overpower"],
    power:
      "Lucky Hit: When you Critically Strike an enemy, you have up to a 100% chance to Fear and Slow them.",
    flavor: "A nightmarish amalgam of blood, bone and steel. This is a weapon of excruciating agony.",
  },
  "Fists of Fate": {
    affixes: ["lucky_hit", "attack_speed", "crit_chance", "life_per_hit"],
    power: "Your attacks randomly deal 1% to 300% of their normal damage.",
    flavor: "“Will you let her play a game with you?”",
  },
  "Tibault's Will": {
    affixes: ["max_life", "damage", "armor", "resource_cost"],
    power:
      "You deal 20%[x] increased damage while Unstoppable and for 4 seconds after. When you become Unstoppable, gain 50 of your Primary Resource.",
    flavor: "The infamous conceited artisan did not leave scraps. He left a statement.",
  },
  "Yen's Blessing": {
    affixes: ["move_speed", "dodge", "all_res", "lucky_hit"],
    power:
      "Casting a Skill has a 40% chance to cast a Skill of the same type that is currently on your Action Bar, ignoring Energy cost and Cooldown. Can only occur once every 8 seconds.",
    flavor: "These boots were blessed by an old monk who believed luck was a muscle.",
  },
  "Penitent Greaves": {
    affixes: ["move_speed", "cold_res", "dodge", "crit_chance"],
    power:
      "You leave behind a trail of frost that Chills enemies. You deal 12%[x] increased damage to Chilled enemies.",
    flavor: "Remorseful boots that frost the ground with every step of the condemned.",
  },
  "Tempest Roar": {
    affixes: ["willpower", "max_life", "lucky_hit", "ranks"],
    power: "Lucky Hit: Storm Skills have up to a 20% chance to grant 4 Spirit. Your base Storm Skills are now also Werewolf Skills.",
    flavor: "Listen, and you will hear the storm that ended a people.",
  },
  "Insatiable Fury": {
    affixes: ["willpower", "overpower", "max_life", "armor"],
    power:
      "Werebear form is now your true form, and you gain +3 Ranks to all Werebear Skills.",
    flavor: "When the last of his tribe fell, the bear did not.",
  },
  "Deathless Visage": {
    affixes: ["intelligence", "crit_damage", "max_life", "essence_on_kill"],
    power:
      "Bone Spear leaves behind echoes that explode for 125% of their original damage, dealing Physical damage.",
    flavor: "The last face many ever saw.",
  },
  "Blood Moon Breeches": {
    affixes: ["intelligence", "overpower", "max_life", "cdr"],
    power:
      "Your Minions have a 5% chance to curse enemies. Enemies affected by at least 1 of your curses take 70%[x] increased Overpower damage from you.",
    flavor: "Stitched from a night when the moon drowned in red.",
  },
  "Cowl of the Nameless": {
    affixes: ["dexterity", "lucky_hit", "cdr", "crit_chance"],
    power:
      "You gain 20%[+] increased Lucky Hit Chance against Crowd Controlled enemies.",
    flavor: "No name. No grave. Only the work.",
  },
  "Grasp of Shadow": {
    affixes: ["dexterity", "attack_speed", "lucky_hit", "ranks"],
    power:
      "Lucky Hit: Damaging a Vulnerable enemy with a Marksman or Cutthroat Skill has up to a 28% chance to summon a Shadow Clone that mimics that Skill.",
    flavor: "The clone is not a copy. It is a debt.",
  },
  "Asheara's Khanjar": {
    affixes: ["dexterity", "attack_speed", "lucky_hit", "damage"],
    power: "Hits with this weapon increase your Attack Speed by 4.0%[+] for 4 seconds, up to 20%[+] .",
    flavor: "Asheara's last gift to the Iron Wolves. It has not rusted.",
  },
  "Raiment of the Infinite": {
    affixes: ["intelligence", "damage", "lucky_hit", "ranks"],
    power:
      "After using Teleport, Close enemies are Pulled to you and Stunned for 3 seconds, but Teleport's Cooldown is increased by 20%.",
    flavor: "The Horadrim stitched the void into cloth. It still pulls.",
  },
  "Esadora's Overflowing Cameo": {
    affixes: ["intelligence", "cdr", "lucky_hit", "damage"],
    power:
      "Upon collecting Crackling Energy, there is a 15% chance to release a lightning nova, dealing Lightning damage.",
    flavor: "She never learned to stop. The cameo remembers.",
  },
  "Blue Rose": {
    affixes: ["intelligence", "lucky_hit", "crit_chance", "cdr"],
    power:
      "Lucky Hit: Up to a 20% chance to freeze enemies for 3 seconds. You deal 20%[x] increased damage to Frozen enemies.",
    flavor: "It blooms only in the dead of winter, and only for the dying.",
  },
  "Paingorger's Gauntlets": {
    affixes: ["strength", "attack_speed", "cdr", "damage"],
    power:
      "Casting an Agility Skill first will cause your next Marksman, Cutthroat, or Imbuement Skill to return 3 times, dealing 40% of the original damage.",
    flavor: "They take more than they give. That is the point.",
  },
  "Godslayer Crown": {
    affixes: ["strength", "cdr", "move_speed", "damage"],
    power:
      "When you Stun, Freeze, or Immobilize an Elite, you Pull in all Nearby enemies and deal 30%[x] increased damage to them for 3 seconds. Can only occur once every 12 seconds.",
    flavor: "Worn by the last king who thought himself above the Light.",
  },
  Razorplate: {
    affixes: ["thorns", "thorns", "thorns", "armor"],
    power: "Thorns has a 10% chance to deal 1000% increased damage.",
    flavor: "Do not embrace this armor. It embraces you.",
  },
  Frostburn: {
    affixes: ["lucky_hit", "cold_res", "attack_speed", "intelligence"],
    power: "Lucky Hit: Up to a 40% chance to Freeze enemies for 2 seconds.",
    flavor: "A whisper of the mountain. It never thaws.",
  },
  Flickerstep: {
    affixes: ["move_speed", "dodge", "lucky_hit", "cdr"],
    power:
      "Each enemy you Evade through reduces your Ultimate Skill's Cooldown by 2 seconds, up to 10 seconds.",
    flavor: "The last step is always the one they never see.",
  },
  "Banished Lord's Talisman": {
    affixes: ["overpower", "ranks", "max_life", "cdr"],
    power:
      "After you spend 300 of your Primary Resource, your next Core Skill is guaranteed to Overpower and Critically Strike. Your Critical Strikes that Overpower deal 80%[x] increased damage.",
    flavor: "Cast out of the court, he kept the one jewel they could not take.",
  },
  "Lidless Wall": {
    affixes: ["block", "max_life", "lucky_hit", "intelligence"],
    power:
      "Lucky Hit: While you have an active Bone Storm, hitting an enemy has a 30% chance to spawn an additional Bone Storm at their location. Each of your Bone Storms deals 25%[x] increased damage.",
    flavor: "The eye does not blink. The dead do not rest.",
  },
  "Mother's Embrace": {
    affixes: ["all_res", "lucky_hit", "crit_chance", "cdr"],
    power:
      "If a Core Skill hits 5 or more enemies, 40% of the Resource cost is refunded.",
    flavor: "She holds you still. That is not kindness.",
  },
  Condemnation: {
    affixes: ["dexterity", "crit_chance", "attack_speed", "damage"],
    power:
      "Your Core Skills deal 30%[x] increased damage when spending 3 Combo Points. Your Basic Skills using this weapon have a 30% chance to generate 3 Combo Points.",
    flavor: "Judgment, folded into steel.",
  },
  Skyhunter: {
    affixes: ["dexterity", "crit_damage", "ranks", "vulnerable"],
    power:
      "The first direct damage you deal to an enemy is a guaranteed Critical Strike. When you deal a Critical Strike, you gain 20 Precision, up to 80. At 80, your next Marksman Skill is a guaranteed Critical Strike and spends the Precision, dealing 50%[x] increased damage.",
    flavor: "The sky is not empty. It is watching.",
  },
  "The Unbroken Chain": {
    affixes: ["strength", "max_life", "cdr", "damage"],
    power:
      "Casting a Skill that Overpowers reduces your Ultimate Skill's Cooldown by 2 seconds. Your Ultimate Skills deal 30%[x] increased damage.",
    flavor: "Forged so no oath could be broken. Including the last one.",
  },
  "Tassets of the Dawning Sky": {
    affixes: ["all_res", "max_life", "move_speed", "armor"],
    power:
      "When you take Fire, Cold, Lightning, or Poison damage, you gain +8% Resistance to that element for 6 seconds.",
    flavor: "They caught the first light and never let it go.",
  },
  Soulbrand: {
    affixes: ["max_life", "cdr", "all_res", "armor"],
    power:
      "Your Healing Potion also grants a Barrier equal to 100% of the restored Life for 8 seconds. While you have a Barrier, you gain 20% Damage Reduction.",
    flavor: "A pact burned into iron. The soul is the ink.",
  },
  "Ring of the Sacrilegious Soul": {
    affixes: ["lucky_hit", "cdr", "intelligence", "max_life"],
    power:
      "You automatically activate the following equipped Skills on Corpses around you: Raise Skeleton, Corpse Explosion, Corpse Tendrils.",
    flavor: "It turns prayer into hunger.",
  },
  "Greatstaff of the Crone": {
    affixes: ["willpower", "damage", "lucky_hit", "ranks"],
    power: "Claw is now a Storm Skill and also casts Storm Strike at 120% normal damage.",
    flavor: "She never needed a throne. The staff was enough.",
  },
  "Airidah's Inexorable Will": {
    affixes: ["willpower", "lucky_hit", "cdr", "damage"],
    power:
      "When casting an Ultimate Skill and again 5 seconds after, you Pull in enemies and deal Physical damage to them. This damage is increased by 1%[x] per 1 point of Willpower you have.",
    flavor: "The wind does not ask. It arrives.",
  },
  "Hunter's Zenith": {
    affixes: ["willpower", "overpower", "ranks", "damage"],
    power:
      "Gain a bonus when you kill with a Shapeshifting Skill: Werewolf — 8 seconds of 30%[+] Movement Speed. Werebear — Your next Earth Skill Overpowers.",
    flavor: "At the peak, there is only the hunt.",
  },
  "Waxing Gibbous": {
    affixes: ["willpower", "life_per_hit", "crit_chance", "damage"],
    power:
      "Killing an enemy with Shred grants Stealth for 2 seconds. Breaking Stealth with an attack grants Ambush, 15%[x] increased damage for 4 seconds.",
    flavor: "The moon grows. So does the hunger.",
  },
  "Storm's Companion": {
    affixes: ["willpower", "max_life", "cdr", "ranks"],
    power: "Your Wolf Companions are now Storm Wolves, dealing Lightning damage and gaining the Storm Howl ability.",
    flavor: "They run ahead of the thunder. Always.",
  },
  "Ugly Bastard Helm": {
    affixes: ["strength", "fire_res", "overpower", "damage"],
    power:
      "You deal 60%[x] increased Fire damage, but all Fire damage you deal is converted into Poison, and you deal 60%[x] increased Poison damage.",
    flavor: "He never took it off. Neither will you.",
  },
  "Locran's Talisman": {
    affixes: ["all_res", "lucky_hit", "cdr", "crit_chance"],
    power:
      "Your Skills have a 10% chance to deal 100%[x] increased damage. This chance is increased by 1% for every 20% Cooldown Reduction you have.",
    flavor: "Locran sold luck. This is what was left of the ledger.",
  },
  "Endurant Faith": {
    affixes: ["strength", "all_res", "block", "max_life"],
    power:
      "When you would be damaged for at least 40% of your Maximum Life at once, you instead become Immune for 1.5 seconds. Can only occur once every 20 seconds.",
    flavor: "Faith that outlasts the wound is the only faith that matters.",
  },
};
