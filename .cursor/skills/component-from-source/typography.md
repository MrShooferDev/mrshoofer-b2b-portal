# Persian / Arabic typography

Mandatory for every component. The sizes are the project's compact scale, taken from the existing components (Tabs, NumberStepper, ActionListBox, SegmentExpand, MultiAutocomplete, CtaBanner). Do not enlarge text to HIG body sizes (17px); keep every new component on this scale so the page stays consistent.

## Type scale

Use these tokens only; do not invent in-between sizes.

| Role | Size / line height | Family | Seen in |
|---|---|---|---|
| Hero title | 28px / 1.45, 34px / 1.4 on wide containers | `font-bold` | CtaBanner title |
| Hero description | 17px / 1.8 | `font-regular` | CtaBanner description (hero blocks only) |
| Hero button / proof | 15px / 1.5 (proof 1.6) | `font-demi-bold` / `font-regular` | CtaBanner |
| Component base | 16px / 24px | `font-regular` | Root of Tabs, Stepper, ListBox |
| Heading (dialog, drawer, card) | 16px / 24px | `font-demi-bold` | Drawer heading |
| Label / item / button | 14px / 20px | `font-medium` | ListBox label, Drawer buttons, Stepper value (`font-demi-bold`) |
| Body text in panels | 14px / 20px | `font-regular` | Drawer body |
| Input, option, placeholder | 14px / 1.5 | `font-regular` | MultiAutocomplete |
| Compact label (tabs, segments, form label) | 13px / 20px or 1.5 | `font-demi-bold` / `font-medium` | Tabs, SegmentExpand, field label |
| Caption / description / section header | 12px / 16px | `font-regular` / `font-medium` | ListBox description and header, chips |

Declare the tokens you use as variables on the component root, e.g. `--ca-text: 14px; --ca-text-lh: 20px;`.

## Fonts

- IRANSansX weights are separate **font-family names, not classes**: `font-regular`, `font-medium`, `font-demi-bold`, `font-bold`. Declare `--ca-font: font-regular, Tahoma, system-ui, sans-serif;` (and the other weights) on the root and set `font-family` in CSS.
- Each family is registered at normal weight, so pair it with `font-weight: normal`. Copying `font-weight: 600/700` from the source makes the browser synthesise a fake bold on top.
- `<button>`, `<input>`, `<select>`, `<textarea>` do not inherit fonts: give each an explicit `font-family` or `font: inherit`. Portalled content (dialogs, drawers, popovers) sits outside the component root, so declare the font variables on the portal root too.

## Script rules

- `letter-spacing: 0` always. Tracking breaks the cursive joins between letters. Never convert Tailwind `tracking-*` utilities; drop them.
- No `font-style: italic`, no `text-transform`. Emphasis = heavier IRANSansX family or colour.
- No weight below `font-regular`.
- `text-align: start`, never `justify`.
- Titles: `text-wrap: balance`; paragraphs: `text-wrap: pretty`.
- Contrast: text >= 4.5:1, large titles >= 3:1.

## Mixed content

- Latin words, emails, codes, URLs inside Persian: wrap in `<bdi>` or a span with `unicode-bidi: isolate`.
- Digits: Persian shapes via `font-feature-settings: "ss02"`; libraries that parse numbers need `numberingSystem: "latn"` internally.
- Persian punctuation `،` `؛` `؟` `«»`; ZWNJ (`\u200c`) inside words like `می‌شود`, `ایمیل‌ها`.

## Layout tied to type

- Touch targets >= 44px where possible; a smaller visual control gets an invisible `::before` hit area.
- Spacing on the 8pt grid (4px allowed inside dense controls).
- Clamp multi-line text with `-webkit-line-clamp`, never with a fixed height.
