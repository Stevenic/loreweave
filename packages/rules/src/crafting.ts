/**
 * Threadcraft Item Crafting — material checks, infusion, and failure consequences.
 *
 * Implements Loremaster's Threadcraft Item Crafting Rules:
 * - Two-check system: Tool proficiency check + Pattern Infusion check
 * - Failure consequences scaled by margin (flawed, failed, backfire)
 * - Critical success on natural 20
 * - Weave state and tradition prerequisites
 * - Crafting counts as Threadcraft casting (Fray Risk accumulation)
 *
 * All functions are pure. No side effects.
 */

import type {
	CraftResult,
	PlayerThreadcraft,
	ThreadcraftItem,
	WeaveState,
} from '@loreweave/types';

// ─── Item Registry ───

/**
 * Built-in Threadcraft item definitions from the spec.
 * Items are organized by tier.
 */
export const THREADCRAFT_ITEMS: ThreadcraftItem[] = [
	// Tier 1: Initiate
	{
		id: 'ward_stone_minor',
		name: 'Ward Stone (Minor)',
		tier: 1,
		materials: [{ material: 'ward_crystal', quantity: 1 }, { material: 'gold', quantity: 50 }],
		craftingTime: 4,
		toolDC: 12,
		infusionDC: 12,
		requiredWeaveState: ['stable'],
		effect: { description: 'Creates a 10-ft. ward zone (ward strength 20) for 24 hours.', properties: { wardStrength: 20, radius: 10, duration: 24 } },
		isConsumable: false,
	},
	{
		id: 'thread_iron_dagger',
		name: 'Thread-Iron Dagger',
		tier: 1,
		materials: [{ material: 'thread_iron_ingot', quantity: 1 }, { material: 'gold', quantity: 50 }],
		craftingTime: 8,
		toolDC: 14,
		infusionDC: 13,
		requiredWeaveState: ['stable', 'thin', 'frayed', 'unraveled'],
		effect: { description: '+1 dagger. Deals force damage instead of piercing to Fray creatures.', properties: { attackBonus: 1, forceDamageVsFray: true } },
		isConsumable: false,
	},
	{
		id: 'fray_ward_charm',
		name: 'Fray Ward Charm',
		tier: 1,
		materials: [{ material: 'ward_crystal', quantity: 1 }, { material: 'gold', quantity: 25 }],
		craftingTime: 2,
		toolDC: 11,
		infusionDC: 11,
		requiredWeaveState: ['stable'],
		effect: { description: 'Advantage on 1 Fray Exposure save per long rest. Destroyed after use.', properties: { frayAdvantage: true, singleUse: true } },
		isConsumable: true,
	},
	{
		id: 'threadline_compass',
		name: 'Threadline Compass',
		tier: 1,
		materials: [{ material: 'threadline_silk', quantity: 1 }, { material: 'gold', quantity: 30 }],
		craftingTime: 4,
		toolDC: 13,
		infusionDC: 12,
		requiredWeaveState: ['stable', 'thin'],
		effect: { description: 'Points toward the nearest Loom Stone within 5 miles.', properties: { detectionRange: 5, targetType: 'loom_stone' } },
		isConsumable: false,
	},
	// Tier 2: Adept
	{
		id: 'thread_iron_weapon',
		name: 'Thread-Iron Weapon',
		tier: 2,
		materials: [{ material: 'thread_iron_ingot', quantity: 2 }, { material: 'gold', quantity: 200 }],
		craftingTime: 16,
		toolDC: 15,
		infusionDC: 14,
		requiredWeaveState: ['stable', 'thin', 'frayed', 'unraveled'],
		effect: { description: '+1 weapon. Force damage to Fray creatures. Bypasses nonmagical immunity.', properties: { attackBonus: 1, forceDamageVsFray: true, bypassNonmagicalImmunity: true } },
		isConsumable: false,
	},
	{
		id: 'ward_anchor',
		name: 'Ward Anchor',
		tier: 2,
		materials: [{ material: 'ward_crystal', quantity: 2 }, { material: 'thread_iron_ingot', quantity: 1 }, { material: 'gold', quantity: 150 }],
		craftingTime: 12,
		toolDC: 15,
		infusionDC: 15,
		requiredWeaveState: ['stable'],
		effect: { description: 'Permanent ward zone (10-ft. radius, strength 30). Requires attunement.', properties: { wardStrength: 30, radius: 10, permanent: true, requiresAttunement: true } },
		isConsumable: false,
	},
	{
		id: 'threadline_silk_armor',
		name: 'Threadline Silk Armor',
		tier: 2,
		materials: [{ material: 'threadline_silk', quantity: 4 }, { material: 'gold', quantity: 300 }],
		craftingTime: 24,
		toolDC: 16,
		infusionDC: 14,
		requiredWeaveState: ['stable'],
		effect: { description: 'Light armor, AC 13 + DEX. Advantage on Fray Exposure saves. Weighs 3 lb.', properties: { ac: 13, frayAdvantage: true, weight: 3, armorType: 'light' } },
		isConsumable: false,
	},
	{
		id: 'pattern_lens',
		name: 'Pattern Lens',
		tier: 2,
		materials: [{ material: 'ward_crystal', quantity: 1 }, { material: 'threadline_silk', quantity: 1 }, { material: 'gold', quantity: 100 }],
		craftingTime: 8,
		toolDC: 14,
		infusionDC: 13,
		requiredWeaveState: ['thin'],
		effect: { description: 'Monocle. Detect Magic at will for weave phenomena only.', properties: { detectMagicAtWill: true, weaveOnly: true } },
		isConsumable: false,
	},
	{
		id: 'fray_bomb',
		name: 'Fray Bomb',
		tier: 2,
		materials: [{ material: 'fray_essence', quantity: 1 }, { material: 'thread_iron_ingot', quantity: 1 }, { material: 'gold', quantity: 50 }],
		craftingTime: 4,
		toolDC: 14,
		infusionDC: 15,
		requiredWeaveState: ['stable', 'thin', 'frayed', 'unraveled'],
		effect: { description: 'Thrown (range 20/60). 3d6 force damage in 10-ft. radius, DC 14 DEX save for half. Single use.', properties: { damage: '3d6', damageType: 'force', radius: 10, saveDC: 14 } },
		isConsumable: true,
	},
	// Tier 3: Master
	{
		id: 'thread_iron_armor',
		name: 'Thread-Iron Armor',
		tier: 3,
		materials: [{ material: 'thread_iron_ingot', quantity: 4 }, { material: 'gold', quantity: 500 }],
		craftingTime: 40,
		toolDC: 17,
		infusionDC: 16,
		requiredWeaveState: ['stable'],
		effect: { description: 'Medium armor, AC 15 + DEX (max 2). Resistance to force damage. Immunity to Fray Exposure levels 1-2.', properties: { ac: 15, maxDex: 2, forceResistance: true, frayImmunityLevels: 2 } },
		isConsumable: false,
	},
	{
		id: 'ward_engine_portable',
		name: 'Ward Engine (Portable)',
		tier: 3,
		materials: [{ material: 'ward_crystal', quantity: 4 }, { material: 'thread_iron_ingot', quantity: 2 }, { material: 'gold', quantity: 800 }],
		craftingTime: 48,
		toolDC: 18,
		infusionDC: 17,
		requiredWeaveState: ['stable'],
		requiredTradition: 'wardweaving',
		effect: { description: '30-ft. ward zone (strength 50). Weighs 20 lb. Must be stationary. Lasts until destroyed.', properties: { wardStrength: 50, radius: 30, weight: 20, permanent: true, requiresAttunement: true } },
		isConsumable: false,
	},
	{
		id: 'binding_instrument',
		name: 'Binding Instrument',
		tier: 3,
		materials: [{ material: 'threadline_silk', quantity: 2 }, { material: 'ward_crystal', quantity: 1 }, { material: 'gold', quantity: 400 }],
		craftingTime: 24,
		toolDC: 16,
		infusionDC: 16,
		requiredWeaveState: ['stable'],
		effect: { description: '+2 to Performance for Binding Song. 1 auto-success in Binding Song skill challenge per long rest.', properties: { performanceBonus: 2, autoSuccess: true } },
		isConsumable: false,
	},
	{
		id: 'weavers_mark_stamp',
		name: "Weaver's Mark Stamp",
		tier: 3,
		materials: [{ material: 'thread_iron_ingot', quantity: 1 }, { material: 'fray_essence', quantity: 1 }, { material: 'ward_crystal', quantity: 1 }, { material: 'gold', quantity: 300 }],
		craftingTime: 16,
		toolDC: 17,
		infusionDC: 17,
		requiredWeaveState: ['thin'],
		effect: { description: 'Inscribe a permanent Detect Magic sensor. Crafter knows when magic is used within 60 ft. Max 3 active Marks.', properties: { detectionRadius: 60, maxMarks: 3 } },
		isConsumable: false,
	},
];

