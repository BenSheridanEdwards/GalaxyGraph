import { readFile } from "node:fs/promises";
import { basename, dirname } from "node:path";
import type { MutationData, MutationStats } from "@galaxy-graph/core";

const KILLED = new Set(["Killed", "Timeout"]);
const SURVIVED = new Set(["Survived", "NoCoverage"]);

const score = (killed: number, survived: number) =>
  killed + survived ? Number(((100 * killed) / (killed + survived)).toFixed(2)) : 0;

export interface StrykerReportFile { mutants?: Array<any> }
export interface StrykerReport { files: Record<string, StrykerReportFile> }

export async function readStrykerReport(path: string): Promise<StrykerReport> {
  return JSON.parse(await readFile(path, "utf8"));
}

export function serviceKeyFromMutationFile(filePath: string, basenameCounts: Record<string, number>): string {
  const b = basename(filePath, ".ts");
  return basenameCounts[b] === 1 ? b : basename(dirname(filePath));
}

export function buildMutationData(report: StrykerReport): MutationData {
  const files = Object.keys(report.files ?? {});
  const basenameCounts = files.reduce<Record<string, number>>((acc, p) => {
    const b = basename(p, ".ts");
    acc[b] = (acc[b] ?? 0) + 1;
    return acc;
  }, {});
  const aggregate = { killed: 0, survived: 0, total: 0, score: 0 };
  const services: Record<string, MutationStats> = {};
  const endpoints: MutationData["endpoints"] = {};

  for (const [filePath, file] of Object.entries(report.files ?? {})) {
    const svc = serviceKeyFromMutationFile(filePath, basenameCounts);
    const svcStats = services[svc] ??= { killed: 0, survived: 0, ignored: 0, total: 0, score: 0 };
    for (const mut of file.mutants ?? []) {
      if (KILLED.has(mut.status)) { svcStats.killed++; aggregate.killed++; }
      else if (SURVIVED.has(mut.status)) { svcStats.survived++; aggregate.survived++; }
      else if (mut.status === "Ignored") { svcStats.ignored = (svcStats.ignored ?? 0) + 1; }
    }
  }
  for (const s of Object.values(services)) {
    s.total = s.killed + s.survived;
    s.score = score(s.killed, s.survived);
  }
  aggregate.total = aggregate.killed + aggregate.survived;
  aggregate.score = score(aggregate.killed, aggregate.survived);
  return { aggregate, services, endpoints };
}
