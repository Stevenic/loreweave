/**
 * Action Resolver — routes GameActions through the rules engine.
 *
 * Takes a parsed GameAction, resolves it mechanically using the
 * D&D 5e rules engine, and returns an ActionResult with effects.
 * All functions are pure — state changes are returned as effects,
 * not applied directly.
 */

import type {
	ActionResult,
	Character,
	DMConfig,
	GameAction,
	GameEffect,
	TileCoord,
	WorldAccess,
} from '@loreweave/types';
import { DIRECTION_OFFSETS } from '@loreweave/types';
import { createRng, parseDiceNotation, rollDice } from '@loreweave/rules';
import { meleeAttack, rangedAttack, applyDamage, applyHealing, passivePerception } from '@loreweave/rules';
import { skillCheck } from '@loreweave/rules';

/**
 * Resolve a game action through the rules engine.
 *
 * @param action - The parsed game action
 * @param actor - The character performing the action
 * @param world - The world instance (for tile lookups)
 * @param characters - All characters (party + NPCs) for target resolution
 * @param config - DM configuration
 * @param turnSeed - Seed for this turn's RNG (deterministic)
 */
export function resolveAction(
	action: GameAction,
	actor: Character,
	world: WorldAccess,
	characters: Map<string, Character>,
	config: DMConfig,
	turnSeed: number,
): ActionResult {
	const rng = createRng(turnSeed);

	switch (action.type) {
		case 'move':
			return resolveMove(action, actor, world);
		case 'look':
			return resolveLook(actor, world);
		case 'attack':
			return resolveAttack(action, actor, characters, rng);
		case 'search':
			return resolveSearch(actor, world, rng, config);
		case 'rest':
			return resolveRest(actor);
		case 'talk':
			return resolveTalk(action, characters);
		case 'pickup':
			return resolvePickup(action, actor, world);
		case 'drop':
			return resolveDrop(action, actor);
		case 'use_item':
			return resolveUseItem(action, actor, rng);
		case 'craft':
			return resolveCraft(action, actor);
		default:
			return {
				success: false,
				action,
				effects: [],
				narrationHints: ['unknown_action'],
			};
	}
}

/**
 * Apply effects to the character roster.
 * Returns a new Map with updated characters — no mutation.
 */
export function applyEffects(
	characters: Map<string, Character>,
	effects: GameEffect[],
): Map<string, Character> {
	const updated = new Map(characters);

	for (const effect of effects) {
		switch (effect.type) {
			case 'move': {
				const char = updated.get(effect.entityId);
				if (char) {
					updated.set(effect.entityId, { ...char, location: effect.to });
				}
				break;
			}
			case 'damage': {
				const char = updated.get(effect.targetId);
				if (char) {
					updated.set(effect.targetId, applyDamage(char, effect.amount));
				}
				break;
			}
			case 'heal': {
				const char = updated.get(effect.targetId);
				if (char) {
					updated.set(effect.targetId, applyHealing(char, effect.amount));
				}
				break;
			}
			case 'condition_added': {
				const char = updated.get(effect.entityId);
				if (char && !char.conditions.includes(effect.condition)) {
					updated.set(effect.entityId, {
						...char,
						conditions: [...char.conditions, effect.condition],
					});
				}
				break;
			}
			case 'condition_removed': {
				const char = updated.get(effect.entityId);
				if (char) {
					updated.set(effect.entityId, {
						...char,
						conditions: char.conditions.filter((c) => c !== effect.condition),
					});
				}
				break;
			}
			case 'item_gained': {
				const char = updated.get(effect.entityId);
				if (char) {
					const slot = char.inventory.find((s) => s.item.id === effect.item.id);
					if (slot && effect.item.stackable) {
						const newSlot = { ...slot, quantity: slot.quantity + effect.quantity };
						updated.set(effect.entityId, {
							...char,
							inventory: char.inventory.map((s) => (s.item.id === effect.item.id ? newSlot : s)),
						});
					} else {
						updated.set(effect.entityId, {
							...char,
							inventory: [...char.inventory, { item: effect.item, quantity: effect.quantity }],
						});
					}
				}
				break;
			}
			case 'item_lost': {
				const char = updated.get(effect.entityId);
				if (char) {
					updated.set(effect.entityId, {
						...char,
						inventory: char.inventory
							.map((s) => {
								if (s.item.id === effect.itemId) {
									return { ...s, quantity: s.quantity - effect.quantity };
								}
								return s;
							})
							.filter((s) => s.quantity > 0),
					});
				}
				break;
			}
			// structure_placed and resource_gathered are world-level effects,
			// not character-level — handled by the DM when applying to world state
		}
	}

	return updated;
}

