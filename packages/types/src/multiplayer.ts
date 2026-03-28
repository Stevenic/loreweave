/**
 * @loreweave/types — Multiplayer type definitions
 *
 * Types for the multiplayer web game layer: real-time communication,
 * chat, persistence, presence, parties, and item transfer.
 */

// ---------------------------------------------------------------------------
// Connection Lifecycle
// ---------------------------------------------------------------------------

/** Connection states per §3.1 of the multiplayer spec. */
export type ConnectionState =
	| 'connecting'
	| 'connected'
	| 'idle'
	| 'disconnected'
	| 'reconnecting'
	| 'reconnected';

// ---------------------------------------------------------------------------
// SignalR Message Envelope
// ---------------------------------------------------------------------------

/** Wire-level message envelope for all SignalR hubs (§3.1). */
export type SignalRMessage<T = unknown> = {
	type: string;
	channel: string;
	sender: string;
	payload: T;
	timestamp: number;
};

/** Named hubs per §3.1. */
export type HubName = 'game' | 'chat' | 'presence';

// ---------------------------------------------------------------------------
// Chat (§4.1, §4.4)
// ---------------------------------------------------------------------------

/** Chat channel type — IC is the game default, OOC for player coordination. */
export type ChatChannel = 'ic' | 'ooc';

/** Scope of a chat message. */
export type ChatScope = 'world' | 'party' | 'whisper' | 'location';

/** A single chat message (§4.1). */
export type ChatMessage = {
	id: string;
	worldId: string;
	channel: ChatChannel;
	scope: ChatScope;
	senderId: string;
	characterName?: string;
	content: string;
	timestamp: number;
	partyId?: string;
	recipientId?: string;
};

// ---------------------------------------------------------------------------
// Presence (§3.2, §5.5)
// ---------------------------------------------------------------------------

/** Player presence state broadcast via PresenceHub. */
export type PlayerPresence = {
	playerId: string;
	characterName: string;
	state: ConnectionState;
	locationName?: string;
	locationTile?: { x: number; y: number };
	lastHeartbeat: number;
	lastSeen?: number;
};

/** Heartbeat payload sent by the client every 30s (§3.2). */
export type HeartbeatPayload = {
	playerId: string;
	locationTile: { x: number; y: number };
	locationName?: string;
};

// ---------------------------------------------------------------------------
// World Settings — Multiplayer World Configuration (§5.2)
// ---------------------------------------------------------------------------

/** Narrative tone presets. */
export type WorldTone = 'gritty' | 'heroic' | 'whimsical' | 'horror' | 'custom';

/** Difficulty tier — affects DC scaling, resource scarcity, lethality. */
export type DifficultyTier = 'casual' | 'standard' | 'hardcore';

/** Play mode — how actions are processed. */
export type PlayMode = 'realtime' | 'async' | 'both';

/** Fray zone intensity level. */
export type FrayIntensity = 'low' | 'medium' | 'high';

/** House rules toggleable at world creation (§5.2 Step 6). */
export type HouseRules = {
	pvpEnabled: boolean;
	friendlyFire: boolean;
	permadeath: boolean;
	frayIntensity: FrayIntensity;
	containerDegradation: boolean;
};

/**
 * Multiplayer world settings created via the World Creation Wizard (§5.2).
 *
 * This is the multiplayer layer's config — distinct from the game-content
 * WorldConfig (personas, stat tiers, creatures) in game.ts.
 */
export type WorldSettings = {
	id: string;
	name: string;
	description: string;
	creatorId: string;
	seed: number;
	tone: WorldTone;
	customTonePrompt?: string;
	difficulty: DifficultyTier;
	playerCap: number;
	visibility: 'public' | 'private';
	inviteCode?: string;
	playMode: PlayMode;
	houseRules: HouseRules;
	createdAt: number;
	/** Chat message retention in days (default 30). */
	chatRetentionDays: number;
	/** Disconnect timeout in minutes before character is moved to safety (default 30). */
	disconnectTimeoutMinutes: number;
	/** Absence threshold in minutes before session recap is generated (default 5). */
	recapThresholdMinutes: number;
};

// ---------------------------------------------------------------------------
// Player Session (§3.3)
// ---------------------------------------------------------------------------

/** Per-player session state persisted to Blob Storage. */
export type PlayerSession = {
	playerId: string;
	worldId: string;
	characterId: string;
	connectionState: ConnectionState;
	connectedAt?: number;
	disconnectedAt?: number;
	lastActionAt?: number;
	/** Pending actions preserved across disconnects (§3.3). */
	pendingActions: PendingAction[];
};

/** An action submitted but not yet resolved. */
export type PendingAction = {
	id: string;
	playerId: string;
	action: string;
	submittedAt: number;
};

// ---------------------------------------------------------------------------
// Containers (§7.3, §7.4, §7.5, §7.6)
// ---------------------------------------------------------------------------

/** Container types in the world. */
export type ContainerType = 'chest' | 'bag' | 'barrel' | 'locked_chest';

