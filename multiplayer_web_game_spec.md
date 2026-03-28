# LoreWeave — Multiplayer Web Game Design Spec

**Status:** Draft
**Author:** Scribe
**Date:** 2026-03-27
**Source:** UX Brainstorm consolidated tally (175 pts, 7 voters)

---

## 1. Overview

This spec defines the multiplayer web game layer for LoreWeave — the systems that transform a single-player narrative engine into a hosted, multi-player, Azure-deployed web experience. It covers real-time communication, chat, parties, item transfer, persistence, and UX.

All features in this spec were voted on during the team brainstorm. They are organized by system domain and ordered by priority (vote rank) within each section. The vote tally is included for each feature to communicate team consensus.

**Upstream dependencies:** This spec builds on top of `loreweave_spec.md` (game design), `world_generation_spec.md` (world gen), and `pixel_v_1_spec.md` (visual assets). It does not redefine systems already specified in those documents.

**Target platform:** Azure-hosted web application, responsive across desktop and mobile browsers.

---

## 2. Priority Tiers

Features are grouped into three implementation tiers based on vote consensus:

| Tier | Criteria | Features |
|------|----------|----------|
| **P0 — Core** | 10+ pts or architectural prerequisite | OOC/IC chat, session recaps, chat-to-intent, SignalR, Threadcraft, location-gated trading, Blob Storage |
| **P1 — Important** | 4–9 pts | Consensus turn model, graceful disconnect, party group actions, presence-as-location, adaptive verbosity, landing page, warded containers, World Creation Wizard |
| **P2 — Texture** | 1–3 pts | Azure Static Web Apps, chat persistence, autosave UX, responsive design, party formation narrative, containers as world objects, container nesting, party leader-decides, async hybrid, presence heartbeats, container degradation, party narrative weaving, proximity narration, tone selection, container interaction beats, tapestry map, voice chat |

---

## 3. Real-Time Infrastructure

### 3.1 SignalR / Web PubSub — Real-Time Communication

**Rank #4 · 12 pts · 3 voters**

The real-time transport layer for all multiplayer communication. Every feature in this spec that involves live updates between players flows through SignalR.

**Requirements:**
- Azure SignalR Service (serverless mode) as the managed WebSocket layer
- Hub architecture with named hubs per concern:
  - `GameHub` — game state updates, turn results, narrative output
  - `ChatHub` — player-to-player messages (OOC and IC channels)
  - `PresenceHub` — connection state, heartbeats, player location
- Connection lifecycle: `connecting → connected → idle → disconnected → reconnecting → reconnected`
- Client reconnection with exponential backoff (SignalR automatic reconnect)
- Server-side connection groups mapped to: world, party, location proximity

**Message format:**
```ts
type SignalRMessage = {
  type: string;        // e.g., "chat", "turn_result", "presence"
  channel: string;     // world ID, party ID, or location key
  sender: string;      // player ID
  payload: unknown;    // type-specific data
  timestamp: number;   // server UTC timestamp
};
```

### 3.2 Presence Heartbeats

**Rank #16 · 3 pts · 2 voters**

Heartbeat mechanism for reliable presence detection.

**Requirements:**
- Client sends heartbeat every 30 seconds via `PresenceHub`
- Server marks player as `idle` after 2 missed heartbeats (60s)
- Server marks player as `disconnected` after 4 missed heartbeats (120s)
- Heartbeat payload includes current location (enables §5.5 presence-as-location)
- Presence state changes broadcast to all players in the same world

### 3.3 Graceful Disconnect Handling

**Rank #8 · 7 pts · 3 voters**

Connection lifecycle state machine that prevents data loss and enables seamless reconnection.

**Requirements:**
- Connection states: `connected → idle → disconnected → reconnecting → reconnected`
- On disconnect:
  - Player's pending actions are preserved (not discarded)
  - Character remains in-world (does not vanish) with `absent` status
  - Party members see a narrative beat: *"[Name] grows still, their thread dimming..."*
