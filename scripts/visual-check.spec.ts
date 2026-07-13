/**
 * visual-check.spec.ts
 *
 * Visual regression + accessibility gate for a figma-to-frontend build.
 * Only run this when the user has asked to validate/verify/test the build
 * against its Figma source — see references/testing-and-qa.md for the full
 * conditional workflow and setup this implements (including preferring
 * Playwright MCP over this script when it's already connected).
 *
 * Install (skip if @playwright/test and @axe-core/playwright are already
 * dependencies):
 *   npm install -D @playwright/test @axe-core/playwright
 *   npx playwright install chromium   # chromium alone is enough here
 *
 * Serve the built page first — file:// URLs can break relative asset paths:
 *   npx serve . -l 8080
 *
 * First run writes baseline screenshots (no Figma reference wired in yet —
 * see the comment below for wiring in the Step 1 get_screenshot output).
 * Subsequent runs diff against the committed baseline using pixelmatch
 * under the hood (Playwright's built-in toHaveScreenshot()). Baselines live
 * at visual-check.spec.ts-snapshots/<name>-<project>-<platform>.png next to
 * this file.
 *
 * Run:
 *   npx playwright test visual-check.spec.ts
 *
 * VERIFY BEFORE RELYING ON THIS: @playwright/test and @axe-core/playwright
 * are both stable, well-documented packages, but pin exact versions in
 * package.json rather than assuming method signatures never change.
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Adjust to the framework actually used — see references/frameworks/bootstrap.md
// or references/frameworks/tailwind.md for the correct breakpoint table.
// This example uses the Bootstrap 5 breakpoints; swap in Tailwind's if applicable.
const BREAKPOINTS = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'wide', width: 1920, height: 1080 },
];

// Point this at the built page — a local file path (file://) or a locally
// served dev URL, depending on how the project is set up.
const PAGE_URL = process.env.CHECK_URL ?? 'http://localhost:8080/index.html';

for (const bp of BREAKPOINTS) {
  test(`visual + a11y check — ${bp.name} (${bp.width}x${bp.height})`, async ({ page }) => {
    await page.setViewportSize({ width: bp.width, height: bp.height });

    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => consoleErrors.push(String(err)));

    await page.goto(PAGE_URL, { waitUntil: 'networkidle' });

    // Visual diff against baseline. If you have the Step 1 Figma reference
    // screenshot, place it at the expected snapshot path Playwright generates
    // on first run (see Playwright docs for exact naming/location) so the
    // first run diffs against Figma rather than just recording a baseline
    // from the build itself.
    await expect(page).toHaveScreenshot(`${bp.name}.png`, {
      maxDiffPixelRatio: 0.03, // tolerant threshold — tune per references/testing-and-qa.md
      animations: 'disabled',
    });

    // Accessibility gate — WCAG 2.1/2.2 AA.
    const axeResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(axeResults.violations, JSON.stringify(axeResults.violations, null, 2)).toEqual([]);

    // Console/network error gate.
    expect(consoleErrors, consoleErrors.join('\n')).toEqual([]);
  });
}
