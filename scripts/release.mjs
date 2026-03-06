#!/usr/bin/env node
/**
 * Release script: bump version, build, and publish to npm.
 *
 * Usage:
 *   node scripts/release.mjs patch   # 0.0.1 -> 0.0.2
 *   node scripts/release.mjs minor   # 0.0.1 -> 0.1.0
 *   node scripts/release.mjs major   # 0.0.1 -> 1.0.0
 *
 * Requires: npm login or NODE_AUTH_TOKEN for npm registry
 */

import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const bump = process.argv[2];

if (!bump || !["patch", "minor", "major"].includes(bump)) {
  console.error("Usage: node scripts/release.mjs <patch|minor|major>");
  process.exit(1);
}

const root = join(__dirname, "..");
const pkgPath = join(root, "package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
const [major, minor, patchVer] = pkg.version.split(".").map(Number);

let next;
if (bump === "major") next = `${major + 1}.0.0`;
else if (bump === "minor") next = `${major}.${minor + 1}.0`;
else next = `${major}.${minor}.${patchVer + 1}`;

console.log(`Bumping ${pkg.version} -> ${next}`);
pkg.version = next;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

execSync("npm run build", { cwd: root, stdio: "inherit" });
execSync("npm publish --access public", { cwd: root, stdio: "inherit" });

console.log(`\nPublished @trymithril/sdk@${next}`);
