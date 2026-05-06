# Kesher Ivrit — Design System
**Version 1.0 — approved before Session 2 redesign**
**Branch: redesign-foundation**

---

## 1. Principles

- **Modern and serious without being cold.** Audience is kids/teens and teachers. Warm but not childish.
- **Typography does the work.** Weight, scale, and spacing replace decorative gradients and emojis.
- **Two colors. No more.** Israeli Blue + warm Gold. Neutrals fill the rest.
- **Consistent over clever.** One card shape, two button shapes, one spacing scale. Every screen.
- **Hebrew-first.** Frank Ruhl Libre is the display voice. It carries both languages.

Reference aesthetics: kawka.me (serif headlines, generous whitespace, all-caps labels) and a-squared-red.vercel.app (typographic hierarchy, big numbers, two-color palette).

---

## 2. Color Palette

### Primary tokens (replace all off-system hardcoded values)

```css
:root {
  /* Brand */
  --primary:        #0038B8;   /* Israeli Blue — main CTA, links, accents */
  --accent:         #C8A84B;   /* Warm gold — replaces 8-variant gold mess */

  /* Surface */
  --white:          #FFFFFF;
  --surface:        #F7F8FC;   /* off-white page background (replaces --blue-bg) */
  --border:         #E2E6F0;   /* cooler, less blue-tinted than #C8D8F5 */

  /* Text */
  --text-dark:      #1A1A2E;   /* keep */
  --text-mid:       #4A5568;
  --text-light:     #8896B0;

  /* Semantic */
  --success:        #2E8B57;   /* one green — no variants */
  --danger:         #C0392B;   /* keep */
  --warning:        #E67E22;   /* keep */

  /* Blue family (used only for home hero + lesson sidebar) */
  --blue-mid:       #1B5EE0;
  --blue-pale:      #D6E8FF;
}
```

### Kill list (colors to eliminate from new screens)
- All purple variants (`#5c1fa8`, `#7c3aed`, `#a78bfa`, etc.) — game-only, not system colors
- All orange/amber variants outside `--warning` — game-only
- 7 of 8 gold variants — keep only `--accent: #C8A84B`
- All hardcoded blue near-duplicates (`#003399`, `#1155CC`, `#002080`, `#001F77`) — use `--primary`

Game-specific colors (Wordle purple, Speed Round orange) remain **hardcoded inside their own component CSS** — not promoted to variables, not reused.

---

## 3. Typography

### Font stack

| Role | Font | Weights | Notes |
|---|---|---|---|
| Hebrew display | Frank Ruhl Libre | 700, 900 | RTL, existing |
| English display | Frank Ruhl Libre | 300, 400, 700 | Same font — Latin glyphs, pairs perfectly |
| Body / UI | Heebo | 400, 600, 700 | Existing, keep |
| Code | Courier New, monospace | 400 | Unchanged |

**Drop Nunito.** Heebo covers all UI weight needs. Frank Ruhl Libre handles display in both scripts.

No new fonts to load. One less HTTP request.

### Type scale

```
Display (hero headline):    clamp(2.8rem, 8vw, 5rem)   Frank Ruhl Libre 900
Title (section head):       1.6–2rem                    Frank Ruhl Libre 700
Subtitle:                   1.1–1.3rem                  Frank Ruhl Libre 300–400, tracked
Eyebrow:                    0.65rem, ALL-CAPS, ls 0.12em  Heebo 700, --text-light
Body:                       0.9–1rem                    Heebo 400–600
Label / UI:                 0.75–0.85rem                Heebo 600–700
```

### Eyebrow pattern (kawka-style)
```css
.eyebrow {
  font-family: var(--font-eng);
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-light);
}
```

### Section numbering (kawka-style, optional)
Use `01`, `02`, `03` for multi-section screens (settings, lesson path, onboarding). Same eyebrow treatment.

---

## 4. Spacing Scale

