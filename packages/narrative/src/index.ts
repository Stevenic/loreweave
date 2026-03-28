/**
 * @loreweave/narrative — Narrative engine
 *
 * The Dungeon Master system: intent parsing, rules resolution,
 * context assembly, prompt building, and LLM narrative generation.
 *
 * Architecture (per spec §4.4):
 *   Player Input → Intent Parser → Rules Engine → World State Update
 *                                                    ↓
 *                                              Narrative Engine (LLM)
 */

// DM — the orchestrator
export { DungeonMaster, createSession, collectNarrativeStream, DEFAULT_DM_CONFIG } from './dm.js';

// Intent parsing — player text → GameAction
export { parseIntent } from './intent-parser.js';
export type { ParseResult } from './intent-parser.js';

// Intent parsing with LLM fallback (§4.3)
export { parseIntentWithFallback } from './intent-fallback.js';

// Context assembly — world state → NarrativeContext
export { assembleContext, getPartyLocation, scanExits, summarizeParty, gatherQuestHints } from './context-assembler.js';

// Action resolution — GameAction → ActionResult via rules engine
export { resolveAction, applyEffects } from './action-resolver.js';

// Prompt building — NarrativeContext + ActionResult → LLM prompts
export { buildPrompts, buildSystemPrompt, buildUserPrompt } from './prompt-builder.js';
export type { PromptPair } from './prompt-builder.js';

// Dialogue system — NPC conversation context and companion management
export {
	buildDialogueContext,
	resolveSocialCheck,
	approvalToTone,
	summarizeCompanion,
	checkCompanionInterjections,
	evaluateCompanionValues,
	applyCompanionReaction,
	extractDialogueTopics,
	MAX_COMPANIONS,
} from './dialogue.js';
