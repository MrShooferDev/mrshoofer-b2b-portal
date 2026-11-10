# Agency portal — knowledge base

Canonical docs for **what pages exist** and **what operations/journeys** users can run in AgencyArea.

Agents and humans should use this instead of rediscovering routes from scratch. Full text stays here so Cursor rules can stay **short** (lower token cost every turn).

## Files

| File | Purpose |
|---|---|
| [agency-pages-and-journeys.md](./agency-pages-and-journeys.md) | Full catalog: nav, pages, operations, happy paths, UX rules |
| [visuals/agency-pages-and-journeys.html](./visuals/agency-pages-and-journeys.html) | **Rendered** flowchart map — open in a browser |
| [visuals/agency-pages-and-journeys.mmd.md](./visuals/agency-pages-and-journeys.mmd.md) | Flowchart Mermaid source |
| [visuals/agency-journeys-sequence.html](./visuals/agency-journeys-sequence.html) | **Rendered** UML sequence diagrams — open in a browser |
| [visuals/agency-journeys-sequence.mmd.md](./visuals/agency-journeys-sequence.mmd.md) | Sequence Mermaid source |

## How to see the visual

Cursor Markdown preview does **not** render Mermaid by default.

1. Open [`visuals/agency-pages-and-journeys.html`](./visuals/agency-pages-and-journeys.html) (flow map) or [`visuals/agency-journeys-sequence.html`](./visuals/agency-journeys-sequence.html) (UML sequences)
2. Open in browser (needs network once for Mermaid CDN)

## How agents should use this

1. Always-on rules (`.cursor/rules/agency-knowledge.mdc`) only **point** here + a tiny route table.
2. Open the catalog when the task is page/journey-related.
3. After changing a journey: update the catalog **and** the flowchart + sequence visual files.

## Related product rules

- `.cursor/rules/agency-ui-stable.mdc` — UI/copy preferences
- `.cursor/rules/agency-journey-scope.mdc` — scoped confirm vs browse
- `.cursor/rules/deploy.mdc` — deploy
