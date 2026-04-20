import { Suspense } from "react";
import {
  listRuns,
  listSitesForRun,
  getPassedForSite,
} from "@/lib/reportReader";
import RunSelector from "@/components/RunSelector";
import ResultsTable from "@/components/ResultsTable";
import EmptyState from "@/components/EmptyState";
import StatCard from "@/components/StatCard";

export const dynamic = "force-dynamic";

export default async function PassedPage({
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
  const sites = await listSitesForRun(currentRun);
  const allPassed = [];
  for (const site of sites) {
    allPassed.push(...(await getPassedForSite(currentRun, site)));
  }

  const priorities = {
    high: allPassed.filter((r) => r.priority === "high").length,
    medium: allPassed.filter((r) => r.priority === "medium").length,
    low: allPassed.filter((r) => r.priority === "low").length,
  };

  const avgDuration =
    allPassed.length > 0
      ? allPassed.reduce((s, r) => s + (r.durationMs || 0), 0) /
        allPassed.length
      : 0;

  return (
    <>
      <Header runs={runs} currentRun={currentRun} />

      {allPassed.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            label="Passed Tests"
            value={allPassed.length}
            color="green"
          />
          <StatCard
            label="High Priority"
            value={priorities.high}
            sub={`${priorities.medium} med / ${priorities.low} low`}
            color="blue"
          />
          <StatCard
            label="Sites Covered"
            value={sites.length}
            color="slate"
          />
          <StatCard
            label="Avg Duration"
            value={`${(avgDuration / 1000).toFixed(1)}s`}
            color="slate"
          />
        </div>
      )}

      {allPassed.length ? (
        <ResultsTable results={allPassed} />
      ) : (
        <EmptyState
          title="No passed tests"
          message="No tests passed in this run, or passed.json files are missing."
        />
      )}
    </>
  );
}

function Header({ runs, currentRun }: { runs: string[]; currentRun: string }) {
  return (
    <div className="mb-8 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Passed Tests</h1>
        <p className="mt-1 text-sm text-slate-500">
          All passing tests with details and timing breakdown
        </p>
      </div>
      <Suspense>
        <RunSelector runs={runs} currentRun={currentRun} />
      </Suspense>
    </div>
  );
}