// ─── Core Functions ───

/**
 * Check if a player can craft a given item.
 *
 * Checks: Threadcraft tier, tradition requirement, weave state.
 * Does NOT check material inventory (that's the caller's responsibility).
 */
export function canCraft(
	player: PlayerThreadcraft,
	item: ThreadcraftItem,
	weaveState: WeaveState,
): boolean {
	// Tier check
	if (player.tier < item.tier) return false;

	// Tradition check
	if (item.requiredTradition) {
		if (player.tradition !== item.requiredTradition && player.secondTradition !== item.requiredTradition) {
			return false;
		}
	}

	// Weave state check
	if (!item.requiredWeaveState.includes(weaveState)) return false;

	return true;
}

/**
 * Attempt to craft a Threadcraft item.
 *
 * Per spec §5:
 * - Tool check: margin < 5 = flawed, margin < 10 = failed, margin >= 10 = backfire
 * - Infusion check: margin < 5 = mundane, margin < 10 = unstable, margin >= 10 = Fray-tainted
 * - Natural 20 on both = critical success
 * - Both pass = success
 *
 * @param toolRoll - The d20 roll + tool proficiency modifier
 * @param infusionRoll - The d20 roll + CON modifier (Threadcraft casting ability)
 * @param toolNatural - The natural d20 value for the tool check
 * @param infusionNatural - The natural d20 value for the infusion check
 */
