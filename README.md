# mrshoofer-b2b-portal

Agency / organization B2B portal (ASP.NET Core, AgencyArea).

## Knowledge base (pages & journeys)

Start here before changing UI flows or adding operations:

| Doc | Use for |
|---|---|
| [docs/README.md](./docs/README.md) | Docs index |
| [docs/agency-pages-and-journeys.md](./docs/agency-pages-and-journeys.md) | Full page/route/operation catalog |
| [docs/visuals/agency-pages-and-journeys.html](./docs/visuals/agency-pages-and-journeys.html) | Flow map (open in browser) |
| [docs/visuals/agency-journeys-sequence.html](./docs/visuals/agency-journeys-sequence.html) | UML sequence diagrams (open in browser) |

Cursor agents load a short pointer from `.cursor/rules/` and open the full catalog only when the task needs page/journey context.

## Deploy

See `.cursor/rules/deploy.mdc` or run `./deploy/show-help.sh`. Preferred: `./deploy.sh`.
