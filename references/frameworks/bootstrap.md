# Bootstrap 5 Conventions

## Stack

Use only: HTML5, CSS3, Bootstrap 5.x, vanilla JavaScript (no jQuery), Bootstrap Icons where needed.

Do not use React, Vue, Angular, Tailwind, SCSS/SASS, other CSS frameworks, or third-party animation libraries unless explicitly requested.

## Folder structure

```
project/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── script.js
├── images/
└── tokens.json          (if the design-tokens.md pipeline was used)
```

## Bootstrap usage

Use Bootstrap's built-in components wherever they genuinely fit rather than reinventing them: Grid/Container, Navbar, Cards, Buttons, Forms, Modals, utility classes. Avoid overriding Bootstrap defaults unless the design genuinely requires it — fighting the framework's own classes usually means the wrong component was chosen.

## Breakpoints

Bootstrap 5's default breakpoints (use these for both the CSS and later for browser-based testing):

| Breakpoint | Min width |
|---|---|
| `sm` | 576px |
| `md` | 768px |
| `lg` | 992px |
| `xl` | 1200px |
| `xxl` | 1400px |

Also verify below 576px (small phones) — Bootstrap's grid handles this as the implicit base, but explicitly check it renders cleanly at ~320px.

## CSS standards

- CSS variables for anything reused (colors, spacing scale, font stacks) — see [design-tokens.md](../design-tokens.md) for the extraction/naming pipeline that feeds these.
- Organize `style.css` per [css-architecture.md](../css-architecture.md), including logical properties if the build is RTL (see [rtl-and-i18n.md](../rtl-and-i18n.md)).
- Reusable utility classes over duplicated declarations.
- No inline styles.

## JavaScript

Vanilla JS only, used only where actually needed: mobile menu toggling, sliders/carousels (Bootstrap's own Carousel component covers most cases before reaching for custom JS), accordions, tabs. Keep it modular and commented — no dead code, no inline handlers.

## Images & icons

- Extract every image via `download_assets` (see [figma-mcp-workflow.md](../figma-mcp-workflow.md)) — never screenshot a design and use the screenshot as an image asset.
- Prefer SVG or Bootstrap Icons over rasterized icons.
- Descriptive filenames: `hero-image.webp`, `team-member.jpg`, not `img1.png`.
- Use `<picture>` with AVIF/WebP/JPEG fallbacks and explicit dimensions per [production-checklist.md](../production-checklist.md) — Bootstrap's own image utilities (`.img-fluid`) don't handle format fallback or dimension attributes.

## Typography

Match font family, weight, size, line-height, and letter-spacing from the Figma variables/text styles. Provide web-safe fallbacks in the `font-family` stack. For Arabic/RTL builds, see the typography specifics in [rtl-and-i18n.md](../rtl-and-i18n.md) before assuming Latin type-scale numbers translate directly.

## Animations

Only what's actually specified — see [animation-extraction.md](../animation-extraction.md) for what counts as a real spec versus an invented one. Common legitimate cases: button/card hover, image zoom, fade-in, slide-up, smooth scroll, visible focus states. Wrap all of it in `prefers-reduced-motion` handling.

## Accessibility

WCAG basics: `alt` attributes, `aria-label`s, keyboard navigation, visible focus states, sufficient contrast, proper semantic structure (see main SKILL.md Step 4 and [production-checklist.md](../production-checklist.md)).

## Quality checklist (Bootstrap-specific, in addition to the main SKILL.md checklist)

- [ ] Bootstrap components used correctly, not hand-rolled where a built-in exists
- [ ] No SCSS/SASS, no Tailwind classes mixed in
- [ ] Valid HTML5 and CSS3
- [ ] Cross-browser sanity (evergreen browsers; no IE-specific concerns needed)
