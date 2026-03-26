# Shared World Definitions

Standard archetypes for locations, NPCs, and vocabulary that any world can reference. These are generic building blocks — world-specific content lives under `worlds/<world-name>/`.

## Structure

```
worlds/shared/
├── locations/          # Location archetypes by category
│   ├── taverns/        # Tavern/inn variants
│   ├── shops/          # Commercial establishments
│   ├── temples/        # Religious sites
│   ├── residences/     # Houses and dwellings
│   ├── civic/          # Public and government buildings
│   ├── wilderness/     # Natural location types
│   └── dungeons/       # Underground and ruin types
├── npcs/               # NPC archetype templates
│   ├── merchants/      # Trade and commerce roles
│   ├── authority/      # Leadership and law roles
│   ├── craft/          # Artisan and skilled labor roles
│   ├── service/        # Hospitality and service roles
│   └── wanderers/      # Traveling and itinerant roles
└── vocabulary/         # Descriptor pools for narrative generation
    ├── atmosphere/     # Mood, sound, smell descriptors by context
    └── architecture/   # Building material and style descriptors by biome
```

## How Archetypes Work

Each archetype is a JSON file defining the structural template for a location or NPC. The world generator selects an archetype, rolls concrete values from its pools, and produces a `LocationRecord` or NPC instance.

Archetypes are **not** world-specific lore. They define:
- What objects/features are always/sometimes/rarely present
- What NPC roles are associated with this location type
- What description vocabulary applies
- What exits and interior layout patterns exist

World-specific flavor (naming conventions, cultural variants, faction ties) comes from the world's own content layered on top.

## File Format

See `archetype_format.md` for the schema definition.
