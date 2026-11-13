# Test Shapes

Falling shapes demo — **PixiJS v8 + TypeScript + Vite**, OOP, mobile-ready.

```bash
npm install
npm run dev       # http://localhost:5173 (also exposed on LAN for phone testing)
npm test          # unit tests (geometry, clipping, spawn, physics, stats, pool)
npm run build     # type-check + production build (modern + legacy bundles) → dist/
npm run preview
```

## Features

| Req | Implementation |
|---|---|
| 1 | Responsive rectangle (`#stage`), canvas sized to it via `ResizeObserver` |
| 2a–d | Shapes start fully above the top at a random X, fall, are removed once fully below the bottom |
| 2e | Rectangle mask on the scene root (GPU scissor in v8) |
| 2f | Gravity as acceleration `v += g·dt`, read each frame → changes apply instantly |
| 2g | 1 shape/s by default, frame-time accumulator (no `setInterval`) |
| 2h ★ | 7 types (3/4/5/6 sides, circle, ellipse, star), random colour, fixed at creation |
| 3 / 3a ★ | Tap empty space → random irregular shape at the pointer (jagged or smooth blob) |
| 4 | Tap a shape → removed (precise geometry hit test) |
| 5a/b/c ★ | HTML stats: visible shapes count and visible area in px² |
| 6 ★ | HTML ± steppers for shapes/second and gravity (hold to repeat, keyboard accessible) |

**Assumptions**
- *Surface area* = sum of the **visible** parts of the shapes (clipped to the rectangle). Overlaps are summed, not unioned.
- *Number of shapes* = shapes at least partially visible in the rectangle.
- Figure 1 swaps letters F/G relative to the text; the text's meaning was followed.

## Architecture (MVC + events)

```
src/
├─ main.ts                       entry, WebGL fallback message
├─ config/   settings.ts, theme.ts
├─ core/     EventEmitter (Observer), ObjectPool, Random, color
├─ model/    SimulationModel, ShapeModel, types      ← no PixiJS / DOM deps
├─ geometry/ polygon (shoelace, transforms), PolygonClipper (Sutherland–Hodgman)
├─ shapes/   ShapeFactory + generator strategies
├─ systems/  SpawnSystem, PhysicsSystem, StatsSystem
├─ view/     StageView, ShapesRenderer, ShapeView, GraphicsContextCache
├─ controller/ AppController (composition root + loop), InputController
├─ ui/       HtmlHud, StatField, StepperControl
└─ styles/   tokens.css (design system), main.css (components)
```

Frame: `spawn → physics → renderer.sync → (every 100 ms) stats → HUD`.

**Patterns:** MVC, Observer (typed `EventEmitter`), Factory + Strategy (`ShapeFactory` registry of `ShapeGenerator`s),
Object Pool (`ShapeView`s), Flyweight (shared `GraphicsContext` per shape type), Composition Root (`AppController`).

## Performance & memory

- **Shared geometry + tint:** each standard shape type is tessellated once (white); instances reuse it with `scale`, `rotation`, `tint`. Only irregular shapes own a context, destroyed on removal.
- **Pooling:** `ShapeView`s are recycled (bounded pool, overflow destroyed); removed views leave the display list.
- **Stats fast path:** fully inside/outside shapes use precomputed values; only edge-crossing shapes are clipped, using reusable scratch buffers (no per-frame allocations). DOM is written only on change.
- **Safety:** hard cap of 300 shapes, frame delta clamped to 50 ms, ticker stopped on `visibilitychange`.
- **Mobile GPU:** resolution capped at 2×, MSAA only on low-DPI screens, `powerPreference: 'low-power'`, transparent canvas over a CSS gradient.

## Mobile / old Android support

- `@vitejs/plugin-legacy`: modern ESM bundle down-levelled to Chrome 64 / Safari 12, plus a **legacy bundle** (Babel + core-js + SystemJS) served via `nomodule` to Android ≥ 7 WebViews, Samsung Internet ≥ 8, iOS ≥ 12.
- PixiJS renderer preference `webgl` (WebGL2 with automatic WebGL1 fallback). If WebGL is unavailable, a message is shown instead of a blank screen.
- Pointer Events (mouse/touch/pen), `touch-action: none` on the canvas, ≥ 44 px tap targets, `dvh` with `vh` fallback, safe-area insets, margins instead of flex `gap`.

## Design system — "Noir & Gold"

Defined in `src/styles/tokens.css` (canvas mirror in `src/config/theme.ts`).

- **Primitives:** `--gold-50…900` (brand `--gold-400 #d4af37`), `--ink-500…950` warm blacks, `--sand-100…700` warm text.
- **Semantic tokens** (use these in components): `--color-bg`, `--color-surface*`, `--color-border*`, `--color-text*`, `--color-accent*`, `--color-focus`, `--gradient-gold`, `--gradient-stage`.
- **Type:** Cinzel (display / brand), Inter (UI, tabular numbers). Scale `--text-2xs…2xl`.
- **Spacing** 4 px grid `--space-1…10`; **radius** `sm/md/lg/pill`; **elevation** `--shadow-sm/md/lg/glow/inset`; **motion** `--ease-out`, `--duration-*` (zeroed under `prefers-reduced-motion`).
- **Components:** `.stat` (HUD field), `.stepper` (± control), `.btn` (gold icon button with hover / pressed / focus / disabled states), `.stage-frame` (gold-bordered playfield).
- Shape colours keep a fully random hue but constrained saturation/lightness so they stay readable on the dark stage.
