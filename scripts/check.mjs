import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

const requiredFiles = [
  "index.html",
  "src/js/graph-engine.js",
  "src/js/app-state.js",
  "src/js/app-render.js",
  "src/js/app.js",
  "src/styles/styles.css"
];

let failed = false;

for (const file of requiredFiles) {
  if (!existsSync(file)) {
    console.error(`Missing required file: ${file}`);
    failed = true;
  }
}

const jsFiles = requiredFiles.filter((file) => file.endsWith(".js"));
for (const file of jsFiles) {
  const result = spawnSync(process.execPath, ["--check", file], { stdio: "inherit" });
  if (result.status !== 0) {
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}

console.log("StudyGraph checks passed.");
