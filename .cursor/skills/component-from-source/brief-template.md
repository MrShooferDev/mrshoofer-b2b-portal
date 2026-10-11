# Brief: <component or change>

Project root (quote it, the parent folder name ends with a space):
`/Users/sadra/Desktop/repos/Shoofer Agencies and Componies panel /MrShoofer-enterprise-selling`

Follow the conventions in `.cursor/skills/component-from-source/SKILL.md` sections 3 and 4.

## Source
<extracted compiled code saved to a file path, or pasted source, or a screenshot path>

## Build
- Files: `react-components/<Name>/<Name>.tsx`, `<Name>.css`; mount in `create-account.tsx`, `Index.cshtml`, `wwwroot/css/create-account-card.css`
- Props (starting state): <...>
- Callback + page event: <onX -> ca-<name>:<event> with detail {...}>
- Persian copy: <labels>
- Changes from the original: <...>

## Exact values
<selectors + values, or "copy verbatim from the source">

## Do not touch
<...>

## Finish
Run `.cursor/skills/component-from-source/scripts/build.sh` (prints OK or the errors). Do not start the .NET app or open a browser.
Return: changed files, one line each, and the build line.
