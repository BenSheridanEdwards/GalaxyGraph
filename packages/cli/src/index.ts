#!/usr/bin/env node
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { generateEncoreDataset } from "@galaxy-graph/adapters";

function usage(): never {
  console.error(`Usage:
  galaxy-graph generate --adapter encore --root <repo> --out <graph.json>

Current adapters:
  encore   Encore.dev TypeScript services + optional Stryker report
`);
  process.exit(1);
}

const args = process.argv.slice(2);
const command = args.shift();
if (command !== "generate") usage();

const get = (flag: string) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
};

const adapter = get("--adapter") ?? "encore";
const root = resolve(get("--root") ?? process.cwd());
const out = resolve(get("--out") ?? "galaxy-graph.json");

if (adapter !== "encore") {
  console.error(`Unsupported adapter: ${adapter}`);
  usage();
}

const dataset = await generateEncoreDataset(root);
await writeFile(out, JSON.stringify(dataset, null, 2) + "\n");
console.log(`Wrote ${out}`);
console.log(`${dataset.services.length} services, ${dataset.endpoints.length} endpoints, ${dataset.topics.length} topics`);
