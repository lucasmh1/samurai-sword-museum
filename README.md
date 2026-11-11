# ⚔️ Nihonto 3D: Samurai Sword Museum & Tameshigiri Dojo

An interactive 3D browser museum and slicing simulation of traditional Japanese samurai blades, sheaths (saya), and metallurgy. Built with **Three.js** and procedural **Web Audio API** sound synthesis.

---

## 🏛️ Features

### 1. 3D Nihonto Gallery
- **6 Historical Blade Types**:
  - **Katana (刀)**: Iconic samurai curved longsword with Muromachi/Edo curvature.
  - **Wakizashi (脇差)**: Companion sidearm worn indoors; daisho pair with Katana.
  - **Tanto (短刀)**: Armor-piercing dagger with aikuchi mounting.
  - **Nodachi / Odachi (野太刀)**: Monumental battlefield greatsword with extended tsuka.
  - **Shirasaya (白鞘)**: Minimalist raw Honoki magnolia wood resting mounting.
  - **Naginata (薙刀)**: Sweeping curved polearm blade favored by warrior monks and Onna-musha.
- **Disassemble (解体) Exploded View**: Smoothly expands the blade in 3D space with pinned interactive educational badges detailing:
  - **Kissaki (切先)**: Hardened geometric tip with Yokote line.
  - **Hamon (刃文)**: Martensite crystal temper line.
  - **Habaki (鎺)**: Gilt collar locking the blade into the scabbard without friction.
  - **Nakago (茎)**: Unpolished tang signed with the smith's signature and Mekugi peg hole.
  - **Tsuba (鍔)** & **Seppa (切羽)**: Hand-forged iron guard with openwork pierced sukashi motifs.
  - **Saya (鞘)**: Traditional scabbard with Kurikata knob, Sageo cord, and Kojiri end cap.
- **Interactive Hamon Switcher**: Toggle differential hardening patterns: *Notare* (waves), *Suguha* (straight), *Midare* (wild), and *Gunome* (clove).
- **Interactive Saya Sheathing / Drawing**: Drag the sheath slider or click **⚡ Quick Draw (居合)** to unsheath the blade with metallic friction audio and glints.

### 2. ⚔️ Tameshigiri (試し斬り) Cutting Dojo Mini-Game
- **Real-Time 3D Mesh Slicing**: Drag / swipe across the screen with glowing blade trails.
- **Targets**: Switch between **Rolled Tatami Straw (畳)** and **Green Bamboo (竹)**.
- **Physical Separation & Gravity**: The top cylinder physically severs along your cut angle, sliding and tumbling with sparks and flying debris.
- **Swordsmanship Grading**: Evaluates angle and velocity (*KANPEKI!*, *SUIHEI!*, *KIRI-OROSHI!*) with combo multipliers.

### 3. 🔊 Zero-Dependency Procedural Audio Engine
- Built purely with the **Web Audio API** (no external audio files required, zero latency):
  - **Blade Draw (Iaido)**: High-frequency metallic friction sweep with decaying crystal resonance.
  - **Noto Sheathe**: Wood sliding scrape finishing with a habaki lock click (*Kachin*).
  - **Kiri Slash**: Aerodynamic blade whoosh with velocity pitch modulation.
  - **Zan Impact**: Crisp organic bamboo/straw splitting bite and temple bowl chimes.
  - **Zen Soundscape**: Gentle ambient koto plucks tuned to the traditional *Hirajoshi* pentatonic scale.

---

## 🚀 Running the Project

No build step required! Simply open `index.html` in any modern web browser or serve locally:

```bash
# Using Python
python -m http.server 8080

# Or with Node
npx serve .
```

---

## 📂 File Architecture

```
├── index.html        # Museum HUD layout, blade selector bar, and gallery controls
├── style.css         # Dark lacquer and gold leaf aesthetics, glassmorphic HUD
├── audio.js          # Web Audio API procedural sound engine
├── swords.js         # 3D procedural blade geometry and materials
├── environment.js    # Museum room, lighting, katanakake stand, and sakura particles
├── tameshigiri.js    # Target cutting physics, blade trails, and scoring engine
└── app.js            # App controller, camera orbits, and mode switching
```
