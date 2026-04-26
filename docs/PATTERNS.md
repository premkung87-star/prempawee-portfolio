# Reusable Patterns — Prempawee Portfolio

Patterns surfaced during sessions that are worth preserving for future-self / future-Claude. Cross-referenced from AUDIT_LOG §-entries where applicable.

---

## 1. `BinaryStarField` — decorative-canvas-as-primitive

**File:** `src/components/preview/BinaryStarField.tsx`
**Surfaced in:** Session 6, AUDIT_LOG §35

A single decorative primitive composed by 6 sibling components (Hero, FeaturedCase, WhatIBuild, Process, Footer, ProofStrip) for consistent terminal-aesthetic chrome. ASCII binary stars (5 shapes: sparkle / fivept / asterisk / tiny / burst), cycling 0/1 chars matrix-style, scatter on click, twinkle on hover.

**Why this shape (one canvas, many consumers):**

- Each consumer configures its own star distribution via `stars: StarConfig[]` prop
- `prefers-reduced-motion: reduce` honored (no cycling, no scatter, no rotation transitions)
- Wrapper marked `aria-hidden="true"` (decorative); inner stars expose `role="button"` + `aria-label="binary star"`
- `tabIndex={-1}` on stars so they don't pollute keyboard tab order — real CTAs win focus
- Performance: 8 stars × ~120 cells × 220ms cycle = manageable; if profiling shows jank, reduce stars or raise interval

**When to use:** terminal/futuristic aesthetic surfaces, decorative chrome that needs to feel hand-made without dominating content.

