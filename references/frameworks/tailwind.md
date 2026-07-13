# Tailwind CSS Conventions

## Stack

HTML5 + Tailwind CSS + vanilla JavaScript. No React/Vue/Angular unless the target project already uses one (check for an existing component framework before assuming a plain HTML build).

**Check the Tailwind version in use before writing config.** v3 (JIT engine, `tailwind.config.js`) and v4 (CSS-first config via `@theme` in the stylesheet, no config file required by default) set up differently enough that guessing wrong wastes a build cycle. If it's not stated and there's no existing project to inspect, ask rather than assume — treat anything below beyond the general workflow as something to verify against current Tailwind docs if it's a v4 project.

## Folder structure

```
project/
├── index.html
├── src/
│   └── input.css       (Tailwind directives / @theme block)
├── dist/
│   └── output.css      (compiled)
├── js/
│   └── script.js
├── images/
└── tokens.json          (if the design-tokens.md pipeline was used)
```

## Design tokens

Pull colors/spacing/typography from Figma's `get_variable_defs` (see [figma-mcp-workflow.md](../figma-mcp-workflow.md)) and map them to Tailwind theme tokens (v3: `theme.extend` in `tailwind.config.js`; v4: `@theme` block in CSS) rather than reaching for arbitrary-value classes (`bg-[#123456]`) for anything that's actually a reusable brand token. Arbitrary values are fine for one-off spacing that doesn't belong in the design system. If the [design-tokens.md](../design-tokens.md) DTCG pipeline was used, [../../scripts/build-tokens.mjs](../../scripts/build-tokens.mjs) can emit the Tailwind theme values directly from `tokens.json` rather than hand-transcribing them.

## Breakpoints — do not reuse the Bootstrap set

Tailwind's default breakpoints are different numbers than Bootstrap's:

| Breakpoint | Min width |
|---|---|
| `sm` | 640px |
| `md` | 768px |
| `lg` | 1024px |
| `xl` | 1280px |
| `2xl` | 1536px |

If a conversion is being done in both frameworks for comparison, don't copy one breakpoint table into the other — test each build against its own framework's actual breakpoints.

## Known build gotcha

On a prior Tailwind conversion (plain HTML + Tailwind v3), arbitrary-value classes (`gap-[19px]`, `bg-[#008aab]`) were silently dropped from the compiled CSS on the **first** build due to a JIT caching quirk — the classes were valid and correctly written, they just didn't make it into the initial `output.css`. A fresh rebuild after the first compile resolved it. If a class that should clearly be working isn't showing up in rendered output, rebuild once before assuming the class syntax is wrong.

## JavaScript

Vanilla JS only, same scope as the Bootstrap doc: mobile menu, sliders, accordions, tabs — only where genuinely interactive behavior is needed.

## Images & icons

Same rule as Bootstrap: extract via `download_assets`, host locally, descriptive filenames, SVG icons preferred over rasterized. Use `<picture>` with AVIF/WebP/JPEG fallbacks and explicit dimensions per [production-checklist.md](../production-checklist.md).

## RTL

Tailwind v3/v4 both support `rtl:`/`ltr:` variant prefixes for directional overrides, but prefer authoring with logical-property utilities (`ms-*`/`me-*` instead of `ml-*`/`mr-*`, `ps-*`/`pe-*` instead of `pl-*`/`pr-*`) as the default so most rules don't need an `rtl:` override at all. See [rtl-and-i18n.md](../rtl-and-i18n.md).

## Accessibility & animation

Same standards as the Bootstrap doc — semantic HTML, WCAG basics, and only animations that trace back to a real spec (see [animation-extraction.md](../animation-extraction.md)), wrapped in `prefers-reduced-motion` handling.

## Quality checklist (Tailwind-specific, in addition to the main SKILL.md checklist)

- [ ] Correct config approach used for the actual Tailwind version (v3 config file vs v4 `@theme`)
- [ ] Reusable brand tokens mapped to theme values, not scattered as arbitrary-value classes
- [ ] Rebuilt at least once before declaring a missing class "broken"
- [ ] No Bootstrap classes/JS mixed in
- [ ] Logical-property utilities used by default; `rtl:`/`ltr:` variants only where a genuine exception is needed
