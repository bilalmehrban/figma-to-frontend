# Gotchas & Lessons Learned

Compiled from real Figma→code conversions across multiple projects. Read once before starting; keep in mind throughout.

## There is no Figma motion/prototype export — don't build a step around one

`get_design_context` and every other Figma MCP tool return static visual/structural data only. There is no `get_motion_context` or equivalent, confirmed against Figma's own documentation. Behavioral/motion intent has to come from annotations, dev resources, or explicit variant states — never assume a tool call will return transition timing or easing. See [animation-extraction.md](animation-extraction.md).

## Figma asset URLs are temporary — always download and rewrite

Covered as a mandatory rule in the main SKILL.md, repeating here because it's the single most common way this workflow silently breaks: a page that looks perfect at delivery time can start showing broken images days later if a live Figma asset URL slipped through instead of a locally hosted copy.

## Generic HTTP fetch tools may not reach Figma's asset CDN in a sandboxed environment

In a network-restricted environment (e.g. this chat interface's sandbox), a generic fetch tool may not be able to reach `figma.com/api/mcp/asset/...` URLs at all, which previously required an image-rendering workaround using locally generated placeholder images. This restriction is specific to sandboxed environments without outbound network access — it does not necessarily apply in a full local dev environment like Claude Code, which typically has real network access. Either way, the fix is the same: use `download_assets` (a first-party Figma MCP call) rather than a generic fetch, and don't assume the sandboxed limitation applies everywhere.

## `get_design_context` defaults to React + Tailwind

Figma's docs are explicit that this is the format Figma optimizes for LLM consumption by default. For a plain HTML/CSS or Bootstrap deliverable, state the target format explicitly in the prompt to the tool rather than assuming it'll hand back what this skill needs.

## Code Connect needs edit permission on the library file, not just a seat

A Dev or Full Figma seat is necessary but not sufficient to publish Code Connect mappings — edit permission on the specific library file is also required. Read-only access blocks publishing even with the right seat. This doesn't block using `get_design_context` itself, which works fine on read-only access — it only blocks setting up new Code Connect mappings.

## Auth errors on the first Figma call are a permissions problem, not a syntax problem

If `get_design_context` (or any Figma MCP tool) fails on the first attempt, reconnecting the Figma connector is almost always the fix — don't spend time adjusting `fileKey`/`nodeId` formatting first.

## Custom fonts get lost if not explicitly tracked

A brand-specific or non-Latin font used in a Figma design (e.g. Vazirmatn for Arabic text) can be present in the design spec but absent from a generated snippet if it's not explicitly called out and wired in (self-hosted font files, or a Google Fonts/other CDN link). Always list every font the design uses and confirm each one is either a system font, a common web font, or explicitly flagged as needing separate integration.

## Fidelity over novelty when cloning an existing design

If the `frontend-design` skill is also loaded, its guidance toward distinctive/non-templated visual choices doesn't apply to a faithful recreation task — match what's in the Figma file, don't "improve" on it.

## Bootstrap and Tailwind breakpoints are different numbers

Don't carry a breakpoint table from one framework's doc over to a build using the other. See the breakpoint tables in `frameworks/bootstrap.md` and `frameworks/tailwind.md`.

## Tailwind: rebuild before assuming a class is broken

A JIT caching quirk has been observed dropping arbitrary-value classes (`gap-[19px]`, `bg-[#008aab]`) from the compiled CSS on the very first build. A second build after that resolved it. If a class isn't showing up in rendered output on a first build, rebuild once before debugging the class syntax itself.
