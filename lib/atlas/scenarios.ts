export type VerticalId = "banking" | "hardware" | "consulting" | "healthcare";
export type Workflow = {
  name: string;
  description: string;
  value: number;
  readiness: number;
  risk: number;
  hours: number;
  systems: string[];
  owner: string;
  approval: string;
};
export type Vertical = {
  label: string;
  signal: string;
  outcome: string;
  workflows: Workflow[];
};

export const verticals: Record<VerticalId, Vertical> = {
  banking: {
    label: "Investment banking",
    signal: "Analysts lose high-value hours rebuilding evidence across fragmented deal rooms.",
    outcome: "Faster, traceable diligence without automating investment judgment.",
    workflows: [
      { name: "Diligence evidence synthesis", description: "Trace claims across CIMs, filings, market data, and prior diligence while preserving source-level evidence.", value: 94, readiness: 82, risk: 38, hours: 520, systems: ["Deal room", "Capital IQ", "SharePoint"], owner: "Head of Diligence", approval: "Deal team validates every material claim" },
      { name: "Management meeting preparation", description: "Build a question tree from unresolved assumptions, historical performance, and sector benchmarks.", value: 86, readiness: 88, risk: 31, hours: 340, systems: ["CRM", "Research", "Deal notes"], owner: "VP, Coverage", approval: "VP approves the external question set" },
      { name: "Comparable-company refresh", description: "Refresh trading comps and surface definition changes before committee materials are produced.", value: 78, readiness: 91, risk: 26, hours: 290, systems: ["Market data", "Excel", "Templates"], owner: "Director, Analytics", approval: "Analyst signs off on adjustments" },
      { name: "Investment committee memo", description: "Draft a cited first pass and explicitly separate evidence, assumptions, and open questions.", value: 92, readiness: 68, risk: 61, hours: 410, systems: ["Deal room", "CRM", "Word"], owner: "Investment Committee Lead", approval: "Partner owns the recommendation" },
    ],
  },
  hardware: {
    label: "Hardware engineering",
    signal: "Late design changes trigger slow, cross-functional impact reviews with incomplete dependency maps.",
    outcome: "Shorter change cycles with engineering authority and safety gates kept intact.",
    workflows: [
      { name: "Engineering-change impact review", description: "Trace a proposed change across requirements, BOMs, test history, suppliers, and open defects.", value: 96, readiness: 79, risk: 45, hours: 610, systems: ["PLM", "Jira", "Test logs"], owner: "Change Control Board", approval: "Board approves disposition" },
      { name: "Failure-analysis evidence pack", description: "Assemble the most relevant logs, lots, revisions, and prior failures for an investigator.", value: 91, readiness: 84, risk: 39, hours: 470, systems: ["MES", "PLM", "Lab systems"], owner: "Reliability Lead", approval: "Engineer confirms root cause" },
      { name: "Supplier deviation triage", description: "Compare deviation requests against design constraints and qualification evidence.", value: 82, readiness: 73, risk: 58, hours: 360, systems: ["Supplier portal", "PLM", "ERP"], owner: "Supplier Quality", approval: "Quality signs the deviation" },
      { name: "Test-plan coverage review", description: "Map requirements to tests and flag untested or stale coverage before release.", value: 77, readiness: 93, risk: 22, hours: 280, systems: ["Requirements", "TestRail", "Git"], owner: "Validation Director", approval: "Test lead closes gaps" },
    ],
  },
  consulting: {
    label: "Management consulting",
    signal: "Teams repeatedly synthesize the same evidence while senior reviewers hunt for unsupported claims.",
    outcome: "More time on judgment and client alignment, less time rebuilding context.",
    workflows: [
      { name: "Commercial diligence synthesis", description: "Reconcile interviews, market research, and operating data into a sourced hypothesis tree.", value: 95, readiness: 86, risk: 36, hours: 540, systems: ["Research", "Interview notes", "Data room"], owner: "Engagement Partner", approval: "Case team validates claims" },
      { name: "Executive workshop preparation", description: "Turn discovery evidence into decisions, unresolved tensions, and workshop exercises.", value: 84, readiness: 89, risk: 29, hours: 310, systems: ["Slides", "Survey data", "Notes"], owner: "Engagement Manager", approval: "Partner approves the agenda" },
      { name: "Proposal knowledge reuse", description: "Retrieve relevant credentials and case studies with client and confidentiality filters applied first.", value: 73, readiness: 92, risk: 24, hours: 250, systems: ["Knowledge base", "CRM", "Proposals"], owner: "Practice Operations", approval: "Principal reviews client fit" },
      { name: "SteerCo narrative draft", description: "Draft a cited update from workstream evidence and flag contradictory status signals.", value: 88, readiness: 72, risk: 47, hours: 390, systems: ["PMO", "Slides", "Workplans"], owner: "Program Director", approval: "Executive sponsor owns decisions" },
    ],
  },
  healthcare: {
    label: "Healthcare operations",
    signal: "Exception reviews span sensitive records, policy, and multiple operational owners.",
    outcome: "Quicker evidence assembly with privacy, escalation, and clinical authority enforced.",
    workflows: [
      { name: "Third-party risk evidence review", description: "Assemble control evidence, prior findings, threat signals, and policy exceptions for a reviewer.", value: 92, readiness: 83, risk: 44, hours: 480, systems: ["GRC", "ServiceNow", "Security ratings"], owner: "Third-Party Risk", approval: "Risk owner accepts exceptions" },
      { name: "Prior-authorization preparation", description: "Collect required evidence and flag missing documentation without making a clinical decision.", value: 97, readiness: 71, risk: 66, hours: 680, systems: ["EHR", "Payer portal", "Policy library"], owner: "Revenue Cycle VP", approval: "Licensed reviewer submits" },
      { name: "Policy-change impact mapping", description: "Identify affected procedures, teams, training, and controls when a policy changes.", value: 79, readiness: 90, risk: 28, hours: 300, systems: ["Policy library", "LMS", "Intranet"], owner: "Compliance Director", approval: "Policy owner publishes" },
      { name: "Safety-event triage support", description: "Group incident evidence and suggest investigation paths while protecting clinical judgment.", value: 90, readiness: 62, risk: 72, hours: 450, systems: ["Event reporting", "EHR", "Quality system"], owner: "Patient Safety Officer", approval: "Clinical leader determines action" },
    ],
  },
};
