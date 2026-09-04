# 🚗 GTA 7: Chinatown

An isometric 2.5D retro open-world mini-game inspired by *Grand Theft Auto: Chinatown Wars*. Built with **pure Vanilla JavaScript** and **HTML5 Canvas** — zero build tools, zero dependencies, and works straight out of the box.

![GTA 7 Chinatown Gameplay](<Gameplay secreenshots/Screenshot 2026-06-10 163322.png>)

---

## 🎯 Objective

You are dropped into an infinite procedural metropolis. Your mission: **reach $5,000 cash** through any means necessary:
* 💵 Pick up money scattered across roadways.
* 🏃 Run down or eliminate pedestrians for quick cash drops.
* 🏪 Rob cash registers at local 24/7 minimarkets.
* 🔫 Arm yourself with a pistol and ammunition from the gun shop.
* 🚨 Outrun the police or pay off your wanted level at the nearest precinct.

---

## ✨ Features

- **🌆 Infinite Procedural City**:
  - Deterministic chunk generation via pure math hashing (`hash2`) — the world remains consistent upon revisit without storing massive maps.
  - Generates skyscrapers, residential blocks, green parks, roads, and sidewalks.
  - Fully functioning traffic light cycles at intersections and zebra crossings.
- **🚘 Vehicle Driving & Hijacking**:
  - Realistic arcade car physics with acceleration, steering, reversing, and handbrake drifting (`Space`).
  - Carjack any traffic vehicle or explore the city on foot.
- **🏢 Special Buildings & Enterable Interiors**:
  - 🛒 **Minimarket / Shop (Green Neon)**: Break in and press `F` to rob the cash register.
  - 🔫 **Gun Store / Ammu-Nation (Red Neon)**: Buy pistols ($300) and ammo clips ($50).
  - 👮 **Police Station (Blue Neon)**: Bribe the chief ($150 / star) to clear your wanted level.
- **⭐ Wanted & Police Response**:
  - 0 to 5-star heat meter scaling with crimes committed.
  - Aggressive police cruisers spawn and ram your vehicle.
  - Getting busted confiscates half your cash and all ammunition, respawning you at the nearest police station.
- **🎯 Isometric Combat & Aiming**:
  - Real-time mouse-aiming using inverted isometric screen-to-world raycasting.
  - Projectile simulation with collision detection against buildings, vehicles, and pedestrians.
- **⌨️ Bilingual Layout Support**:
  - Seamless controls on both English (QWERTY) and Russian (ЙЦУКЕН) keyboard configurations.
- **⚡ Lightweight & Zero Dependencies**:
  - Pure HTML, CSS, and vanilla JS.
  - Works offline and runs over standard `file://` protocol without requiring Node.js or bundlers.

---

## 📸 Screenshots

| Roaming the City | Combat & Hijacking |
| :---: | :---: |
| ![City Exploration](<Gameplay secreenshots/Screenshot 2026-06-10 163352.png>) | ![Combat & Action](<Gameplay secreenshots/Screenshot 2026-06-10 163427.png>) |

| Interior Stores & Ammu-Nation | Police Chases |
| :---: | :---: |
| ![Shop Interior](<Gameplay secreenshots/Screenshot 2026-06-10 163451.png>) | ![Gameplay Screenshot](<Gameplay secreenshots/Screenshot 2026-06-10 163322.png>) |

---

## 🎮 Controls

### 🚶 On Foot
| Action | English Key | Russian Key |
| :--- | :--- | :--- |
| **Move** | `W` `A` `S` `D` / Arrow Keys | `Ц` `Ф` `Ы` `В` / Стрелки |
| **Enter Vehicle / Enter Building** | `E` | `У` |
| **Punch / Shoot (towards mouse)** | `F` or `Left Click` | `А` or `Left Click` |
| **Aim** | `Mouse Cursor` | `Курсор мыши` |

### 🏎️ In Vehicle
| Action | English Key | Russian Key |
| :--- | :--- | :--- |
| **Accelerate / Drive** | `W` / `Up Arrow` | `Ц` / `Стрелка вверх` |
| **Steer Left / Right** | `A` / `D` | `Ф` / `В` |
| **Brake / Reverse** | `S` / `Down Arrow` | `Ы` / `Стрелка вниз` |
| **Handbrake / Drift** | `Space` | `Пробел` |
| **Exit Vehicle** | `E` | `У` |

### 🏬 Inside Interiors
| Action | English Key | Russian Key |
| :--- | :--- | :--- |
| **Rob Cash Register** *(Shop)* | `F` | `А` |
| **Buy Pistol ($300)** *(Gun Shop)* | `1` | `1` |
| **Buy Ammo ($50)** *(Gun Shop)* | `2` | `2` |
| **Bribe Police ($150/★)** *(Precinct)*| `1` | `1` |
| **Exit Building** | Walk into southern doorway | Идти к выходу на юге |

---

## 🚀 How to Run

### Option 1: Direct File Launch
Simply double-click [index.html](file:///index.html) or open it directly in any modern web browser (Chrome, Firefox, Edge, Safari). No web server needed!

### Option 2: Local HTTP Server
You can also serve it using any static server tool:

```bash
# Using npx serve
npx serve .

# Using Python 3
python -m http.server 3000
```
Then visit `http://localhost:3000` in your browser.

---

## 🏗️ Architecture & Project Structure

The project uses classic non-module JavaScript scripts loaded in a strict dependency sequence via [index.html](file:///index.html):

```
Gta-7/
├── index.html                 # Canvas container, HUD, and script loader
├── README.md                  # Project documentation
├── CLAUDE.md                  # Architecture & development guidelines
├── Gameplay secreenshots/     # Game preview assets
└── js/
    ├── core.js                # Shared global state, constants, math & projection helpers
    ├── world.js               # Infinite procedural generation, hashing, & traffic lights
    ├── actors.js              # Player, NPC pedestrians, traffic cars, and police AI
    ├── combat.js              # Shooting, punching, bullet raycasting, & heat handling
    ├── interiors.js           # Interior maps, shop mechanics, weapon buying, & bribery
    ├── render.js              # Isometric projection, painter's algorithm sorter, minimap, & HUD
    └── game.js                # Game loop (60 FPS), tick orchestration, & input handling
```

### Script Execution Pipeline:
1. `core.js` — Initializes state, math vectors, camera, input tables, and isometric projection utilities.
2. `world.js` — Generates roads, buildings, super-chunks, traffic light phases, and special building positions deterministically.
3. `actors.js` — Updates car physics, pedestrian wandering, traffic behaviors, and cop spawning.
4. `combat.js` — Handles mouse aiming raycasts, bullet physics, weapon firing, and wanted level spikes.
5. `interiors.js` — Handles room transition triggers, register robberies, armory purchases, and bribery.
6. `render.js` — Collects render primitives into a depth-sorted array (Painter's algorithm) and draws 2.5D prisms, shadows, particle sparks, float texts, and the minimap.
7. `game.js` — Orchestrates game state (`idle`, `play`, `busted`, `win`), entities culling/recycling, and the animation loop.

---

## 🛠️ Console Cheats & Debugging

Because state is stored on top-level global variables (`window`), you can tweak parameters live in the browser's developer console (`F12`):

```javascript
// Give yourself cash
cash += 1000;

// Set wanted level (0 to 5)
heat = 5;

// Give gun & ammo
gun = true;
reserve += 50;

// Teleport player
player.x = 0;
player.y = 0;
```

---

## 📜 License

Open source and free to modify for educational and personal experiments.
