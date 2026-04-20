export default function StatCard({
  label,
  value,
  sub,
  color = "blue",
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: "blue" | "green" | "red" | "yellow" | "slate";
}) {
  const colorMap = {
    blue: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
    green: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
    red: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
    yellow: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
    slate: { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200" },
  };
  const c = colorMap[color];

  return (
    <div className={`rounded-xl border ${c.border} ${c.bg} p-5`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1.5 text-2xl font-bold ${c.text}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}
