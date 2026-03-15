
🌿
DEWDROP VALLEY
A Cozy Pixel Art RPG Adventure

Game Design Document  •  Version 1.0
2026



1. Game Overview

| Attribute | Details |
|-----------|----------|
| Title | Dewdrop Valley |
| Genre | Cozy Top-Down Pixel Art RPG / Adventure |
| Platform | PC (Windows/Mac), Mobile (iOS/Android) |
| Engine | Godot 4 (or Unity 2D) |
| Art Style | 8-bit / 16-bit pixel art, warm earthy palette |
| Target Audience | Ages 13+, fans of Stardew Valley, Spiritfader, Undertale |
| Tone | Warm, wholesome, quietly emotional |
| Scope | 8–12 hours main story; 20+ hours full completion |

Elevator Pitch
Dewdrop Valley is a cozy top-down pixel art RPG where you inherit a crumbling cottage in a sleepy village and slowly bring it — and its eccentric residents — back to life. No combat. No timers. Just exploration, relationships, and the gentle mystery of why everyone seems to be hiding something warm.

2. Story & Setting
Premise
After burning out from city life, your character (customizable name/pronouns) receives a letter from their late great-aunt Mira: she's left them her cottage in Dewdrop Valley, a small village nestled between a misty forest and a pebble beach. The village is sleepy, a little overgrown, and oddly quiet — but there's magic humming under the surface.
Core Themes
•	Slow living and finding joy in small things
•	Community and the courage to ask for help
•	Grief, memory, and letting go
•	Nature as a healing force

The Village — Dewdrop Valley
Population: ~30 named NPCs. The village has a central square with a fountain, a weekly market, surrounding farms and cottages, a crumbling lighthouse, a misty forest path, and a hidden beach cove.
Main Story Arc
Act 1 — Settling In (Days 1–7)
The player arrives, meets their neighbours, and discovers that the village festival — the Dewdrop Lantern Night — hasn't been held in 10 years since a mysterious falling-out. Restoring it becomes the heart of the story.
Act 2 — Untangling (Days 8–20)
Each major NPC has a side story tied to the old feud. By helping them, the player pieces together what really happened and begins to heal the village's wounds.
Act 3 — The Lantern Night (Day 21+)
The festival is restored. A bittersweet ending reveals the truth about Great-Aunt Mira's role in the falling-out — and the player must decide how to honour her memory.

3. Core Gameplay
Movement & Exploration
•	Top-down, 4-directional movement (8-directional on gamepad)
•	Pixel-perfect collision on a 16x16 tile grid
•	Smooth camera follow with slight lag for cozy feel
•	Areas: Village, Forest, Beach, Player Cottage, NPC homes
•	Day/night cycle (each in-game day = ~20 real minutes)

Core Loops
Daily Loop
Wake up → check journal → talk to NPCs → explore/complete tasks → return home → sleep to advance day.
Relationship Loop
Gift items → complete quests → unlock cutscenes → deepen friendships → unlock new areas and secrets.
Restoration Loop
Collect materials (forage, buy, receive as gifts) → upgrade cottage and village spaces → unlock new NPC interactions.

No Combat Design
Dewdrop Valley has zero combat. Tension comes from dialogue choices, time-sensitive quests, and emotional stakes. This keeps the game accessible and true to its cozy tone.
Dialogue System
•	Branching dialogue with 2–3 player choices at key moments
•	Choices affect relationship scores (hidden stat 0–100)
•	NPCs remember past choices and reference them later
•	Skippable after first read; log available in journal

4. Characters
Player Character
Customisable name, pronouns, skin tone, hair colour. Backstory is urban burnout; personality shaped by player choices over the game.

Key NPCs

| Name | Role | Description |
|------|------|-------------|
| Bramble | Herbalist | Elderly, gruff but deeply kind. Tends the forest path and holds secrets about Mira. |
| Sol | Lighthouse Keeper | Young, anxious, hasn't left the lighthouse in months. Loves astronomy. |
| Clem & Rue | Baker siblings | Bickering twins who haven't spoken properly in years — the heart of the old feud. |
| Wren | Travelling Artist | Arrives mid-game; nomadic, wise, becomes a close confidant. |
| Elder Moss | Village Elder | Ancient, gentle, speaks in riddles. Knows everything about the valley's past. |

5. Art & Audio Direction
Visual Style
•	8-bit pixel art with warm, muted earthy tones (sage, ochre, dusty rose, warm cream)
•	16x16 character sprites, 32x32 for key NPCs
•	Animated environmental details: fireflies, rustling grass, gentle rain
•	Soft screen-space vignette; pixelated fonts for UI (Press Start 2P or m5x7)
•	Day/night palette shift — golden afternoon → indigo dusk → starlit night

Audio
•	Chiptune / lo-fi acoustic hybrid soundtrack
•	Each village zone has its own ambient theme
•	Dynamic music layers that shift based on relationship levels
•	Foley: footsteps on grass/wood/sand, rain on windows, crackling fireplace
•	NPCs have short voiced 'grunts' (not full voice acting)

6. Monetisation & Release
Business Model

| Category | Details |
|----------|----------|
| Price | $14.99 base game (PC) / $6.99 mobile |
| DLC | Optional seasonal content packs (new festivals, NPCs) |
| No Ads | True premium experience — no ads, no energy timers |
| Demo | Free demo covering Day 1–3 |

Release Milestones

| Milestone | Timeline |
|-----------|----------|
| Prototype | Week 4 — playable vertical slice (village + 2 NPCs) |
| Alpha | Month 3 — Act 1 complete, all systems in place |
| Beta | Month 6 — full story, polish pass |
| Launch | Month 9 — PC launch |
| Mobile | Month 12 — iOS/Android port |

7. Technical Notes
Engine & Tools
•	Godot 4.x — open source, excellent 2D pipeline
•	Aseprite — pixel art creation
•	LMMS / GarageBand — chiptune composition
•	Tiled — map editing (Godot TMX import)

Save System
Auto-save at end of each in-game day. Manual save available from journal. Three save slots. Cloud sync on Steam / Apple Game Center.
Accessibility
•	Scalable UI and pixel art (nearest-neighbour upscaling)
•	Colourblind modes (Protanopia, Deuteranopia, Tritanopia)
•	Adjustable text size and dialogue speed
•	Remappable controls; full controller support

🌿  May Dewdrop Valley find its way to every cozy corner of the world.  🌿
