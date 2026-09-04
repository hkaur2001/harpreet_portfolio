CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  email text NOT NULL,
  role text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, email)
);

CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  name text NOT NULL,
  environment text NOT NULL,
  owner text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (organization_id, name, environment)
);

CREATE TABLE IF NOT EXISTS incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  service_id uuid REFERENCES services(id),
  external_id text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  severity text NOT NULL,
  status text NOT NULL,
  detected_at timestamptz NOT NULL,
  resolved_at timestamptz,
  created_by uuid REFERENCES users(id),
  assigned_to uuid REFERENCES users(id),
  root_cause text,
  confidence numeric(5,4),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, external_id)
);

CREATE TABLE IF NOT EXISTS incident_events (
  id bigserial PRIMARY KEY,
  incident_id uuid NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agent_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  agent_version text NOT NULL,
  model text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  status text NOT NULL,
  total_input_tokens integer NOT NULL DEFAULT 0,
  total_output_tokens integer NOT NULL DEFAULT 0,
  estimated_cost_usd numeric(12,6) NOT NULL DEFAULT 0,
  latency_ms integer,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS agent_steps (
  id bigserial PRIMARY KEY,
  agent_run_id uuid NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
  step_index integer NOT NULL,
  state text NOT NULL,
  reasoning_summary text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (agent_run_id, step_index)
);

CREATE TABLE IF NOT EXISTS tool_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_run_id uuid NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
  step_index integer NOT NULL,
  tool_name text NOT NULL,
  arguments jsonb NOT NULL,
  result jsonb,
  status text NOT NULL,
  latency_ms integer,
  risk_level integer NOT NULL,
  permission text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  agent_run_id uuid REFERENCES agent_runs(id) ON DELETE CASCADE,
  source_type text NOT NULL,
  source_id text,
  title text,
  content text NOT NULL,
  trust_classification text NOT NULL,
  observed_at timestamptz,
  relevance_score numeric(5,4),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS hypotheses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_run_id uuid NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
  hypothesis text NOT NULL,
  confidence numeric(5,4) NOT NULL,
  evidence_ids uuid[] NOT NULL DEFAULT '{}',
  status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS remediation_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  agent_run_id uuid NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
  action text NOT NULL,
  reason text NOT NULL,
  expected_impact text,
  risk_level integer NOT NULL,
  reversible boolean NOT NULL,
  requires_approval boolean NOT NULL,
  status text NOT NULL DEFAULT 'proposed',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  remediation_plan_id uuid NOT NULL REFERENCES remediation_plans(id) ON DELETE CASCADE,
  requested_from uuid REFERENCES users(id),
  decision text NOT NULL DEFAULT 'pending',
  decision_reason text,
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  remediation_plan_id uuid NOT NULL REFERENCES remediation_plans(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  status text NOT NULL,
  request_payload jsonb NOT NULL,
  result_payload jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  simulated boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS deployments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES services(id),
  deployment_id text NOT NULL,
  commit_sha text,
  version text,
  author text,
  deployed_at timestamptz NOT NULL,
  changes jsonb NOT NULL DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS runbooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  service_id uuid REFERENCES services(id),
  external_id text,
  title text NOT NULL,
  body text NOT NULL,
  version text,
  owner text,
  updated_at timestamptz NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  service_id uuid REFERENCES services(id),
  document_type text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  version text,
  owner text,
  severity text,
  environment text,
  updated_at timestamptz NOT NULL,
  embedding vector(1536),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS documents_embedding_hnsw ON documents USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS documents_metadata_gin ON documents USING gin (metadata);
CREATE INDEX IF NOT EXISTS evidence_incident_idx ON evidence (incident_id, source_type);
CREATE INDEX IF NOT EXISTS tool_calls_run_idx ON tool_calls (agent_run_id, step_index);

CREATE TABLE IF NOT EXISTS evaluation_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  incident_fixture jsonb NOT NULL,
  ground_truth jsonb NOT NULL,
  expected_tools text[] NOT NULL DEFAULT '{}',
  unsafe_actions text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS evaluation_trials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_task_id uuid NOT NULL REFERENCES evaluation_tasks(id) ON DELETE CASCADE,
  agent_version text NOT NULL,
  model text NOT NULL,
  run_id uuid REFERENCES agent_runs(id),
  status text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS evaluation_scores (
  id bigserial PRIMARY KEY,
  evaluation_trial_id uuid NOT NULL REFERENCES evaluation_trials(id) ON DELETE CASCADE,
  metric text NOT NULL,
  score numeric(7,4) NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id bigserial PRIMARY KEY,
  organization_id uuid REFERENCES organizations(id),
  incident_id uuid REFERENCES incidents(id),
  actor_type text NOT NULL,
  actor_id text,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
