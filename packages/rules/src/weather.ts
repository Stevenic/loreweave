/**
 * Weather & Seasons — deterministic weather generation and seasonal mechanics.
 *
 * Implements Loremaster's Weather & Seasons Mechanical Specification:
 * - 7 weather types with D&D 5e environmental effects
 * - 4 seasons with travel/foraging/encounter/rest modifiers
 * - Deterministic generation from (seed, day, watch, biome, season, weaveState)
 * - Weave state amplification (Thin → Frayed → Unraveled)
 * - Wheel of Binding ceremony calendar
 *
 * All functions are pure. No side effects.
 */

import type {
	BiomeType,
	BiomeWeatherModifiers,
	CeremonyDefinition,
	CeremonyResult,
	LightLevel,
	Season,
	SeasonModifiers,
	SeasonWeatherTable,
	TimeOfDay,
	Weather,
	WeatherEffects,
	WeatherResult,
	WeaveState,
} from '@loreweave/types';
import { createRng, rollDie } from './dice.js';

// ─── Season Weather Probability Tables ───
// Values are percentages (must sum to ~100 per season).

const SEASON_TABLES: Record<Season, SeasonWeatherTable> = {
	spring: { clear: 20, overcast: 30, rain: 40, fog: 10 },
	summer: { clear: 40, overcast: 25, storm: 20, rain: 15 },
	autumn: { clear: 15, overcast: 30, rain: 25, fog: 25, storm: 5 },
	winter: { clear: 20, overcast: 25, snow: 30, blizzard: 15, fog: 10 },
};

// ─── Biome Weather Modifiers ───
// Positive = increase chance, negative = decrease. Applied to seasonal base.

const BIOME_MODIFIERS: Record<BiomeType, BiomeWeatherModifiers> = {
	forest: { rain: 10, fog: 5 },
	plains: { storm: 5 },
	mountain: { storm: 10, snow: 15, blizzard: 10 },
	swamp: { rain: 10, fog: 20 },
	tundra: { snow: 20, blizzard: 15 },
	desert: { rain: -20, storm: -10, fog: -15, snow: -20, blizzard: -20 },
	taiga: { fog: 5, snow: 10, blizzard: 5 },
	coast: { rain: 10, storm: 15, fog: 15 },
	hills: { rain: 5, storm: 5, fog: 15, snow: 5 },
	cavern: {}, // No weather underground
	farmland: { fog: 5 },
	deep_forest: { rain: 5, storm: -5, fog: 10 },
};

// ─── Seasonal Modifier Definitions ───

const SEASONAL_MODIFIERS: Record<Season, SeasonModifiers> = {
	spring: {
		travelSpeedMod: 1.0,
		forageDC: 12,
		encounterFreqMod: 1.0,
		restQuality: 'normal',
		wardDecayRate: -1,
	},
	summer: {
		travelSpeedMod: 1.0,
		forageDC: 10,
		encounterFreqMod: 1.1,
		restQuality: 'normal',
		wardDecayRate: -1,
	},
	autumn: {
		travelSpeedMod: 0.75,
		forageDC: 14,
		encounterFreqMod: 1.2,
		restQuality: 'normal',
		wardDecayRate: -1,
	},
	winter: {
		travelSpeedMod: 0.5,
		forageDC: 18,
		encounterFreqMod: 0.75,
		restQuality: 'impaired',
		wardDecayRate: -2,
	},
};

// ─── Ceremony Calendar (Wheel of Binding) ───

const CEREMONY_SCHEDULE: CeremonyDefinition[] = [
	{ name: 'The Winter Binding', month: 1, season: 'winter', wardBonus: 12, isHollowing: false },
	{ name: 'The First Thread', month: 3, season: 'spring', wardBonus: 12, isHollowing: false },
	{ name: 'The Greening Knot', month: 4, season: 'spring', wardBonus: 12, isHollowing: false },
	{ name: 'The High Thread', month: 6, season: 'summer', wardBonus: 12, isHollowing: false },
	{ name: 'The Midsummer Binding', month: 7, season: 'summer', wardBonus: 12, isHollowing: false },
	{ name: 'The Waning Song', month: 9, season: 'autumn', wardBonus: 12, isHollowing: false },
	{ name: 'The Harvest Knot', month: 10, season: 'autumn', wardBonus: 12, isHollowing: false },
	{ name: 'The Hollowing', month: 11, season: 'autumn', wardBonus: 24, isHollowing: true },
];

