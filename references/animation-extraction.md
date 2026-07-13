# Animation & Motion Extraction

## The corrected starting point

Figma's Dev Mode MCP Server does not expose prototype/interaction/motion data through any tool — confirmed against Figma's own documentation and an open community feature request asking for exactly this capability. `get_design_context` returns static visual and structural properties only. There is no `get_motion_context` or equivalent. Don't design a workflow step around a tool call that doesn't exist.

This means animation "extraction" is really **animation inference from the sources that do exist**, and the deliverable notes should say so honestly rather than implying a fidelity level the process can't back up.

## Where motion intent actually comes from

1. **Annotations on the frame** — Figma's own recommended place for behavior that's "hard to capture from visuals alone." Read every annotation before building.
2. **Dev resources** — attached links/notes, occasionally pointing to a separate prototype file, video, or written spec a human needs to open.
3. **Variant/state differences in the design tree** — if a component has explicit hover/active/focus variants, the *end state* is real data (colors, positions, opacity) even though the *transition* between states is not. This is legitimate extraction, not inference — build on it with confidence.
4. **The reference screenshot** — useful for confirming a static end-state, not for inferring timing or easing, which cannot be read from a still image.

If none of the above specify a behavior, don't invent one. Note it in delivery as "no motion specified for this element" rather than adding a plausible-sounding fade or slide that wasn't actually in the file.

## What to capture when a real spec exists

For each annotated/specified animation:
- **Trigger** — hover, click, page load, scroll-into-view
- **Duration** — ms, if stated
- **Delay** — ms, including stagger delay for sequences (e.g. cards revealing one after another)
- **Easing** — named curve or cubic-bezier, if stated
- **Transform** — scale/translate/rotate, start and end state
- **Opacity** — start and end state

Where a spec gives some but not all of these (e.g. "fades in on scroll" with no duration stated), use reasonable, clearly-labeled defaults (~300-500ms, ease-out) rather than blocking on it — but say in delivery notes that duration/easing were assumed, not specified.

## Mapping to implementation

- **Hover / active / focus states** → CSS `transition` on the relevant property. Two-state changes don't need `@keyframes`.
- **Entrance / micro-interactions** → `@keyframes` in the Animations section of styles.css (`css-architecture.md`, Section 7), triggered via a class toggle.
- **Scroll-triggered reveals** → `IntersectionObserver` toggling a class that runs the keyframe animation, not raw scroll listeners (worse for performance — every scroll event fires a full layout/paint check instead of one observer callback per threshold crossing). The modern CSS-only alternative, `animation-timeline: view()`, reached Baseline support in late 2024 and can replace the JS entirely for pure scroll-linked reveals — use it behind an `@supports` check with the `IntersectionObserver` version as fallback for older engines.
- **Staggered sequences** → one observer/class pattern with `animation-delay` calculated per item index in JS, not N hardcoded keyframe rules.

## Accessibility — not optional

Wrap all motion in a `prefers-reduced-motion` check:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

Or gate the animation itself behind `(prefers-reduced-motion: no-preference)` and provide an instant-state fallback. This isn't a nice-to-have — treat it as part of the definition of "done" for any animated element, same tier as the asset-URL rule.

## Smart Animate pitfalls (context, not extraction guidance)

Figma's own prototype "Smart Animate" is frame-to-frame and depends on matching layer names/hierarchy between the two frames; it's known to fail silently or glitch when layers don't line up, and Figma has at times recommended falling back to Instant transitions when this happens. There's no automatic web equivalent — a shared-element/FLIP-style transition on the web has to be hand-authored from a real spec (Steps above), not reverse-engineered from Smart Animate's internal behavior, which the MCP tools don't expose anyway.

## Verify at delivery, don't assume

Add to the SKILL.md final checklist: confirm every implemented animation actually fires during the Playwright pass ([testing-and-qa.md](testing-and-qa.md)), at the breakpoints it applies to. A hover transition has no touch equivalent — call that gap out explicitly rather than leaving it silently inert on mobile.