- On reconnect:
  - Session state restored from Blob Storage
  - Missed turn results delivered in order
  - Session recap generated if absence exceeded a configurable threshold (default: 5 minutes)
- On timeout (configurable, default: 30 minutes):
  - Character moved to nearest safe location (settlement, camp)
  - Active combat: character takes Dodge action each turn until reconnect or timeout

### 3.4 Async Hybrid Support

**Rank #16 · 3 pts · 2 voters**

Support for both real-time and asynchronous play modes.

**Requirements:**
- Real-time mode: actions processed immediately via SignalR, results broadcast live
- Async mode: actions queued to Azure Queue Storage, processed by Azure Functions
- Both modes write to the same world state in Blob Storage — no divergent state
- World creator selects mode at creation (§5.7) with option to allow both
- Async actions include a `submittedAt` timestamp; processing order is deterministic (FIFO per player, interleaved by submission time across players)
- Async players receive results on next connection (delivered via session recap, §4.2)

---

## 4. Chat & Communication

### 4.1 OOC/IC Chat Separation

**Rank #1 · 21 pts · 6 voters (highest consensus)**

Two distinct chat channels separating player coordination from in-character speech.

**Requirements:**
- **IC (In-Character):** Text routed to the intent parser (§4.3 of `loreweave_spec.md`). Treated as game actions. Displayed in the narrative stream with character attribution.
- **OOC (Out-of-Character):** Text displayed in a separate chat panel. Never processed by the intent parser. Never seen by the narrative engine.
- Default channel is IC (game-first UX)
- OOC prefix: `//` or toggled via UI tab/button
- Message schema:

```ts
type ChatMessage = {
  id: string;
  worldId: string;
  channel: "ic" | "ooc";
  senderId: string;       // player ID
  characterName?: string; // only for IC
  content: string;
  timestamp: number;
  partyId?: string;       // scoped to party if set, otherwise world-wide
};
```

- OOC messages scoped to: world (default), party, or whisper (1:1)
- IC messages always scoped to location proximity (players in the same or adjacent tiles)

### 4.2 Session Recaps on Rejoin

**Rank #2 · 15 pts · 5 voters**

LLM-generated narrative summary of events that occurred while a player was absent.

**Requirements:**
- Triggered on reconnect when absence exceeds configurable threshold (default: 5 minutes)
- Input context: world event log entries since player's last action, filtered to player's location and party
- Output: 2–5 sentence narrative summary in the DM's voice, delivered as the first message on rejoin
- Recap prompt uses the same DM persona and constraints as the narrative engine (§4.4.4 of `loreweave_spec.md`)
- Recap is generated fresh each time (not cached) — reflects current world state
- Token budget: falls within the text LLM tier (16–32k tokens)
- Depends on: chat persistence (§4.4) for message history, graceful disconnect (§3.3) for absence detection

### 4.3 Chat-to-Intent Extraction

**Rank #3 · 13 pts · 4 voters**

Enhanced natural language parsing that converts freeform IC chat into structured game actions.

**Requirements:**
- Extends the existing keyword-based intent parser (§4.3 of `loreweave_spec.md`)
- For inputs that fail keyword parsing, attempt LLM-based intent extraction as a fallback
- LLM fallback receives: raw input, current location context, nearby entities, inventory
- LLM returns a structured `GameAction` or `null` (treated as pure roleplay)
- Fallback is budget-gated: only invoked when keyword parser returns `null` with no `failureHints`
- Pure roleplay (no action detected) is narrated as flavor text by the DM
- Latency target: < 2 seconds for LLM fallback path

### 4.4 Chat Persistence Across Sessions

**Rank #16 · 3 pts · 1 voter**

Persistent message storage so chat history survives disconnects and session boundaries.

**Requirements:**
- All messages (IC and OOC) persisted to Blob Storage
- Storage key: `worlds/{worldId}/chat/{channel}/{date}/{timestamp}_{messageId}.json`
- On rejoin: load last N messages (configurable, default: 50) per channel
- Retention policy: configurable per world (default: 30 days)
- Prerequisite for session recaps (§4.2) — recap prompt reads from persisted message history

