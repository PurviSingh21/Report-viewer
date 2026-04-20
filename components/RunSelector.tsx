"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function RunSelector({
  runs,
  currentRun,
}: {
  runs: string[];
  currentRun: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("run", e.target.value);
    router.push(`?${params.toString()}`);
  }

  if (!runs.length) return null;

  return (
    <select
      value={currentRun}
      onChange={onChange}
      className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
    >
      {runs.map((r) => (
        <option key={r} value={r}>
          {r}
        </option>
      ))}
    </select>
  );
}
