import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, join, relative } from "node:path";
import ts from "typescript";
import type { EndpointDef, GalaxyGraphDataset, ServiceDef, TopicDef } from "@galaxy-graph/core";
import { jsdocOf, narrativeFromDoc } from "./jsdoc.js";
import { buildMutationData, readStrykerReport } from "./stryker.js";

export interface EncoreAdapterOptions {
  backendDir?: string;
  mutationReport?: string;
}


function readEncoreServiceName(serviceFile: string): string {
  const src = readFileSync(serviceFile, "utf8");
  return src.match(/new\s+Service\s*\(\s*["']([^"']+)["']/)?.[1] ?? basename(dirname(serviceFile));
}

function discoverEncoreServiceDirs(rootDir: string, opts: EncoreAdapterOptions = {}): Map<string, { svc: string; dir: string }> {
  const backendDir = join(rootDir, opts.backendDir ?? "backend/systems");
  const map = new Map<string, { svc: string; dir: string }>();
  for (const f of walk(backendDir)) {
    if (basename(f) !== "encore.service.ts") continue;
    const dir = dirname(f);
    map.set(dir, { svc: readEncoreServiceName(f), dir });
  }
  return map;
}

function serviceForFile(file: string, dirs: Map<string, { svc: string; dir: string }>): string {
  let cur = dirname(file);
  while (cur && cur !== dirname(cur)) {
    const hit = dirs.get(cur);
    if (hit) return hit.svc;
    cur = dirname(cur);
  }
  return basename(dirname(file));
}

function title(id: string): string {
  return id.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/^./, c => c.toUpperCase());
}

function walk(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    if (entry.startsWith(".") || entry === "node_modules" || entry === "migrations") continue;
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (entry.endsWith(".ts") && !entry.endsWith(".test.ts")) out.push(p);
  }
  return out;
}

export function discoverEncoreServices(rootDir: string, opts: EncoreAdapterOptions = {}): ServiceDef[] {
  const services: ServiceDef[] = [];
  for (const { svc, dir } of discoverEncoreServiceDirs(rootDir, opts).values()) {
    const candidates = [join(dir, `${svc}.ts`), join(dir, `${basename(dir)}.ts`), ...walk(dir).filter((f) => basename(f) !== "encore.service.ts")];
    const entry = candidates.find((f) => existsSync(f)) ?? join(dir, `${svc}.ts`);
    const narrative = existsSync(entry) ? parseFileNarrative(entry) : undefined;
    services.push({ id: `svc:${svc}`, svc, file: relative(join(rootDir, "backend"), entry), ...(narrative ? { narrative } : {}) });
  }
  return services;
}

function parseFileNarrative(path: string) {
  const sf = ts.createSourceFile(path, readFileSync(path, "utf8"), ts.ScriptTarget.Latest, true);
  for (const stmt of sf.statements) {
    const n = narrativeFromDoc(jsdocOf(stmt));
    if (n) return n;
  }
  return undefined;
}

export function parseEncoreEndpoints(rootDir: string, opts: EncoreAdapterOptions = {}): EndpointDef[] {
  const backendRoot = join(rootDir, opts.backendDir ?? "backend/systems");
  const serviceDirs = discoverEncoreServiceDirs(rootDir, opts);
  const endpoints: EndpointDef[] = [];
  for (const f of walk(backendRoot)) {
    const src = readFileSync(f, "utf8");
    if (!src.includes("api(")) continue;
    const svc = serviceForFile(f, serviceDirs);
    const sf = ts.createSourceFile(f, src, ts.ScriptTarget.Latest, true);
    for (const stmt of sf.statements) {
      if (!ts.isVariableStatement(stmt)) continue;
      if (!stmt.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) continue;
      const decl = stmt.declarationList.declarations[0];
      if (!decl || !ts.isIdentifier(decl.name)) continue;
      const text = decl.initializer?.getText(sf) ?? "";
      if (!text.startsWith("api(")) continue;
      const method = text.match(/method:\s*["']([^"']+)["']/)?.[1] ?? "";
      const path = text.match(/path:\s*["']([^"']+)["']/)?.[1] ?? "";
      const internal = /expose:\s*false/.test(text);
      const narrative = narrativeFromDoc(jsdocOf(stmt));
      endpoints.push({ id: `ep:${svc}:${decl.name.text}`, svc, fnName: decl.name.text, noun: title(decl.name.text), method, path, ...(internal ? { internal } : {}), ...(narrative ? { narrative } : {}) });
    }
  }
  return endpoints;
}

export function parseEncoreTopics(rootDir: string): TopicDef[] {
  const eventsDir = join(rootDir, "backend/events");
  return walk(eventsDir).map((f) => {
    const src = readFileSync(f, "utf8");
    const topic = src.match(/new\s+Topic<[^>]*>\s*\(\s*["']([^"']+)["']/)?.[1] ?? basename(f, ".ts");
    return { topic, file: relative(rootDir, f), ...(parseFileNarrative(f) ? { narrative: parseFileNarrative(f) } : {}) };
  });
}

export async function generateEncoreDataset(rootDir: string, opts: EncoreAdapterOptions = {}): Promise<GalaxyGraphDataset> {
  const services = discoverEncoreServices(rootDir, opts);
  const endpoints = parseEncoreEndpoints(rootDir, opts);
  const topics = parseEncoreTopics(rootDir);
  const mutationReport = join(rootDir, opts.mutationReport ?? "reports/mutation/mutation.json");
  const mutation = existsSync(mutationReport) ? buildMutationData(await readStrykerReport(mutationReport)) : { aggregate: { killed: 0, survived: 0, total: 0, score: 0 }, services: {}, endpoints: {} };
  return { services, endpoints, tests: [], contracts: [], topics, mutation };
}
