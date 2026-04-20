"use client";

import { useState, useMemo } from "react";
import { StatusBadge, PriorityBadge } from "./StatusBadge";
import type { TestResult } from "@/lib/types";

export default function ResultsTable({
  results,
  showCurl = false,
}: {
  results: TestResult[];
  showCurl?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [siteFilter, setSiteFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<string>("title");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const sites = useMemo(
    () => [...new Set(results.map((r) => r.websiteName || r.website || "unknown"))].sort(),
    [results]
  );

  const filtered = useMemo(() => {
    let data = results;
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.fullTitle.toLowerCase().includes(q) ||
          r.apiName.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all")
      data = data.filter((r) => r.outcome === statusFilter);
    if (priorityFilter !== "all")
      data = data.filter((r) => r.priority === priorityFilter);
    if (siteFilter !== "all")
      data = data.filter(
        (r) => (r.websiteName || r.website || "unknown") === siteFilter
      );

    data = [...data].sort((a, b) => {
      const valA = (a as unknown as Record<string, unknown>)[sortKey];
      const valB = (b as unknown as Record<string, unknown>)[sortKey];
      if (typeof valA === "number" && typeof valB === "number")
        return sortDir === "asc" ? valA - valB : valB - valA;
      const strA = String(valA || "");
      const strB = String(valB || "");
      return sortDir === "asc"
        ? strA.localeCompare(strB)
        : strB.localeCompare(strA);
    });

    return data;
  }, [results, search, statusFilter, priorityFilter, siteFilter, sortKey, sortDir]);

  function toggleSort(key: string) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function toggleRow(i: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  return (
    <div>
      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search tests..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-64 rounded-lg border border-slate-200 bg-white px-3 text-sm placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-blue-400 focus:outline-none"
        >
          <option value="all">All Status</option>
          <option value="passed">Passed</option>
          <option value="failed">Failed</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-blue-400 focus:outline-none"
        >
          <option value="all">All Priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        {sites.length > 1 && (
          <select
            value={siteFilter}
            onChange={(e) => setSiteFilter(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-blue-400 focus:outline-none"
          >
            <option value="all">All Sites</option>
            {sites.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        )}
        <span className="ml-auto text-xs text-slate-500">
          {filtered.length} of {results.length} tests
        </span>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="w-8 px-2 py-3" />
                <SortHeader
                  label="Test"
                  sortKey="title"
                  current={sortKey}
                  dir={sortDir}
                  onClick={toggleSort}
                />
                <SortHeader
                  label="Site"
                  sortKey="websiteName"
                  current={sortKey}
                  dir={sortDir}
                  onClick={toggleSort}
                />
                <SortHeader
                  label="Status"
                  sortKey="outcome"
                  current={sortKey}
                  dir={sortDir}
                  onClick={toggleSort}
                />
                <SortHeader
                  label="Priority"
                  sortKey="priority"
                  current={sortKey}
                  dir={sortDir}
                  onClick={toggleSort}
                />
                <SortHeader
                  label="API"
                  sortKey="apiName"
                  current={sortKey}
                  dir={sortDir}
                  onClick={toggleSort}
                />
                <SortHeader
                  label="Duration"
                  sortKey="durationMs"
                  current={sortKey}
                  dir={sortDir}
                  onClick={toggleSort}
                  align="right"
                />
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => {
                const isOpen = expanded.has(i);
                return (
                  <RowGroup
                    key={i}
                    result={r}
                    isOpen={isOpen}
                    onToggle={() => toggleRow(i)}
                    showCurl={showCurl}
                  />
                );
              })}
              {!filtered.length && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    No test results match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SortHeader({
  label,
  sortKey: key,
  current,
  dir,
  onClick,
  align = "left",
}: {
  label: string;
  sortKey: string;
  current: string;
  dir: "asc" | "desc";
  onClick: (key: string) => void;
  align?: "left" | "right";
}) {
  const active = current === key;
  return (
    <th
      onClick={() => onClick(key)}
      className={`cursor-pointer select-none px-4 py-3 font-semibold text-slate-600 hover:text-slate-900 ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {label}
      {active && (
        <span className="ml-1 text-blue-500">{dir === "asc" ? "\u2191" : "\u2193"}</span>
      )}
    </th>
  );
}

function RowGroup({
  result: r,
  isOpen,
  onToggle,
  showCurl,
}: {
  result: TestResult;
  isOpen: boolean;
  onToggle: () => void;
  showCurl: boolean;
}) {
  return (
    <>
      <tr
        onClick={onToggle}
        className="cursor-pointer border-b border-slate-50 hover:bg-slate-50/70 transition-colors"
      >
        <td className="px-2 py-3 text-center text-slate-400">
          <span className={`inline-block transition-transform ${isOpen ? "rotate-90" : ""}`}>
            &#9654;
          </span>
        </td>
        <td className="px-4 py-3 font-medium text-slate-800 max-w-xs truncate">
          {r.title}
        </td>
        <td className="px-4 py-3 text-slate-600 capitalize">
          {r.websiteName || r.website || "-"}
        </td>
        <td className="px-4 py-3">
          <StatusBadge outcome={r.outcome} />
        </td>
        <td className="px-4 py-3">
          <PriorityBadge priority={r.priority} />
        </td>
        <td className="px-4 py-3 text-slate-600">{r.apiName || "-"}</td>
        <td className="px-4 py-3 text-right tabular-nums text-slate-500">
          {(r.durationMs / 1000).toFixed(2)}s
        </td>
      </tr>
      {isOpen && (
        <tr className="border-b border-slate-100">
          <td colSpan={7} className="bg-slate-50/50 px-6 py-4">
            <div className="grid gap-3 text-sm">
              <Detail label="Full Title" value={r.fullTitle} />
              <Detail label="Project" value={r.projectName} />
              <Detail label="Started" value={r.startedAt} />
              <Detail label="Finished" value={r.finishedAt} />
              <Detail label="Retries" value={String(r.retry)} />
              {r.error && (
                <div>
                  <span className="font-semibold text-red-700">Error:</span>
                  <pre className="mt-1 max-h-40 overflow-auto rounded-lg bg-red-50 p-3 text-xs text-red-800 whitespace-pre-wrap border border-red-200">
                    {r.error}
                  </pre>
                </div>
              )}
              {r.screenshotPaths?.length ? (
                <div>
                  <span className="font-semibold text-slate-700">Screenshots:</span>
                  <ul className="mt-1 space-y-1">
                    {r.screenshotPaths.map((p, i) => (
                      <li key={i} className="text-xs text-slate-500 font-mono break-all">
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {(showCurl || r.outcome === "failed") && r.retryCurl && (
                <div>
                  <span className="font-semibold text-slate-700">Retry cURL:</span>
                  <div className="mt-1 relative group">
                    <pre className="overflow-auto rounded-lg bg-slate-900 p-3 text-xs text-green-400 font-mono">
                      {r.retryCurl}
                    </pre>
                    <CopyButton text={r.retryCurl} />
                  </div>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex gap-2">
      <span className="font-semibold text-slate-600 shrink-0">{label}:</span>
      <span className="text-slate-700 break-all">{value}</span>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="absolute top-2 right-2 rounded-md bg-slate-700 px-2 py-1 text-xs text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-600"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}