All padding, margin, and gap values snap to this scale. No more 11px, 13px, 18px, 22px, 28px.

```
4px   8px   12px   16px   24px   32px   48px   64px
```

---

## 5. Border Radius

Two values only:

```css
--radius:     12px;   /* cards, inputs, secondary buttons */
--radius-sm:   8px;   /* chips, tags, tight elements */
--radius-pill: 50px;  /* hero CTA only */
```

Eliminate: 14px, 16px, 18px, 20px, 22px, 24px, 28px variants.

---

## 6. Cards — One Template

```css
.card {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius);       /* 12px */
  padding: 24px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
```

- No gradients
- No colored backgrounds (exception: home hero sits on `--primary` blue, cards on it use white)
- Blue top-stripe accent is allowed **only on the daily lesson card** — it's functional (signals "today's task"), not decorative
- Dark theme: `background: #12121A; border-color: #2A2A40;`

---

## 7. Buttons — Two Templates

```css
/* Primary — solid, no gradient */
.btn-primary {
  background: var(--primary);
  color: var(--white);
  border: none;
  border-radius: var(--radius-sm);    /* 8px — not pill */
  padding: 14px 28px;
  font-family: var(--font-eng);
  font-weight: 700;
  font-size: 1rem;
}

/* Secondary */
.btn-secondary {
  background: transparent;
  color: var(--primary);
  border: 1.5px solid var(--primary);
  border-radius: var(--radius-sm);
  padding: 13px 28px;
  font-family: var(--font-eng);
  font-weight: 700;
  font-size: 1rem;
}
```

**Exception:** The home screen hero CTA ("Start Learning") stays pill-shaped (`border-radius: 50px`) — it is a deliberate visual anchor, not a system button.

---

## 8. Emoji Rules

| Context | Rule |
|---|---|
| Morah chat messages | ✅ Allowed — conversational content |
| Morah avatar / user avatar | ✅ Allowed — placeholder until real art |
| UI navigation labels | ❌ Replace per icon decision below |
| Section / card headers | ❌ Remove — typography carries the weight |
| Button labels | ❌ Remove |
| Settings rows | ❌ Remove |
| Close buttons (✕) | ❌ Replace with CSS-drawn × or SVG |
| Game screens | ⚠️ One per game as a visual anchor (🏆, ⚡, 🟩) — tolerated |
| iOS install instructions (📤) | ✅ Functional — references actual Safari UI element |

### Icon decision (resolved per Session 2)

**No emoji, no icon library. CSS-drawn icons only for the home screen.**

Rationale: the home screen has exactly one chrome icon (the settings button). Pulling in an SVG icon library for one icon is over-engineering. A CSS-drawn 3-line icon (hamburger/menu style, or a simple gear using CSS borders) is zero-dependency and consistent.

For future screens with more icons (sidebar, navigation bar): revisit with a deliberate SVG set decision. Do not mix approaches within one screen.

---

## 9. Shadows

```
Subtle:  0 1px 4px rgba(0,0,0,0.06)          /* cards */
Default: 0 2px 12px rgba(0,0,0,0.10)         /* floating elements */
Strong:  0 8px 32px rgba(0,0,0,0.16)         /* modals, overlays */
```

Eliminate all blue-tinted shadows (`rgba(0,56,184,0.xx)`) outside the home hero screen.

---

## 10. Rollout Order

| Session | Screen | Status |
|---|---|---|
| 1 | Design system spec | ✅ Complete |
| 2 | Home screen | Planned |
| 3 | Registration + Login screens | — |
| 4 | Lesson screen (chat, challenges, sidebar) | — |
| 5 | Games + Settings | — |

**Consistency gate:** Before each session, update `:root` variables to match the approved palette. Previously redesigned screens inherit corrections for free.

**Branch strategy:** All redesign work on `redesign-foundation`. Tag `stable-v9.51` marks the last clean production state. Merge to `main` only after explicit approval.
