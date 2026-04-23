import { NextRequest, NextResponse } from "next/server";
import { 
  listRuns,
  getRunSummary,
  getAllResultsForRun,
  getAllPassedForRun,
  getAllFailedForRun,
  getQualityMetrics,
} from "@/lib/reportReader";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const action = searchParams.get("action") || "runs";
  const runId = searchParams.get("run") || "";

  try {
    switch (action) {
      case "runs": {
        const runs = await listRuns();
        return NextResponse.json({ runs });
      }

      case "summary": {
        if (!runId)
          return NextResponse.json({ error: "run param required" }, { status: 400 });
        const summary = await getRunSummary(runId);
        return NextResponse.json({ summary });
      }

      case "results": {
        if (!runId)
          return NextResponse.json({ error: "run param required" }, { status: 400 });
        const results = await getAllResultsForRun(runId);
        return NextResponse.json({ results });
      }

      case "passed": {
        if (!runId)
          return NextResponse.json({ error: "run param required" }, { status: 400 });
        const passed = await getAllPassedForRun(runId);
        return NextResponse.json({ results: passed });
      }

      case "failed": {
        if (!runId)
          return NextResponse.json({ error: "run param required" }, { status: 400 });
        const failed = await getAllFailedForRun(runId);
        return NextResponse.json({ results: failed });
      }

      case "quality": {
        if (!runId)
          return NextResponse.json({ error: "run param required" }, { status: 400 });
        const metrics = await getQualityMetrics(runId);
        return NextResponse.json({ metrics });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
