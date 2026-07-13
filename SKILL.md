---
name: convert
description: This skill should be used when the user shares a Figma URL, file key, or node ID and wants it turned into a webpage, mentions "convert this Figma design," "build this page/screen from Figma," "pixel-perfect," "lookalike," or wants a Figma frame recreated as HTML/CSS — even if they don't say "skill" or name a framework. Also use for extracting design tokens, assets, or components from a Figma file for frontend implementation, for RTL/Arabic builds, or for testing/QA-ing a page against its Figma source. Converts Figma designs into production-ready, responsive frontend code (HTML + Bootstrap 5, or HTML + Tailwind CSS) with vanilla JavaScript.
version: 1.0.0
---

# Figma → Frontend

Act as a Principal Frontend Engineer converting Figma designs into production-ready HTML with high visual fidelity. This skill covers the full loop: pull the design from Figma, extract tokens and assets, build the page, verify it against the source with real tools, and hand off a production-readiness report.

Don't skip steps to save time. The most common failure modes in this workflow are, in order: silently expired asset URLs, unverified responsive/RTL behavior, and claiming an animation was "extracted from Figma" when no such data exists to extract (see Step 1).

## 0. Ask upfront: framework, multi-page mechanism, and language direction

Before doing any discovery or build work, confirm these with the user instead of guessing. Ask as a short, single batch of questions — don't trickle them out one at a time.

**Framework** — skip asking only if already unambiguous:
- User already named a framework directly ("build this in Tailwind") → use it, no need to ask.
- An existing project/repo is in context and already uses one framework → match it, no need to ask.
- Otherwise → ask: "Bootstrap 5 or Tailwind CSS?" Don't silently default to one.

Load [references/frameworks/bootstrap.md](references/frameworks/bootstrap.md) or [references/frameworks/tailwind.md](references/frameworks/tailwind.md) before writing any CSS. Don't mix the two in one deliverable unless explicitly asked for both variants.

**Multi-page mechanism** — if the deliverable is more than one page and the mechanism isn't already stated, ask before building. Load [references/multipage-components.md](references/multipage-components.md) and offer the choice: generation-time duplication (default recommendation — no build step, no runtime JS dependency for the header/footer), a lightweight SSG like 11ty (only if a build step is acceptable), or Web Components (only for app-like, non-SEO-critical pages). Never fall back to runtime `fetch()` + `innerHTML` injection for primary navigation — see that doc for why.

**Language direction** — if it isn't already clear from the design or the user's request, ask whether the build needs to support Arabic or another RTL language. If yes, load [references/rtl-and-i18n.md](references/rtl-and-i18n.md) now so CSS is written with logical properties from the first line, not retrofitted later.

## 1. Discover — pull the design from Figma

Load [references/figma-mcp-workflow.md](references/figma-mcp-workflow.md) before the first Figma tool call. It covers the verified current tool set, the `fileKey`/`nodeId` dash-to-colon parsing gotcha, large-file handling via `get_metadata`, and — critically — where design *intent* (behavior, states, motion) actually lives versus where it doesn't.

Call sequence: `get_metadata` first if the frame/file is large → targeted `get_design_context` (explicitly state the output target, e.g. "plain HTML + CSS", since it defaults to React+Tailwind) → `get_variable_defs` → `get_screenshot` (save this as the visual baseline for Step 5) → `download_assets`.

**While discovering, also read Figma annotations and dev resources on the frame.** This is the only reliable source of stated interaction/behavior intent — Figma's MCP tools return static visual/structural data only, not prototype transitions. Don't assume motion data will show up in `get_design_context`; it won't. See [references/animation-extraction.md](references/animation-extraction.md) before building anything that hovers, enters, or scrolls.

If Figma MCP tools aren't loaded yet, `tool_search` for them — batch-load `get_design_context`, `get_screenshot`, `get_variable_defs`, `download_assets`, `get_metadata` in one call.

## 2. Extract & host every asset locally — non-negotiable

Figma's returned asset URLs (`figma.com/api/mcp/asset/...`) are temporary. **Never reference a live Figma asset URL in the final deliverable.** For every image, icon, or logo:

1. Call `download_assets` and save into `/images` with a descriptive filename (`hero-image.webp`, not `image1.png`).
2. Point every `src` / `background-image` at the local path.
3. Before delivering, grep the output for `figma.com` — if it matches anything, an asset was missed.
4. If a design uses a font that isn't web-safe or a common Google Font, list it explicitly under "missing assets" rather than silently substituting or dropping it — non-Latin display fonts (e.g. Arabic brand fonts) are the easiest to lose track of.

## 3. Extract design tokens

Load [references/design-tokens.md](references/design-tokens.md) before writing a single CSS variable. Extract colors, spacing, typography, radius, and shadow from `get_variable_defs` and the design tree, emit them as a `tokens.json` in W3C DTCG format (the stable, tool-portable standard as of the 2025.10 spec), then run [scripts/build-tokens.mjs](scripts/build-tokens.mjs) to generate the target output — CSS custom properties for the vanilla/Bootstrap path, Tailwind theme config for the Tailwind path. Name tokens after Figma's own variable names, and don't silently collapse multiple variable modes (light/dark, brand) into one — flag it if the target mode is ambiguous.

For a trivial one-page job, a direct CSS-vars-only `:root` block (no `tokens.json` step) is an acceptable shortcut — use judgment on whether the pipeline is worth it for the job size.

## 4. Build

