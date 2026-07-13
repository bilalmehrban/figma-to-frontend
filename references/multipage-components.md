# Multi-Page Shared Components

Static HTML has no native include mechanism — there's no `<import src="header.html">`. A multi-page deliverable needs an explicit decision on how the header/footer/nav stay consistent across pages without either duplicated maintenance burden or a runtime hack that hurts SEO. Decide this in Step 0, before building any page.

## Default: generation-time duplication

Keep one canonical header partial and one canonical footer partial as source files. When generating each page, copy that exact markup into the page's HTML directly — the duplication happens once, at generation time, not at runtime in the browser.

Why this is the default:
- Zero runtime JS dependency for primary navigation
- No flash-of-unstyled-content, no SEO/crawlability penalty (the nav is in the initial HTML source, not injected after load)
- Fully static, fully inspectable output — no build tooling required
- The usual objection to hand-duplication ("now I have to update 10 files by hand") doesn't really apply here, because an agent regenerates every page from the same source partial on request — the DRY-ness lives at the generation step, not in the shipped files.

Keep the source partials in the delivered folder structure (e.g. `partials/header.html`, `partials/footer.html`) even though their content is duplicated into each page, so future edits have one obvious place to start and the duplication is visibly intentional, not accidental drift.

## Opt-in: a lightweight static site generator (11ty)

If the user explicitly says a build step is acceptable, 11ty (Eleventy) is the better fit over heavier options — zero-config, no client-side framework requirement, outputs clean static HTML, and supports real includes (`{% include "header.njk" %}`) so the header/footer genuinely live in one file. Reach for this only when asked; don't introduce a build step into what was framed as a "standalone" deliverable without saying so first.

Astro is a heavier alternative (islands architecture, its own `<Image>` component, Vite build) — only worth it if the user wants component-level interactivity beyond what vanilla JS comfortably covers.

## Reserved for app-like pages: Web Components

`customElements.define()` with a `<template>` gives real `<site-header>` custom elements with no build step and broad modern-browser support. The tradeoff: the header markup is injected by JavaScript, so it isn't present in the initial HTML source — acceptable for an authenticated, app-like page where SEO doesn't matter, a real downside for a public marketing/content page where the primary nav needs to be crawlable and present without JS.

## Explicitly not recommended

- **Runtime `fetch()` + `innerHTML` injection** for the primary header/footer — causes flash-of-unstyled-content and actively hurts SEO/crawlability. Don't reach for this just because it "feels more DRY" than duplication; it isn't a good tradeoff for content that needs to be there on first paint.
- **Server-Side Includes (SSI)** — requires server configuration the deliverable doesn't control.
- **`<iframe>`-based reuse** — breaks styling inheritance and SEO; not appropriate for primary layout chrome.
