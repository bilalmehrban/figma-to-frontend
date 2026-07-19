# figma-to-frontend

A Claude Code plugin that converts Figma designs into production-ready, responsive static frontend code — HTML5 + **Bootstrap 5 or Tailwind CSS** + vanilla JavaScript. No React, Vue, or build-framework lock-in in the output.

It's an [Agent Skill](https://docs.claude.com/en/docs/claude-code/skills), packaged as a plugin so it can be installed with one command and invoked with `/figma-to-frontend:convert`, or picked up automatically when you ask Claude to "convert this Figma design" / "build this page from Figma" / similar.

## What it does

Given a Figma URL, file key, or node ID, the skill runs a 7-step workflow:

0. **Decide** framework (Bootstrap default, Tailwind on signal), multi-page mechanism, and language direction (LTR/RTL) up front.
1. **Discover** — pulls the design via Figma's Dev Mode MCP tools (`get_design_context`, `get_variable_defs`, `get_metadata`, `get_screenshot`), and reads Figma annotations/dev resources for behavior intent.
2. **Extract assets** — downloads and locally hosts every image/icon (Figma's asset URLs are temporary — this is a non-negotiable rule, not a suggestion).
3. **Extract design tokens** — colors, spacing, typography, radius, shadow, emitted as a [W3C DTCG-format](https://www.designtokens.org/) `tokens.json` and compiled to CSS variables / Tailwind theme / SCSS via a Style Dictionary script.
4. **Build** — semantic, accessible HTML with the chosen framework, responsive images, RTL-ready logical-property CSS, and only the motion that Figma's annotations/variants actually specify (there is no Figma "motion export" — see [`references/animation-extraction.md`](references/animation-extraction.md) for why the extraction step is honest about this).
5. **Test** (opt-in — only when asked to validate/verify/test the build) — a Playwright spec (`toHaveScreenshot()` visual diffing + `@axe-core/playwright` WCAG 2.2 AA scan + console-error check) verifies the build against the Figma reference screenshot, not just by eye.
6. **Deliver** — folder structure, asset manifest, and a filled-in production-readiness checklist (Core Web Vitals budgets, responsive images, semantic/SEO structure).

## Why this exists

Most "Figma to code" prompts either (a) try to do everything in one giant instruction with no way to manage context on a large project, or (b) quietly assume capabilities that don't actually exist — like extracting animation timing/easing from Figma's MCP tools, which as of this writing simply don't expose that data. This skill is built from verified current tool behavior, not assumption, and says so explicitly wherever a claim needed a caveat (see the reference docs — most of them include a "verify this" note next to anything that could change or wasn't independently confirmed).

## Structure

```
figma-to-frontend/
├── .claude-plugin/
│   ├── plugin.json          # plugin manifest
│   └── marketplace.json     # lets this same repo be added as a marketplace
├── SKILL.md                 # the 7-step orchestration file
├── references/               # loaded on demand, not all at once (progressive disclosure)
│   ├── figma-mcp-workflow.md
│   ├── design-tokens.md
│   ├── animation-extraction.md
│   ├── multipage-components.md
│   ├── rtl-and-i18n.md
│   ├── css-architecture.md
│   ├── testing-and-qa.md
│   ├── production-checklist.md
│   ├── gotchas.md
│   └── frameworks/
│       ├── bootstrap.md
│       └── tailwind.md
├── scripts/
│   ├── build-tokens.mjs       # Style Dictionary token build
│   └── visual-check.spec.ts   # Playwright + axe-core test spec
└── README.md
```

Reference docs are only loaded when the relevant step is reached, not all up front — this keeps the skill's context footprint proportional to the size of the actual job.

## Prerequisites

- **Claude Code**, with the [Figma Dev Mode MCP Server](https://developers.figma.com/docs/figma-mcp-server/) connected (desktop server needs a Dev/Full Figma seat; the remote server works on any plan but needs a frame/layer link rather than an in-app selection).
- **Node.js**, if you use the token-build and visual-test scripts (`style-dictionary`, `@playwright/test`, `@axe-core/playwright` — see the comments at the top of each script for install commands).
- Optional: **Playwright MCP** connected, for an interactive alternative to the scripted test spec.

## Install

**Quick local test** (no install, just point Claude Code at the folder):
```bash
git clone https://github.com/bilalmehrban/figma-to-frontend.git
claude --plugin-dir ./figma-to-frontend
```
Then try `/figma-to-frontend:convert` inside the session, or just ask Claude to convert a Figma link — the skill also triggers automatically based on its description.

**Personal, permanent install** (no marketplace needed):
```bash
cp -r figma-to-frontend ~/.claude/skills/figma-to-frontend
```
Claude Code auto-loads any folder under a skills directory that contains a `.claude-plugin/plugin.json` — on your next session it loads as `figma-to-frontend@skills-dir`, no install step.

**Install from GitHub as a proper plugin** (once pushed):
```
/plugin marketplace add bilalmehrban/figma-to-frontend
/plugin install figma-to-frontend@figma-to-frontend-marketplace
```
This repo ships its own `.claude-plugin/marketplace.json` pointing at itself (`"source": "."`), so it can act as a single-plugin marketplace without a separate catalog repo. This self-referencing pattern is supported in recent Claude Code releases — if `/plugin install` can't find it, update Claude Code first (`claude --debug` will show marketplace/plugin load messages if something's off) before assuming the repo structure is wrong.

## Caveats

- Figma's Dev Mode MCP Server is a free beta and actively changing — re-check [`references/figma-mcp-workflow.md`](references/figma-mcp-workflow.md)'s tool list periodically rather than assuming it's permanently accurate.
- Automated visual diffing and `axe-core` both catch real regressions but aren't a substitute for human review, especially for RTL/Arabic typesetting and genuine accessibility sign-off.
- Core Web Vitals are field metrics; a clean local test run doesn't guarantee real-world numbers once a build is live, especially after CMS integration adds its own scripts/overhead.

## License

MIT — see [LICENSE](LICENSE).