### 4.5 Voice Chat Support

**Rank #30 · 1 pt · 1 voter**

Voice communication for OOC coordination.

**Requirements:**
- OOC-only — IC speech must be text so the intent parser can process it
- Azure Communication Services for WebRTC voice rooms
- Voice rooms scoped to party
- Push-to-talk default, with option for open mic
- **Tier:** P2 — not blocking for v1, spike for v2

---

## 5. UX & World Management

### 5.1 Landing Page / Lobby

**Rank #13 · 5 pts · 1 voter**

The player's front door — first screen every player sees.

**Requirements:**
- Public world browser: list of public worlds with name, description, player count, tone, difficulty
- "My Worlds" section: worlds the player has created or joined
- "Join by Code" for private worlds
- Character selection per world (one character per player per world)
- World status indicators: active players, last activity, world age
- Responsive layout (§5.6)

### 5.2 World Creation Wizard

**Rank #14 · 4 pts · 1 voter**

Guided multi-step flow for creating a new world. Every downstream system inherits its configuration from decisions made here.

**Requirements:**
- Step 1 — **Identity:** World name, description, creator attribution
- Step 2 — **Tone:** Narrative tone selection (gritty / heroic / whimsical / horror / custom). Propagates to narrative engine prompt persona.
- Step 3 — **Difficulty:** Difficulty tier (casual / standard / hardcore). Affects rules engine DC scaling, resource scarcity, combat lethality.
- Step 4 — **World Shape:** Biome preferences, world seed (auto-generated or manual), world size category
- Step 5 — **Multiplayer:** Player cap (1–32), public/private toggle, invite code generation, play mode (real-time / async / both)
- Step 6 — **House Rules:** Optional toggles — PvP enabled, friendly fire, permadeath, Fray zone intensity, container degradation
- Step 7 — **Review & Create:** Summary of all choices, confirm

**Output:** A `WorldConfig` record persisted to Blob Storage that all downstream systems read:

```ts
type WorldConfig = {
  id: string;
  name: string;
  description: string;
  creatorId: string;
  seed: number;
  tone: "gritty" | "heroic" | "whimsical" | "horror" | "custom";
  customTonePrompt?: string;
  difficulty: "casual" | "standard" | "hardcore";
  playerCap: number;
  visibility: "public" | "private";
  inviteCode?: string;
  playMode: "realtime" | "async" | "both";
  houseRules: {
    pvpEnabled: boolean;
    friendlyFire: boolean;
    permadeath: boolean;
    frayIntensity: "low" | "medium" | "high";
    containerDegradation: boolean;
  };
  createdAt: number;
};
```

### 5.3 Tone Selection at Creation

**Rank #26 · 2 pts · 1 voter**

Absorbed into World Creation Wizard (§5.2, Step 2). Tone propagates to narrative engine prompt persona, vocabulary tables, and adaptive verbosity defaults.

### 5.4 Autosave UX with Visual Feedback

**Rank #16 · 3 pts · 2 voters**

**Requirements:**
- Auto-save world state to Blob Storage after every turn resolution
- Visual indicator in the UI: "Saving..." → "Saved" with timestamp
- Manual save button for explicit snapshots
- Save failures surface a non-blocking warning toast (do not interrupt gameplay)

### 5.5 Presence as In-World Location

**Rank #10 · 6 pts · 2 voters**

Transform the friends/player list from "online/offline" to a living world map.

**Requirements:**
- Player list displays character name + current location name (not coordinates)
- Location resolved from the nearest named place (settlement, landmark, biome name)
- Format: *"Sorrel — The Weavers' Cradle"* or *"Kael — Thornwick Forest (traveling)"*
- Players in Fray zones show: *"Kael — The Fray (Hollowreach border)"*
- Absent players show: *"Sorrel — The Threadbare Inn (resting)"* with last-seen timestamp
- Data source: heartbeat payload (§3.2) includes location, displayed via presence state

