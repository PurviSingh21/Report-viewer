import { Suspense } from "react";
import { listRuns, getAllResultsForRun } from "@/lib/reportReader";
import RunSelector from "@/components/RunSelector";
import ResultsTable from "@/components/ResultsTable";
import EmptyState from "@/components/EmptyState";

export const dynamic = "force-dynamic";

export default async function ResultsPage({
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
  const results = await getAllResultsForRun(currentRun);

  return (
    <>
      <Header runs={runs} currentRun={currentRun} />
      {results.length ? (
        <ResultsTable results={results} />
      ) : (
        <EmptyState
          title="No results in this run"
          message="This test run doesn't contain any aggregated results."
        />
      )}
    </>
  );
}

function Header({ runs, currentRun }: { runs: string[]; currentRun: string }) {
  return (
    <div className="mb-8 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Test Results</h1>
        <p className="mt-1 text-sm text-slate-500">
          Browse, filter, and inspect individual test results
        </p>
      </div>
      <Suspense>
        <RunSelector runs={runs} currentRun={currentRun} />
      </Suspense>
    </div>
  );
}
