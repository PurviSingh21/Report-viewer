import { Suspense } from "react";
import { listRuns, getAllPassedForRun } from "@/lib/reportReader";
import RunSelector from "@/components/RunSelector";
import JsonViewer from "@/components/JsonViewer";
import EmptyState from "@/components/EmptyState";

export const dynamic = "force-dynamic";

export default async function PassedJsonPage({
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
  const passed = await getAllPassedForRun(currentRun);

  return (
    <>
      <Header runs={runs} currentRun={currentRun} />
      {passed.length ? (
        <JsonViewer
          data={passed}
          title="passed.json"
          filename={`passed-${currentRun}.json`}
        />
      ) : (
        <EmptyState
          title="No passed data"
          message="No passed.json files found for this run."
        />
      )}
    </>
  );
}

function Header({ runs, currentRun }: { runs: string[]; currentRun: string }) {
  return (
    <div className="mb-8 flex items-center justify-between">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-slate-900">Passed JSON</h1>
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
            RAW
          </span>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Raw passed.json data with syntax highlighting
        </p>
      </div>
      <Suspense>
        <RunSelector runs={runs} currentRun={currentRun} />
      </Suspense>
    </div>
  );
}
