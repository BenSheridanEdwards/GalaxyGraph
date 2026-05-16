import { readFile } from "node:fs/promises";
import { basename, dirname } from "node:path";
import type { MutationData, MutationStats } from "@galaxy-graph/core";

const KILLED = new Set(["Killed", "Timeout"]);
const SURVIVED = new Set(["Survived", "NoCoverage"]);

const score = (killed: number, survived: number) =>
  killed + survived ? Number(((100 * killed) / (killed + survived)).toFixed(2)) : 0;

export interface StrykerMutant {
  status?: string;
  mutatorName?: string;
  location?: { start?: { line?: number } };
  replacement?: string;
}
export interface StrykerReportFile { mutants?: StrykerMutant[] }
export interface StrykerReport { files: Record<string, StrykerReportFile> }

export interface MutationBuildOptions {
  /** Map Stryker file paths to Galaxy endpoint keys (`svc:fnName`). */
  endpointsByFile?: Record<string, Array<{ key: string; svc: string; fnName: string }>>;
}

export async function readStrykerReport(path: string): Promise<StrykerReport> {
  return JSON.parse(await readFile(path, "utf8"));
}

export function serviceKeyFromMutationFile(filePath: string, basenameCounts: Record<string, number>): string {
  const b = basename(filePath, ".ts");
  return basenameCounts[b] === 1 ? b : basename(dirname(filePath));
}

function addStatus(stats: MutationStats, mut: StrykerMutant): void {
  if (KILLED.has(mut.status ?? "")) stats.killed++;
  else if (SURVIVED.has(mut.status ?? "")) {
    stats.survived++;
    (stats.survivors ??= []).push({
      mutator: mut.mutatorName ?? "UnknownMutator",
      line: mut.location?.start?.line ?? 0,
      replacement: mut.replacement ?? "",
    });
  }
  else if (mut.status === "Ignored") stats.ignored = (stats.ignored ?? 0) + 1;
}

function finalize(stats: MutationStats): MutationStats {
  stats.total = stats.killed + stats.survived;
  stats.score = score(stats.killed, stats.survived);
  if (!stats.survivors?.length) delete stats.survivors;
  return stats;
}

export function buildMutationData(report: StrykerReport, opts: MutationBuildOptions = {}): MutationData {
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
    const fileEndpoints = opts.endpointsByFile?.[filePath] ?? opts.endpointsByFile?.[filePath.replace(/^\.\//, "")] ?? [];

    for (const mut of file.mutants ?? []) {
      addStatus(svcStats, mut);
      if (KILLED.has(mut.status ?? "")) aggregate.killed++;
      else if (SURVIVED.has(mut.status ?? "")) aggregate.survived++;

      for (const ep of fileEndpoints) {
        const epStats = endpoints[ep.key] ??= { svc: ep.svc, fnName: ep.fnName, killed: 0, survived: 0, ignored: 0, total: 0, score: 0 };
        addStatus(epStats, mut);
      }
    }
  }
  for (const s of Object.values(services)) finalize(s);
  for (const s of Object.values(endpoints)) finalize(s);
  aggregate.total = aggregate.killed + aggregate.survived;
  aggregate.score = score(aggregate.killed, aggregate.survived);
  return { aggregate, services, endpoints };
}
