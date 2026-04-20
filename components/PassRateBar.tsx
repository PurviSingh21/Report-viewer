export default function PassRateBar({
  rate,
  label,
  detail,
}: {
  rate: number;
  label: string;
  detail?: string;
}) {
  const color =
    rate >= 90 ? "bg-emerald-500" : rate >= 70 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="tabular-nums font-semibold text-slate-900">
          {rate}%
          {detail && (
            <span className="ml-1.5 text-xs font-normal text-slate-400">
              {detail}
            </span>
          )}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-100">
        <div
          className={`h-2 rounded-full transition-all ${color}`}
          style={{ width: `${Math.min(rate, 100)}%` }}
        />
      </div>
    </div>
  );
}
