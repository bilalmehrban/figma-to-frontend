# Testing & QA

Only run this workflow when the user explicitly asks to validate, verify, or test the build against the Figma source — this is not an automatic step. If it wasn't requested, skip it and say so plainly in delivery notes rather than silently marking anything as verified.

The goal, when requested: verify the built page actually matches the Figma reference, passes an accessibility scan, and doesn't throw errors — not eyeball the code and assume it's fine.

## Preferred path: Playwright MCP (no install needed)

If Playwright MCP (`@playwright/mcp`, Microsoft's official package) is already connected, use it first — it needs no setup. It can drive: navigate → screenshot at each breakpoint (most setups support viewport/device emulation) → pull console messages → compare against the Step-1 Figma screenshot by eye. **Check the live tool list before calling anything** — don't guess a specific tool name from memory, since exact call signatures can vary by version.

Use this path whenever it's available. Only fall to the scripted path below if Playwright MCP isn't connected, or a repeatable regression suite that survives past this session is actually wanted.

## Scripted path: Playwright + axe-core

### Setup — check before assuming installed

1. Check whether `@playwright/test` and `@axe-core/playwright` are already dependencies (`package.json` or `node_modules`). If not:
   ```bash
   npm install -D @playwright/test @axe-core/playwright
   npx playwright install chromium
   ```
   `npx playwright install` downloads browser binaries — chromium alone is enough for this workflow; installing all three engines is ~300MB and rarely needed. This is a one-time cost, but budget time for it on the first run.
2. If install fails (no network access, a sandboxed environment without npm registry reach, etc.), stop and fall to the manual comparison below rather than retrying in a loop.

### Serve the built page

Start a static server from the project root before running the spec — `file://` URLs can break relative asset paths and CORS for local fonts/images in some setups:
```bash
npx serve . -l 8080
# or: python -m http.server 8080
```
Point `CHECK_URL` at the served page if it isn't `http://localhost:8080/index.html` (the script's default).

### Run

Use [../scripts/visual-check.spec.ts](../scripts/visual-check.spec.ts) as the template. It:

1. Navigates to the built page.
2. Calls `expect(page).toHaveScreenshot()` at each breakpoint that matters for the framework in use (see the breakpoint table in `frameworks/bootstrap.md` or `frameworks/tailwind.md`). `toHaveScreenshot()` is built into `@playwright/test`, diffs pixel-for-pixel against a baseline using `pixelmatch` under the hood, and writes expected/actual/diff images on failure — no external service needed.
   - **Use the Figma reference screenshot (from Step 1's `get_screenshot`) as the baseline image**, or generate a first-run baseline from the built page if a like-for-like image isn't practical to align pixel-for-pixel with Figma's own renderer.
   - **Baseline file location**: Playwright writes/reads snapshots at `<spec-file-name>-snapshots/<snapshot-name>-<project>-<platform>.png` next to the spec (e.g. `visual-check.spec.ts-snapshots/desktop-chromium-win32.png`). To use the Figma screenshot as the baseline, place it at that exact path before the first run instead of letting the first run generate one from the build itself.
   - **Use a tolerant threshold**, not pixel-perfect equality — Figma's renderer and a real browser will never produce byte-identical output. Tune `maxDiffPixelRatio` (start around 1-5%) and `threshold` (default 0.2 YIQ color distance) to catch real layout/spacing/color regressions without flagging font-rendering noise.
3. Runs an `@axe-core/playwright` scan (`new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']).analyze()`) and fails on violations.
4. Checks browser console messages for JS errors or failed network requests (a missed local asset path usually shows up here as a 404).

**Verify exact API details against the installed package versions before running** — `@playwright/test` and `@axe-core/playwright` are both stable, well-documented packages, but pin/check versions rather than assuming the exact method signatures never change.

## Fallback: manual comparison

Use this when no browser-automation tool is available at all — Playwright MCP isn't connected, and the scripted path's install failed or isn't possible in the current environment:

1. Render the built page at each target breakpoint width.
2. Place it side-by-side with the Figma reference screenshot.
3. Check spacing, alignment, color, and typography by eye — flag in delivery notes that this was a manual check, so the person knows the fidelity confidence level is lower than an automated diff would give.
4. For console/JS errors without a browser tool, re-read the JS for obvious runtime issues (undefined references, missing null checks on DOM queries) since there's no way to catch them live.

## What "verified" means for delivery

Don't mark "responsive at all target breakpoints, verified in a real browser" or "zero axe-core violations" as done in the final checklist unless one of the paths above actually ran. A media query that looks correct on paper, or code that looks accessible on read-through, is not the same as a tool confirming it. If testing wasn't requested at all, say so plainly instead of leaving the checklist items unexplained.

Note for anyone reading the delivered report: automated visual diffing and `axe-core` both catch real regressions, but neither is a complete substitute for human review — `axe-core`-class tools are generally understood to catch roughly half of real-world accessibility issues, and visual diffing catches rendering regressions, not design-intent mismatches a human would notice at a glance.