/** A container world entity (§7.3). */
export type Container = {
	id: string;
	type: ContainerType;
	locationTile: { x: number; y: number };
	capacity: number;
	contents: ContainerItem[];
	ownerId?: string;
	locked: boolean;
	lockDC?: number;
	warded: boolean;
	wardStrength?: number;
	/** Nested container (one level only per §7.5). */
	nestedContainerId?: string;
	createdAt: number;
};

/** Simplified item reference for container contents. */
export type ContainerItem = {
	itemId: string;
	name: string;
	quantity: number;
};

// ---------------------------------------------------------------------------
// Party System (§6.1–§6.5)
// ---------------------------------------------------------------------------

/** Party decision model. */
export type PartyDecisionModel = 'consensus' | 'leader_decides';

/** A player party. */
export type Party = {
	id: string;
	worldId: string;
	name?: string;
	leaderId: string;
	memberIds: string[];
	decisionModel: PartyDecisionModel;
	createdAt: number;
};

/** A pending party vote (movement, rest, etc.). */
export type PartyVote = {
	id: string;
	partyId: string;
	proposerId: string;
	action: string;
	votes: Record<string, boolean>;
	requiredApproval: 'majority' | 'unanimous';
	createdAt: number;
	expiresAt: number;
};

// ---------------------------------------------------------------------------
// Trading (§7.1, §7.2)
// ---------------------------------------------------------------------------

/** A direct trade proposal between two players (§7.2). */
export type TradeProposal = {
	id: string;
	worldId: string;
	initiatorId: string;
	recipientId: string;
	offeredItems: ContainerItem[];
	requestedItems: ContainerItem[];
	status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
	createdAt: number;
};

// ---------------------------------------------------------------------------
// Turn Coordination (§6.1 — Wave 2)
// ---------------------------------------------------------------------------

/** Turn phase — which mode the game loop is currently in. */
export type TurnPhase = 'exploration' | 'combat' | 'group_check';

/** State of a multiplayer turn cycle. */
export type TurnState = {
	worldId: string;
	phase: TurnPhase;
	/** Turn number (monotonically increasing). */
	turnNumber: number;
	/** Player IDs in initiative order (DEX-based in exploration, rolled in combat). */
	initiativeOrder: string[];
	/** Actions submitted this turn, keyed by player ID. */
	submittedActions: Record<string, PendingAction>;
	/** Player IDs that have submitted actions this turn. */
	readyPlayers: string[];
	/** Expected player IDs (all connected party members). */
	expectedPlayers: string[];
	/** Turn start timestamp for timeout tracking. */
	turnStartedAt: number;
	/** Per-player time limit in ms (default: 60000 for combat). */
	timeLimitMs: number;
	/** Active player ID (combat mode only — whose turn it is). */
	activePlayerId?: string;
	/** Pending consensus vote (if movement requires party vote). */
	pendingVote?: PartyVote;
};

/** Result of processing all actions for a turn. */
export type TurnResult = {
	turnNumber: number;
	/** Ordered action results (in initiative order). */
	results: { playerId: string; result: TurnActionResult }[];
	/** Narrative text for this turn (combined, LLM-generated). */
	narrative: string;
	/** Next turn state. */
	nextPhase: TurnPhase;
};

/** Per-player action result within a turn. */
export type TurnActionResult = {
	playerId: string;
	action: PendingAction;
	success: boolean;
	effects: string[];
	narrationHint: string;
};

// ---------------------------------------------------------------------------
// Graceful Disconnect (§3.3 — Wave 2)
// ---------------------------------------------------------------------------

/** Disconnect event recorded when a player drops connection. */
export type DisconnectEvent = {
	playerId: string;
	worldId: string;
	disconnectedAt: number;
	/** Last known character location. */
	lastLocation: { x: number; y: number };
	lastLocationName?: string;
	/** Whether the character was in combat when disconnected. */
	wasInCombat: boolean;
	/** Pending actions at time of disconnect. */
	preservedActions: PendingAction[];
};

/** Reconnect result delivered to the player on rejoin. */
export type ReconnectResult = {
	playerId: string;
	worldId: string;
	/** Duration of absence in ms. */
	absenceDurationMs: number;
	/** Missed turn results since disconnect. */
	missedTurns: TurnResult[];
	/** Session recap narrative (if absence exceeded threshold). */
	recap?: string;
	/** Whether the character was relocated to safety. */
	wasRelocated: boolean;
	/** New location (if relocated). */
	safeLocation?: { x: number; y: number; name: string };
};

// ---------------------------------------------------------------------------
// Session Recap (§4.2 — Wave 2)
// ---------------------------------------------------------------------------

/** Input context for session recap generation. */
export type RecapContext = {
	worldId: string;
	playerId: string;
	/** IC messages since the player's last action. */
	messagesSinceDisconnect: ChatMessage[];
	/** World events since disconnect, filtered to player's location/party. */
	worldEventsSummary: string[];
	/** Current world state summary for grounding. */
	currentStateSummary: string;
	/** DM persona name for voice consistency. */
	dmPersonaName?: string;
};

