/**
 * Player Threadcraft Progression — feat chain and Fray Risk mechanics.
 *
 * Implements Loremaster's Player Threadcraft Progression spec:
 * - 3-tier feat chain (Initiate → Adept → Master) + Speaker (Harmony only)
 * - CON-based spellcasting, escalating Fray Risk DC per cast
 * - Tradition-specific signature abilities
 * - Fraytouch +2 DC penalty
 *
 * All functions are pure. No side effects.
 */

import type {
	PlayerThreadcraft,
	SpellInfo,
	ThreadcraftTradition,
} from '@loreweave/types';

// ─── Tradition Spell Lists ───

type TraditionSpells = {
	cantrips: string[];
	spells: Record<number, string[]>; // level → spell IDs
};

const TRADITION_SPELLS: Record<ThreadcraftTradition, TraditionSpells> = {
	wardweaving: {
		cantrips: ['mending', 'resistance', 'blade_ward'],
		spells: {
			1: ['shield_of_faith', 'sanctuary', 'protection_from_evil_and_good'],
			2: ['warding_bond', 'aid', 'lesser_restoration'],
			3: ['dispel_magic', 'magic_circle', 'remove_curse'],
			4: ['banishment', 'death_ward', 'freedom_of_movement'],
		},
	},
	threadwalking: {
		cantrips: ['guidance', 'druidcraft', 'mage_hand'],
		spells: {
			1: ['detect_magic', 'longstrider', 'goodberry'],
			2: ['misty_step', 'pass_without_trace', 'locate_object'],
			3: ['clairvoyance', 'sending', 'plant_growth'],
			4: ['dimension_door', 'locate_creature', 'divination'],
		},
	},
	binding: {
		cantrips: ['minor_illusion', 'thaumaturgy', 'friends'],
		spells: {
			1: ['bless', 'heroism', 'command'],
			2: ['calm_emotions', 'enhance_ability', 'enthrall'],
			3: ['hypnotic_pattern', 'tongues', 'motivational_speech'],
			4: ['compulsion', 'aura_of_purity', 'charm_monster'],
		},
	},
	remembering: {
		cantrips: ['message', 'prestidigitation', 'mind_sliver'],
		spells: {
			1: ['identify', 'comprehend_languages', 'detect_evil_and_good'],
			2: ['augury', 'see_invisibility', 'mind_spike'],
			3: ['speak_with_dead', 'nondetection', 'clairvoyance'],
			4: ['arcane_eye', 'divination', 'locate_creature'],
		},
	},
	fraytouch: {
		cantrips: ['chill_touch', 'toll_the_dead', 'infestation'],
		spells: {
			1: ['inflict_wounds', 'bane', 'cause_fear'],
			2: ['ray_of_enfeeblement', 'blindness_deafness', 'phantasmal_force'],
			3: ['bestow_curse', 'fear', 'vampiric_touch'],
			4: ['blight', 'phantasmal_killer', 'shadow_of_moil'],
		},
	},
	threadline_reading: {
		cantrips: ['light', 'guidance', 'true_strike'],
		spells: {
			1: ['comprehend_languages', 'detect_magic', 'faerie_fire'],
			2: ['see_invisibility', 'detect_thoughts', 'zone_of_truth'],
			3: ['tongues', 'clairvoyance', 'dispel_magic'],
			4: ['arcane_eye', 'true_seeing_lesser', 'divination'],
		},
	},
};

// ─── Core Functions ───

/**
 * Get the Fray Risk DC for a Threadcraft spell cast.
 *
 * Per spec §3:
 * - Initiate/Adept base: 10 + (castsToday - 1)
 * - Master base: 8 + (castsToday - 1)
 * - Fraytouch tradition: +2 to DC
 */
export function getFrayRiskDC(
	tier: number,
	castsToday: number,
	tradition: ThreadcraftTradition,
): number {
	const baseDC = tier >= 3 ? 8 : 10;
	const escalation = Math.max(0, castsToday - 1);
	const fraytouchPenalty = tradition === 'fraytouch' ? 2 : 0;
	return baseDC + escalation + fraytouchPenalty;
}

/**
 * Roll a Fray Risk saving throw.
 *
 * @returns Whether the save passed, and the roll details.
 */
export function rollFrayRisk(
	dc: number,
	conMod: number,
	profBonus: number,
	proficient: boolean,
	roll: number,
): { passed: boolean; total: number; roll: number } {
	const total = roll + conMod + (proficient ? profBonus : 0);
	return {
		passed: total >= dc,
		total,
		roll,
	};
}

/**
 * Process a Threadcraft spell cast — update progression state.
 *
 * Increments frayRiskCastsToday. If the spell has free uses remaining,
 * decrements those. Returns new state (immutable).
 */