export function attemptCraft(
	player: PlayerThreadcraft,
	item: ThreadcraftItem,
	toolRoll: number,
	infusionRoll: number,
	toolNatural: number,
	infusionNatural: number,
): CraftResult {
	const toolPass = toolRoll >= item.toolDC;
	const infusionPass = infusionRoll >= item.infusionDC;

	// Critical success: natural 20 on both
	if (toolNatural === 20 && infusionNatural === 20) {
		return {
			outcome: 'critical_success',
			item,
			frayExposure: false,
			toolRoll,
			infusionRoll,
		};
	}

	// Both pass = success
	if (toolPass && infusionPass) {
		return {
			outcome: 'success',
			item,
			frayExposure: false,
			toolRoll,
			infusionRoll,
		};
	}

	// Tool check failed
	if (!toolPass) {
		const margin = item.toolDC - toolRoll;
		if (margin >= 10) {
			// Backfire: materials consumed + Fray exposure
			return {
				outcome: 'backfire',
				frayExposure: true,
				toolRoll,
				infusionRoll,
			};
		}
		if (margin >= 5) {
			// Failed: materials consumed, no item
			return {
				outcome: 'failed',
				frayExposure: false,
				toolRoll,
				infusionRoll,
			};
		}
		// Margin 1-4: flawed item (functions but breaks after 1d6 uses)
		return {
			outcome: 'flawed',
			item,
			remainingUses: 0, // Caller should roll 1d6 for actual uses
			frayExposure: false,
			toolRoll,
			infusionRoll,
		};
	}

	// Tool passed but infusion failed — item is mundane, unstable, or Fray-tainted
	const infusionMargin = item.infusionDC - infusionRoll;
	if (infusionMargin >= 10) {
		// Fray-tainted: functions but each use requires CON save or Fray Exposure
		return {
			outcome: 'flawed',
			item,
			frayExposure: true,
			toolRoll,
			infusionRoll,
		};
	}
	if (infusionMargin >= 5) {
		// Unstable: 25% failure chance per use
		return {
			outcome: 'flawed',
			item,
			frayExposure: false,
			toolRoll,
			infusionRoll,
		};
	}
	// Margin 1-4: mundane item (no magical properties)
	return {
		outcome: 'flawed',
		item,
		frayExposure: false,
		toolRoll,
		infusionRoll,
	};
}

/**
 * Get all recipes available to a player at their current Threadcraft tier.
 */
export function getAvailableRecipes(player: PlayerThreadcraft): ThreadcraftItem[] {
	return THREADCRAFT_ITEMS.filter((item) => {
		if (player.tier < item.tier) return false;
		if (item.requiredTradition) {
			return player.tradition === item.requiredTradition || player.secondTradition === item.requiredTradition;
		}
		return true;
	});
}

/**
 * Compute how many Fray Risk casts a crafting session counts as.
 * Per spec §3: crafting counts as 1 Threadcraft cast per hour of work.
 */
export function craftingFrayRiskCasts(item: ThreadcraftItem): number {
	return item.craftingTime;
}
