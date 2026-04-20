import { Suspense } from "react";
import {
  listRuns,
  listSitesForRun,
  getFailedForSite,
} from "@/lib/reportReader";
import RunSelector from "@/components/RunSelector";
import ResultsTable from "@/components/ResultsTable";
import EmptyState from "@/components/EmptyState";
import StatCard from "@/components/StatCard";

export const dynamic = "force-dynamic";

export default async function FailedPage({
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
  const allFailed = [];
  for (const site of sites) {
    allFailed.push(...(await getFailedForSite(currentRun, site)));
  }

  const withScreenshots = allFailed.filter(
    (r) => r.screenshotPaths?.length
  ).length;
  const withCurl = allFailed.filter((r) => r.retryCurl).length;

  return (
    <>
      <Header runs={runs} currentRun={currentRun} />

      {allFailed.length > 0 && (
        <div className="mb-6 grid grid-cols-3 gap-4">
          <StatCard
            label="Failed Tests"
            value={allFailed.length}
            color="red"
          />
          <StatCard
            label="With Screenshots"
            value={withScreenshots}
            sub={`${allFailed.length - withScreenshots} missing`}
            color="yellow"
          />
          <StatCard
            label="With Retry cURL"
            value={withCurl}
            color="blue"
          />
        </div>
      )}

      {allFailed.length ? (
        <ResultsTable results={allFailed} showCurl />
      ) : (
        <EmptyState
          title="No failed tests"
          message="All tests passed in this run. Great job!"
        />
      )}
    </>
  );
}

function Header({ runs, currentRun }: { runs: string[]; currentRun: string }) {
  return (
    <div className="mb-8 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Failed Tests</h1>
        <p className="mt-1 text-sm text-slate-500">
          Investigate failures with screenshots and retry cURL commands
        </p>
      </div>
      <Suspense>
        <RunSelector runs={runs} currentRun={currentRun} />
      </Suspense>
    </div>
  );
}
