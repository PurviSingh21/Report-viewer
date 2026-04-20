export type PriorityLevel = "high" | "medium" | "low";
export type TestOutcome = "passed" | "failed";

export interface TestResult {
  title: string;
  fullTitle: string;
  apiName: string;
  priority: PriorityLevel;
  status: string;
  outcome: TestOutcome;
  durationMs: number;
  startedAt: string;
  finishedAt: string;
  projectName: string;
  retry: number;
  workerIndex: number;
  website?: string;
  websiteName?: string;
  error?: string;
  screenshotPaths?: string[];
  attachments?: string[];
  retryCurl?: string;
}

export interface RunSummary {
  runId: string;
  timestamp: string;
  sites: SiteSummary[];
  totals: {
    total: number;
    passed: number;
    failed: number;
    passRate: number;
    totalDurationMs: number;
    avgDurationMs: number;
  };
}

export interface SiteSummary {
  name: string;
  total: number;
  passed: number;
  failed: number;
  passRate: number;
  avgDurationMs: number;
  byPriority: Record<PriorityLevel, { total: number; passed: number; failed: number }>;
}

export interface QualityMetrics {
  overallPassRate: number;
  siteReliability: Array<{ site: string; passRate: number; totalTests: number }>;
  priorityCoverage: Record<PriorityLevel, { total: number; passed: number; passRate: number }>;
  slowestTests: TestResult[];
  flakyTests: TestResult[];
  apiCoverage: Array<{ api: string; total: number; passed: number; passRate: number }>;
}