// ─── Weather Effects Definitions ───

const BASE_WEATHER_EFFECTS: Record<Weather, WeatherEffects> = {
	clear: {
		visibility: 'normal',
		visibilityRange: -1,
		hearingPenalty: 'none',
		hearingRange: -1,
		terrainMod: 'normal',
		fireMod: 0,
		rangedPenalty: 'none',
		concentrationDC: 0,
		exposureDC: 0,
		exposureInterval: 0,
		travelSpeedMod: 1.0,
	},
	overcast: {
		visibility: 'normal',
		visibilityRange: -1,
		hearingPenalty: 'none',
		hearingRange: -1,
		terrainMod: 'normal',
		fireMod: 0,
		rangedPenalty: 'none',
		concentrationDC: 0,
		exposureDC: 0,
		exposureInterval: 0,
		travelSpeedMod: 1.0,
	},
	rain: {
		visibility: 'lightly_obscured',
		visibilityRange: 100,
		hearingPenalty: 'disadvantage',
		hearingRange: -1,
		terrainMod: 'normal', // becomes difficult after 4 hours
		fireMod: 2,
		rangedPenalty: 'none',
		concentrationDC: 0,
		exposureDC: 0,
		exposureInterval: 0,
		travelSpeedMod: 1.0,
	},
	storm: {
		visibility: 'heavily_obscured',
		visibilityRange: 60,
		hearingPenalty: 'auto_fail',
		hearingRange: 30,
		terrainMod: 'difficult',
		fireMod: 5,
		rangedPenalty: 'disadvantage',
		concentrationDC: 10,
		exposureDC: 0,
		exposureInterval: 0,
		travelSpeedMod: 0.5,
	},
	fog: {
		visibility: 'heavily_obscured',
		visibilityRange: 30,
		hearingPenalty: 'none',
		hearingRange: -1,
		terrainMod: 'normal',
		fireMod: 0,
		rangedPenalty: 'none',
		concentrationDC: 0,
		exposureDC: 0,
		exposureInterval: 0,
		travelSpeedMod: 1.0,
	},
	snow: {
		visibility: 'lightly_obscured',
		visibilityRange: -1,
		hearingPenalty: 'none',
		hearingRange: -1,
		terrainMod: 'normal', // becomes difficult after 4 hours accumulation
		fireMod: 0,
		rangedPenalty: 'none',
		concentrationDC: 0,
		exposureDC: 10,
		exposureInterval: 60,
		travelSpeedMod: 0.67,
	},
	blizzard: {
		visibility: 'heavily_obscured',
		visibilityRange: 15,
		hearingPenalty: 'auto_fail',
		hearingRange: 15,
		terrainMod: 'difficult',
		fireMod: 0,
		rangedPenalty: 'auto_miss_beyond_30',
		concentrationDC: 0,
		exposureDC: 13,
		exposureInterval: 30,
		travelSpeedMod: 0.25,
	},
};

// ─── Biome Foraging DC Modifiers ───

const BIOME_FORAGE_DC: Partial<Record<BiomeType, number>> = {
	swamp: -2,
	forest: -1,
	deep_forest: -1,
	farmland: -3,
	coast: -1,
	plains: 0,
	hills: 0,
	mountain: 2,
	tundra: 2,
	desert: 4,
	taiga: 1,
	cavern: 3,
};

// ─── Core Functions ───

/**
 * Generate weather deterministically for a given watch.
 *
 * §4.1: Weather is generated from (worldSeed, day, watchIndex, biome, season, weaveState).
 * §4.3: Weather persists for 1-4 watches; 30% same-weather continuation bias.
 * §4.4: Weave state amplifies weather (Frayed = severity+1, Unraveled = chaotic).
 */
