/**
 * World state management.
 *
 * Manages the chunk cache, lazy generation, and tile access.
 * The World is the primary interface for the game engine to interact
 * with the generated terrain.
 */

import type {
	BiomeType,
	Chunk,
	ChunkCoord,
	GameTime,
	Season,
	TimeOfDay,
	TileCoord,
	Weather,
	WorldEvent,
	WorldSeed,
	WorldTile,
} from '@loreweave/types';
import { CHUNK_SIZE } from '@loreweave/types';
import { generateChunk, worldToChunkCoord, worldToLocalCoord } from './chunk-generator.js';

/** Chunk key for Map lookup. */
function chunkKey(cx: number, cy: number): string {
	return `${cx},${cy}`;
}

export class World {
	readonly seed: WorldSeed;
	private chunks: Map<string, Chunk> = new Map();
	private events: WorldEvent[] = [];
	time: GameTime;
	weather: Weather;
	season: Season;

	constructor(seed: WorldSeed) {
		this.seed = seed;
		this.time = { day: 1, hour: 8, minute: 0 };
		this.weather = 'clear';
		this.season = 'spring';
	}

	/** Get a chunk, generating it if necessary (lazy generation). §13.2 */
	getChunk(coord: ChunkCoord): Chunk {
		const key = chunkKey(coord.cx, coord.cy);
		let chunk = this.chunks.get(key);
		if (!chunk) {
			chunk = generateChunk(this.seed, coord);
			this.chunks.set(key, chunk);
		}
		return chunk;
	}

	/** Get a tile at world-space coordinates. Generates the chunk if needed. */
	getTile(x: number, y: number): WorldTile {
		const coord = worldToChunkCoord(x, y);
		const chunk = this.getChunk(coord);
		const { lx, ly } = worldToLocalCoord(x, y);
		return chunk.tiles[ly * CHUNK_SIZE + lx];
	}

	/** Get all tiles in a rectangular area. */
	getTilesInArea(x: number, y: number, width: number, height: number): WorldTile[] {
		const tiles: WorldTile[] = [];
		for (let dy = 0; dy < height; dy++) {
			for (let dx = 0; dx < width; dx++) {
				tiles.push(this.getTile(x + dx, y + dy));
			}
		}
		return tiles;
	}

	/** Get visible tiles around a position (square area). */
	getVisibleTiles(center: TileCoord, radius: number): WorldTile[] {
		return this.getTilesInArea(
			center.x - radius,
			center.y - radius,
			radius * 2 + 1,
			radius * 2 + 1,
		);
	}

	/** Check if a tile is loaded (chunk exists in cache). */
	isLoaded(x: number, y: number): boolean {
		const coord = worldToChunkCoord(x, y);
		return this.chunks.has(chunkKey(coord.cx, coord.cy));
	}

	/** Get the number of loaded chunks. */
	get loadedChunkCount(): number {
		return this.chunks.size;
	}

	/** Unload a chunk from the cache. Used for memory management. */
	unloadChunk(coord: ChunkCoord): void {
		this.chunks.delete(chunkKey(coord.cx, coord.cy));
	}

	/**
	 * Ensure chunks within a radius of a position are loaded.
	 * Useful for pre-loading around player positions.
	 *
	 * @param center - World-space center position
	 * @param chunkRadius - Number of chunks to load in each direction
	 */
	ensureLoadedRadius(center: TileCoord, chunkRadius: number): void {
		const centerChunk = worldToChunkCoord(center.x, center.y);
		for (let dy = -chunkRadius; dy <= chunkRadius; dy++) {
			for (let dx = -chunkRadius; dx <= chunkRadius; dx++) {
				this.getChunk({ cx: centerChunk.cx + dx, cy: centerChunk.cy + dy });
			}
		}
	}

	/** Add a world event. */
	addEvent(event: WorldEvent): void {
		this.events.push(event);
	}

	/** Get events at or near a location. */
	getEventsAt(location: TileCoord, radius: number = 0): WorldEvent[] {
		return this.events.filter((e) => {
			const dx = e.location.x - location.x;
			const dy = e.location.y - location.y;
			return Math.abs(dx) <= radius && Math.abs(dy) <= radius;
		});
	}

	/** Get recent events (within the last N game days). */
	getRecentEvents(withinDays: number): WorldEvent[] {
		const cutoff = this.time.day - withinDays;
		return this.events.filter((e) => e.timestamp.day >= cutoff);
	}

	/** Advance game time by the given number of minutes. */
	advanceTime(minutes: number): void {
		this.time.minute += minutes;
		while (this.time.minute >= 60) {
			this.time.minute -= 60;
			this.time.hour++;
		}
		while (this.time.hour >= 24) {
			this.time.hour -= 24;
			this.time.day++;
		}
		// Update season every 90 days
		this.season = dayToSeason(this.time.day);
	}

	/** Get the current time of day. */
	getTimeOfDay(): TimeOfDay {
		return hourToTimeOfDay(this.time.hour);
	}

	/** Get chunk coordinates for all loaded chunks. */
	getLoadedChunkCoords(): ChunkCoord[] {
		return [...this.chunks.values()].map((c) => c.coord);
	}

	/** Count tiles of a specific biome within loaded chunks. */
	countBiomeTiles(biome: BiomeType): number {
		let count = 0;
		for (const chunk of this.chunks.values()) {
			for (const tile of chunk.tiles) {
				if (tile.biome === biome) count++;
			}
		}
		return count;
	}
}

/** Map hour to time of day. */
function hourToTimeOfDay(hour: number): TimeOfDay {
	if (hour >= 5 && hour < 7) return 'dawn';
	if (hour >= 7 && hour < 10) return 'morning';
	if (hour >= 10 && hour < 14) return 'noon';
	if (hour >= 14 && hour < 17) return 'afternoon';
	if (hour >= 17 && hour < 19) return 'dusk';
	if (hour >= 19 && hour < 22) return 'evening';
	if (hour >= 22 || hour < 1) return 'night';
	return 'midnight';
}

/** Map day number to season (90-day cycles). */
function dayToSeason(day: number): Season {
	const dayInYear = ((day - 1) % 360);
	if (dayInYear < 90) return 'spring';
	if (dayInYear < 180) return 'summer';
	if (dayInYear < 270) return 'autumn';
	return 'winter';
}
