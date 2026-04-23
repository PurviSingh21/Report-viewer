import { list } from "@vercel/blob";
import type { TestResult } from "./types";

// All report blobs live under this prefix in the store.
const PREFIX = "report-viewer/runs/";

/**
 * Returns true when the Vercel Blob token is available (i.e. we're on Vercel
 * or the token is set locally). Falls back to filesystem when false.
 */
export function isBlobAvailable(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

/** List every unique run ID stored in Blob, newest first. */
export async function blobListRuns(): Promise<string[]> {
  const { blobs } = await list({ prefix: PREFIX, mode: "folded" });
  // In folded mode each "folder" is returned as a blob with a trailing slash.
  return blobs
    .map((b) => b.pathname.replace(PREFIX, "").replace(/\/$/, ""))
    .filter(Boolean)
    .sort()
    .reverse();
}

/** List every site folder under a given run ID. */
export async function blobListSites(runId: string): Promise<string[]> {
  const { blobs } = await list({
    prefix: `${PREFIX}${runId}/`,
    mode: "folded",
  });
  return blobs
    .map((b) =>
      b.pathname.replace(`${PREFIX}${runId}/`, "").replace(/\/$/, "")
    )
    .filter((s) => s !== "");
}

/** Fetch a JSON file from Blob and return its parsed contents. */
export async function blobGetJson<T>(
  runId: string,
  site: string,
  file: string
): Promise<T | null> {
  // list() with exact path returns the blob entry that includes the public URL.
  const { blobs } = await list({
    prefix: `${PREFIX}${runId}/${site}/${file}`,
  });
  const blob = blobs.find(
    (b) => b.pathname === `${PREFIX}${runId}/${site}/${file}`
  );
  if (!blob) return null;
  try {
    const res = await fetch(blob.url, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** Convenience: fetch full_result.json for a site. */
export async function blobGetResults(
  runId: string,
  site: string
): Promise<TestResult[]> {
  return (await blobGetJson<TestResult[]>(runId, site, "full_result.json")) ?? [];
}

/** Convenience: fetch passed.json for a site. */
export async function blobGetPassed(
  runId: string,
  site: string
): Promise<TestResult[]> {
  return (await blobGetJson<TestResult[]>(runId, site, "passed.json")) ?? [];
}

/** Convenience: fetch failed.json for a site. */
export async function blobGetFailed(
  runId: string,
  site: string
): Promise<TestResult[]> {
  return (await blobGetJson<TestResult[]>(runId, site, "failed.json")) ?? [];
}
