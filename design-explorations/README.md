# Design Explorations

Standalone HTML/CSS files showcasing alternate aesthetic directions for prempawee.com. Not shipped — use as A/B comparisons against the live site. If a direction is approved, we port to the Next.js app (chat.tsx, layout.tsx, globals.css) with Playwright regression tests gating the deploy.

## How to view

```bash
open design-explorations/hero-editorial.html
```

## Explorations

### `hero-editorial.html` — Editorial Luxury · Thai-Infused

**Aesthetic:** Contemporary editorial / luxury-publication, rooted in Thai design DNA. Warm rice-paper background, deep espresso type, aged-brass accents. Reads like a high-end quarterly or a Wat Arun-era print catalogue, not a dev portfolio.

**Why this direction:** Your current terminal aesthetic signals "solo dev" to Thai SMB buyers (restaurant owners, clinic managers, retail brands). An editorial read signals "established practice." Rarer in the dev-portfolio space, and the Thai-numeral + bilingual headline immediately reads "deeply local, not a foreign template." Target: justify the ฿45k Enterprise tier by looking like you're worth it before a single word of the chat fires.

**Notable choices:**

- **Typography:** Fraunces (variable serif with an `opsz` + `SOFT` axis for display warmth) pairs with Noto Serif Thai for the bilingual moment. Instrument Serif for body italics. JetBrains Mono retained for metadata/colophon as a nod to the dev DNA without dominating.
- **Color:** Cream paper `#f2ece0` + espresso ink `#1a1511` + aged-brass `#b08a3d` + silk red `#8b4132`. No generic blacks or tech-blues.
- **Thai integration:** Numerals in Thai (๐๓, ๐๖, ๑๒), a barely-visible `ไทย` watermark, a bilingual headline that actually mixes languages in a single sentence, and a Wat Arun-inspired cornice ornament line. Not tokenistic — structurally Thai.
- **Layout:** 12-column grid with deliberate asymmetry. Headline pushes into columns 11-12 on desktop for drama. Colophon reads like a magazine masthead (VOL. ๒๕๖๙, ISSUE ๐๑).
- **Motion:** Staggered rise-in on load (220ms → 520ms across the display lines). Hairline rule draws from left with cubic-bezier ease. Cursor-tied parallax on the Thai watermark (a few pixels — imperceptible unless you're looking for it). All motion respects `prefers-reduced-motion`.
- **Decorative details:** SVG noise-filter paper grain at 4% opacity via CSS `mix-blend-mode: multiply`. Custom Thai-temple cornice ornament rendered as inline SVG at the bottom. Brass gradient wipe on CTA hover.

**What's deliberately missing:** No stock icon set, no hero image, no rounded "AI-gradient" button, no purple anywhere. Every element earns its place.

**Trade-offs to discuss:**

- Shifts from dark theme → light theme. Disorients returning visitors but reads significantly more premium for new ones.
- Serif display is slower to render at extreme sizes; we ship Fraunces-variable (~180KB) with `display=swap` to avoid FOIT.
- Loses the "terminal/ASCII" identity that Hacker News / dev Twitter would recognize. Intentional: not your audience.

## If approved — how to port

1. Add Fraunces + Instrument Serif + Noto Serif Thai fonts to `src/app/layout.tsx` via `next/font/google`.
2. Update CSS variables in `src/app/globals.css` to the new palette.
3. Rewrite the header + welcome section in `src/components/chat.tsx` to match the hero composition; keep the chat stream intact (it can sit below the hero in a second viewport section).
4. Add Playwright visual-regression screenshots to `tests/e2e/` for both languages.
5. Run `npm run test:e2e` → verify hydration + headers still green → deploy.