**When NOT to use:** content-bearing surfaces (don't make stars carry meaning); high-density pages where 8 simultaneous setIntervals would compound.

---

## 2. Cross-subtree triggers via `window.dispatchEvent` + `useEffect` listener

**Files:** `src/components/preview/NavBar.tsx` (dispatcher), `src/components/preview/ChatPanel.tsx` (listener)
**Surfaced in:** Session 6 v3 polish, AUDIT_LOG §35

When a sibling component at the root needs to drive state in a deeply-nested component, the React-idiomatic options are:
1. Lift state to root (intrusive — every consumer-prop change forces root re-render)
2. Context (overkill for one event)
3. Zustand/jotai (new dep)
4. **`window.dispatchEvent` + `useEffect` listener** ← chosen for /preview-scale apps

**The dispatcher (NavBar):**

```ts
function onPricingClick() {
  window.dispatchEvent(
    new CustomEvent<{ text: string }>("preview:chat-prompt", {
      detail: { text: t.suggest_pricing },
    }),
  );
}
```

**The listener (ChatPanel):**

```ts
useEffect(() => {
  if (!consented) return; // gate by consent
  function onPrompt(e: Event) {
    const ev = e as CustomEvent<{ text?: string }>;
    const text = ev.detail?.text?.trim();
    if (!text || isLoading || isLimitReached) return; // guard double-fire + cap
    sendMessage({ text });
  }
  window.addEventListener("preview:chat-prompt", onPrompt);
  return () => window.removeEventListener("preview:chat-prompt", onPrompt);
}, [consented, isLoading, isLimitReached, sendMessage]);
```

**Why this over alternatives:**

- Zero new deps
- Listener fully self-contained — NavBar doesn't need a ref to ChatPanel; ChatPanel doesn't need to know NavBar exists
- Guards prevent double-fire (consented + isLoading + isLimitReached)
- Cleanup on unmount prevents listener leaks
- Type-safe via `CustomEvent<{ text: string }>`

**Critical caveat (caught during v3 review):** if you mount the listener-component twice (e.g., one for mobile, one for desktop via `lg:hidden` / `hidden lg:block`), both listeners fire on every event → double-message bug. **One ChatPanel mount, ever** — see Pattern 6.

**When to use:** AI-native UX where surrounding UI feeds prompts to a chat ("BOOK A CALL" button → opens chat with "Are you free in May?"); cross-subtree triggers in /preview-scale apps.

**When NOT to use:** state synchronization (use Context or a store); high-frequency events (window event bus has overhead vs direct calls).

---

## 3. GROUNDING-RULE pre-implementation grep

**Surfaced in:** Session 6 v2 redesign, AUDIT_LOG §34

When implementing from a Claude Design (or any external-design) handoff bundle, the design has no access to your `portfolio-data.ts` or KB and will confidently fabricate plausible-sounding metrics, project names, testimonials, and architecture stories.

**Pre-implementation gate:**

```bash
# Every named project in the design — does it exist?
grep -n "\"<project_name>\"\|'<project_name>'" src/lib/portfolio-data.ts supabase-seed.sql

# Every numeric claim — does it trace to a measured artifact?
grep -nE "[0-9]+%|[0-9]+ms|<[0-9]+ms|−[0-9]+%" src/lib/portfolio-data.ts

# Every testimonial / quote — does the named person/role appear in any source?
grep -n "<surname>\|<role>" docs/ src/
```

**If a claim doesn't trace:**

1. **Drop it.** Best option. The design wants a "trust signal"; pick a different one that's grounded.
2. **Reskin it.** If the claim is shape-correct but wrong-data, replace with truthful equivalent (NWL CLUB description: "240-seat music venue with ESP32 IoT" → "Bangkok streetwear brand with Work Tracker + Community Website").
3. **Link out.** If the design wants a deep case study but the only published case lives elsewhere, link to the real one with the design's typographic framing rather than fabricating the absent one. See the `FeaturedCase` pattern (Pattern 4 below).

**When to use:** every Claude Design handoff. Add to dispatch checklist for `frontend-react-specialist` (Pattern 5 below).

**Cost:** ~5 min of grep + decision-making. Saves the "buyer reads marketing copy that contradicts the chatbot's grounded answers within the same page" failure mode (AUDIT_LOG §34).

---

## 4. `FeaturedCase` link-out pattern

**File:** `src/components/preview/FeaturedCase.tsx`
**Surfaced in:** Session 6 v2 redesign, AUDIT_LOG §34

When a redesign wants a "deep case study" section but the only real published case lives on a different project, don't fabricate a new one. Use the design's typographic framing (meta strip → oversized headline → body → CTA) but resolve the CTA to the real published case via `next/link`.

**Pattern shape:**

```tsx
<section id="case">
  <div>{kicker} · {meta_strip}</div>
  <h2>{headline_l1}<br/><span style={{opacity:0.4}}>{headline_l2}</span></h2>
  <p>{honest_body_paragraph}</p>
  <Link href="/case-studies/<real-slug>" data-cursor="hover">
    {cta_text} →
  </Link>
</section>
```

**Why this over alternatives:**

- Preserves design rhythm (the "quiet rhythm break between dense rows" the design called for)
- Honors GROUNDING RULE (no fabricated metrics)
- Drives traffic to the real case-study page (which has actual screenshots, architecture, outcomes)
- Easy to rotate when more cases are published — flip the `href` and the headline copy

**When to use:** redesigns that include "feature a case study" sections but the named project doesn't have a published case yet.

**When NOT to use:** when a case is genuinely ready to ship inline (then write it as a real `CaseStudy` entry in `portfolio-data.ts` and link from a `/case-studies/[slug]` route).

---

## 5. `frontend-react-specialist` dispatch checklist

**Surfaced in:** Session 6 (3 dispatches: head-planning, v2 redesign, v3 polish), AUDIT_LOG §35

Comprehensive brief structure that returns clean `STATUS: COMPLETE` without round-trips:

```
## Task
[One paragraph stating the goal + scope + risk classification]

## Read these first (top to bottom — do not skim)
- [absolute file path 1]
- [absolute file path 2]
...

## What to build
### N. New file / Update file: <path>
[Specific changes; cite line numbers when modifying existing code]

## Constraints (CRITICAL)
- No watchlist files: layout.tsx, page.tsx, proxy.ts, chat.tsx, next.config.ts
- GROUNDING RULE: every numeric/proper-noun claim must trace to portfolio-data.ts or supabase-seed.sql
- TypeScript strict — every new prop typed
- Tailwind v4 utilities; no new dependencies; no new keyframes
- prefers-reduced-motion respected
- Accessibility: WCAG 2.1 AA, 44×44 touch targets minimum, semantic HTML

## Verification
- typecheck / lint / test / build (specialist cannot run; explicitly defer to Foreman)
- Static review: confirm [specific invariants]

## Output
FRONTEND REPORT covering:
- Files created (paths)
- Files modified (paths + 1-line summary each)
- Pattern decisions (especially [domain-specific])
- Verification status (commands deferred to Foreman)
- Suggested commit message
- GROUNDING / a11y / perf notes worth surfacing

DO NOT push or create PR. Foreman handles git ops.
Branch off main, name it: feat/<descriptive>. Stage files, do not commit.
```

**Why this shape:**

- Specialist knows exactly what to read — no guessing
- Constraints stated upfront — no "should I touch X?" round-trips
- Output format predictable — Main Session can parse it programmatically
- Author/shipper split (AUDIT_LOG §33) — specialist writes content, Main Session ships PR
- Verification deferred explicitly — specialist doesn't fabricate `npm run X passed`

**Cost of comprehensive brief:** ~4 minutes. **Saves:** ~10–15 min of round-trip per dispatch.

---

## 6. One ChatPanel mount, ever

**Files:** `src/components/preview/ChatPanel.tsx` (single instance), `src/components/preview/Hero.tsx` (single mount-point)
**Surfaced in:** Session 6 v3 polish (caught during static review), AUDIT_LOG §35

When implementing responsive layouts, the temptation is to render two `<ChatPanel>` instances — one for mobile, one for desktop — keyed by `lg:hidden` / `hidden lg:block`. **Don't.**

**Why this fails:**

ChatPanel installs three side effects on mount:
1. `installSessionIdFetchOverride()` — patches `window.fetch` for `x-session-id` header
2. `useChat()` — opens a streaming session against `/api/chat`
3. `addEventListener("preview:chat-prompt", ...)` — listens for cross-subtree prompts

Two instances install **two** of each. Result:
- Two fetch overrides chained → unpredictable session ID behavior
- Two parallel streaming sessions per `sendMessage()` call → message duplicated
- Two `preview:chat-prompt` listeners → every dispatch fires twice → double-send to `/api/chat`

**Right pattern: single mount + CSS responsiveness:**

```tsx
<div className="flex flex-col lg:grid lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
  <div className="order-1 lg:order-1 lg:col-start-1 lg:row-start-1">{kicker}</div>
  <div className="order-2 lg:order-2 lg:col-start-1 lg:row-start-2">{headline}</div>
  <div className="order-3 lg:order-3 lg:col-start-2 lg:row-start-1 lg:row-span-4">
    <ChatPanel lang={lang} tall />  {/* SINGLE MOUNT */}
  </div>
  <div className="order-4 lg:order-4 lg:col-start-1 lg:row-start-3">{stats}</div>
  <div className="order-5 lg:order-5 lg:col-start-1 lg:row-start-4">{hint}</div>
</div>
```

**Why this works:**

- Single component instance → single set of effects
- Mobile order via `order-N` (DOM order matches anyway, defensive)
- Desktop layout via explicit `col-start` + `row-start` — deterministic both directions
- Chat spans 4 rows on desktop via `lg:row-span-4` — visual centerpiece

**When the rule applies:** anywhere a component owns network/event-listener side effects (chat panels, video players, websocket clients, geo-locators).

**When the rule doesn't apply:** purely visual components with no side effects (buttons, dividers, decorative star fields).

---

## 7. CSS containment for sticky-safe clipping — `overflow: clip` not `overflow: hidden`

**Surfaced in:** Session 7, AUDIT_LOG §38 (Bug A)
**Symptom history:** Foreman opened Session 7 reporting "the area below [the chat] is completely empty. It's just a black space, and the interactive section (02 process) has disappeared." Process section was rendering as a giant black void after the first viewport-height of scrolling.

When a parent element has `overflow: hidden` and contains a `position: sticky` child, sticky pinning silently breaks. Per CSS Overflow Module Level 3, any `overflow` value other than `visible` or `clip` makes the element a *scroll container* for sticky positioning. The sticky child resolves its `top: 0` against THAT parent's scroll position — and since the parent itself is not scrolled (the document is), the sticky child stays at its initial position within the parent and slides off-screen with the parent as the user scrolls the document.

**Wrong:**

```tsx
<section className="overflow-hidden relative" style={{ height: "360vh" }}>
  <BinaryStarField stars={...} />            {/* absolute decoration to clip */}
  <div className="sticky top-0 h-dvh">       {/* ← never pins; slides with section */}
    {stickyContent}
  </div>
</section>
```

**Right:**

```tsx
<section className="overflow-clip relative" style={{ height: "360vh" }}>
  <BinaryStarField stars={...} />
  <div className="sticky top-0 h-dvh">       {/* ← pins to viewport correctly */}
    {stickyContent}
  </div>
</section>
```

**The Chromium gotcha that catches the half-fix:** reaching for `overflow-x: hidden` (to keep horizontal clipping while leaving vertical free) does NOT work — Chromium silently promotes `overflow-y: visible` to `overflow-y: auto` whenever `overflow-x: hidden` is set, per the CSS Overflow spec's "computed value" table (visible/clip cannot mix with hidden/scroll/auto across axes). The promoted `auto` produces the same scroll-container side-effect on the y-axis, reproducing the bug identically. Use `overflow-x: clip` instead (Tailwind: `overflow-x-clip`) — it has the matching one-axis-only behavior without the scroll-container side effect.

**Browser support:**
- `overflow: clip` — Chrome 90+ (April 2021), Firefox 81+ (September 2020), Safari 16+ (September 2022)
- Covers prempawee's target audience fully; if older Safari support is ever required, fall back to `contain: paint` on the parent OR a wrapper structure that moves clipping outside the sticky's containing block.

**When to use:** any /preview section that wraps decorative absolute-positioned children needing clipping (BinaryStarField, marquees, particle effects) AND contains sticky descendants. The `overflow-clip` swap is free if those decorations are the only reason `overflow-hidden` was there.

**When NOT to use:** if the parent genuinely needs to be a scroll container (rare in /preview-scale apps — would mean a scrollable inner panel like a chat history, not a section background).

**Quick audit grep:**

```bash
# Find any /preview section combining overflow-hidden with sticky children:
rg -A 30 'overflow-hidden' src/components/preview/*.tsx | rg -B 30 'sticky'
```

---

## 8. Defer non-deterministic render-path values to post-mount via `mounted` flag

**File:** `src/components/preview/BinaryStarField.tsx`
**Surfaced in:** Session 7, AUDIT_LOG §38 (Bug B)
**Symptom history:** every `/preview` page load logged a React hydration mismatch error in the dev console, traced to BinaryStarField's `useMemo` calling `pickChar()` (which uses `Math.random()`) during render. SSR produced one set of cycling characters, client produced another, hydration failed silently, React fell back to regenerating the whole tree client-side. The page rendered correctly because React recovers, but every load incurred wasted reconciliation + a console error trace — the same silent-drift failure-mode class as AUDIT_LOG §17/§20.

The hydration contract is that SSR HTML and the first client render must produce byte-identical trees. Any function inside the render path that returns different values across the SSR/client boundary breaks that contract:

- `Math.random()` — different seed per call, server vs client
- `Date.now()` / `new Date()` (no-arg) — clock drift between SSR and client
- Locale-dependent formatters (`toLocaleString()` without explicit locale) — server locale ≠ client locale
- `crypto.randomUUID()` — same as Math.random
- `window.matchMedia()` (read during render) — undefined on server
- `navigator.*` reads — undefined on server

**Wrong:**

```tsx
function BinaryStar({ shape }: Props) {
  const cells = useMemo(() => {
    const arr = [];
    for (let r = 0; r < MH; r++) {
      for (let c = 0; c < MW; c++) {
        if (mask[r][c]) {
          arr.push({ r, c, ch: pickChar() });   // ← Math.random() in render
        }
      }
    }
    return arr;
  }, [tick, shape]);
  // ...
}
```

**Right (mounted-flag pattern):**

```tsx
function BinaryStar({ shape }: Props) {
  const [mounted, setMounted] = useState(false);

  // Defer randomization to post-mount so SSR and first client render match.
  useEffect(() => { setMounted(true); }, []);

  const cells = useMemo(() => {
    const arr = [];
    for (let r = 0; r < MH; r++) {
      for (let c = 0; c < MW; c++) {
        if (mask[r][c]) {
          // SSR + first client render: deterministic checkerboard.
          // Post-mount: randomized chars cycle via tick.
          const ch = mounted ? pickChar() : (r + c) % 2 === 0 ? "0" : "1";
          arr.push({ r, c, ch });
        }
      }
    }
    return arr;
  }, [tick, shape, mounted]);
  // ...
}
```

**Why this over alternatives:**

- **`suppressHydrationWarning` (escape hatch):** silences the console error but the mismatch still happens — React still pays the regeneration cost on every load, and silent drift is exactly the failure mode CLAUDE.md/AUDIT_LOG §17/§20 warn against. Use only when the divergence is intentional and trivial (e.g. a localized timestamp).
- **Render the random content only client-side via dynamic import with `{ ssr: false }`:** works but heavier (extra chunk, FOIT-style flicker). Mounted-flag is cheaper for small components.
- **Move the random call into `useEffect` and store in state:** equivalent to mounted-flag but adds an extra render cycle. Mounted-flag with deterministic SSR fallback is simpler.
- **`useId()`:** the right call for ID generation (Wide-tree-safe across SSR), but doesn't help for cycling display content.

**Concrete pre-deploy grep:**

```bash
# For any new /preview component, verify no non-deterministic render-path values:
rg -nE 'Math\.random|Date\.now|new Date\(\)|crypto\.randomUUID' src/components/preview/*.tsx | rg -v 'useEffect|onClick|setTimeout|setInterval'
```

Anything that lights up needs to be either inside a `useEffect`/event handler, or gated behind a `mounted` flag with a deterministic SSR fallback.

**When to use:** any decorative or animated component that uses non-deterministic input for its initial render (cycling chars, particle positions, jitter, gradient seeds).

**When NOT to use:** purely event-driven randomness (e.g. randomizing on click) — those execute post-mount by construction and don't affect SSR.

---

## Cross-references

- **AUDIT_LOG §08** — fire-and-forget edge promises (the broader anti-pattern that motivates Pattern 6's listener cleanup)
- **AUDIT_LOG §17** + **§20** — silent React 19 hydration failures with no console signal (the failure-mode class Pattern 8 prevents at the component level)
- **AUDIT_LOG §32** — GROUNDING RULE origin
- **AUDIT_LOG §33** — GROUNDING RULE generalized to KB writes + marketing copy
- **AUDIT_LOG §34** — GROUNDING RULE rescue from Claude Design fabricated content (motivates Pattern 3 + 4)
- **AUDIT_LOG §35** — head-orchestration in practice (motivates Pattern 5)
- **AUDIT_LOG §38** — overflow-clip + post-mount-flag rules from Session 7 (motivates Pattern 7 + 8)
- **CLAUDE.md** — entry point + risk classification matrix
- **KARPATHY.md §6** — browser verification is the only valid success signal for render-path changes (informs Pattern 7 + 8 — both bugs were silent to typecheck/lint/build, only real browser scroll/console revealed them)
- **KARPATHY.md §13** — don't overengineer (informs all patterns above)
- **KARPATHY.md §16** — verify before claim (informs Pattern 3)