/** Generated session recap. */
export type SessionRecap = {
	playerId: string;
	worldId: string;
	/** The narrative recap text (2–5 sentences in DM voice). */
	narrative: string;
	generatedAt: number;
	/** Duration of absence that triggered this recap. */
	absenceDurationMs: number;
};

// ---------------------------------------------------------------------------
// Chat-to-Intent LLM Fallback (§4.3 — Wave 2)
// ---------------------------------------------------------------------------

/** Context sent to the LLM for intent extraction fallback. */
export type IntentExtractionContext = {
	/** Raw player IC message. */
	rawInput: string;
	/** Current location description. */
	locationDescription: string;
	/** Nearby entity names and types. */
	nearbyEntities: { name: string; type: string }[];
	/** Player's inventory item names. */
	inventoryItems: string[];
	/** Recent action types for context (last 3). */
	recentActions: string[];
};

/** LLM intent extraction result. */
export type IntentExtractionResult = {
	/** Extracted action type, or null if pure roleplay. */
	actionType: string | null;
	/** Target entity name (if applicable). */
	targetName?: string;
	/** Direction (if movement). */
	direction?: string;
	/** Item name (if item-related). */
	itemName?: string;
	/** Confidence score 0–1 from the LLM. */
	confidence: number;
	/** Whether this is pure roleplay with no game action. */
	isRoleplay: boolean;
};

// ---------------------------------------------------------------------------
// World Event Log (§4.2 dependency — event persistence)
// ---------------------------------------------------------------------------

/** A world event log entry for persistence and recap generation. */
export type WorldEventLogEntry = {
	id: string;
	worldId: string;
	timestamp: number;
	/** Location tile where the event occurred. */
	location: { x: number; y: number };
	/** Player who caused the event (if any). */
	actorId?: string;
	/** Event type for filtering. */
	eventType: 'action' | 'combat' | 'movement' | 'narrative' | 'disconnect' | 'reconnect' | 'system';
	/** Human-readable summary for recap generation. */
	summary: string;
	/** Party ID if this event is scoped to a party. */
	partyId?: string;
};

// ---------------------------------------------------------------------------
// Adaptive Verbosity (§9.1)
// ---------------------------------------------------------------------------

/** Narrative pacing mode. */
export type VerbosityMode = 'combat' | 'exploration' | 'social' | 'downtime';

// ---------------------------------------------------------------------------
// Blob Storage Keys (§8.1)
// ---------------------------------------------------------------------------

/**
 * Blob Storage path builder.
 * Structure: worlds/{worldId}/...
 */
export type BlobPath =
	| { kind: 'config'; worldId: string }
	| { kind: 'chunk'; worldId: string; chunkId: string }
	| { kind: 'entity'; worldId: string; entityId: string }
	| { kind: 'character'; worldId: string; playerId: string }
	| { kind: 'inventory'; worldId: string; playerId: string }
	| { kind: 'chat'; worldId: string; channel: ChatChannel; date: string; messageId: string }
	| { kind: 'event'; worldId: string; date: string; eventId: string };

// ---------------------------------------------------------------------------
// Service Interfaces
// ---------------------------------------------------------------------------

/** Abstract persistence layer for world state (§8.1). */
export type WorldStore = {
	getWorldSettings(worldId: string): Promise<WorldSettings | null>;
	putWorldSettings(settings: WorldSettings): Promise<void>;
	listWorlds(filter?: { visibility?: 'public' | 'private' }): Promise<WorldSettings[]>;
	deleteWorld(worldId: string): Promise<void>;

	getPlayerSession(worldId: string, playerId: string): Promise<PlayerSession | null>;
	putPlayerSession(session: PlayerSession): Promise<void>;

	getBlob<T>(path: string): Promise<T | null>;
	putBlob<T>(path: string, data: T): Promise<void>;
	deleteBlob(path: string): Promise<void>;
	listBlobs(prefix: string): Promise<string[]>;
};

/** Abstract real-time message broker (§3.1). */
export type MessageBroker = {
	publish(hub: HubName, channel: string, message: SignalRMessage): Promise<void>;
	subscribe(hub: HubName, channel: string, handler: (message: SignalRMessage) => void): void;
	unsubscribe(hub: HubName, channel: string): void;
	joinGroup(hub: HubName, group: string, connectionId: string): Promise<void>;
	leaveGroup(hub: HubName, group: string, connectionId: string): Promise<void>;
};

/** Chat persistence and retrieval (§4.4). */
export type ChatStore = {
	persistMessage(message: ChatMessage): Promise<void>;
	getRecentMessages(worldId: string, channel: ChatChannel, limit: number): Promise<ChatMessage[]>;
	getMessagesSince(worldId: string, channel: ChatChannel, since: number): Promise<ChatMessage[]>;
	pruneExpired(worldId: string, retentionDays: number): Promise<number>;
};