// ─── Individual Action Resolvers ───

function resolveMove(
	action: GameAction,
	actor: Character,
	world: WorldAccess,
): ActionResult {
	if (!action.direction) {
		return {
			success: false,
			action,
			effects: [],
			narrationHints: ['no_direction'],
		};
	}

	const offset = DIRECTION_OFFSETS[action.direction];
	const targetCoord: TileCoord = {
		x: actor.location.x + offset.x,
		y: actor.location.y + offset.y,
	};

	const targetTile = world.getTile(targetCoord.x, targetCoord.y);

	if (!targetTile.walkable) {
		return {
			success: false,
			action,
			effects: [],
			narrationHints: ['blocked_path', `surface:${targetTile.surface}`, `biome:${targetTile.biome}`],
		};
	}

	const effects: GameEffect[] = [
		{ type: 'move', entityId: actor.id, from: actor.location, to: targetCoord },
	];

	const hints: string[] = [`entered:${targetTile.biome}`, `surface:${targetTile.surface}`];
	if (targetTile.river) hints.push('river_crossing');
	if (targetTile.features.length > 0) {
		hints.push(`features:${targetTile.features.join(',')}`);
	}
	if (targetTile.structures.length > 0) {
		hints.push(`structures:${targetTile.structures.join(',')}`);
	}

	return { success: true, action, effects, narrationHints: hints };
}

function resolveLook(
	actor: Character,
	world: WorldAccess,
): ActionResult {
	const tile = world.getTile(actor.location.x, actor.location.y);
	const perception = passivePerception(actor);

	const hints: string[] = [
		`biome:${tile.biome}`,
		`surface:${tile.surface}`,
		`perception:${perception}`,
	];

	if (tile.river) hints.push('river_nearby');
	for (const feature of tile.features) {
		hints.push(`feature:${feature}`);
	}
	for (const structure of tile.structures) {
		hints.push(`structure:${structure}`);
	}
	for (const resource of tile.resources) {
		// Only surface resources if perception is high enough
		if (perception >= 12) {
			hints.push(`resource:${resource}`);
		}
	}

	return {
		success: true,
		action: { type: 'look', actorId: actor.id },
		effects: [],
		narrationHints: hints,
	};
}

function resolveAttack(
	action: GameAction,
	actor: Character,
	characters: Map<string, Character>,
	rng: () => number,
): ActionResult {
	if (!action.targetId) {
		return {
			success: false,
			action,
			effects: [],
			narrationHints: ['no_target'],
		};
	}

	const target = characters.get(action.targetId);
	if (!target) {
		return {
			success: false,
			action,
			effects: [],
			narrationHints: ['target_not_found'],
		};
	}

	// Default weapon: 1d6 (simple weapon). In the future, read from equipped weapon.
	const weaponDamage = parseDiceNotation('1d6');

	// Determine melee vs ranged based on distance
	const dx = Math.abs(actor.location.x - target.location.x);
	const dy = Math.abs(actor.location.y - target.location.y);
	const distance = Math.max(dx, dy);

	const result = distance <= 1
		? meleeAttack(actor, target, weaponDamage, rng)
		: rangedAttack(actor, target, weaponDamage, rng);

	return {
		success: result.hit,
		action,
		effects: result.effects,
		narrationHints: result.narrationHints,
	};
}

function resolveSearch(
	actor: Character,
	world: WorldAccess,
	rng: () => number,
	config: DMConfig,
): ActionResult {
	const tile = world.getTile(actor.location.x, actor.location.y);
	const check = skillCheck(actor, 'investigation', config.defaultDC, rng);

	const hints: string[] = [
		`investigation:${check.total}`,
		`dc:${config.defaultDC}`,
		check.success ? 'search_success' : 'search_failure',
	];

	const effects: GameEffect[] = [];

	if (check.success && tile.resources.length > 0) {
		// Gather the first available resource
		const resource = tile.resources[0];
		effects.push({
			type: 'resource_gathered',
			location: actor.location,
			resource,
			quantity: 1,
		});
		hints.push(`found:${resource}`);
	}

	if (check.critical) hints.push('critical_search');
	if (check.fumble) hints.push('fumble_search');

	return { success: check.success, action: { type: 'search', actorId: actor.id }, effects, narrationHints: hints };
}

