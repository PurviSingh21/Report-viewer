import { Suspense } from "react";
import { listRuns, getRunSummary } from "@/lib/reportReader";
import RunSelector from "@/components/RunSelector";
import StatCard from "@/components/StatCard";
import PassRateBar from "@/components/PassRateBar";
import EmptyState from "@/components/EmptyState";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
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
          message="Run your Playwright tests first, then come back to view the reports. Test results are read from the test-results/ folder."
        />
      </>
    );
  }

  const currentRun = params.run || runs[0];
  const summary = await getRunSummary(currentRun);

  if (!summary) {
    return (
      <>
        <Header runs={runs} currentRun={currentRun} />
        <EmptyState
          title="No data for this run"
          message="This test run doesn't contain any aggregated results (passed.json / failed.json). Run tests with the priority reporter enabled."
        />
      </>
    );
  }

  const { totals, sites } = summary;

  return (
    <>
      <Header runs={runs} currentRun={currentRun} />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Tests" value={totals.total} color="blue" />
        <StatCard
          label="Passed"
          value={totals.passed}
          sub={`${totals.passRate}% pass rate`}
          color="green"
        />
        <StatCard label="Failed" value={totals.failed} color="red" />
        <StatCard
          label="Avg Duration"
          value={`${(totals.avgDurationMs / 1000).toFixed(1)}s`}
          sub={`Total: ${(totals.totalDurationMs / 1000).toFixed(1)}s`}
          color="slate"
        />
      </div>

      {/* Accuracy Ring */}
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-6 flex flex-col items-center justify-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-4">
            Overall Accuracy
          </p>
          <div className="relative h-36 w-36">
            <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="10"
              />
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke={totals.passRate >= 90 ? "#22c55e" : totals.passRate >= 70 ? "#f59e0b" : "#ef4444"}
                strokeWidth="10"
                strokeDasharray={`${(totals.passRate / 100) * 326.7} 326.7`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-slate-900">
                {totals.passRate}%
              </span>
            </div>
          </div>
          <p className="mt-2 text-sm text-slate-500">
            {totals.passed} of {totals.total} tests passing
          </p>
        </div>

        {/* Per-site breakdown */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-4">
            Site Reliability
          </p>
          <div className="space-y-4">
            {sites.map((s) => (
              <PassRateBar
                key={s.name}
                label={s.name}
                rate={s.passRate}
                detail={`${s.passed}/${s.total}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Priority breakdown table */}
      <div className="mt-8 rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700">
            Results by Site & Priority
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-3 text-left font-semibold text-slate-600">Site</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-600">Total</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-600">Passed</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-600">Failed</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-600">High</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-600">Medium</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-600">Low</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-600">Avg Time</th>
              </tr>
            </thead>
            <tbody>
              {sites.map((s) => (
                <tr key={s.name} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-6 py-3 font-medium text-slate-800 capitalize">{s.name}</td>
                  <td className="px-4 py-3 text-center tabular-nums">{s.total}</td>
                  <td className="px-4 py-3 text-center tabular-nums text-emerald-600 font-medium">{s.passed}</td>
                  <td className="px-4 py-3 text-center tabular-nums text-red-600 font-medium">{s.failed}</td>
                  <td className="px-4 py-3 text-center tabular-nums">
                    <PriorityCells data={s.byPriority.high} />
                  </td>
                  <td className="px-4 py-3 text-center tabular-nums">
                    <PriorityCells data={s.byPriority.medium} />
                  </td>
                  <td className="px-4 py-3 text-center tabular-nums">
                    <PriorityCells data={s.byPriority.low} />
                  </td>
                  <td className="px-4 py-3 text-center tabular-nums text-slate-500">
                    {(s.avgDurationMs / 1000).toFixed(1)}s
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function Header({ runs, currentRun }: { runs: string[]; currentRun: string }) {
  return (
    <div className="mb-8 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Test automation overview and metrics
        </p>
      </div>
      <Suspense>
        <RunSelector runs={runs} currentRun={currentRun} />
      </Suspense>
    </div>
  );
}

function PriorityCells({
  data,
}: {
  data: { total: number; passed: number; failed: number };
}) {
  if (!data.total) return <span className="text-slate-300">-</span>;
  return (
    <span>
      <span className="text-emerald-600">{data.passed}</span>
      {data.failed > 0 && (
        <>
          /<span className="text-red-600">{data.failed}</span>
        </>
      )}
    </span>
  );
}
