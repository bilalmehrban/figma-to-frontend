/**
 * build-tokens.mjs
 *
 * Builds CSS custom properties, Tailwind theme values, and SCSS variables
 * from a W3C DTCG-format tokens.json (see references/design-tokens.md).
 *
 * VERIFY BEFORE RUNNING:
 * Style Dictionary's config API has had breaking changes across major versions.
 * This template targets Style Dictionary v4's DTCG-aware API. Check the exact
 * API surface against the version actually installed (`npm ls style-dictionary`)
 * and its own docs/changelog before trusting this file verbatim — don't assume
 * it matches whatever version ends up in package.json.
 *
 * Install (skip if `style-dictionary` is already a dependency):
 *   npm install -D style-dictionary
 *
 * If install fails (no network access, a sandboxed environment without npm
 * registry reach, etc.), don't retry in a loop — fall back to hand-written
 * CSS custom properties instead (see references/design-tokens.md).
 *
 * Run:
 *   node scripts/build-tokens.mjs
 */

import StyleDictionary from 'style-dictionary';

const sd = new StyleDictionary({
  source: ['tokens.json'],
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'css/',
      files: [
        {
          destination: 'tokens.css',
          format: 'css/variables',
          options: {
            selector: ':root',
          },
        },
      ],
    },
    scss: {
      transformGroup: 'scss',
      buildPath: 'scss/',
      files: [
        {
          destination: '_tokens.scss',
          format: 'scss/variables',
        },
      ],
    },
    // Tailwind: emits a flat JS object shaped for `theme.extend` (v3) or as
    // reference values to hand-copy into an `@theme` block (v4). Verify which
    // Tailwind major version the target project uses (see references/frameworks/tailwind.md)
    // before assuming this output slots in without adjustment.
    tailwind: {
      transformGroup: 'js',
      buildPath: 'tailwind/',
      files: [
        {
          destination: 'tokens.js',
          format: 'javascript/es6',
        },
      ],
    },
  },
});

await sd.buildAllPlatforms();

console.log('Tokens built: css/tokens.css, scss/_tokens.scss, tailwind/tokens.js');
