import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, join, relative } from "node:path";
import ts from "typescript";
import type { ContractDef, EndpointDef, GalaxyGraphDataset, ServiceDef, TestDef, TopicDef } from "@galaxy-graph/core";
import { jsdocOf, narrativeFromDoc, semanticTagsFromDoc } from "./jsdoc.js";
import { buildMutationData, readStrykerReport } from "./stryker.js";

export interface EncoreAdapterOptions {
  backendDir?: string;
  mutationReport?: string;
}

function backendRoot(rootDir: string, opts: EncoreAdapterOptions = {}): string {
  return join(rootDir, opts.backendDir ?? "backend/systems");
}

function readEncoreServiceName(serviceFile: string): string {
  const src = readFileSync(serviceFile, "utf8");
  return src.match(/new\s+Service\s*\(\s*["']([^"']+)["']/)?.[1] ?? basename(dirname(serviceFile));
}

function discoverEncoreServiceDirs(rootDir: string, opts: EncoreAdapterOptions = {}): Map<string, { svc: string; dir: string }> {
  const map = new Map<string, { svc: string; dir: string }>();
  for (const f of walk(backendRoot(rootDir, opts))) {
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
    if (entry.startsWith(".") || entry === "node_modules" || entry === "migrations" || entry === "dist") continue;
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (entry.endsWith(".ts")) out.push(p);
  }
  return out;
}

function parseFileNarrative(path: string) {
  const sf = ts.createSourceFile(path, readFileSync(path, "utf8"), ts.ScriptTarget.Latest, true);
  for (const stmt of sf.statements) {
    const n = narrativeFromDoc(jsdocOf(stmt));
    if (n) return n;
  }
  return undefined;
}

function stringArray(src: string, key: string): string[] {
  const match = src.match(new RegExp(`${key}\\s*:\\s*\\[([^\\]]*)\\]`, "m"));
  if (!match) return [];
  return [...match[1].matchAll(/["']([^"']+)["']/g)].map((m) => m[1]);
}

function stringProp(src: string, key: string): string | undefined {
  return src.match(new RegExp(`${key}\\s*:\\s*["']([^"']+)["']`))?.[1];
}

function boolSignal(src: string, key: string): boolean | undefined {
  const hit = src.match(new RegExp(`${key}\\s*:\\s*(true|false)`))?.[1];
  return hit ? hit === "true" : undefined;
}

export function discoverEncoreServices(rootDir: string, opts: EncoreAdapterOptions = {}): ServiceDef[] {
  const services: ServiceDef[] = [];
  for (const { svc, dir } of discoverEncoreServiceDirs(rootDir, opts).values()) {
    const candidates = [join(dir, `${svc}.ts`), join(dir, `${basename(dir)}.ts`), ...walk(dir).filter((f) => basename(f) !== "encore.service.ts" && !f.endsWith(".test.ts"))];
    const entry = candidates.find((f) => existsSync(f)) ?? join(dir, `${svc}.ts`);
    const narrative = existsSync(entry) ? parseFileNarrative(entry) : undefined;
    services.push({ id: `svc:${svc}`, svc, file: relative(join(rootDir, "backend"), entry), ...(narrative ? { narrative } : {}) });
  }
  return services;
}

export function parseEncoreEndpoints(rootDir: string, opts: EncoreAdapterOptions = {}): EndpointDef[] {
  const serviceDirs = discoverEncoreServiceDirs(rootDir, opts);
  const endpoints: EndpointDef[] = [];
  for (const f of walk(backendRoot(rootDir, opts))) {
    if (f.endsWith(".test.ts") || f.includes(`${dirname(f)}/_contracts/`)) continue;
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
  return walk(eventsDir).filter((f) => !f.endsWith(".test.ts")).map((f) => {
    const src = readFileSync(f, "utf8");
    const topic = src.match(/new\s+Topic<[^>]*>\s*\(\s*["']([^"']+)["']/)?.[1] ?? basename(f, ".ts");
    const narrative = parseFileNarrative(f);
    return { topic, file: relative(rootDir, f), ...(narrative ? { narrative } : {}) };
  });
}

export function parseEncoreContractTests(rootDir: string, opts: EncoreAdapterOptions = {}): TestDef[] {
  const tests: TestDef[] = [];
  for (const f of walk(backendRoot(rootDir, opts)).filter((p) => p.endsWith(".test.ts") || p.includes(".contract."))) {
    const src = readFileSync(f, "utf8");
    const sf = ts.createSourceFile(f, src, ts.ScriptTarget.Latest, true);
    sf.forEachChild((node) => {
      const expr = ts.isExpressionStatement(node) ? node.expression : node;
      if (!ts.isCallExpression(expr) || !ts.isIdentifier(expr.expression) || !["test", "it"].includes(expr.expression.text)) return;
      const doc = semanticTagsFromDoc(jsdocOf(node));
      const name = expr.arguments[0]?.getText(sf).replace(/^['"]|['"]$/g, "") ?? basename(f);
      const endpoints = stringArray(expr.getText(sf), "endpoints");
      tests.push({ id: `test:${relative(rootDir, f)}:${tests.length + 1}`, svc: endpoints[0]?.split(":")[0] ?? basename(dirname(f)), name, http: /supertest|fetch\(|api\(/.test(src), endpoints, ...(doc?.story ? { story: doc.story } : {}), ...(doc?.category ? { category: doc.category } : {}) });
    });
  }
  return tests;
}

export function parseEncoreContracts(rootDir: string, opts: EncoreAdapterOptions = {}): ContractDef[] {
  const contracts: ContractDef[] = [];
  for (const f of walk(join(backendRoot(rootDir, opts), "_contracts"))) {
    if (!f.endsWith(".ts") || f.endsWith(".test.ts")) continue;
    const src = readFileSync(f, "utf8");
    const sf = ts.createSourceFile(f, src, ts.ScriptTarget.Latest, true);
    const narrative = parseFileNarrative(f);
    const producer = stringProp(src, "producer") ?? "unknown-producer";
    const consumer = stringProp(src, "consumer") ?? "unknown-consumer";
    const mode = (stringProp(src, "mode") as ContractDef["mode"]) ?? (stringProp(src, "topic") ? "event-bus" : "direct-call");
    const topic = stringProp(src, "topic");
    contracts.push({
      id: stringProp(src, "id") ?? `contract:${basename(f, ".ts")}`,
      file: relative(rootDir, f),
      describe: stringProp(src, "describe") ?? title(basename(f, ".ts")),
      producer, consumer, mode, ...(topic ? { topic } : {}), ...(narrative ? { narrative } : {}),
      producerFns: stringArray(src, "producerFns"), consumerFns: stringArray(src, "consumerFns"),
      tests: [...src.matchAll(/test\s*\(\s*["']([^"']+)["']/g)].map((m) => ({ name: m[1] })),
      signals: { idempotent: boolSignal(src, "idempotent"), auditLogged: boolSignal(src, "auditLogged") },
    });
  }
  return contracts;
}

export function endpointMutationMap(rootDir: string, opts: EncoreAdapterOptions = {}): Record<string, Array<{ key: string; svc: string; fnName: string }>> {
  const out: Record<string, Array<{ key: string; svc: string; fnName: string }>> = {};
  const serviceDirs = discoverEncoreServiceDirs(rootDir, opts);
  for (const f of walk(backendRoot(rootDir, opts))) {
    const src = readFileSync(f, "utf8");
    if (!src.includes("api(")) continue;
    const svc = serviceForFile(f, serviceDirs);
    const rel = relative(rootDir, f);
    out[rel] = parseEncoreEndpoints(rootDir, opts).filter((ep) => ep.svc === svc).map((ep) => ({ key: `${ep.svc}:${ep.fnName}`, svc: ep.svc, fnName: ep.fnName }));
  }
  return out;
}

export async function generateEncoreDataset(rootDir: string, opts: EncoreAdapterOptions = {}): Promise<GalaxyGraphDataset> {
  const services = discoverEncoreServices(rootDir, opts);
  const endpoints = parseEncoreEndpoints(rootDir, opts);
  const topics = parseEncoreTopics(rootDir);
  const contracts = parseEncoreContracts(rootDir, opts);
  const tests = parseEncoreContractTests(rootDir, opts);
  const mutationReport = join(rootDir, opts.mutationReport ?? "reports/mutation/mutation.json");
  const mutation = existsSync(mutationReport)
    ? buildMutationData(await readStrykerReport(mutationReport), { endpointsByFile: endpointMutationMap(rootDir, opts) })
    : { aggregate: { killed: 0, survived: 0, total: 0, score: 0 }, services: {}, endpoints: {} };
  return { services, endpoints, tests, contracts, topics, mutation };
}
