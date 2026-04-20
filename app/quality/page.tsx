import { Suspense } from "react";
import { listRuns, getQualityMetrics } from "@/lib/reportReader";
import RunSelector from "@/components/RunSelector";
import StatCard from "@/components/StatCard";
import PassRateBar from "@/components/PassRateBar";
import EmptyState from "@/components/EmptyState";
import type { PriorityLevel } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function QualityPage({
  searchParams,
}: {
  searchParams: Promise<{ run?: string }>;
}) {
  const params = await searchParams;
  const runs = await listRuns();

  if (!runs.length) {
    return (
      <>
        <Header runs={[]} currentRun="" />
        <EmptyState
          title="No test runs found"
          message="Run your Playwright tests first to generate results."
        />
      </>
    );
  }

  const currentRun = params.run || runs[0];
  const metrics = await getQualityMetrics(currentRun);

  const totalTests = metrics.siteReliability.reduce(
    (s, r) => s + r.totalTests,
    0
  );

  const reliabilityGrade =
    metrics.overallPassRate >= 95
      ? "A"
      : metrics.overallPassRate >= 85
        ? "B"
        : metrics.overallPassRate >= 70
          ? "C"
          : metrics.overallPassRate >= 50
            ? "D"
            : "F";

  const gradeColor: Record<string, string> = {
    A: "text-emerald-600",
    B: "text-blue-600",
    C: "text-amber-600",
    D: "text-orange-600",
    F: "text-red-600",
  };

  return (
    <>
      <Header runs={runs} currentRun={currentRun} />

      {/* Top-level stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Overall Pass Rate"
          value={`${metrics.overallPassRate}%`}
          color={metrics.overallPassRate >= 90 ? "green" : metrics.overallPassRate >= 70 ? "yellow" : "red"}
        />
        <StatCard label="Total Tests" value={totalTests} color="blue" />
        <StatCard
          label="Flaky Tests"
          value={metrics.flakyTests.length}
          sub="Tests with retries"
          color={metrics.flakyTests.length > 0 ? "yellow" : "green"}
        />
        <div className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col items-center justify-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Reliability Grade
          </p>
          <p className={`mt-1.5 text-4xl font-black ${gradeColor[reliabilityGrade]}`}>
            {reliabilityGrade}
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Site reliability */}
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Site Reliability
          </h2>
          {metrics.siteReliability.length > 0 ? (
            <div className="space-y-4">
              {metrics.siteReliability.map((s) => (
                <PassRateBar
                  key={s.site}
                  label={s.site}
                  rate={s.passRate}
                  detail={`${s.totalTests} tests`}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">No site data available</p>
          )}
        </div>

        {/* Priority coverage */}
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Priority Coverage
          </h2>
          <div className="space-y-4">
            {(["high", "medium", "low"] as PriorityLevel[]).map((p) => {
              const data = metrics.priorityCoverage[p];
              return (
                <PassRateBar
                  key={p}
                  label={`${p.charAt(0).toUpperCase() + p.slice(1)} Priority`}
                  rate={data.passRate}
                  detail={`${data.passed}/${data.total}`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* API coverage */}
      {metrics.apiCoverage.length > 0 && (
        <div className="mt-8 rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-700">
              API / Module Coverage
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-3 text-left font-semibold text-slate-600">
                    API / Module
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-600">
                    Total
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-600">
                    Passed
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-600">
                    Pass Rate
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 w-48">
                    Health
                  </th>
                </tr>
              </thead>
              <tbody>
                {metrics.apiCoverage
                  .sort((a, b) => a.passRate - b.passRate)
                  .map((api) => (
                    <tr
                      key={api.api}
                      className="border-b border-slate-50 hover:bg-slate-50/50"
                    >
                      <td className="px-6 py-3 font-medium text-slate-800">
                        {api.api}
                      </td>
                      <td className="px-4 py-3 text-center tabular-nums">
                        {api.total}
                      </td>
                      <td className="px-4 py-3 text-center tabular-nums text-emerald-600 font-medium">
                        {api.passed}
                      </td>
                      <td className="px-4 py-3 text-center tabular-nums font-semibold">
                        <span
                          className={
                            api.passRate >= 90
                              ? "text-emerald-600"
                              : api.passRate >= 70
                                ? "text-amber-600"
                                : "text-red-600"
                          }
                        >
                          {api.passRate}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-2 w-full rounded-full bg-slate-100">
                          <div
                            className={`h-2 rounded-full ${
                              api.passRate >= 90
                                ? "bg-emerald-500"
                                : api.passRate >= 70
                                  ? "bg-amber-500"
                                  : "bg-red-500"
                            }`}
                            style={{
                              width: `${Math.min(api.passRate, 100)}%`,
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Slowest tests */}
      {metrics.slowestTests.length > 0 && (
        <div className="mt-8 rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-700">
              Slowest Tests (Top 10)
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-3 text-left font-semibold text-slate-600">
                    Test
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">
                    Site
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-600">
                    Duration
                  </th>
                </tr>
              </thead>
              <tbody>
                {metrics.slowestTests.map((t, i) => (
                  <tr
                    key={i}
                    className="border-b border-slate-50 hover:bg-slate-50/50"
                  >
                    <td className="px-6 py-3 font-medium text-slate-800 max-w-sm truncate">
                      {t.title}
                    </td>
                    <td className="px-4 py-3 text-slate-600 capitalize">
                      {t.websiteName || t.website || "-"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium text-amber-600">
                      {(t.durationMs / 1000).toFixed(2)}s
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Flaky tests */}
      {metrics.flakyTests.length > 0 && (
        <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50/50 overflow-hidden">
          <div className="px-6 py-4 border-b border-amber-200">
            <h2 className="text-sm font-semibold text-amber-800">
              Flaky Tests (Required Retries)
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-amber-200 bg-amber-50">
                  <th className="px-6 py-3 text-left font-semibold text-amber-800">
                    Test
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-amber-800">
                    Site
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-amber-800">
                    Retries
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-amber-800">
                    Final Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {metrics.flakyTests.map((t, i) => (
                  <tr
                    key={i}
                    className="border-b border-amber-100 hover:bg-amber-50"
                  >
                    <td className="px-6 py-3 font-medium text-slate-800 max-w-sm truncate">
                      {t.title}
                    </td>
                    <td className="px-4 py-3 text-slate-600 capitalize">
                      {t.websiteName || t.website || "-"}
                    </td>
                    <td className="px-4 py-3 text-center tabular-nums font-medium text-amber-700">
                      {t.retry}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          t.outcome === "passed"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {t.outcome}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

function Header({ runs, currentRun }: { runs: string[]; currentRun: string }) {
  return (
    <div className="mb-8 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Quality Metrics</h1>
        <p className="mt-1 text-sm text-slate-500">
          Code quality, reliability scores, and test health analysis
        </p>
      </div>
      <Suspense>
        <RunSelector runs={runs} currentRun={currentRun} />
      </Suspense>
    </div>
  );
}
