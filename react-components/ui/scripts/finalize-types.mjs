import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = "dist/types";

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path);
    else if (path.endsWith(".d.ts")) {
      const source = readFileSync(path, "utf8");
      const stripped = source.replace(/^import "\.\/[^"]+\.css";\r?\n/gm, "");
      if (stripped !== source) writeFileSync(path, stripped);
    }
  }
}

walk(root);
writeFileSync(join(root, "css.d.ts"), "export {};\n");
