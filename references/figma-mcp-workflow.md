# Figma MCP Workflow

## Parsing the Figma URL

A Figma URL looks like:
```
https://www.figma.com/design/abc123XYZfileKey/Project-Name?node-id=1234-5678&t=...
```

- `fileKey` = the alphanumeric segment after `/design/` → `abc123XYZfileKey`
- `nodeId` = the `node-id` query param, but **convert the dash to a colon**: `1234-5678` → `1234:5678`

Getting the colon conversion wrong is the most common reason a call returns nothing useful — if `get_design_context` fails or returns an unrelated node, re-check this first before assuming a permissions issue.

## Verified current tool set

Figma's Dev Mode MCP Server is a free beta ("will eventually be a usage-based paid feature," per Figma's own docs) and is under active development, so re-check this list periodically. As of this writing, the full tool set is: `add_code_connect_map`, `create_new_file`, `generate_diagram`, `generate_figma_design`, `get_code_connect_map`, `get_code_connect_suggestions`, `get_context_for_code_connect`, `get_design_context`, `get_figjam`, `get_libraries`, `get_metadata`, `get_screenshot`, `get_variable_defs`, `search_design_system`, `send_code_connect_mappings`, `upload_assets`, `use_figma`, `whoami`.

The ones this skill actually uses:

1. **`get_design_context`** — the primary call. Returns design context for a selection/node. **Defaults to a React + Tailwind representation** — this is explicitly the format Figma optimizes for LLM consumption. For a plain HTML/CSS deliverable, say so explicitly in the prompt to this tool (e.g. "generate my Figma selection in plain HTML + CSS"), don't assume it'll default to what this skill needs.
   - If there's no existing codebase to map Figma components onto, pass `disableCodeConnect: true` — nothing for Code Connect to map to, and skipping it avoids a wasted lookup.
2. **`get_variable_defs`** — pulls the file's color/spacing/typography variables. Figma's own docs note this sometimes returns raw values instead of named tokens; if that happens, explicitly prompt "list the variable names and their values used in my Figma selection" rather than accepting unlabeled numbers.
3. **`get_metadata`** — a lightweight layer-ID/name/type/position outline, for when a frame is too large for `get_design_context` to handle in one call. Use it first on large files, then call `get_design_context` on only the specific sub-nodes needed.
4. **`get_screenshot`** — takes a screenshot of the selection. Keep this on; it's the Step 5 visual-diff baseline.
5. **`download_assets`** — extracts image/icon assets. Returns temporary URLs that must be fetched to retrieve actual file contents (both an export render and, where relevant, raw source images) — see "Asset URLs are temporary" below.

## What Figma's MCP tools do NOT return — read this before promising animation fidelity

**There is no motion/prototype/interaction tool.** `get_design_context` captures static visual and structural design only — fills, effects, layout, text, hierarchy. It does not expose prototype connections, triggers, click actions, transition types, durations, easing curves, or Smart Animate data, regardless of how the Figma file is structured. This has been an open, unresolved feature request on Figma's own community forum, not a hidden capability.

**What this means in practice**: don't call any tool expecting motion data back, and don't describe hover/entrance/scroll behavior in delivery notes as "extracted from Figma" unless it came from one of the two channels that actually exist:
- **Annotations** — Figma's own recommended channel for behavior that "is hard to capture from visuals alone, like how something should behave, align, or respond." Read these on every frame before assuming a static design has no specified motion.
- **Dev resources** — links/notes attached to the file, sometimes containing a separate motion spec, video, or Figma prototype link a human needs to open manually.

If neither exists, say so in delivery notes rather than inventing a "probably fades in" behavior. See [animation-extraction.md](animation-extraction.md) for the full extraction and implementation workflow.

## Call sequence summary

1. `get_metadata` (only if the target frame is large enough that `get_design_context` would truncate or time out)
2. `get_design_context` (explicit output-format instruction, `disableCodeConnect: true` for standalone builds)
3. `get_variable_defs`
4. `get_screenshot` (visual baseline)
5. `download_assets` (once the needed nodes are identified)

## Code Connect — when it does and doesn't apply

Code Connect maps Figma components to existing code components, improving codegen accuracy when implementing into an established component library. It requires a Dev or Full Figma seat **and** edit permission on the library file to *publish* mappings. Read-only access is enough to *use* `get_design_context`, but not enough to *publish* new mappings even with the right seat type — if the user has read-only library access, skip Code Connect setup and proceed with a direct design pull.

For a standalone HTML lookalike with no target codebase, Code Connect isn't relevant — go straight to `get_design_context` with `disableCodeConnect: true`.

## Access, seats, and rate limits

- The **desktop server** runs locally and requires selection-based prompting; it needs a Dev or Full Figma seat on a paid plan.
- The **remote server** is available on all seats/plans but requires a frame/layer link rather than an in-app selection.
- Starter/View/Collab seats are capped at a small number of tool calls per month; Dev/Full seats get higher per-minute limits. Budget for this on a large multi-page project — don't assume unlimited calls.

## On errors

If a Figma MCP call fails on the first attempt, it's very likely an authentication/permission issue, not a parameter problem — reconnect the Figma connector before tweaking `fileKey`/`nodeId` syntax.

## Asset URLs are temporary

Everything `get_design_context` and `download_assets` return under `figma.com/api/mcp/asset/...` is a short-lived link, not a permanent resource. See SKILL.md Step 2 for the mandatory download-and-rewrite rule — never reference these URLs in final output.

Note: in a fully sandboxed environment without outbound network access to Figma's asset CDN, fetching these via a generic HTTP tool may fail even before expiry — that's a network restriction, not an expiry issue. `download_assets` is the correct tool either way since it's a first-party Figma MCP call, not a generic fetch.
