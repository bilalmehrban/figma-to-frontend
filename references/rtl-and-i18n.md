# RTL & Internationalization

Trigger this doc whenever the build targets Arabic (or any RTL language), and set it up from the first line of CSS — retrofitting RTL onto an LTR-only stylesheet later is much more error-prone than building bidirectional from the start.

## Foundation

- Set `dir="rtl"` and the correct `lang` attribute on `<html>` — never fake direction with CSS alone.
- Use **CSS logical properties throughout**, not physical ones: `margin-inline-start` / `margin-inline-end` instead of `margin-left` / `margin-right`, `padding-inline-*` instead of `padding-left/right`, `inset-inline-start` instead of `left`, `text-align: start` instead of `text-align: left`, `border-inline-start` instead of `border-left`. Written this way, one stylesheet serves both directions with no `[dir="rtl"]` override blocks needed for basic layout.
- Flexbox and Grid already reverse their visual order automatically under `dir="rtl"` — don't manually flip `flex-direction` or grid columns; let the browser do it.

## What still needs manual handling

- **Directional icons** (arrows, chevrons, "next/back" indicators) need an explicit flip: `[dir="rtl"] .icon-arrow { transform: scaleX(-1); }`. **Symbolic icons** (a play button, a checkmark, a logo) should *not* be flipped — flipping breaks their meaning.
- **Box-shadows and other directional visual effects** that were authored assuming LTR need a mirrored value under `[dir="rtl"]`.
- **Phone numbers, latin text/brand names embedded in Arabic content**: force `direction: ltr; unicode-bidi: isolate` on that specific span so digits and Latin characters don't get visually reordered by the surrounding RTL context.
- **Numbers**: keep numerals left-to-right even inside RTL text — this is standard convention, not a bug to "fix."

## Arabic typography specifics

- **Letter-spacing**: set `letter-spacing: 0` (or don't touch it) for Arabic — any nonzero value breaks the cursive letter-joining that Arabic script depends on.
- **Line-height**: Arabic generally needs more vertical breathing room than Latin text — budget ~1.6–1.8 rather than the ~1.4–1.5 that might look fine for an English build.
- **Base font size**: err toward the higher end of the range (16–18px minimum) — Arabic glyphs at small sizes lose legibility faster than Latin ones.
- **Font choice**: confirm the brand's Arabic font actually covers the required character set and weights — don't assume a Latin display font has an Arabic companion cut without checking (see the font-tracking rule in [gotchas.md](gotchas.md)).
- Avoid heavy use of low-opacity/RGBA text color on Arabic — rendering artifacts on the joined script are more visible than on Latin letterforms.

## Mixed-direction / user-generated content

For content whose direction isn't known ahead of time (e.g. a mixed Arabic/English field), use `dir="auto"` with `text-align: match-parent` rather than hardcoding a direction.

## This still needs a human

Automated RTL implementation catches structural/layout mirroring; it does not replace a native Arabic speaker reviewing the actual typeset result for readability, correct letter-joining rendering, and idiomatic phrasing where copy was translated. Flag this as an outstanding review step in delivery notes rather than marking RTL "done" purely on the strength of passing a logical-properties checklist.
