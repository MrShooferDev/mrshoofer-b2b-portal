---
name: component-from-source
description: Turns a UI component from a URL (reui, HeroUI, shadcn or any Next.js/bundled site), pasted source, DOM path, screenshot or Builder.io JSON into a React component mounted on the Razor Create Account page, with Persian RTL text and IRANSansX. Extracts the exact compiled code from the site's JS chunks instead of guessing. Use when the user sends a component link, Builder.io JSON, a DOM element, or asks to "implement/convert/place this component".
version: 0.0.2
---

# Component from source (v0.0.2)

Changes per version: [CHANGELOG.md](CHANGELOG.md). Bump `version` there and here on every skill change.

Goal: exact look and behaviour of the original, converted to this project's conventions, at the lowest token cost.

## Budget mode (default, overrides everything below)

Leave budget mode only when the user writes "verify" or "full".

1. **Do the work yourself.** No subagents: the user already picked a cheap model for the chat, and delegating re-sends context twice.
2. **Read at most 3 files:** `create-account.tsx`, one similar component, and `Index.cshtml` (grep for `data-ca-` instead of reading the whole file). Do not explore the repo.
3. **One pass:** write every file, run `scripts/build.sh` once, and fix only reported errors.
4. **No browser, no screenshots, no app start/restart.** If the user reports the app is down, tell them to run `dotnet run --urls http://localhost:5055` themselves.
5. **Build exactly what was asked.** No extra features, polish or refactors. Mention a possible improvement in one line instead of implementing it.
6. **Small tweaks** (sizes, colors, text): edit, build, done. No re-reading and no checks.
7. **Final reply of at most 5 lines:** what was added, the event name, the files. No cost reports or tables unless asked.

## 1. Pick the input path (cheapest complete source first)

| User gives | Do |
|---|---|
| Source files (`.tsx`/`.css`) or a licence/registry key | Convert directly. Skip step 2. |
| Demo/preview URL | Step 2 with the script. |
| Full page URL + visible text / DOM path | Step 2, using that text as `--find`. |
| Screenshot, Figma, Builder.io JSON | No code to extract. Build from the visual; ask for a one-line behaviour description if motion is unclear. Builder.io JSON never contains JS behaviour (animations, WebGL, handlers). |

If a Builder.io export comes from a public site, prefer extracting from that site's URL: the compiled module is ~5x smaller than the JSON and includes behaviour.

## 2. Extract compiled code (script, do not hand-search chunks)

```bash
S=".cursor/skills/component-from-source/scripts/extract_component.py"
python3 "$S" URL --find "Visible Label" --find "OtherLabel"   # locate module(s)
python3 "$S" URL --module 501803 --deps                        # print module + small deps
python3 "$S" URL --label cta-12/                               # sites that label modules by file path (reui)
python3 "$S" URL --css segment__                               # CSS rules for a class prefix
```

- Run from the repo root; needs network permission. Output is cached in `$TMPDIR/component-extract-cache`, so re-runs are instant.
- `--find` strings: exact visible labels in quotes (`'"Meetings"'`), shader uniform names, or distinctive class names. Pick 2 so one module matches.
- The header lists exported client components (e.g. `IconExpand`) and whether the page is client-rendered. Both confirm the code ships to the browser.
- Deps over 20 KB are skipped (libraries like React Aria). Replace them with plain React; do not port library internals.
- If nothing matches, the chunk loads lazily: open the page in the browser, copy JS URLs from `performance.getEntriesByType('resource')` into a file, pass `--browser-chunks file.txt`.

Keep verbatim from the compiled code: class/Tailwind values, CSS rules, keyframes and timings, shader source, SVG paths/masks, image URLs, magic numbers. Rename minified identifiers to meaningful names.

## 3. Convert to project conventions

Location: `react-components/<Name>/<Name>.tsx` + `<Name>.css`.