Follow the framework-specific reference from Step 0, plus [references/css-architecture.md](references/css-architecture.md) for CSS structure (variables → reset → typography → layout → components → utilities → animations → media queries).

Non-negotiable rules that don't live in the framework docs:
- **Semantic HTML and accessibility**: landmark elements (`header`, `nav`, `main`, `section`, `footer`), `alt` text, `aria-label`s, visible focus states, sufficient contrast.
- **Responsive images**: `<picture>` with AVIF → WebP → JPEG source order, correct `srcset`/`sizes`, explicit `width`/`height` on every image (prevents layout shift), `loading="lazy"` below the fold, `fetchpriority="high"` with no `lazy` on the hero/LCP image.
- **Motion**: implement only what Step 1's annotations/variants/screenshot actually specified — CSS `transition` for two-state hovers, `@keyframes` for entrances, `IntersectionObserver` (not scroll listeners) for scroll reveals — and wrap all of it in `prefers-reduced-motion` handling. Full detail in [references/animation-extraction.md](references/animation-extraction.md).
- **RTL**: if Step 0 flagged this build as RTL, every rule uses logical properties (`margin-inline-start`, not `margin-left`) per [references/rtl-and-i18n.md](references/rtl-and-i18n.md) — don't write physical-direction CSS now and mirror it later.
- **Fidelity over novelty**: if the `frontend-design` skill is also loaded, its "make distinctive, non-templated choices" guidance does not apply here — match the source.

Work section-by-section, validating against the Figma screenshot while building. Large pages: build in passes (hero → nav → body sections → footer), not one shot.

## 5. Test — only when the user asks to validate/verify/test against Figma

This step is opt-in, not automatic. Skip it by default and go straight to Step 6 (Deliver) unless the user explicitly asks to validate, verify, or test the build against the Figma source. If skipped, say so plainly in delivery notes rather than silently marking anything as verified.

When testing is requested, load [references/testing-and-qa.md](references/testing-and-qa.md) for the full workflow: prefer Playwright MCP if already connected (no install needed); otherwise install and run [scripts/visual-check.spec.ts](scripts/visual-check.spec.ts) — a Playwright spec using `toHaveScreenshot()` (pixelmatch-based diffing) against the Step-1 Figma screenshot baseline at each breakpoint, plus an `@axe-core/playwright` scan for WCAG 2.2 AA violations, plus a console-error check. If neither path is available (no MCP connection, and install fails or isn't possible in a sandboxed/offline environment), fall back to the manual side-by-side comparison in that doc and say plainly that fidelity confidence is lower as a result.

## 6. Deliver

Provide:
- Folder structure and the multi-page mechanism actually used
- Asset manifest (extracted files + local paths)
- Missing assets/fonts flagged separately
- `tokens.json` (if the token pipeline was used) plus generated CSS/Tailwind output
- Implementation notes — anything approximated or that Figma didn't actually specify (especially any motion that had to be inferred rather than extracted)
- The production-readiness checklist below, filled in honestly

### Final checklist
- [ ] No `figma.com` URLs anywhere in the output
- [ ] Every extracted token traces back to a Figma variable or an explicitly noted hardcoded value
- [ ] Every implemented animation traces back to an annotation, a variant difference, or the reference screenshot — none invented
- [ ] All motion wrapped in `prefers-reduced-motion` handling
- [ ] `<picture>` responsive images with explicit dimensions; LCP image not lazy-loaded
- [ ] Semantic landmarks, single `<h1>`, logical heading order
- [ ] RTL verified with logical properties (if applicable), directional icons flipped, native-speaker review flagged as still needed
- [ ] Framework used matches Step 0 — no accidental mixing
- [ ] Header/footer single-sourced per the multi-page mechanism chosen in Step 0

**If Step 5 testing was requested and run**, also confirm:
- [ ] Responsive at all target breakpoints, verified in a real browser (not just assumed from the CSS)
- [ ] No console errors
- [ ] Zero `axe-core` WCAG 2.2 AA violations (and a note that manual a11y review is still recommended — automated tools catch roughly half of real-world issues)
- [ ] Playwright visual diff within threshold at every breakpoint

**If Step 5 wasn't requested**, say so explicitly in delivery notes instead of leaving these unchecked with no explanation.

## Reference files

| Doc | Load when |
|---|---|
| [figma-mcp-workflow.md](references/figma-mcp-workflow.md) | Before any Figma MCP tool call |
| [frameworks/bootstrap.md](references/frameworks/bootstrap.md) | Framework decision = Bootstrap 5 |
| [frameworks/tailwind.md](references/frameworks/tailwind.md) | Framework decision = Tailwind |
| [css-architecture.md](references/css-architecture.md) | Writing any custom CSS on top of either framework |
| [design-tokens.md](references/design-tokens.md) | Before writing CSS variables/tokens.json |
| [animation-extraction.md](references/animation-extraction.md) | Design includes hover states, transitions, or any motion |
| [multipage-components.md](references/multipage-components.md) | More than one page in the deliverable |
| [rtl-and-i18n.md](references/rtl-and-i18n.md) | Arabic or other RTL-language build |
| [testing-and-qa.md](references/testing-and-qa.md) | User asks to validate/verify/test the build against Figma |
| [production-checklist.md](references/production-checklist.md) | Before final delivery |
| [gotchas.md](references/gotchas.md) | Anything looks off, or before starting a new project type (read once, keep in mind throughout) |
