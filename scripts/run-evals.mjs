import fs from "node:fs";
import process from "node:process";

const dataset = JSON.parse(fs.readFileSync(new URL("../evals/datasets/portfolio-evals.json", import.meta.url), "utf8"));
const checks = [];

function check(project, name, passed, detail) {
  checks.push({ project, name, passed: Boolean(passed), detail });
}

for (const [project, cases] of Object.entries(dataset.projects)) {
  check(project, "dataset has cases", Array.isArray(cases) && cases.length > 0, `${cases.length} cases`);
  check(project, "every case has a stable id", cases.every((item) => typeof item.id === "string" && item.id.length > 3), "IDs make regressions traceable");
  check(project, "every case is sliced", cases.every((item) => typeof item.slice === "string" && item.slice.length > 0), "Slices prevent aggregate scores from hiding failures");
}

const sentinel = dataset.projects.sentinel;
check("sentinel", "high-risk remediation requires approval", sentinel.some((item) => item.expected?.requiresApproval === true), "Rollback-style actions are not model-authorized");
check("sentinel", "prompt-injection fixture blocks destructive action", sentinel.some((item) => item.expected?.treatAsUntrustedData && item.expected?.destructiveActionAllowed === false), "Untrusted logs remain data");

const secure = dataset.projects.secureKnowledge;
check("secureKnowledge", "negative permission case exists", secure.some((item) => item.expected?.mustAbstain && item.expected?.forbiddenSource), "Access-control failure is a launch blocker");
check("secureKnowledge", "positive permission case requires source", secure.some((item) => item.expected?.requiredSource && item.expected?.mustCite), "Allowed answers still need evidence");

function longestSharedRun(a, b) {
  const x = a.toLowerCase().match(/[a-z0-9']+/g) ?? [];
  const y = b.toLowerCase().match(/[a-z0-9']+/g) ?? [];
  let best = 0;
  const dp = Array(y.length + 1).fill(0);
  for (let i = 1; i <= x.length; i += 1) {
    let previous = 0;
    for (let j = 1; j <= y.length; j += 1) {
      const temp = dp[j];
      dp[j] = x[i - 1] === y[j - 1] ? previous + 1 : 0;
      best = Math.max(best, dp[j]);
      previous = temp;
    }
  }
  return best;
}
check("voiceAgent", "copy detector catches long reused phrase", longestSharedRun("The best product demos answer one question quickly", "Draft: The best product demos answer one question quickly and then continue") >= 8, "Deterministic guard complements subjective style grading");
check("voiceAgent", "copy detector allows unrelated wording", longestSharedRun("Short direct writing", "Completely different language appears here") < 3, "Low overlap does not trigger the guard");

const research = dataset.projects.researchAgent;
check("researchAgent", "source-gap case forbids fabrication", research.some((item) => item.expected?.mustReportMissingSourceCategories && item.expected?.mustNotFabricateSources), "Coverage gaps are explicit");
check("researchAgent", "quality thresholds cover goal usefulness", research.some((item) => item.expected?.relevanceMin >= 4 && item.expected?.actionabilityMin >= 4), "A digest must be useful, not just well written");

const policy = dataset.projects.policyRadar;
check("policyRadar", "primary-source contract is required", policy.some((item) => item.expected?.hasPrimarySource === true), "Provenance is a hard data-quality requirement");
check("policyRadar", "outage case forbids fabricated records", policy.some((item) => item.expected?.showDegradedState && item.expected?.fabricateRecords === false), "Failure should be visible");

const passed = checks.filter((item) => item.passed).length;
const failed = checks.filter((item) => !item.passed);

for (const item of checks) console.log(`${item.passed ? "PASS" : "FAIL"} [${item.project}] ${item.name} - ${item.detail}`);
console.log(`\n${passed}/${checks.length} deterministic evaluation gates passed.`);
if (failed.length) {
  console.error(`Failed gates: ${failed.map((item) => `${item.project}:${item.name}`).join(", ")}`);
  process.exit(1);
}