- Props set the starting state (`defaultValue`, `defaultFocusedKey`, ...); support controlled `value` where it makes sense.
- Every interaction exposes a callback prop (`onValueChange`, `onAction`), bridged to a bubbling `CustomEvent` named `ca-<name>:<event>` in `create-account.tsx`.
- CSS: `ca-` BEM classes, variables on the root; convert Tailwind utilities to plain CSS.
- RTL: logical properties only (`margin-inline-start`, `inset-inline-end`). Exception: an indicator positioned from `offsetLeft`/`offsetTop` must be anchored with physical `left: 0; top: 0`, because those measurements are physical (`inset-inline-start` puts it on the right in RTL). If the items change width when selected (expanding labels), do not measure `offsetLeft` after the change: the RTL group resizes and the indicator chases a mid-transition layout. Compute the settled offset from the inline-start edge instead (padding + preceding collapsed widths + gaps), anchor with `inset-inline-start: 0`, and translate by `offset * (rtl ? -1 : 1)` so it slides straight left/right. Never put `direction: ltr` on an element that uses inline margins; wrap LTR runs (shortcuts, numbers) in an inner span instead. RTL-aware arrow keys.
- Persian text for all labels. IRANSansX weights are **font-family names, not classes**: declare `--ca-font: font-regular, Tahoma, system-ui, sans-serif;` (and `font-medium`, `font-demi-bold`, `font-bold` variants) on the root and set `font-family` + `font-weight: normal` in CSS. Never put `font-medium` etc. in `className` (no such class exists). `<button>`, `<input>`, `<select>`, `<textarea>` do not inherit fonts: give each an explicit `font-family` or `font: inherit`. Portalled content (dialogs, drawers, popovers) sits outside the component root, so declare the font variables on the portal root too.
- **Typography is mandatory: always read [typography.md](typography.md)** (the project's compact Persian scale). Map every text element of the source to a role from its table. Core: component base 16px / 24px, labels and buttons 14px / 20px, compact labels 13px, captions 12px / 16px, headings 16px / 24px demi-bold; hero titles only 28-34px. Never enlarge text beyond this scale. `letter-spacing: 0`, no italics, no `justify`. It does not count toward the 3-file budget.
- Focus rings only via `:focus-visible` (or `:has(:focus-visible)`), never `:focus`/`:focus-within`, or users see a ring on click.
- Clipping containers: `overflow: hidden; overflow: clip;` so `scrollIntoView`/focus cannot scroll them.
- Honour `prefers-reduced-motion` (disable animations; skip WebGL loops).
- Digits: libraries that parse numbers (NumberFlow) need `numberingSystem: "latn"`; show Persian shapes with `font-feature-settings: "ss02"`.
- Minimal comments; match surrounding code.

## 4. Mount on the page

1. `Areas/AgencyArea/Views/CreateAccount/Index.cshtml`: add `<div class="ca-<name>-mount" data-ca-<name> data-...>`; initial values from query/model via `data-*`.
2. `wwwroot/css/create-account-card.css`: `.ca-<name>-mount { min-height: ... }` equal to the smallest rendered height, to avoid layout shift without leaving a gap.
3. `react-components/create-account.tsx`: read `mount.dataset`, `createRoot`, dispatch the `CustomEvent`s.

## 5. Build and verify

```bash
.cursor/skills/component-from-source/scripts/build.sh   # prints one OK line, or only the errors
```

- Never run the build in the same parallel batch as the edits it depends on (stale bundle).
- Output `wwwroot/js/react/create-account.{js,css}` must be committed (deploy does not run npm).
- The app is already running at `http://localhost:5055/CreateAccount`; do not start another instance.
- Only in "verify"/"full" mode: one browser pass, computed styles via `Runtime.evaluate` first, one screenshot last. WebGL canvases read back blank without `preserveDrawingBuffer`; compare two screenshots instead.

## Cost rules

- One component per chat; this skill replaces repeating the conventions. Context size multiplies every step's cost, so a long chat makes even small tasks expensive.
- Put every tweak in the first message; batch edits, then build once.
- Delegation is only worth it when an expensive model runs the chat: then fill [brief-template.md](brief-template.md), save it under `$TMPDIR`, and pass a one-line prompt with its path (long inline Task prompts fail JSON parsing). Save extracted code to a file instead of pasting it.
- Escalate to a stronger model only when the build fails or the result is visibly wrong after one attempt.

## Licensing

Compiled code is readable, not free to reuse. Paid blocks (reui Pro, HeroUI Pro) need a licence for commercial use; otherwise rebuild the idea without copying their code. Tell the user when the source is a paid component.