### 5.6 Responsive / Mobile Design

**Rank #16 · 3 pts · 2 voters**

**Requirements:**
- Mobile-first responsive layout
- Breakpoints: mobile (< 768px), tablet (768–1024px), desktop (> 1024px)
- Mobile: stacked layout — narrative panel full-width, chat as slide-up drawer, map as overlay
- Desktop: multi-panel layout — narrative center, chat sidebar, map/inventory panels
- Touch-friendly interaction targets (minimum 44px tap targets)
- Virtual keyboard handling for chat input on mobile

### 5.7 Tapestry Map (World Overview)

**Rank #30 · 1 pt · 1 voter**

Visual world map rendered in the LoreWeave aesthetic.

**Requirements:**
- Overworld map showing explored regions as a "woven tapestry" — brighter where wards hold, fraying at edges
- Fog of war for unexplored areas (rendered as unraveled threads)
- Player position markers with character names
- Clickable regions for location details
- Rendered client-side from world state data (tile biomes, ward strength, exploration status)
- **Tier:** P2 — visual polish, not blocking for v1

---

## 6. Party System

### 6.1 Consensus Turn Model

**Rank #8 · 7 pts · 2 voters**

How parties resolve simultaneous action when multiple players are present.

**Requirements:**
- **Exploration mode:** All party members submit actions independently. Actions resolve in initiative order (DEX-based). Each player sees the narrative result of all actions in sequence.
- **Combat mode:** Initiative-based turn order (D&D 5e rules). Active player has a configurable time limit (default: 60 seconds). Timeout → Dodge action.
- **Group check mode:** When a party-wide check is required (e.g., group Stealth), all members roll. Success if at least half succeed (PHB 2024 rule).
- **Consensus actions:** Movement to a new location requires majority party vote (configurable: majority or unanimous). Dissenting players may split from the party.

### 6.2 Party Group Actions

**Rank #10 · 6 pts · 2 voters**

Actions that affect or involve the entire party.

**Requirements:**
- Group rest: any member can propose, requires majority approval
- Group travel: leader proposes destination, party votes
- Group check: triggered automatically by the rules engine when applicable
- Party chat: IC channel scoped to party members only
- Party-wide effects (e.g., bless, campfire warmth) applied to all members within range

### 6.3 Party Leader-Decides Model

**Rank #16 · 3 pts · 1 voter**

Alternative decision model where the party leader's choice overrides.

**Requirements:**
- Party creator is default leader; leadership transferable
- When enabled (world house rule or party setting), leader can override consensus for movement and group actions
- Leader-decides vs. consensus is a per-party toggle, not a global setting
- Non-leaders can still act independently for personal actions (attack, use item, talk)

### 6.4 Party Formation as Narrative Event

**Rank #16 · 3 pts · 1 voter**

Party creation as an in-world narrative moment, not a UI button click.

**Requirements:**
- When players form a party, the narrative engine generates a binding scene: *"The weave recognizes the bond — threads intertwine between you, glowing faintly..."*
- Party name is optional; if omitted, the DM assigns one based on context
- Party dissolution also triggers a narrative beat
- Purely cosmetic — wraps the mechanical party-create/destroy with flavor text

### 6.5 Party Narrative Weaving

**Rank #26 · 2 pts · 1 voter**

Narrative engine awareness of party dynamics.

**Requirements:**
- DM references party relationships in narration (not just individual actions)
- Party members' actions can complement each other narratively: *"As Kael draws the guard's attention, Sorrel slips past unnoticed..."*
- Context assembly (§4.4.3 of `loreweave_spec.md`) includes party composition and recent party actions
- **Tier:** P2 — narrative polish

---

## 7. Item Transfer & Trading

### 7.1 Threadcraft Remote Item Transfer

**Rank #5 · 10 pts · 3 voters**

LoreWeave's signature remote trading mechanic — sending items through the weave at a cost.

