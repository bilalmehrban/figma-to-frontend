# Production Readiness Checklist

Use this at Step 6 (Deliver) as the substance behind the SKILL.md checklist — the numbers and reasoning to actually check against, not just tick boxes.

## Core Web Vitals budgets

Target the field-data (real-user, 75th-percentile) thresholds Google uses to classify a page as "good":
- **LCP (Largest Contentful Paint)**: ≤ 2.5s
- **INP (Interaction to Next Paint)**: ≤ 200ms — this replaced FID as the responsiveness metric in March 2024; "FID" is a metric behind.
- **CLS (Cumulative Layout Shift)**: ≤ 0.1

Internally, aim tighter than the pass/fail line (e.g. LCP 2.0s, INP 160ms, CLS 0.08) since these are lab-environment estimates and real-user field data usually runs worse than a clean local test. The highest-leverage fixes for LCP specifically: compress and correctly size the hero image, set `fetchpriority="high"` on it, inline critical CSS, and preload the primary font.

## Accessibility

Target WCAG 2.1/2.2 AA. Run `@axe-core/playwright` as part of the Step 5 test pass (see [testing-and-qa.md](testing-and-qa.md)) and fail the build on violations — but say explicitly in delivery notes that automated tooling (axe-core-class rule engines) is generally understood to catch roughly half of real-world accessibility issues in a first-time audit, so a genuine production sign-off still needs a manual keyboard-navigation and screen-reader pass, not just a clean automated scan.

## Responsive images

- `<picture>` with source order **AVIF → WebP → JPEG** (graceful degradation for older browsers/renderers).
- Correct `srcset` (width descriptors, e.g. 400w/800w/1200w/1600w) and a matching `sizes` attribute.
- **Explicit `width` and `height`** on every image — this is what prevents layout shift (CLS) from images loading in after layout has already happened.
- `loading="lazy"` on below-the-fold images; **no** `loading="lazy"` and `fetchpriority="high"` on the LCP/hero image specifically.

## SEO / semantic structure

- Semantic landmarks (`header`, `nav`, `main`, `footer`), a single `<h1>`, and a logical heading order underneath it (no skipped levels).
- Meta title and description, Open Graph tags for social sharing.
- Descriptive `alt` text on meaningful images (empty `alt=""` on purely decorative ones).
- Clean, crawlable HTML — this is one more reason the multi-page nav should be in the initial HTML source rather than injected by JS (see [multipage-components.md](multipage-components.md)).

## CLS specifics (beyond images)

- Reserve space for any dynamically-injected content (ads, embeds, late-loading widgets) rather than letting it push layout down after the fact.
- `font-display: swap` on custom fonts, so text renders in a fallback immediately rather than staying invisible and then reflowing when the custom font arrives.
- Animate `transform`/`opacity` only (see [animation-extraction.md](animation-extraction.md)) — animating layout properties (`width`, `height`, `top`) causes the exact reflow/repaint cost CLS is measuring.

## Honest caveats to carry into delivery notes

- Core Web Vitals are measured on real-user field data; a static deliverable can look great in a local Lighthouse run and still need real-world validation once it's live, especially after it's integrated into a CMS (extra script tags, tracking pixels, etc. all affect these numbers).
- This checklist covers what a static frontend deliverable can control. Server response time, CDN configuration, and CMS-side rendering overhead are outside this skill's scope but will affect these same metrics once deployed — flag that boundary rather than implying the checklist guarantees production performance end-to-end.
