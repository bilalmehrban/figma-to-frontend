# Design Tokens (Color, Spacing, Typography, Radius, Shadow)

## Where these come from
- `get_variable_defs` is the primary source — pulls Figma's actual variable collections. Never hand-pick a color or spacing value off the screenshot if a bound variable exists for it.
- Not everything is variable-backed. Plenty of files have hardcoded fills/effects on layers with no variable binding — for those, pull the raw value from `get_design_context`'s per-node style data instead of guessing from the screenshot.

## Extraction checklist
- **Colors** — primary/secondary/accent, text colors (heading/body/muted), background colors, border colors, semantic colors (success/warning/error) if present.
- **Spacing** — base unit if the file uses one consistent scale (4px/8px grid is common — check, don't assume), section padding, repeated gap values.
- **Typography** — font family(ies), the actual type scale in use (not a generic scale), weights, line-heights, letter-spacing if non-default.
- **Radius** — corner radius values across cards/buttons/inputs; usually 2-3 distinct values reused everywhere.
- **Shadow** — elevation values, especially for cards and modals.

## Naming convention
Mirror Figma's own variable names (translated to kebab-case) instead of inventing new ones. If Figma has `Primary/600`, use `primary-600`, not `blue`. This keeps the token set traceable back to source when the design updates later.

## Output format: W3C DTCG JSON

Emit extracted tokens as a `tokens.json` following the **W3C Design Tokens Community Group format (spec version 2025.10)** — the first stable, vendor-neutral design token standard, supported across Figma, Tokens Studio, Style Dictionary, and other major tools. Tokens use a `$value` and `$type`, with an optional `$description`; group/alias references use `{group.token}` syntax. Composite types (shadow, typography, gradient, border, transition) are first-class.

Example shape:

```json
{
  "color": {
    "primary-600": {
      "$type": "color",
      "$value": "#0066FF",
      "$description": "Primary brand color, from Figma variable Primary/600"
    }
  },
  "spacing": {
    "unit-4": { "$type": "dimension", "$value": "16px" }
  },
  "shadow": {
    "card": {
      "$type": "shadow",
      "$value": { "offsetX": "0", "offsetY": "10px", "blur": "30px", "color": "rgba(0,0,0,0.1)" }
    }
  }
}
```

### Setup — check before assuming installed

Check whether `style-dictionary` is already a dependency (`package.json` or `node_modules`) before installing:
```bash
npm install -D style-dictionary
```
If install fails (no network access, a sandboxed environment without npm registry reach, etc.), stop rather than retrying in a loop, and fall back to hand-written CSS custom properties in the `:root` block ([css-architecture.md](css-architecture.md), Section 1) — every token still traces back to `tokens.json`, just without the generated CSS/Tailwind/SCSS output.

### Run

Run [../scripts/build-tokens.mjs](../scripts/build-tokens.mjs) (a Style Dictionary build) against `tokens.json` to generate:
- CSS custom properties (`:root { --color-primary-600: #0066FF; }`) for the vanilla/Bootstrap path
- Tailwind theme values for the Tailwind path
- SCSS variables if the target project uses Bootstrap's Sass source instead of compiled CSS

**Verify the exact Style Dictionary config API against the version actually installed** (`style-dictionary` on npm) before running the script — v4 has first-class DTCG support, but the config API has had breaking changes across versions; don't assume the template in `build-tokens.mjs` matches whatever version gets installed without checking its own docs/changelog first.

For a trivial one-page job, skip the DTCG/Style Dictionary pipeline entirely and emit CSS custom properties directly in the `:root` block ([css-architecture.md](css-architecture.md), Section 1) — the standard pipeline is worth the setup cost once there's more than one page or the tokens need to be reused across a larger design system later.

## Handling variable modes (light/dark, brand variants)
If `get_variable_defs` returns multiple modes for a collection, don't silently pick one. Flag it and confirm which mode applies, unless the target frame makes it unambiguous — picking silently is a guess, not an extraction.
