/**
 * Context Assembler — builds NarrativeContext from game state.
 *
 * Gathers everything the LLM needs to render narrative:
 * location, entities, weather, time, party state, exits, quest hints.
 * All pure functions — no side effects.
 */

import type {
	BiomeType,
	Character,
	CharacterSummary,
	DMConfig,
	Direction,
	EntityRef,
	ExitInfo,
	GameSession,
	NarrativeContext,
	Quest,
	TileCoord,
	WorldAccess,
	WorldTile,
} from '@loreweave/types';
import { DIRECTION_OFFSETS } from '@loreweave/types';

/**
 * Assemble the full narrative context for the LLM.
 *
 * This is the primary function — it gathers location, entities,
 * weather, time, party state, exits, and quest hints into a
 * single NarrativeContext object.
 */
export function assembleContext(
	session: GameSession,
	config: DMConfig,
): NarrativeContext {
	const partyLocation = getPartyLocation(session.party);
	const tile = session.world.getTile(partyLocation.x, partyLocation.y);
	const recentEvents = session.world.getEventsAt(partyLocation, config.viewRadius);
	const nearbyExits = scanExits(session.world, partyLocation);
	const players = summarizeParty(session.party);
	const questHints = gatherQuestHints(session.quests, tile, session.knownEntities);

	return {
		location: tile,
		visibleEntities: session.knownEntities,
		weather: session.world.weather,
		timeOfDay: session.world.getTimeOfDay(),
		season: session.world.season,
		recentEvents: recentEvents.slice(-config.recentEventCount),
		players,
		nearbyExits,
		questHints,
	};
}

/** Get the party's current location (uses first character's position). */
export function getPartyLocation(party: Character[]): TileCoord {
	if (party.length === 0) {
		return { x: 0, y: 0 };
	}
	return party[0].location;
}

/** Scan adjacent tiles to build exit descriptions. */
export function scanExits(
	world: { getTile(x: number, y: number): WorldTile },
	center: TileCoord,
): ExitInfo[] {
	const exits: ExitInfo[] = [];
	const directions = Object.entries(DIRECTION_OFFSETS) as [Direction, TileCoord][];

	for (const [direction, offset] of directions) {
		const nx = center.x + offset.x;
		const ny = center.y + offset.y;
		const tile = world.getTile(nx, ny);

		exits.push({
			direction,
			description: describeExit(tile),
			biome: tile.biome,
		});
	}

	return exits;
}

/** Generate a brief description of an exit tile. */
function describeExit(tile: WorldTile): string {
	const parts: string[] = [];

	if (!tile.walkable) {
		parts.push('impassable');
	}

	parts.push(BIOME_DESCRIPTIONS[tile.biome] ?? tile.biome);

	if (tile.river) {
		parts.push('with a river');
	}

	if (tile.structures.length > 0) {
		parts.push(`(${tile.structures.join(', ')})`);
	}

	return parts.join(' ');
}

const BIOME_DESCRIPTIONS: Record<BiomeType, string> = {
	forest: 'dense forest',
	plains: 'open plains',
	mountain: 'rocky mountains',
	swamp: 'murky swamp',
	tundra: 'frozen tundra',
	desert: 'arid desert',
	taiga: 'snowy taiga',
	coast: 'windswept coastline',
	hills: 'rolling moorland',
	cavern: 'dark cavern',
	farmland: 'cultivated farmland',
	deep_forest: 'ancient deep forest',
};

/** Summarize the party for the LLM context (no full stat blocks). */
export function summarizeParty(party: Character[]): CharacterSummary[] {
	return party.map((c) => ({
		name: c.name,
		hp: c.hp,
		maxHp: c.maxHp,
		conditions: c.conditions,
	}));
}

/**
 * Gather quest-relevant hints for the current location.
 * If a quest objective relates to the current tile, nearby entities,
 * or current biome, surface a hint.
 */
export function gatherQuestHints(
	quests: Quest[],
	tile: WorldTile,
	entities: EntityRef[],
): string[] {
	const hints: string[] = [];
	const entityNames = new Set(entities.map((e) => e.name.toLowerCase()));
	const entityTypes = new Set(entities.map((e) => e.type.toLowerCase()));

	for (const quest of quests) {
		for (const objective of quest.objectives) {
			const target = objective.target.toLowerCase();

			// Check if the objective target is a nearby entity
			if (entityNames.has(target) || entityTypes.has(target)) {
				hints.push(`Quest "${quest.name}": ${objective.description} — target is nearby`);
				continue;
			}

			// Check if the objective type matches the location
			if (objective.type === 'explore' && tile.biome === target) {
				hints.push(`Quest "${quest.name}": ${objective.description} — you are in the right area`);
				continue;
			}

			// Check if resources match a gather objective
			if (objective.type === 'gather' && tile.resources.some((r) => r.toLowerCase() === target)) {
				hints.push(`Quest "${quest.name}": ${objective.description} — resources available here`);
			}
		}
	}

	return hints;
}
