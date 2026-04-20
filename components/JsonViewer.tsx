"use client";

import { useState, useMemo } from "react";

interface JsonViewerProps {
  data: unknown;
  title: string;
  filename: string;
}

export default function JsonViewer({ data, title, filename }: JsonViewerProps) {
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const [copied, setCopied] = useState(false);

  const jsonString = useMemo(
    () => JSON.stringify(data, null, 2),
    [data]
  );

  const lines = useMemo(() => jsonString.split("\n"), [jsonString]);

  const filteredLines = useMemo(() => {
    if (!search) return lines;
    const q = search.toLowerCase();
    return lines.filter((line) => line.toLowerCase().includes(q));
  }, [lines, search]);

  const recordCount = Array.isArray(data) ? data.length : null;

  function handleCopy() {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
          {recordCount !== null && (
            <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
              {recordCount} record{recordCount !== 1 ? "s" : ""}
            </span>
          )}
          <span className="text-xs text-slate-400 tabular-nums">
            {lines.length} lines
          </span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Filter lines..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-48 rounded-lg border border-slate-200 bg-white px-3 text-xs placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="h-8 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            {collapsed ? "Expand" : "Collapse"}
          </button>
          <button
            onClick={handleCopy}
            className="h-8 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
          <button
            onClick={handleDownload}
            className="h-8 rounded-lg bg-blue-600 px-3 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Download
          </button>
        </div>
      </div>

      {collapsed ? (
        <div className="px-6 py-8 text-center text-sm text-slate-400">
          JSON collapsed — click Expand to view
        </div>
      ) : (
        <div className="overflow-auto max-h-[70vh]">
          <pre className="px-6 py-4 text-xs leading-5 font-mono">
            {filteredLines.map((line, i) => (
              <div
                key={i}
                className="flex hover:bg-blue-50/50 transition-colors"
              >
                <span className="w-12 shrink-0 select-none text-right pr-4 text-slate-300 tabular-nums">
                  {i + 1}
                </span>
                <span className="flex-1 whitespace-pre-wrap break-all">
                  <JsonLineHighlight line={line} />
                </span>
              </div>
            ))}
            {search && filteredLines.length === 0 && (
              <div className="py-8 text-center text-slate-400">
                No lines match your filter.
              </div>
            )}
          </pre>
        </div>
      )}
    </div>
  );
}

function JsonLineHighlight({ line }: { line: string }) {
  const keyMatch = line.match(/^(\s*)"([^"]+)"(\s*:\s*)/);
  if (keyMatch) {
    const [fullMatch, indent, key, colon] = keyMatch;
    const rest = line.slice(fullMatch.length);
    return (
      <>
        <span>{indent}</span>
        <span className="text-blue-700">&quot;{key}&quot;</span>
        <span className="text-slate-500">{colon}</span>
        <ValueHighlight value={rest} />
      </>
    );
  }

  return <ValueHighlight value={line} />;
}

function ValueHighlight({ value }: { value: string }) {
  const trimmed = value.replace(/,\s*$/, "");
  const trailing = value.slice(trimmed.length);

  if (/^".*"$/.test(trimmed))
    return (
      <>
        <span className="text-emerald-700">{trimmed}</span>
        <span className="text-slate-400">{trailing}</span>
      </>
    );

  if (/^-?\d+(\.\d+)?$/.test(trimmed))
    return (
      <>
        <span className="text-amber-700">{trimmed}</span>
        <span className="text-slate-400">{trailing}</span>
      </>
    );

  if (trimmed === "true" || trimmed === "false")
    return (
      <>
        <span className="text-purple-700">{trimmed}</span>
        <span className="text-slate-400">{trailing}</span>
      </>
    );

  if (trimmed === "null")
    return (
      <>
        <span className="text-red-500">{trimmed}</span>
        <span className="text-slate-400">{trailing}</span>
      </>
    );

  return <span className="text-slate-700">{value}</span>;
}
