import type {
  TestResult,
  RunSummary,
  SiteSummary,
  PriorityLevel,
  QualityMetrics,
} from "./types";
import {
  isBlobAvailable,
  blobListRuns,
  blobListSites,
  blobGetResults,
  blobGetPassed,
  blobGetFailed,
} from "./blobStore";

// ─── Filesystem-based data fetching (local dev fallback) ──────

async function fsListRuns(): Promise<string[]> {
  const fs = await import("fs/promises");
  const path = await import("path");
  const dir = path.resolve(process.cwd(), "..", "test-results");
  try {
    const stat = await fs.stat(dir);
    if (!stat.isDirectory()) return [];
  } catch {
    return [];
  }
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort()
    .reverse();
}

async function fsListSitesForRun(runId: string): Promise<string[]> {
  const fs = await import("fs/promises");
  const pathMod = await import("path");
  const dir = pathMod.resolve(process.cwd(), "..", "test-results", runId);
  try {
    const stat = await fs.stat(dir);
    if (!stat.isDirectory()) return [];
  } catch {
    return [];
  }
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const sites: string[] = [];
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    if (["artifacts", "html-report", "summary", "setup"].includes(e.name)) continue;
    try {
      const full = pathMod.join(dir, e.name, "full_result.json");
      const passed = pathMod.join(dir, e.name, "passed.json");
      const failed = pathMod.join(dir, e.name, "failed.json");
      const hasAny =
        (await fs.stat(full).catch(() => null))?.isFile() ||
        (await fs.stat(passed).catch(() => null))?.isFile() ||
        (await fs.stat(failed).catch(() => null))?.isFile();
      if (hasAny) sites.push(e.name);
    } catch {
      /* skip */
    }
  }
  return sites;
}

