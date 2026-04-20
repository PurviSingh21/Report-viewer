export function StatusBadge({ outcome }: { outcome: string }) {
  const isPassed = outcome === "passed";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        isPassed
          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
          : "bg-red-50 text-red-700 ring-1 ring-red-600/20"
      }`}
    >
      {isPassed ? "Passed" : "Failed"}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    high: "bg-red-50 text-red-700 ring-red-600/20",
    medium: "bg-amber-50 text-amber-700 ring-amber-600/20",
    low: "bg-slate-100 text-slate-600 ring-slate-500/20",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${
        colors[priority] || colors.medium
      }`}
    >
      {priority}
    </span>
  );
}
