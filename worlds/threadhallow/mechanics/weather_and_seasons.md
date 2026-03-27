# Weather & Seasons — Mechanical Specification

*Addendum to the Threadhallow Mechanics Companion*
*Source: 2024 Free Rules (DM's Toolbox — Environmental Effects), adapted for Threadhallow*

---

## 1. Weather Types

Seven weather types, each mapped to 2024 Free Rules environmental hazards.

### 1.1 Clear

No mechanical effects. Full visibility. The default.

### 1.2 Overcast

- **Visibility:** Normal
- **Mechanical:** No direct effects
- **Narrative:** Gray skies, flat light, subdued atmosphere
- **Weave signal:** In Thin zones, overcast skies may develop unnatural colors (copper, violet)

### 1.3 Rain

- **Visibility:** Lightly obscured beyond 100 ft.
- **Hearing:** Disadvantage on Wisdom (Perception) checks that rely on hearing
- **Fire:** Open flames extinguished; fire damage from non-magical sources reduced by 2
- **Terrain:** Unpaved surfaces become difficult terrain after 4 hours of continuous rain
- **Tracking:** DC of Wisdom (Survival) checks to track increases by +5

### 1.4 Heavy Rain / Storm

- **Visibility:** Heavily obscured beyond 60 ft., lightly obscured beyond 30 ft.
- **Hearing:** Automatic failure on Perception checks relying on hearing beyond 30 ft.
- **Fire:** All non-magical flames extinguished; fire damage reduced by 5
- **Terrain:** All unpaved surfaces are difficult terrain
- **Ranged attacks:** Disadvantage on ranged weapon attacks beyond normal range
- **Concentration:** DC 10 Constitution save to maintain concentration on spells when hit by wind/lightning
- **Lightning risk:** Outdoors, 5% chance per hour of lightning strike on highest metal object (8d6 lightning damage, DC 15 DEX save for half)
- **Travel:** Overland travel speed reduced by half

### 1.5 Fog

- **Visibility:** Heavily obscured beyond 30 ft.
- **Navigation:** DC 13 Wisdom (Survival) check every hour to maintain direction; failure = 1d4 hours lost
- **Stealth:** Advantage on Dexterity (Stealth) checks
- **Ambush:** Creatures in fog have advantage on initiative rolls for ambushes
- **Duration:** Typically dawn to mid-morning, or all day in swamp/coast biomes

### 1.6 Snow

- **Visibility:** Lightly obscured
- **Terrain:** 1 inch per hour accumulation; after 4 hours, difficult terrain
- **Tracking:** DC of Survival checks to track *decreases* by 5 (tracks in snow)
- **Cold exposure:** DC 10 Constitution save every hour without cold weather gear or 1 level of exhaustion (per 2024 Free Rules, Extreme Cold)
- **Travel:** Overland speed reduced by one-third after accumulation

### 1.7 Blizzard

- **Visibility:** Heavily obscured beyond 15 ft. (whiteout conditions)
- **Hearing:** Automatic failure on hearing-based Perception beyond 15 ft.
- **Terrain:** All surfaces are difficult terrain
- **Cold exposure:** DC 13 Constitution save every 30 minutes without shelter or cold gear; failure = 1 level of exhaustion
- **Navigation:** DC 16 Wisdom (Survival) check every hour; failure = lost, moving in random direction
- **Travel:** Overland travel at one-quarter speed; DC 14 Constitution save every 2 hours or forced to stop and shelter
- **Ranged attacks:** Disadvantage; attacks beyond 30 ft. automatically miss

---

## 2. Seasonal Modifiers

Four seasons, each affecting travel, foraging, rest, and encounter rates.

### 2.1 Spring (The Greening — months 3–5)

| Category | Modifier |
|----------|----------|
| Travel speed | Normal |
| Foraging (Survival DC) | DC 12 (abundant) |
| Rest quality | Normal |
| Encounter frequency | Normal |
| Weather tendency | Rain (40%), Overcast (30%), Clear (20%), Fog (10%) |
| Special | Ward ceremonies at +2 effectiveness; new growth obscures old trails |

### 2.2 Summer (The High Thread — months 6–8)

| Category | Modifier |
|----------|----------|
| Travel speed | Normal |
| Foraging (Survival DC) | DC 10 (peak abundance) |
| Rest quality | Short rests: normal; Long rests interrupted by heat if no shelter (DC 10 CON or no benefit) |
| Encounter frequency | +10% (more active creatures) |
| Weather tendency | Clear (40%), Overcast (25%), Storm (20%), Rain (15%) |
| Special | Longest days; Threadlines most visible at midsummer; heat exhaustion in desert/plains (DC 12 CON/hour without water) |

### 2.3 Autumn (The Waning — months 9–11)

| Category | Modifier |
|----------|----------|
| Travel speed | Reduced by one-quarter (muddy roads, shorter days) |
| Foraging (Survival DC) | DC 14 (diminishing) |
| Rest quality | Normal |
| Encounter frequency | +20% (creatures stocking for winter; bandit activity peaks) |
| Weather tendency | Overcast (30%), Rain (25%), Fog (25%), Clear (15%), Storm (5%) |
| Special | The Hollowing falls in late autumn; Fray activity increases as the old ward weakens; fog frequency doubles near Thin zones |

### 2.4 Winter (The Binding — months 12–2)

| Category | Modifier |
|----------|----------|
| Travel speed | Reduced by half (snow, ice, short days) |
| Foraging (Survival DC) | DC 18 (scarce; tundra/mountain: DC 20) |
| Rest quality | Long rests require shelter or cold weather gear; without either, DC 13 CON or only short rest benefit |
| Encounter frequency | –25% (creatures dormant) except wolves and Fray creatures (unaffected by season) |
| Weather tendency | Snow (30%), Overcast (25%), Clear (20%), Blizzard (15%), Fog (10%) |
| Special | Binding ceremonies critical; ward decay accelerates (–2/week instead of –1); Threadlines glow brighter in cold |

---

## 3. Time of Day

### 3.1 Light Levels

| Time | Light | Mechanical Effect |
|------|-------|-------------------|
| Dawn (1 hour) | Dim light | Disadvantage on Perception checks beyond 60 ft.; advantage on Stealth approaching from the east |
| Day | Bright light | Normal |
| Dusk (1 hour) | Dim light | As dawn, from the west |
| Night (no moon) | Darkness | Heavily obscured beyond darkvision range; creatures without darkvision have disadvantage on attack rolls and Perception checks |
| Night (moon) | Dim light outdoors | As dim light |

### 3.2 Rest Timing

Per 2024 Free Rules:
- **Long rest:** 8 hours, at least 6 of which sleeping. Typically night. Only 1 per 24 hours.
- **Short rest:** 1 hour. Any time.

### 3.3 Watch Schedule

A standard day is divided into 6 watches of 4 hours:
- Pre-dawn (2am–6am)
- Morning (6am–10am)
- Midday (10am–2pm)
- Afternoon (2pm–6pm)
- Evening (6pm–10pm)
- Night (10pm–2am)

Weather changes are checked at the start of each watch.

---

## 4. Deterministic Weather Generation

Weather is generated deterministically from the world seed, current date, biome, and season.

### 4.1 Algorithm

```
function generateWeather(worldSeed, day, watchIndex, biome, season, weaveState):
    // Seed the RNG
    rng = seededRNG(hash(worldSeed, day, watchIndex))

    // Get base probability table for this season
    probTable = SEASON_WEATHER_PROBABILITIES[season]

    // Apply biome modifiers
    modifiedTable = applyBiomeModifiers(probTable, biome)

    // Roll weather
    roll = rng.next(1, 100)
    weather = selectFromTable(modifiedTable, roll)

    // Determine persistence (how many watches this weather lasts)
    persistence = rng.next(1, 4)  // 1d4 watches

    // Apply weave state amplification
    weather = applyWeaveAmplification(weather, weaveState)

    return { weather, persistence }
```

### 4.2 Biome Modifiers

| Biome | Rain | Storm | Fog | Snow | Blizzard | Notes |
|-------|------|-------|-----|------|----------|-------|
| forest | +10% | — | +5% | — | — | Canopy provides shelter |
| plains | — | +5% | — | — | — | Exposed to storms |
| mountain | — | +10% | — | +15% | +10% | Altitude = cold + storms |
| swamp | +10% | — | +20% | — | — | Persistent fog |
| tundra | — | — | — | +20% | +15% | Snow/blizzard dominant |
| desert | –20% | –10% | –15% | –20% | –20% | Dry; clear dominant |
| taiga | — | — | +5% | +10% | +5% | Cold, some fog |
| coast | +10% | +15% | +15% | — | — | Maritime weather |
| hills | +5% | +5% | +15% | +5% | — | Fog in valleys |
| cavern | N/A | N/A | N/A | N/A | N/A | No weather underground |
| farmland | — | — | +5% | — | — | Similar to plains, less exposed |
| deep_forest | +5% | –5% | +10% | — | — | Dense canopy filters storms |

**Cavern exception:** Underground locations have no weather. Instead, they have environmental conditions (dampness, temperature, air quality) that are static per location.

### 4.3 Weather Persistence

Weather persists for 1d4 watches (4-hour blocks). At the end of the persistence period, new weather is generated. The new weather is biased toward the previous weather:
- 30% chance of same weather continuing
- 70% chance of new roll on the season table

### 4.4 Weave State Amplification

| Weave State | Weather Modification |
|---|---|
| **Stable** | No modification |
| **Thin** | Weather has minor visual anomalies (rain falls slightly sideways, fog has copper tinge). No mechanical change. Wind occasionally carries sounds that shouldn't be there. |
| **Frayed** | One severity step increase (Rain → Storm, Snow → Blizzard, Clear → Fog). All weather DCs +2. Weather changes every 1d4 hours instead of 1d4 watches. 25% chance of Fray phenomena mixed into weather (thread-rain, gravity fog). |
| **Unraveled** | Weather is unreliable — changes every 1d4 hours regardless of persistence. Can produce impossible combinations (snow in summer, blizzard in desert). All DCs +5. No long rests outdoors. 50% chance weather is a Fray manifestation rather than natural. |

---

## 5. The Wheel of Binding — Game Clock

The Wheel of Binding is Threadhallow's calendar-based game clock, driven by 8 annual ward ceremonies.

### 5.1 Ceremony Schedule

| # | Ceremony | Season | Month | Ward Effect |
|---|----------|--------|-------|-------------|
| 1 | The First Thread | Early Spring | 3 | +12 ward strength |
| 2 | The Greening Knot | Mid Spring | 4 | +12 ward strength |
| 3 | The High Thread | Early Summer | 6 | +12 ward strength |
| 4 | The Midsummer Binding | Mid Summer | 7 | +12 ward strength |
| 5 | The Waning Song | Early Autumn | 9 | +12 ward strength |
| 6 | The Harvest Knot | Mid Autumn | 10 | +12 ward strength |
| 7 | The Hollowing | Late Autumn | 11 | +24 ward strength (×2 multiplier) |
| 8 | The Winter Binding | Mid Winter | 1 | +12 ward strength |

### 5.2 Ward Decay

- **Base decay:** –1 ward strength per week
- **Winter decay:** –2 per week (months 12–2)
- **Missed ceremony:** No ward recovery for that cycle. The next ceremony is at +2 DC (cumulative).
- **Failed ceremony:** Ward strength decreases by 6 instead of increasing by 12.

### 5.3 Ward Strength Budget

Annual ward budget calculation:
- 8 successful ceremonies: +108 ward strength (+12 × 7 + +24 × 1)
- Annual decay: –52 to –78 (52 weeks × –1 to –1.5 average)
- **Net annual:** +30 to +56 ward strength if all ceremonies succeed

This means a settlement at ward strength 50 stays healthy with consistent ceremonies but can spiral quickly if ceremonies are missed. Two consecutive missed ceremonies + winter decay = –26 to –30 ward strength in 6 weeks.

### 5.4 Ceremony Mechanics

Each ceremony is a Binding Song skill challenge (Mechanics Companion §7):
- **Complexity 2:** 6 successes before 3 failures
- **Base DC:** Depends on Song completeness (DC 12 with full Song, up to DC 21 with no Song)
- **Flawless completion (6/0):** +18 instead of +12 (+36 during Hollowing)
- **The Hollowing:** The most important ceremony. ×2 multiplier on success OR failure. A failed Hollowing costs –12 instead of the usual –6.

### 5.5 Game Clock Implications

The Wheel creates mechanical urgency:
- Players can't ignore ceremonies without consequences
- Each settlement's ward strength is tracked independently
- Traveling to a distant ceremony means missing your home settlement's ceremony
- The Act IV choice (Restoration/Release/Harmony) determines whether the Wheel continues, is replaced, or evolves

---

## 6. Engine Implementation Spec

Six pure functions for Beacon to implement in `packages/rules/src/weather.ts`:

### 6.1 `generateWeather(seed, day, watch, biome, season, weaveState): WeatherResult`

Returns `{ type: WeatherType, persistence: number, amplified: boolean, frayPhenomenon: boolean }`.

Deterministic from inputs. Uses seeded RNG with `hash(seed, day, watch)`.

### 6.2 `getSeasonalModifiers(season): SeasonModifiers`

Returns `{ travelSpeedMod, forageDC, encounterFreqMod, restQuality, wardDecayRate }`.

Pure lookup from season tables.

### 6.3 `getWeatherEffects(weather, weaveState): WeatherEffects`

Returns `{ visibility, hearingPenalty, terrainMod, fireMod, rangedPenalty, concentrationDC, exposureDC, travelSpeedMod }`.

Composes base weather effects with weave state amplification.

### 6.4 `getLightLevel(timeOfDay, weather, biome): LightLevel`

Returns `'bright' | 'dim' | 'dark'` with modifiers for underground (always dark without light source) and weather (fog/blizzard reduce light level by one step).

### 6.5 `advanceCeremonyCalendar(currentDay, wardStrength, ceremonyResults): WardState`

Tracks the Wheel of Binding. Takes current day, ward strength, and array of past ceremony results. Returns updated ward strength after decay and any scheduled ceremony effects.

### 6.6 `getForageDC(biome, season, weather): number`

Returns the DC for a Wisdom (Survival) foraging check, accounting for biome (swamp easier, tundra harder), season (summer easiest, winter hardest), and weather (storm/blizzard increase DC by +5).

---

## Types Needed in `game.ts`

```typescript
export type WeatherType = 'clear' | 'overcast' | 'rain' | 'storm' | 'fog' | 'snow' | 'blizzard';

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export type TimeOfDay = 'pre_dawn' | 'morning' | 'midday' | 'afternoon' | 'evening' | 'night';

export type LightLevel = 'bright' | 'dim' | 'dark';

export type WeatherResult = {
    type: WeatherType;
    persistence: number;      // watches (1-4)
    amplified: boolean;       // true if weave state modified it
    frayPhenomenon: boolean;  // true if Fray manifestation mixed in
};

export type SeasonModifiers = {
    travelSpeedMod: number;    // multiplier (1.0 = normal, 0.5 = half)
    forageDC: number;          // base DC before biome/weather
    encounterFreqMod: number;  // multiplier (1.0 = normal, 1.2 = +20%)
    restQuality: 'normal' | 'impaired';
    wardDecayRate: number;     // per week (-1 normal, -2 winter)
};

export type WeatherEffects = {
    visibility: 'normal' | 'lightly_obscured' | 'heavily_obscured';
    visibilityRange: number;   // feet (-1 = unlimited)
    hearingPenalty: 'none' | 'disadvantage' | 'auto_fail';
    hearingRange: number;      // feet (-1 = unlimited)
    terrainMod: 'normal' | 'difficult';
    fireMod: number;           // damage reduction to non-magical fire
    rangedPenalty: 'none' | 'disadvantage' | 'auto_miss_beyond_30';
    concentrationDC: number;   // 0 = no extra check
    exposureDC: number;        // 0 = no exposure check
    exposureInterval: number;  // minutes between checks (0 = N/A)
    travelSpeedMod: number;    // multiplier
};

export type CeremonyResult = {
    day: number;
    ceremonyIndex: number;     // 0-7
    successes: number;
    failures: number;
    flawless: boolean;
    isHollowing: boolean;
    wardChange: number;        // actual change applied
};
```

---

## RAW Deviations

| Deviation | Rationale |
|-----------|-----------|
| Deterministic weather generation | D&D uses DM discretion for weather. LoreWeave needs reproducible, seed-based weather. Same inputs → same output. |
| Weave state amplification | Not in D&D. Core Threadhallow mechanic — weather as a carrier signal for Fray activity. |
| Wheel of Binding ceremony schedule | Custom game clock. D&D has no equivalent. Creates mechanical urgency tied to the narrative. |
| Ward decay per week | Custom mechanic (Mechanics Companion §4). Not in D&D but doesn't conflict with any RAW. |
| Foraging DCs by season | The 2024 Free Rules set a flat DC 15 for foraging. Our seasonal variation (DC 10–18) adds realism without breaking balance — the average across all seasons is close to DC 15. |
| Blizzard auto-miss beyond 30 ft. | More restrictive than RAW (which only gives disadvantage). Justified by whiteout conditions — you literally cannot see the target. |