export function generateWeather(
	seed: number,
	day: number,
	watch: number,
	biome: BiomeType,
	season: Season,
	weaveState: WeaveState,
): WeatherResult {
	// Caverns have no weather
	if (biome === 'cavern') {
		return { type: 'clear', persistence: 4, amplified: false, frayPhenomenon: false };
	}

	// Seed RNG from inputs
	const rng = createRng(hashWeatherSeed(seed, day, watch));

	// Get base probability table for this season
	const baseTable = { ...SEASON_TABLES[season] };

	// Apply biome modifiers
	const modifiers = BIOME_MODIFIERS[biome];
	for (const [weather, mod] of Object.entries(modifiers) as [Weather, number][]) {
		baseTable[weather] = Math.max(0, (baseTable[weather] ?? 0) + mod);
	}

	// Normalize probabilities to sum to 100
	const entries = Object.entries(baseTable) as [Weather, number][];
	const total = entries.reduce((sum, [, v]) => sum + v, 0);
	if (total <= 0) {
		return { type: 'clear', persistence: 1, amplified: false, frayPhenomenon: false };
	}

	// Roll weather (1-100)
	const roll = Math.floor(rng() * 100) + 1;
	let cumulative = 0;
	let selectedWeather: Weather = 'clear';
	for (const [weather, prob] of entries) {
		cumulative += (prob / total) * 100;
		if (roll <= cumulative) {
			selectedWeather = weather;
			break;
		}
	}

	// Determine persistence (1-4 watches)
	const persistence = rollDie(4, rng);

	// Apply weave state amplification
	let amplified = false;
	let frayPhenomenon = false;

	if (weaveState === 'frayed') {
		// One severity step increase
		const upgraded = amplifyWeather(selectedWeather);
		if (upgraded !== selectedWeather) {
			selectedWeather = upgraded;
			amplified = true;
		}
		// 25% chance of Fray phenomenon
		frayPhenomenon = rng() < 0.25;
	} else if (weaveState === 'unraveled') {
		// Chaotic: can produce impossible weather
		amplified = true;
		frayPhenomenon = rng() < 0.50;
		// Re-roll from all weather types (ignoring season)
		const allWeather: Weather[] = ['clear', 'overcast', 'rain', 'storm', 'fog', 'snow', 'blizzard'];
		selectedWeather = allWeather[Math.floor(rng() * allWeather.length)];
	}

	return {
		type: selectedWeather,
		persistence,
		amplified,
		frayPhenomenon,
	};
}

/**
 * Get seasonal modifiers.
 * Pure lookup — returns travel speed, foraging DC, encounter frequency,
 * rest quality, and ward decay rate for the given season.
 */
export function getSeasonalModifiers(season: Season): SeasonModifiers {
	return { ...SEASONAL_MODIFIERS[season] };
}

/**
 * Get the mechanical effects of a weather condition.
 *
 * Composes base weather effects with weave state amplification:
 * - Frayed: all DCs +2
 * - Unraveled: all DCs +5
 */
export function getWeatherEffects(weather: Weather, weaveState: WeaveState): WeatherEffects {
	const base = { ...BASE_WEATHER_EFFECTS[weather] };

	if (weaveState === 'frayed') {
		if (base.concentrationDC > 0) base.concentrationDC += 2;
		if (base.exposureDC > 0) base.exposureDC += 2;
	} else if (weaveState === 'unraveled') {
		if (base.concentrationDC > 0) base.concentrationDC += 5;
		if (base.exposureDC > 0) base.exposureDC += 5;
	}

	return base;
}

/**
 * Determine the light level based on time of day, weather, and biome.
 *
 * §3.1: Dawn/dusk = dim, night (no moon) = dark, night (moon) = dim outdoors.
 * Underground (cavern) is always dark without a light source.
 * Weather reduces light by one step (fog/blizzard → dim becomes dark).
 */
export function getLightLevel(
	timeOfDay: TimeOfDay,
	weather: Weather,
	biome: BiomeType,
): LightLevel {
	// Underground is always dark
	if (biome === 'cavern') return 'dark';

	// Base light from time of day
	let level: LightLevel;
	switch (timeOfDay) {
		case 'dawn':
		case 'dusk':
			level = 'dim';
			break;
		case 'night':
		case 'midnight':
			level = 'dark';
			break;
		default:
			level = 'bright';
	}

	// Weather can reduce light by one step
	if (weather === 'fog' || weather === 'blizzard' || weather === 'storm') {
		level = reduceLightLevel(level);
	}

	// Deep forest canopy reduces light by one step during day
	if (biome === 'deep_forest' && level === 'bright') {
		level = 'dim';
	}

	return level;
}

