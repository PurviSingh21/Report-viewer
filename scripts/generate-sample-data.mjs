import fs from "fs";
import path from "path";

const runId = `run-${new Date().toISOString().replace(/[:.]/g, "-")}-sample`;
const baseDir = path.resolve(process.cwd(), "..", "test-results", runId);

const SITES = ["blockpeer", "crickbox"];

const TESTS = {
  blockpeer: [
    { title: "Login page loads correctly", apiName: "auth", priority: "high", outcome: "passed", durationMs: 2340 },
    { title: "Sign in with valid credentials", apiName: "auth", priority: "high", outcome: "passed", durationMs: 4520 },
    { title: "Dashboard loads after login", apiName: "dashboard", priority: "high", outcome: "passed", durationMs: 3100 },
    { title: "Portfolio table renders data", apiName: "portfolio", priority: "medium", outcome: "passed", durationMs: 5200 },
    { title: "Transaction history pagination", apiName: "transactions", priority: "medium", outcome: "failed", durationMs: 8450, error: "Timeout waiting for selector '.transaction-row:nth-child(11)'\n  at tests/blockpeer/priority-medium/authenticated/business-modules.spec.ts:45:12" },
    { title: "Settings page accessibility", apiName: "settings", priority: "low", outcome: "passed", durationMs: 1800 },
    { title: "Forgot password flow", apiName: "auth", priority: "medium", outcome: "passed", durationMs: 3400 },
    { title: "Sign out clears session", apiName: "auth", priority: "high", outcome: "passed", durationMs: 2100 },
    { title: "API token refresh on 401", apiName: "auth", priority: "high", outcome: "failed", durationMs: 15200, error: "Expected status 200 but received 401\n  Response body: {\"error\":\"token_expired\"}\n  at tests/blockpeer/priority-high/authenticated/dashboard-critical.spec.ts:78:5" },
    { title: "CSV export downloads file", apiName: "reports", priority: "low", outcome: "passed", durationMs: 6700 },
    { title: "Search filters work", apiName: "search", priority: "medium", outcome: "passed", durationMs: 2900 },
    { title: "Mobile responsive layout", apiName: "ui", priority: "low", outcome: "passed", durationMs: 1500 },
  ],
  crickbox: [
    { title: "Home page loads", apiName: "public", priority: "high", outcome: "passed", durationMs: 1200 },
    { title: "Live scores widget", apiName: "scores", priority: "high", outcome: "passed", durationMs: 3500 },
    { title: "Match detail page", apiName: "matches", priority: "medium", outcome: "passed", durationMs: 4100 },
    { title: "Player profile renders", apiName: "players", priority: "medium", outcome: "failed", durationMs: 7800, error: "Element '.player-stats' not found\n  Waiting for selector timed out after 30000ms\n  at tests/crickbox/crickbox.spec.ts:32:8" },
    { title: "Team standings table", apiName: "standings", priority: "medium", outcome: "passed", durationMs: 2600 },
    { title: "News feed loads articles", apiName: "news", priority: "low", outcome: "passed", durationMs: 3200 },
    { title: "Login with social auth", apiName: "auth", priority: "high", outcome: "passed", durationMs: 5100 },
    { title: "Notification preferences", apiName: "settings", priority: "low", outcome: "passed", durationMs: 1900 },
  ],
};

function buildResult(site, test, index) {
  const now = new Date();
  const started = new Date(now.getTime() - test.durationMs);
  const result = {
    title: test.title,
    fullTitle: `${site} > ${test.apiName} > ${test.title}`,
    apiName: test.apiName,
    priority: test.priority,
    status: test.outcome === "passed" ? "passed" : "failed",
    outcome: test.outcome,
    durationMs: test.durationMs,
    startedAt: started.toISOString(),
    finishedAt: now.toISOString(),
    projectName: `${site}-public`,
    retry: test.outcome === "failed" && index % 3 === 0 ? 1 : 0,
    workerIndex: index % 4,
    website: `https://staging.${site}.com`,
    websiteName: site,
  };

  if (test.error) {
    result.error = test.error;
    result.screenshotPaths = [
      path.join(baseDir, site, "screenshots", `${test.apiName}-failure-${Date.now()}.png`),
    ];
    result.retryCurl = `curl -s -o /dev/null -w "%{http_code}" -X GET "https://staging.${site}.com/${test.apiName}" -H "Accept: text/html,application/json"`;
  }

  return result;
}

for (const site of SITES) {
  const siteDir = path.join(baseDir, site);
  const ssDir = path.join(siteDir, "screenshots");
  fs.mkdirSync(ssDir, { recursive: true });

  const tests = TESTS[site];
  const results = tests.map((t, i) => buildResult(site, t, i));
  const passed = results.filter((r) => r.outcome === "passed");
  const failed = results.filter((r) => r.outcome === "failed");

  fs.writeFileSync(path.join(siteDir, "full_result.json"), JSON.stringify(results, null, 2));
  fs.writeFileSync(path.join(siteDir, "passed.json"), JSON.stringify(passed, null, 2));
  fs.writeFileSync(path.join(siteDir, "failed.json"), JSON.stringify(failed, null, 2));
}

console.log(`Sample data generated at: test-results/${runId}`);
console.log(`  blockpeer: ${TESTS.blockpeer.length} tests (${TESTS.blockpeer.filter(t => t.outcome === "failed").length} failed)`);
console.log(`  crickbox: ${TESTS.crickbox.length} tests (${TESTS.crickbox.filter(t => t.outcome === "failed").length} failed)`);