export function castThreadcraftSpell(
	state: PlayerThreadcraft,
	spellId: string,
	useSpellSlot: boolean,
): PlayerThreadcraft {
	const newState = {
		...state,
		freecastsRemaining: { ...state.freecastsRemaining },
		frayRiskCastsToday: state.frayRiskCastsToday,
	};

	// Cantrips don't trigger Fray Risk (they're minor weaving)
	const isCantrip = isSpellCantrip(spellId, state.tradition, state.secondTradition);
	if (isCantrip) return newState;

	// Increment Fray Risk counter
	newState.frayRiskCastsToday = state.frayRiskCastsToday + 1;

	// Decrement free cast if available and not using a spell slot
	if (!useSpellSlot && newState.freecastsRemaining[spellId] !== undefined && newState.freecastsRemaining[spellId] > 0) {
		newState.freecastsRemaining[spellId] = newState.freecastsRemaining[spellId] - 1;
	}

	return newState;
}

/**
 * Get all spells available to a player at their current Threadcraft tier.
 */
export function getAvailableSpells(state: PlayerThreadcraft): SpellInfo[] {
	const spells: SpellInfo[] = [];

	const addTraditionSpells = (tradition: ThreadcraftTradition, isSecondary: boolean) => {
		const tradSpells = TRADITION_SPELLS[tradition];
		if (!tradSpells) return;

		// Cantrips
		for (const cantrip of tradSpells.cantrips) {
			if (state.knownCantrips.includes(cantrip)) {
				spells.push({
					id: cantrip,
					name: cantrip.replace(/_/g, ' '),
					level: 0,
					tradition,
					canFreecast: true,
				});
			}
		}

		// Leveled spells
		const maxLevel = isSecondary ? 2 : getMaxSpellLevel(state.tier);
		for (let level = 1; level <= maxLevel; level++) {
			const levelSpells = tradSpells.spells[level];
			if (!levelSpells) continue;
			for (const spell of levelSpells) {
				if (state.knownSpells.includes(spell)) {
					spells.push({
						id: spell,
						name: spell.replace(/_/g, ' '),
						level,
						tradition,
						canFreecast: (state.freecastsRemaining[spell] ?? 0) > 0,
					});
				}
			}
		}
	};

	addTraditionSpells(state.tradition, false);
	if (state.secondTradition) {
		addTraditionSpells(state.secondTradition, true);
	}

	return spells;
}

/**
 * Check if a player meets the prerequisites for a Threadcraft feat tier.
 *
 * Per spec §2:
 * - Tier 1: Level 4+, INT or WIS 13+, narrative gate
 * - Tier 2: Level 8+, CON 14+, Tier 1 feat, narrative gate
 * - Tier 3: Level 13+, CON 16+, Tier 2 feat, narrative gate
 */
export function canLearnFeat(
	playerLevel: number,
	conScore: number,
	intScore: number,
	wisScore: number,
	currentTier: number,
	narrativeGate: boolean,
): boolean {
	const targetTier = currentTier + 1;

	if (!narrativeGate) return false;

	switch (targetTier) {
		case 1:
			return playerLevel >= 4 && (intScore >= 13 || wisScore >= 13);
		case 2:
			return playerLevel >= 8 && conScore >= 14 && currentTier >= 1;
		case 3:
			return playerLevel >= 13 && conScore >= 16 && currentTier >= 2;
		default:
			return false;
	}
}

/**
 * Reset Fray Risk after a long rest.
 *
 * Per spec §3:
 * - Initiate: DC resets but carries escalation risk
 * - Adept+: DC fully resets to base
 * - Free casts are restored
 */
export function longRestReset(state: PlayerThreadcraft): PlayerThreadcraft {
	const newState = {
		...state,
		frayRiskCastsToday: 0,
		signatureAbilityUsed: false,
		freecastsRemaining: { ...state.freecastsRemaining },
	};

	// Restore free casts: 1 per known leveled spell
	for (const spellId of state.knownSpells) {
		newState.freecastsRemaining[spellId] = 1;
	}

	return newState;
}

/**
 * Get the tradition spell list for reference.
 */
export function getTraditionSpells(tradition: ThreadcraftTradition): TraditionSpells {
	return TRADITION_SPELLS[tradition];
}

// ─── Helpers ───

function getMaxSpellLevel(tier: number): number {
	switch (tier) {
		case 1: return 1;
		case 2: return 2;
		case 3: return 4;
		default: return 0;
	}
}

function isSpellCantrip(
	spellId: string,
	primary: ThreadcraftTradition,
	secondary?: ThreadcraftTradition,
): boolean {
	if (TRADITION_SPELLS[primary]?.cantrips.includes(spellId)) return true;
	if (secondary && TRADITION_SPELLS[secondary]?.cantrips.includes(spellId)) return true;
	return false;
}