async function fsReadJson<T>(filePath: string): Promise<T | null> {
  const fs = await import("fs/promises");
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function fsGetForSite(runId: string, site: string, file: string): Promise<TestResult[]> {
  const pathMod = await import("path");
  const filePath = pathMod.resolve(process.cwd(), "..", "test-results", runId, site, file);
  return (await fsReadJson<TestResult[]>(filePath)) ?? [];
}

// ─── Public API (Blob → filesystem) ──────────────────────────

export async function listRuns(): Promise<string[]> {
  if (isBlobAvailable()) return blobListRuns();
  return fsListRuns();
}

export async function listSitesForRun(runId: string): Promise<string[]> {
  if (isBlobAvailable()) return blobListSites(runId);
  return fsListSitesForRun(runId);
}

export async function getResultsForSite(runId: string, site: string): Promise<TestResult[]> {
  if (isBlobAvailable()) return blobGetResults(runId, site);
  return fsGetForSite(runId, site, "full_result.json");
}

export async function getPassedForSite(runId: string, site: string): Promise<TestResult[]> {
  if (isBlobAvailable()) return blobGetPassed(runId, site);
  return fsGetForSite(runId, site, "passed.json");
}

export async function getFailedForSite(runId: string, site: string): Promise<TestResult[]> {
  if (isBlobAvailable()) return blobGetFailed(runId, site);
  return fsGetForSite(runId, site, "failed.json");
}

export async function getAllResultsForRun(runId: string): Promise<TestResult[]> {
  const sites = await listSitesForRun(runId);
  const all: TestResult[] = [];
  for (const site of sites) all.push(...(await getResultsForSite(runId, site)));
  return all;
}

export async function getAllPassedForRun(runId: string): Promise<TestResult[]> {
  const sites = await listSitesForRun(runId);
  const all: TestResult[] = [];
  for (const site of sites) all.push(...(await getPassedForSite(runId, site)));
  return all;
}

export async function getAllFailedForRun(runId: string): Promise<TestResult[]> {
  const sites = await listSitesForRun(runId);
  const all: TestResult[] = [];
  for (const site of sites) all.push(...(await getFailedForSite(runId, site)));
  return all;
}

// ─── Aggregation helpers ──────────────────────────────────────

function buildSiteSummary(name: string, results: TestResult[]): SiteSummary {
  const passed = results.filter((r) => r.outcome === "passed").length;
  const failed = results.filter((r) => r.outcome === "failed").length;
  const total = results.length;
  const totalDuration = results.reduce((s, r) => s + (r.durationMs || 0), 0);

  const byPriority: SiteSummary["byPriority"] = {
    high: { total: 0, passed: 0, failed: 0 },
    medium: { total: 0, passed: 0, failed: 0 },
    low: { total: 0, passed: 0, failed: 0 },
  };
  for (const r of results) {
    const p = (r.priority || "medium") as PriorityLevel;
    if (byPriority[p]) {
      byPriority[p].total++;
      if (r.outcome === "passed") byPriority[p].passed++;
      else byPriority[p].failed++;
    }
  }

  return {
    name,
    total,
    passed,
    failed,
    passRate: total > 0 ? Math.round((passed / total) * 10000) / 100 : 0,
    avgDurationMs: total > 0 ? Math.round(totalDuration / total) : 0,
    byPriority,
  };
}

export async function getRunSummary(runId: string): Promise<RunSummary | null> {
  const sites = await listSitesForRun(runId);
  if (!sites.length) return null;

  const siteSummaries: SiteSummary[] = [];
  for (const site of sites) {
    const results = await getResultsForSite(runId, site);
    siteSummaries.push(buildSiteSummary(site, results));
  }

  const totals = siteSummaries.reduce(
    (acc, s) => {
      acc.total += s.total;
      acc.passed += s.passed;
      acc.failed += s.failed;
      acc.totalDurationMs += s.avgDurationMs * s.total;
      return acc;
    },
    { total: 0, passed: 0, failed: 0, totalDurationMs: 0 }
  );

  const timestamp = runId.match(/run-(\d{4}-\d{2}-\d{2}T[\d-]+)/)?.[1] || "";

  return {
    runId,
    timestamp: timestamp.replace(/-/g, (m, _i, offset) => (offset > 9 ? ":" : m)),
    sites: siteSummaries,
    totals: {
      ...totals,
      passRate:
        totals.total > 0
          ? Math.round((totals.passed / totals.total) * 10000) / 100
          : 0,
      avgDurationMs:
        totals.total > 0 ? Math.round(totals.totalDurationMs / totals.total) : 0,
    },
  };
}

export async function getQualityMetrics(runId: string): Promise<QualityMetrics> {
  const allResults = await getAllResultsForRun(runId);

  const passed = allResults.filter((r) => r.outcome === "passed").length;
  const overallPassRate =
    allResults.length > 0
      ? Math.round((passed / allResults.length) * 10000) / 100
      : 0;

  const siteMap = new Map<string, TestResult[]>();
  for (const r of allResults) {
    const site = r.websiteName || r.website || "unknown";
    if (!siteMap.has(site)) siteMap.set(site, []);
    siteMap.get(site)!.push(r);
  }
  const siteReliability = [...siteMap.entries()].map(([site, results]) => ({
    site,
    passRate:
      results.length > 0
        ? Math.round(
            (results.filter((r) => r.outcome === "passed").length / results.length) * 10000
          ) / 100
        : 0,
    totalTests: results.length,
  }));

  const priorityCoverage: QualityMetrics["priorityCoverage"] = {
    high: { total: 0, passed: 0, passRate: 0 },
    medium: { total: 0, passed: 0, passRate: 0 },
    low: { total: 0, passed: 0, passRate: 0 },
  };
  for (const r of allResults) {
    const p = (r.priority || "medium") as PriorityLevel;
    if (priorityCoverage[p]) {
      priorityCoverage[p].total++;
      if (r.outcome === "passed") priorityCoverage[p].passed++;
    }
  }
  for (const p of Object.values(priorityCoverage)) {
    p.passRate = p.total > 0 ? Math.round((p.passed / p.total) * 10000) / 100 : 0;
  }

  const slowestTests = [...allResults]
    .sort((a, b) => (b.durationMs || 0) - (a.durationMs || 0))
    .slice(0, 10);

  const flakyTests = allResults.filter((r) => r.retry > 0);

  const apiMap = new Map<string, { total: number; passed: number }>();
  for (const r of allResults) {
    const api = r.apiName || "unknown";
    if (!apiMap.has(api)) apiMap.set(api, { total: 0, passed: 0 });
    const entry = apiMap.get(api)!;
    entry.total++;
    if (r.outcome === "passed") entry.passed++;
  }
  const apiCoverage = [...apiMap.entries()].map(([api, { total, passed }]) => ({
    api,
    total,
    passed,
    passRate: total > 0 ? Math.round((passed / total) * 10000) / 100 : 0,
  }));

  return {
    overallPassRate,
    siteReliability,
    priorityCoverage,
    slowestTests,
    flakyTests,
    apiCoverage,
  };
}
