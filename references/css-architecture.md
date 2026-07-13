# CSS Architecture

Applies to any custom CSS written on top of either framework — Bootstrap/Tailwind utility classes handle most styling, but any custom CSS written should follow this structure rather than being scattered ad hoc.

```
/* 1. Variables */
:root {
  --color-primary: ...;
  --color-secondary: ...;
  --font-heading: ...;
  --spacing-unit: ...;
}

/* 2. Reset */
/* only what the chosen framework doesn't already normalize */

/* 3. Typography */
/* heading/body styles not covered by framework utility classes */

/* 4. Layout */
/* page-level structural rules — use logical properties (see below) if the build is RTL */

/* 5. Components */
/* one block per custom component, named clearly */

/* 6. Utilities */
/* small reusable helpers not provided by the framework */

/* 7. Animations */
/* keyframes and transition rules — see animation-extraction.md for what's legitimate to include here */

/* 8. Media queries */
/* grouped by breakpoint, referencing the framework's own breakpoint table
   (see frameworks/bootstrap.md or frameworks/tailwind.md) */
```

## Principles

- Reusable CSS variables over repeated magic numbers/colors — see [design-tokens.md](design-tokens.md) for the extraction/naming pipeline that feeds this block.
- Consistent, descriptive class naming — a class name should indicate what it's for without opening the CSS file.
- No duplicated declarations across sections; if the same rule appears twice, it belongs in a shared class or variable.
- No inline styles — anything that needs to be dynamic gets a class toggled by JS, not a `style=""` attribute.
- **Logical properties over physical ones** (`margin-inline-start` not `margin-left`, `inset-inline-start` not `left`) whenever the build might ever need RTL support, even if it doesn't yet — this costs nothing in an LTR-only build and avoids a full rewrite later. See [rtl-and-i18n.md](rtl-and-i18n.md) if the current build is explicitly RTL.
