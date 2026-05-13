# Traceback Analysis

## Status

This is a future-feature design note. It is not part of the current Version 1 debugger implementation.

Traceback analysis is meant to help explain where suspicious data most likely came from when the developer is looking at a bad return value, invalid field, or unexpected branch outcome.

## Goal

Shorten the path from observing a bad value to identifying the most likely upstream source.

The feature should help answer questions such as:

- Where did this bad return value first become likely?
- Which caller probably supplied the wrong argument?
- Which assignment or state transition most likely introduced this corrupted value?
- What source locations deserve inspection first?

## Non-goals

- Claiming a mathematically proven origin when only partial evidence exists.
- Replacing record/replay debugging with guesses.
- Providing full reverse execution in the first version.
- Hiding uncertainty behind confident summaries.

## User experience

When the user selects a suspicious value, the UI should produce a ranked list of candidate origins.

Each candidate should show:

- source location
- candidate category such as caller, assignment, branch, or state transition
- why the candidate is relevant
- whether the evidence is observed, inferred, or simulated
- confidence level

The output should feel like a guided suspect list, not a verdict.

## Preconditions

These should exist before implementation:

1. Persistent debugger session support.
2. Stable call stack, frame, variable, and source-line state.
3. A way to inspect recent execution context or replay targeted slices.
4. Project-open and file-open support so candidates can jump to real source.
5. A compact evidence model shared with look-ahead and sandbox results.

High-quality traceback becomes much stronger if record/replay or history capture exists, but a limited heuristic version can exist earlier.

## Evidence model

Traceback findings should distinguish between three evidence classes:

- observed: directly seen in the live or replayed session
- inferred: reasoned from source, control flow, or current values
- simulated: derived from sandbox or replay experiments

Every candidate must carry one of those labels.

## Suggested architecture

### Layer 1: Observation collector

Responsibilities:

- collect current frame, caller frames, locals, and active source location
- capture recent debugger events and value changes when available
- expose candidate source references

### Layer 2: Candidate generator

Responsibilities:

- propose likely caller origins
- propose likely local assignments
- propose likely state transitions and branch decisions
- merge static hints with observed runtime context

### Layer 3: Ranking engine

Responsibilities:

- score candidates by proximity, evidence strength, and control-flow relevance
- demote weak guesses
- produce a flat suspect list with confidence bands

## Candidate families

The initial version should consider a short, explicit set of candidate types:

- direct caller supplied suspicious argument
- current-frame assignment introduced suspicious value
- branch prevented initialization or forced fallback path
- propagated failure code from earlier call
- struct field copied from suspicious upstream source

Deferred candidate families:

- cross-thread races
- DMA or device-driven mutation
- arbitrary memory corruption with no execution history
- long-range reverse taint across unrelated modules

## Output model

Each candidate should include:

- `kind`: caller | assignment | branch | propagatedFailure | stateTransition
- `summary`: short explanation
- `sourceLocation`: file and line when available
- `evidence`: flat list of facts
- `evidenceClass`: observed | inferred | simulated
- `confidence`: low | medium | high
- `rank`: integer order

## Protocol shape

These messages are design targets, not current protocol commitments.

Commands:

- `debug.traceback.request`

Events:

- `debug.traceback.ready`
- `debug.traceback.failed`

Example request payload:

```json
{
  "sessionId": "debug-1",
  "frameId": "frame-0",
  "target": {
    "kind": "local",
    "name": "statusCode"
  }
}
```

Example result payload:

```json
{
  "summary": "statusCode is most likely derived from bootStage after scheduler initialization failed.",
  "candidates": [
    {
      "rank": 1,
      "kind": "propagatedFailure",
      "summary": "statusCode copies bootStage when schedulerReady is false.",
      "sourceLocation": {
        "filePath": "samples/tinyos/src/kernel.cpp",
        "line": 18
      },
      "evidence": [
        "Observed statusCode = bootStage in current frame",
        "Observed schedulerReady = false",
        "Observed bootStage = 1"
      ],
      "evidenceClass": "observed",
      "confidence": "high"
    },
    {
      "rank": 2,
      "kind": "caller",
      "summary": "bootStage originated from DetectBootStage returning 1.",
      "sourceLocation": {
        "filePath": "samples/tinyos/src/kernel.cpp",
        "line": 16
      },
      "evidence": [
        "Observed local bootStage = 1",
        "Observed assignment from DetectBootStage()"
      ],
      "evidenceClass": "inferred",
      "confidence": "medium"
    }
  ]
}
```

## Frontend integration

Recommended entry points:

- variable context action in the debug panel
- button in an analysis drawer after a suspicious result is detected
- optional follow-up action from look-ahead results

Recommended presentation:

- single summary sentence
- ranked flat candidate list
- evidence chips or short lists
- direct jump-to-source action for each candidate

## Delivery phases

### Phase 1: Heuristic caller and assignment ranking

Scope:

- current frame and immediate callers only
- source and runtime hint fusion
- ranked suspects with confidence and evidence

Success criteria:

- developer gets a useful shortlist instead of raw stack/frame data alone

### Phase 2: Replay-assisted traceback

Scope:

- use limited replay or history capture
- upgrade some inferred evidence to observed evidence

Success criteria:

- traceback quality improves without pretending to be exact reverse execution

### Phase 3: Rich history-backed tracing

Scope:

- integrate stronger event history, checkpoints, or record/replay
- broaden candidate quality and confidence

Success criteria:

- tool can explain more upstream failures with less guesswork

## Risks

- Misleading users if inferred candidates are phrased as facts.
- Weak ranking if execution history is too shallow.
- Scope explosion if reverse execution is treated as an immediate requirement.
- Poor trust if confidence levels are inconsistent across analyses.

## Recommendation

Do not begin with full reverse-debugger ambitions.

Start with a constrained heuristic suspect list based on current-frame data, immediate callers, and obvious propagation patterns. Only deepen the feature after persistent-session support and at least limited replay or history capture exist.