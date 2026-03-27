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
		creatures,
		vocabulary,
		tierOverrides,
	};
}

/**
 * Load vocabulary tables — shared base + world-specific overlay.
 */
async function loadVocabulary(
	worldsDir: string,
	worldId: string,
): Promise<WorldConfig['vocabulary']> {
	const sharedVocabDir = join(worldsDir, 'shared', 'vocabulary');
	const worldVocabDir = join(worldsDir, worldId, 'vocabulary');

	const result: WorldConfig['vocabulary'] = {};

	// Load each vocabulary table (shared, then overlay with world-specific)
	const tableNames = ['biome_descriptors', 'time_of_day', 'weather_descriptors', 'settlement_descriptors', 'building_styles'] as const;
	const fieldNames = ['biomes', 'timeOfDay', 'weather', 'settlements', 'buildingStyles'] as const;

	for (let i = 0; i < tableNames.length; i++) {
		const tableName = tableNames[i];
		const fieldName = fieldNames[i];

		// Load shared
		let table = await loadOptionalJsonFile<VocabularyTable>(
			join(sharedVocabDir, `${tableName}.json`),
		);

		// Overlay world-specific
		const worldTable = await loadOptionalJsonFile<VocabularyTable>(
			join(worldVocabDir, `${tableName}.json`),
		);

		if (worldTable) {
			table = table ? { ...table, ...worldTable } : worldTable;
		}

		if (table) {
			result[fieldName] = table;
		}
	}

	return Object.keys(result).length > 0 ? result : undefined;
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