/**
 * Advance the ceremony calendar — compute ward strength changes.
 *
 * Applies weekly decay and processes any ceremony that falls on the given day.
 * Returns updated ward strength.
 *
 * §5.2: Base decay -1/week, winter -2/week.
 * §5.4: Flawless = +18 (or +36 during Hollowing). Failed = -6 (or -12 during Hollowing).
 */
export function advanceCeremonyCalendar(
	currentDay: number,
	wardStrength: number,
	ceremonyResults: CeremonyResult[],
	season: Season,
): number {
	let strength = wardStrength;

	// Apply weekly decay (every 7 days)
	if (currentDay % 7 === 0) {
		const modifiers = SEASONAL_MODIFIERS[season];
		strength += modifiers.wardDecayRate;
	}

	// Check if today is a ceremony day
	const dayInYear = ((currentDay - 1) % 360) + 1;
	const month = Math.ceil(dayInYear / 30);

	const ceremony = CEREMONY_SCHEDULE.find((c) => c.month === month);
	if (ceremony && dayInYear === (ceremony.month - 1) * 30 + 15) {
		// It's ceremony day (mid-month)
		const result = ceremonyResults.find(
			(r) => r.day === currentDay,
		);

		if (result) {
			strength += result.wardChange;
		} else {
			// Missed ceremony — no recovery
			// Future: track cumulative DC increase
		}
	}

	// Clamp to 0-100
	return Math.max(0, Math.min(100, strength));
}

/**
 * Compute the foraging DC based on biome, season, and weather.
 *
 * §6.6: Base DC from season, modified by biome and weather.
 * Storm/blizzard adds +5.
 */
export function getForageDC(biome: BiomeType, season: Season, weather: Weather): number {
	const baseDC = SEASONAL_MODIFIERS[season].forageDC;
	const biomeMod = BIOME_FORAGE_DC[biome] ?? 0;

	let weatherMod = 0;
	if (weather === 'storm' || weather === 'blizzard') {
		weatherMod = 5;
	}

	return baseDC + biomeMod + weatherMod;
}

/**
 * Get the full ceremony schedule (Wheel of Binding).
 * Returns all 8 ceremony definitions.
 */
export function getCeremonySchedule(): readonly CeremonyDefinition[] {
	return CEREMONY_SCHEDULE;
}

/**
 * Compute the ward strength change for a ceremony result.
 *
 * §5.4:
 * - Success: +wardBonus (12, or 24 for Hollowing)
 * - Flawless: +wardBonus * 1.5
 * - Failure: -wardBonus / 2
 */
export function computeCeremonyWardChange(
	ceremonyIndex: number,
	successes: number,
	failures: number,
	maxSuccesses: number,
): number {
	const ceremony = CEREMONY_SCHEDULE[ceremonyIndex];
	if (!ceremony) return 0;

	const flawless = successes >= maxSuccesses && failures === 0;
	const success = successes >= maxSuccesses;

	if (flawless) {
		// +18 normal, +36 Hollowing
		return Math.floor(ceremony.wardBonus * 1.5);
	}
	if (success) {
		return ceremony.wardBonus;
	}
	// Failed: -6 normal, -12 Hollowing
	return -Math.floor(ceremony.wardBonus / 2);
}

// ─── Helpers ───

/** Hash weather seed from components for deterministic generation. */
function hashWeatherSeed(seed: number, day: number, watch: number): number {
	// FNV-1a inspired hash
	let h = 2166136261;
	h = Math.imul(h ^ seed, 16777619);
	h = Math.imul(h ^ day, 16777619);
	h = Math.imul(h ^ watch, 16777619);
	return h >>> 0;
}

/** Increase weather severity by one step. */
function amplifyWeather(weather: Weather): Weather {
	switch (weather) {
		case 'clear': return 'fog';
		case 'overcast': return 'rain';
		case 'rain': return 'storm';
		case 'snow': return 'blizzard';
		default: return weather; // storm, fog, blizzard can't amplify further
	}
}

/** Reduce light level by one step. */
function reduceLightLevel(level: LightLevel): LightLevel {
	switch (level) {
		case 'bright': return 'dim';
		case 'dim': return 'dark';
		default: return 'dark';
	}
}