**Requirements:**
- Requires the sender to have the Threadcraft skill
- Threadcraft check (DC based on item value/weight and distance) to send an item to a named recipient
- On success: item arrives at recipient's location, wrapped in a narrative beat
- On failure: item is lost to the Fray (destroyed or degraded, based on margin of failure)
- Fray risk scales with distance: adjacent settlement (DC 10), same region (DC 15), cross-world (DC 20)
- Recipient must be in a warded location (settlement, camp) to receive
- Each transfer is a narrative event visible to nearby players

### 7.2 Location-Gated Trading

**Rank #6 · 9 pts · 4 voters**

Players must be in the same location to trade directly.

**Requirements:**
- Direct trade (no Threadcraft) requires both players on the same tile or adjacent tiles
- Trade UI: propose items → counterparty reviews → both confirm → swap
- Trade is atomic — both sides commit or neither does
- Trade visible to nearby players as a narrative beat: *"Kael passes a worn dagger to Sorrel..."*
- NPC merchants follow the same proximity rule — must be at the merchant's location
- Remote trade only possible via Threadcraft (§7.1)

### 7.3 Containers as World Objects

**Rank #16 · 3 pts · 1 voter**

Chests, barrels, bags, and other containers exist as interactive world entities.

**Requirements:**
- Containers are world entities with: location, capacity (weight/slot-based), contents, ownership, ward status
- Container types: chest (stationary), bag (portable, carried by character), barrel (stationary, large capacity), locked chest (requires key or Thieves' Tools check)
- Players interact via standard actions: `open`, `take from`, `put in`, `lock`, `ward`
- Containers persist in world state — other players can discover and interact with them
- Container contents are part of the world state saved to Blob Storage

```ts
type Container = {
  id: string;
  type: "chest" | "bag" | "barrel" | "locked_chest";
  locationTile: { x: number; y: number };
  capacity: number;        // max item slots
  contents: Item[];
  ownerId?: string;        // player who placed it
  locked: boolean;
  lockDC?: number;         // Thieves' Tools DC to pick
  warded: boolean;
  wardStrength?: number;   // remaining ward HP
  createdAt: number;
};
```

### 7.4 Warded Containers

**Rank #14 · 4 pts · 2 voters**

Protection mechanic for containers in dangerous areas.

**Requirements:**
- Warding costs ward resources (thread fragments, ward stones — specific items TBD by Bard/Loremaster)
- Warded containers are immune to Fray degradation (§7.6)
- Ward strength depletes over time in Fray zones (configurable rate)
- Ward can be refreshed by spending additional resources
- Warding is a player action that triggers a narrative beat

### 7.5 Container Nesting

**Rank #16 · 3 pts · 1 voter**

Containers can hold other containers (bags inside chests).

**Requirements:**
- One level of nesting only (no recursive containers)
- Nested container's contents count toward parent's capacity
- Nested container inherits parent's ward protection

### 7.6 Container Degradation in Fray Zones

**Rank #26 · 2 pts · 2 voters**

The consequence mechanic that makes warded containers meaningful.

**Requirements:**
- Unwarded containers in Fray zones degrade over time
- Server-side tick check (interval configurable, default: every 10 game-minutes)
- Degradation roll: percentile check against Fray intensity (from WorldConfig)
- On degradation: random item in container is damaged or destroyed
- Warded containers are immune until ward strength depletes
- Narrative beat on degradation: *"The Fray gnaws at your unwarded chest — a glass vial inside cracks and darkens..."*

### 7.7 Container Interaction Beats

**Rank #30 · 1 pt · 1 voter**

Narrative flavor for container interactions.

**Requirements:**
- Opening, closing, storing, and retrieving items generate brief DM narration
- Narration references container type and contents contextually
- **Tier:** P2 — narrative polish

---

## 8. Persistence & Hosting

### 8.1 Blob Storage for World State & Inventories

**Rank #6 · 9 pts · 3 voters**

Azure Blob Storage as the persistence backbone.

**Requirements:**
- JSON blobs per world, per player, per entity type
- Storage structure:
  ```
  worlds/{worldId}/
    config.json              — WorldConfig (§5.2)
    state/
      chunks/{chunkId}.json  — world tile data
      entities/{entityId}.json
    players/{playerId}/
      character.json
      inventory.json
    chat/{channel}/{date}/
      {timestamp}_{id}.json
    events/
      {date}/{timestamp}_{id}.json
  ```
- Hot tier for active worlds, cool tier for inactive (> 30 days)
- Optimistic concurrency via ETags to prevent write conflicts
- Snapshot versioning for rollback (configurable retention)

### 8.2 Azure Static Web Apps Hosting

**Rank #16 · 3 pts · 1 voter**

**Requirements:**
- Azure Static Web Apps for the client application
- CDN distribution, custom domain, HTTPS
- GitHub Actions CI/CD integration
- Staging environments for PR previews
- API backend via Azure Functions (integrated)

---

## 9. Narrative Features

### 9.1 Adaptive Verbosity

**Rank #10 · 6 pts · 4 voters**

Context-sensitive narrative pacing — the DM adjusts prose length and intensity based on game mode.

**Requirements:**
- Mode detection: `combat` / `exploration` / `social` / `downtime`
- Mode set automatically based on game state (combat initiative active → combat mode) or manually by player (`//pace exploration`)
- Prompt modifier per mode:

| Mode | Style | Target Length |
|------|-------|---------------|
| `combat` | Terse, punchy, mechanical clarity | 1–2 sentences |
| `exploration` | Atmospheric, descriptive, world-building | 3–5 sentences |
| `social` | Conversational, character-focused | 2–4 sentences |
| `downtime` | Reflective, ambient, time-passing | 1–3 sentences |

- Mode flag injected into the system prompt (§4.4.4 of `loreweave_spec.md`)
- Player can override auto-detected mode via OOC command

### 9.2 Proximity-Gated Narration

**Rank #26 · 2 pts · 1 voter**

Players only receive narrative for events within perceptual range.

**Requirements:**
- Narration scoped to `viewRadius` (default: 5 tiles, per §4.4.6 of `loreweave_spec.md`)
- Events beyond view radius are omitted from the player's narrative stream
- Events at the edge of view radius are narrated with reduced detail: *"You hear distant shouts to the east..."*
- Party members always receive each other's action narration regardless of distance (thread bond)

---

## 10. Open Design Questions

These questions surfaced during the brainstorm and require decisions before implementation:

| # | Question | Recommendation | Deciding Factor |
|---|----------|----------------|-----------------|
| 1 | **Authentication provider** | Azure AD B2C with social logins (Discord, Google, Microsoft) | Standard Azure stack, handles token refresh |
| 2 | **Player cap per world** | 32 (configurable at creation) | Balances party diversity with server cost |
| 3 | **Mobile support depth** | Responsive web, not native app | Responsive design (§5.6) covers this |
| 4 | **Monetization model** | Pay-per-use Azure costs passed through or subscription | stevenic to decide — affects hosting architecture |
| 5 | **Accessibility** | Screen reader support, colorblind palettes, keyboard navigation | Not yet specced — needs dedicated pass |
| 6 | **NPC system integration** | NPCs follow the same proximity/presence rules as players | Pending NPC system approval (designed but not yet approved) |

---

## 11. Implementation Order

Recommended build sequence based on dependency chains:

### Wave 1 — Foundation
1. **SignalR infrastructure** (§3.1) — everything depends on this
2. **Blob Storage persistence** (§8.1) — everything persists through this
3. **Azure Static Web Apps** (§8.2) — hosting platform
4. **OOC/IC chat separation** (§4.1) — core message schema
5. **Chat persistence** (§4.4) — prerequisite for recaps

### Wave 2 — Game Loop
6. **Chat-to-intent extraction** (§4.3) — enhanced parser
7. **Consensus turn model** (§6.1) — multiplayer game loop
8. **Presence heartbeats** (§3.2) — connection lifecycle
9. **Graceful disconnect** (§3.3) — connection resilience
10. **Session recaps** (§4.2) — requires chat persistence + disconnect detection

### Wave 3 — World & UX
11. **World Creation Wizard** (§5.2) — world config propagates everywhere
12. **Landing page / lobby** (§5.1) — player entry point
13. **Presence as in-world location** (§5.5) — social layer
14. **Adaptive verbosity** (§9.1) — narrative quality
15. **Autosave UX** (§5.4) — save indicators
16. **Responsive design** (§5.6) — mobile support

### Wave 4 — Items & Parties
17. **Containers as world objects** (§7.3) — entity model foundation
18. **Location-gated trading** (§7.2) — proximity trade
19. **Threadcraft remote transfer** (§7.1) — signature mechanic
20. **Warded containers** (§7.4) — protection mechanic
21. **Container nesting** (§7.5) — quality of life
22. **Party group actions** (§6.2) — party mechanics
23. **Party formation narrative** (§6.4) — flavor
24. **Party leader-decides** (§6.3) — alternative model

### Wave 5 — Polish
25. **Container degradation** (§7.6) — Fray consequence
26. **Async hybrid support** (§3.4) — async play mode
27. **Proximity-gated narration** (§9.2) — perceptual scoping
28. **Party narrative weaving** (§6.5) — narrative polish
29. **Container interaction beats** (§7.7) — flavor
30. **Tapestry map** (§5.7) — world visualization
31. **Voice chat** (§4.5) — v2 feature

---

## Appendix A — Consolidated Vote Tally

| Rank | Feature | Pts | Voters | Spec Section |
|------|---------|-----|--------|--------------|
| 1 | OOC/IC chat separation | 21 | 6 | §4.1 |
| 2 | Session recaps on rejoin | 15 | 5 | §4.2 |
| 3 | Chat-to-intent extraction | 13 | 4 | §4.3 |
| 4 | SignalR / real-time comms | 12 | 3 | §3.1 |
| 5 | Threadcraft remote transfer | 10 | 3 | §7.1 |
| 6 | Location-gated trading | 9 | 4 | §7.2 |
| 6 | Blob Storage persistence | 9 | 3 | §8.1 |
| 8 | Consensus turn model | 7 | 2 | §6.1 |
| 8 | Graceful disconnect | 7 | 3 | §3.3 |
| 10 | Party group actions | 6 | 2 | §6.2 |
| 10 | Presence as in-world location | 6 | 2 | §5.5 |
| 10 | Adaptive verbosity | 6 | 4 | §9.1 |
| 13 | Landing page / lobby | 5 | 1 | §5.1 |
| 14 | Warded containers | 4 | 2 | §7.4 |
| 14 | World Creation Wizard | 4 | 1 | §5.2 |
| 16 | Azure Static Web Apps | 3 | 1 | §8.2 |
| 16 | Chat persistence | 3 | 1 | §4.4 |
| 16 | Autosave UX | 3 | 2 | §5.4 |
| 16 | Responsive / mobile | 3 | 2 | §5.6 |
| 16 | Party formation narrative | 3 | 1 | §6.4 |
| 16 | Containers as world objects | 3 | 1 | §7.3 |
| 16 | Container nesting | 3 | 1 | §7.5 |
| 16 | Party leader-decides | 3 | 1 | §6.3 |
| 16 | Async hybrid support | 3 | 2 | §3.4 |
| 16 | Presence heartbeats | 3 | 2 | §3.2 |
| 26 | Container degradation | 2 | 2 | §7.6 |
| 26 | Party narrative weaving | 2 | 1 | §6.5 |
| 26 | Proximity-gated narration | 2 | 1 | §9.2 |
| 26 | Tone selection at creation | 2 | 1 | §5.3 |
| 30 | Container interaction beats | 1 | 1 | §7.7 |
| 30 | Tapestry map | 1 | 1 | §5.7 |
| 30 | Voice chat | 1 | 1 | §4.5 |
