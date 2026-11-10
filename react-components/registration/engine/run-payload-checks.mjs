// Usage (from react-components): node registration/engine/run-payload-checks.mjs
// Runs the engine tests with Node's built-in TypeScript type stripping.
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const dir = path.dirname(fileURLToPath(import.meta.url));
const res = spawnSync(
  process.execPath,
  ["--experimental-strip-types", "--no-warnings", "--test", path.join(dir, "payload.test.ts")],
  { stdio: "inherit" },
);
process.exit(res.status ?? 1);
