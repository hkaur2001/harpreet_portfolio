# Evaluation framework

The portfolio treats evaluation as part of the product, not a final demo score.

## Evaluation model

Each project is evaluated at three layers:

1. **Deterministic checks** - code-based pass/fail rules for things that should never be subjective, such as authorization, required citations, source URLs, action approval, copied phrase length, and schema validity.
2. **Model-based graders** - rubric-driven LLM judges for qualities that are semantic or subjective, such as relevance, groundedness, style fidelity, synthesis, and actionability.
3. **Human/product signals** - blind preference, task completion, edit rate, adoption, and incident-resolution outcomes when real users are available.

The goal is not one impressive percentage. The goal is a set of launch gates that map to the ways the system can fail.

## Industry-style workflow

### 1. Specify
Define the job, the user, the failure modes, and what "good" means before optimizing prompts or models.

### 2. Build a golden dataset
Create representative inputs with expected outputs, required evidence, forbidden behavior, and difficult edge cases. Production failures are continuously added back to this set.

### 3. Measure components and end-to-end behavior
Evaluate retrieval, tool choice, policy behavior, generation, and final task success separately. This makes failures diagnosable.

### 4. Repeat stochastic tests
Model outputs can vary. Important model-quality cases should run multiple trials and report mean, variance, and worst-case behavior rather than a single lucky run.

### 5. Slice results
Aggregate scores can hide problems. Results should be broken down by scenario, source type, identity/permission level, risk class, format, and failure mode.

### 6. Gate releases
Security and policy failures are hard blockers. Subjective metrics can use thresholds. A new version should not ship when it regresses a critical slice.

### 7. Monitor production
Offline evals continue after launch. Sample real traces, run online/reference-free graders where appropriate, collect user feedback, and promote new failure cases into the golden dataset.

## Project-specific evaluation

### Sentinel
- Correct root-cause class
- Correct tool selection / trajectory
- Evidence sufficiency
- Approval-policy compliance
- Prompt-injection resistance
- Recovery verification
- Latency and cost

Hard launch gates: zero policy bypasses, zero destructive actions outside simulation, complete tool schemas.

### Secure Knowledge Assistant
- Retrieval relevance
- Groundedness
- Answer relevance
- Reference-answer correctness where a gold answer exists
- Citation coverage
- Permission leakage
- Abstention when authorized evidence is insufficient

Hard launch gate: zero restricted-document leakage.

### Voiceprint Studio
- Style fidelity
- Brief adherence
- Platform fit
- Originality / copied phrase length
- Human blind preference
- Edit distance from final human-approved copy

Hard launch gate: no high-risk verbatim copying.

### SignalBrief
- Goal relevance
- Source diversity and source quality
- Freshness
- Citation coverage
- Synthesis quality
- Actionability
- Redundancy

Hard launch gate: no fabricated sources or silent claims of source coverage.

### AI Policy Radar
This is primarily deterministic software, so evaluation focuses on data quality rather than an LLM judge:
- API availability / graceful degradation
- Required-field normalization
- Source-link validity
- Freshness
- Duplicate handling
- Cache behavior

Hard launch gate: never fabricate or silently replace unavailable source data.

## Why multiple grader types matter

A code rule is best when the answer is objective. An LLM judge is useful when a rubric requires semantic judgment. Human review remains the gold standard for taste, business usefulness, and high-impact decisions. Strong evaluation systems combine all three rather than asking an LLM to grade everything.
