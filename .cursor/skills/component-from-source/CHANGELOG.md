# Changelog: component-from-source

## v0.0.2 (2026-09-30)

- Added `typography.md`: mandatory Persian/Arabic type scale based on the project's existing components (base 16px / 24px, labels and buttons 14px / 20px, compact labels 13px, captions 12px / 16px, headings 16px / 24px demi-bold, hero titles 28-34px). Text must never be enlarged beyond it.
- Fonts: IRANSansX weights are font-family names, not classes; always pair with `font-weight: normal` (no fake bold). Buttons, inputs and portalled content (drawers, dialogs) need explicit font declarations.
- Script rules: `letter-spacing: 0`, no italics, no `text-transform`, no `justify`; isolation of Latin runs; Persian punctuation and ZWNJ.
- RTL indicators: when items change width on selection, compute the settled offset from the inline-start edge and translate by direction instead of measuring `offsetLeft` mid-transition.
- `typography.md` does not count toward the 3-file budget.

## v0.0.1

- Initial skill: budget mode, extraction script (`extract_component.py`), project conventions (`ca-` BEM, RTL logical properties, Persian labels, reduced motion), mounting on the Create Account page, `build.sh`, licensing note.
