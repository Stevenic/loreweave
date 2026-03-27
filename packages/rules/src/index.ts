/**
 * @loreweave/rules — D&D 5e rules engine
 *
 * Deterministic implementation of ability scores, combat resolution,
 * conditions, dice rolling, and other D&D 5e SRD mechanics.
 */

// Dice
export {
	createRng,
	d20,
	d20Advantage,
	d20Disadvantage,
	parseDiceNotation,
	rollDice,
	rollDie,
	xorshift32,
} from './dice.js';

// Abilities
export {
	abilityCheck,
	abilityModifier,
	getAbilityModifier,
	proficiencyBonus,
	rollAbilityScore,
	savingThrow,
	skillCheck,
	skillModifier,
	standardArray,
} from './abilities.js';
export type { CheckResult } from './abilities.js';

// Combat
export {
	applyDamage,
	applyHealing,
	initiativeOrder,
	isDead,
	isUnconscious,
	meleeAttack,
	passivePerception,
	rangedAttack,
	rollInitiative,
} from './combat.js';
export type { AttackResult } from './combat.js';

// NPC Generator
export { generateNpc } from './npc-generator.js';

// Ward System
export {
	applyWardEvent,
	canCreatureBreach,
	computeNaturalDecay,
	getThreadcraftBonus,
	getWardThreshold,
} from './ward.js';

// Fray Exposure
export {
	frayExposureSave,
	getAllFrayEffects,
	getExposureDC,
	getFrayEffects,
	isExposureImmune,
} from './fray.js';
export type { FrayExposureResult } from './fray.js';

// Skill Challenges
export {
	getApplicableSkills,
	getChallengeDC,
	getFailureConsequence,
	runSkillChallenge,
} from './skill-challenge.js';
export type { ChallengeAttempt } from './skill-challenge.js';

// Encounters
export {
	applyWeaveModifiers,
	encounterXP,
	findEncounterTable,
	rollEncounter,
	rollEncounterWithWeave,
} from './encounter.js';
export type { EncounterResult, ResolvedCreature, WeaveEncounterModifiers } from './encounter.js';

// Weather & Seasons
export {
	advanceCeremonyCalendar,
	computeCeremonyWardChange,
	generateWeather,
	getCeremonySchedule,
	getForageDC,
	getLightLevel,
	getSeasonalModifiers,
	getWeatherEffects,
} from './weather.js';
