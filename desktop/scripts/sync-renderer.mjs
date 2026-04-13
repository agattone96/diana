import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..");
const sourceDir = path.join(repoRoot, "frontend", "dist");
const destDir = path.join(repoRoot, "desktop", "renderer-dist");

if (!fs.existsSync(sourceDir)) {
  throw new Error(
    `Missing ${sourceDir}. Build the Expo web export first (cd frontend && npx expo export --platform web).`
  );
}

fs.rmSync(destDir, { recursive: true, force: true });
fs.mkdirSync(destDir, { recursive: true });
fs.cpSync(sourceDir, destDir, { recursive: true });

const indexPath = path.join(destDir, "index.html");
if (!fs.existsSync(indexPath)) {
  throw new Error(`Expected ${indexPath} to exist after sync.`);
}

console.log(`Synced renderer from ${sourceDir} -> ${destDir}`);