function resolveRest(actor: Character): ActionResult {
	const healAmount = Math.max(1, Math.floor(actor.maxHp * 0.5));
	const effects: GameEffect[] = [];

	if (actor.hp < actor.maxHp) {
		effects.push({
			type: 'heal',
			targetId: actor.id,
			amount: healAmount,
		});
	}

	// Remove temporary conditions on rest
	const removableConditions = ['frightened', 'charmed'] as const;
	for (const condition of removableConditions) {
		if (actor.conditions.includes(condition)) {
			effects.push({
				type: 'condition_removed',
				entityId: actor.id,
				condition,
			});
		}
	}

	return {
		success: true,
		action: { type: 'rest', actorId: actor.id },
		effects,
		narrationHints: ['long_rest', `healed:${healAmount}`],
	};
}

function resolveTalk(
	action: GameAction,
	characters: Map<string, Character>,
): ActionResult {
	const hints: string[] = [];

	if (action.targetId) {
		const target = characters.get(action.targetId);
		if (target) {
			hints.push(`talking_to:${target.name}`);
		} else {
			hints.push('target_not_found');
		}
	} else {
		hints.push('no_target');
	}

	// Talk doesn't have mechanical effects — it's purely narrative.
	// The LLM generates the dialogue based on the NPC context.
	return {
		success: true,
		action,
		effects: [],
		narrationHints: hints,
	};
}

function resolvePickup(
	action: GameAction,
	actor: Character,
	world: WorldAccess,
): ActionResult {
	// In v1, pickup is narration-driven. The item system will be expanded later.
	const hints: string[] = action.itemId ? [`item:${action.itemId}`] : ['no_item_specified'];

	return {
		success: !!action.itemId,
		action,
		effects: [],
		narrationHints: hints,
	};
}

function resolveDrop(
	action: GameAction,
	actor: Character,
): ActionResult {
	if (!action.itemId) {
		return { success: false, action, effects: [], narrationHints: ['no_item_specified'] };
	}

	const slot = actor.inventory.find((s) => s.item.id === action.itemId || s.item.name.toLowerCase() === action.itemId?.toLowerCase());
	if (!slot) {
		return { success: false, action, effects: [], narrationHints: ['item_not_in_inventory'] };
	}

	return {
		success: true,
		action,
		effects: [{ type: 'item_lost', entityId: actor.id, itemId: slot.item.id, quantity: 1 }],
		narrationHints: [`dropped:${slot.item.name}`],
	};
}

function resolveUseItem(
	action: GameAction,
	actor: Character,
	rng: () => number,
): ActionResult {
	if (!action.itemId) {
		return { success: false, action, effects: [], narrationHints: ['no_item_specified'] };
	}

	const slot = actor.inventory.find((s) => s.item.id === action.itemId || s.item.name.toLowerCase() === action.itemId?.toLowerCase());
	if (!slot) {
		return { success: false, action, effects: [], narrationHints: ['item_not_in_inventory'] };
	}

	// Basic healing potion logic — expandable via item type system later
	const effects: GameEffect[] = [];
	const hints: string[] = [`used:${slot.item.name}`];

	if (slot.item.name.toLowerCase().includes('potion') && slot.item.name.toLowerCase().includes('heal')) {
		const healRoll = rollDice(parseDiceNotation('2d4+2'), rng);
		effects.push({ type: 'heal', targetId: actor.id, amount: healRoll.total });
		effects.push({ type: 'item_lost', entityId: actor.id, itemId: slot.item.id, quantity: 1 });
		hints.push(`healed:${healRoll.total}`);
	} else {
		// Generic item use — consume it
		effects.push({ type: 'item_lost', entityId: actor.id, itemId: slot.item.id, quantity: 1 });
	}

	return { success: true, action, effects, narrationHints: hints };
}

function resolveCraft(
	action: GameAction,
	actor: Character,
): ActionResult {
	// Crafting system is a stub — will be expanded with Recipe types
	return {
		success: false,
		action,
		effects: [],
		narrationHints: ['crafting_not_yet_implemented'],
	};
}
