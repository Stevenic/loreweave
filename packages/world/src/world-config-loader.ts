/**
 * World Config Loader — reads WorldConfig from a world's directory.
 *
 * Each world has a config/ directory containing JSON files for:
 * - persona.json — DM personality
 * - stat-tiers.json — NPC stat tier definitions
 * - ward.json — ward thresholds and events (optional)
 * - fray.json — fray exposure config (optional)
 * - encounters.json — encounter tables (optional)
 * - creatures.json — creature stat blocks (optional)
 * - skill-challenges.json — skill challenge templates (optional)
 *
 * Vocabulary tables are loaded from worlds/shared/vocabulary/ and
 * optionally overlaid from worlds/<name>/vocabulary/.
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type {
	CreatureStatBlock,
	DMPersona,
	DungeonEncounterModifier,
	EncounterTable,
	FrayExposureConfig,
	SkillChallengeConfig,
	StatTierDefinition,
	StatsTier,
	VocabularyTable,
	WardEventDefinition,
	WardThreshold,
	WorldConfig,
} from '@loreweave/types';

/**
 * Load a WorldConfig from a world directory.
 *
 * @param worldsDir - Path to the worlds/ root directory
 * @param worldId - The world identifier (directory name)
 */
export async function loadWorldConfig(
	worldsDir: string,
	worldId: string,
): Promise<WorldConfig> {
	const configDir = join(worldsDir, worldId, 'config');

	// Required: persona and stat tiers
	const persona = await loadJsonFile<DMPersona>(join(configDir, 'persona.json'));
	const statTiers = await loadJsonFile<StatTierDefinition[]>(join(configDir, 'stat-tiers.json'));

	// Optional: world-specific systems
	const wardData = await loadOptionalJsonFile<{ thresholds: WardThreshold[]; events: WardEventDefinition[] }>(
		join(configDir, 'ward.json'),
	);
	const frayExposure = await loadOptionalJsonFile<FrayExposureConfig>(
		join(configDir, 'fray.json'),
	);
	const encounterData = await loadOptionalJsonFile<{ tables: EncounterTable[]; dungeonModifiers?: DungeonEncounterModifier[] }>(
		join(configDir, 'encounters.json'),
	);
	const creatures = await loadOptionalJsonFile<CreatureStatBlock[]>(
		join(configDir, 'creatures.json'),
	);
	const highCrCreatures = await loadOptionalJsonFile<CreatureStatBlock[]>(
		join(configDir, 'high_cr_creatures.json'),
	);
	const allCreatures = creatures || highCrCreatures
		? [...(creatures ?? []), ...(highCrCreatures ?? [])]
		: undefined;
	const skillChallenges = await loadOptionalJsonFile<SkillChallengeConfig[]>(
		join(configDir, 'skill-challenges.json'),
	);
	const tierOverrides = await loadOptionalJsonFile<Record<string, StatsTier>>(
		join(configDir, 'tier-overrides.json'),
	);

	// Load vocabulary tables (shared + world-specific overlay)
	const vocabulary = await loadVocabulary(worldsDir, worldId);

	// Load world metadata
	const meta = await loadOptionalJsonFile<{ id: string; name: string; description: string }>(
		join(configDir, 'world.json'),
	);

	return {
		id: meta?.id ?? worldId,
		name: meta?.name ?? worldId,
		description: meta?.description ?? '',
		persona,
		statTiers,
		wardThresholds: wardData?.thresholds,
		wardEvents: wardData?.events,
		frayExposure,
		encounterTables: encounterData?.tables,
		dungeonModifiers: encounterData?.dungeonModifiers,
		skillChallenges,
		creatures: allCreatures,
		vocabulary,
		tierOverrides,
	};
}

/**
 * Vocabulary file definitions — maps field name to file path and data key.
 *
 * The JSON files have a wrapper object (e.g., `{ "id": "...", "biomes": {...} }`).
 * The `dataKey` specifies which key contains the actual VocabularyTable data.
 */
const VOCABULARY_FILES = [
	{ field: 'biomes' as const, subdir: 'atmosphere', file: 'biome_descriptors.json', dataKey: 'biomes' },
	{ field: 'timeOfDay' as const, subdir: 'atmosphere', file: 'time_of_day.json', dataKey: 'times' },
	{ field: 'weather' as const, subdir: 'atmosphere', file: 'weather_descriptors.json', dataKey: 'weather' },
	{ field: 'settlements' as const, subdir: 'atmosphere', file: 'settlement_descriptors.json', dataKey: 'settlements' },
	{ field: 'buildingStyles' as const, subdir: 'architecture', file: 'building_styles.json', dataKey: 'styles' },
] as const;

/**
 * Load vocabulary tables — shared base + world-specific overlay.
 *
 * Vocabulary JSON files live in subdirectories (atmosphere/, architecture/)
 * and have a wrapper object around the actual vocabulary data.
 */
async function loadVocabulary(
	worldsDir: string,
	worldId: string,
): Promise<WorldConfig['vocabulary']> {
	const sharedVocabDir = join(worldsDir, 'shared', 'vocabulary');
	const worldVocabDir = join(worldsDir, worldId, 'vocabulary');

	const result: WorldConfig['vocabulary'] = {};

	for (const def of VOCABULARY_FILES) {
		// Load shared (try subdir path, then flat path as fallback)
		let table = await loadVocabTable(join(sharedVocabDir, def.subdir, def.file), def.dataKey)
			?? await loadVocabTable(join(sharedVocabDir, def.file), def.dataKey);

		// Overlay world-specific
		const worldTable = await loadVocabTable(join(worldVocabDir, def.subdir, def.file), def.dataKey)
			?? await loadVocabTable(join(worldVocabDir, def.file), def.dataKey);

		if (worldTable) {
			table = table ? { ...table, ...worldTable } : worldTable;
		}

		if (table) {
			result[def.field] = table;
		}
	}

	return Object.keys(result).length > 0 ? result : undefined;
}

/**
 * Load a vocabulary table from a JSON file, extracting the data from a wrapper object.
 * Returns undefined if the file doesn't exist or the data key is missing.
 */
async function loadVocabTable(
	filePath: string,
	dataKey: string,
): Promise<VocabularyTable | undefined> {
	try {
		const content = await readFile(filePath, 'utf-8');
		const data = JSON.parse(content) as Record<string, unknown>;
		// Try the specific data key first (e.g., "biomes", "times")
		const table = data[dataKey] as VocabularyTable | undefined;
		if (table && typeof table === 'object') return table;
		// Fallback: if no wrapper key, treat the whole object as a table
		// (excluding metadata fields)
		const { id: _id, type: _type, description: _desc, ...rest } = data;
		if (Object.keys(rest).length > 0) return rest as VocabularyTable;
		return undefined;
	} catch {
		return undefined;
	}
}

/**
 * Read and parse a required JSON file. Throws on missing/invalid.
 */
async function loadJsonFile<T>(filePath: string): Promise<T> {
	const content = await readFile(filePath, 'utf-8');
	return JSON.parse(content) as T;
}

/**
 * Read and parse an optional JSON file. Returns undefined if missing.
 */
async function loadOptionalJsonFile<T>(filePath: string): Promise<T | undefined> {
	try {
		const content = await readFile(filePath, 'utf-8');
		return JSON.parse(content) as T;
	} catch {
		return undefined;
	}
}
