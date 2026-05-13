# Look-Ahead Debugger

## Status

This is a future-feature design note. It is not part of the current Version 1 debugger implementation.

The current debugger is a staged `gdb --batch` snapshot driver. That is enough for start, pause, stepping, variables, registers, and source-line updates, but it is not a strong foundation for look-ahead reasoning, sandbox experiments, or traceback analysis.

## Goal

Reduce time-to-diagnosis when a developer is paused on a suspicious call site or return value.

The feature should help answer questions such as:

- What is the next function likely to do with these inputs?
- Which argument or local value looks suspicious before I step over?
- If this function returns a bad value, where is the most likely upstream source?
- If I change one input in a safe sandbox, does the failure path disappear?

## Non-goals

- Replacing the debugger with an AI-driven execution engine.
- Claiming a single proven root cause when only heuristic evidence exists.
- Mutating the live debug session without explicit user intent.
- Supporting arbitrary reverse execution in Version 1.

## User experience

### Call-site look-ahead

When paused on a source line containing a function call, the user can request look-ahead analysis.

The UI should show:

- callee name
- current argument values
- relevant local state
- suspicious-value warnings
- likely branches or early-return conditions
- a short confidence-scored summary

### Bad-value traceback

When a suspicious return value or variable is selected, the UI should show ranked candidates rather than a single definitive answer.

Each candidate should include:

- source location
- why it is relevant
- whether it is observed, inferred, or simulated
- confidence level

### Sandboxed experiments

The UI may later allow a developer to test alternate values such as:

- passing `2` instead of `1`
- treating a null pointer as non-null
- toggling a state flag

Sandbox results must be clearly marked as hypothetical and isolated from the live session.

## Required prerequisites

These should be in place before implementation starts:

1. Persistent debugger session support using `gdb/mi` or equivalent.
2. Stable source mapping for the active frame and current line.
3. Reliable access to arguments, locals, registers, and stack frames.
4. Project-open and file-open state in the frontend so results can be tied to real source files.
5. A way to request analysis without blocking ordinary stepping.

The current staged snapshot debugger should not be extended directly to implement this feature beyond proof-of-concept experimentation.

## Suggested architecture

Treat debugger intelligence as a separate analysis layer above the debugger transport.

### Layer 1: Debug adapter

Responsibilities:

- maintain the live debug session
- provide frames, variables, registers, and source location
- expose call-site context
- support explicit sandbox/replay entry points later

### Layer 2: Analysis engine

Responsibilities:

- inspect the current frame and the next callee
- evaluate rule-based heuristics
- rank suspicious inputs and likely failure paths
- build traceback candidates from observed history and static hints
- run isolated experiments when sandbox support exists

### Layer 3: Explanation formatter

Responsibilities:

- convert raw analysis into short human-readable summaries
- separate observed facts from inferred guesses
- assign confidence bands
- provide evidence lists for UI rendering

## Analysis model

The first useful version should be rule-driven, not model-driven.

Initial rule families:

- null or invalid pointer used by callee
- integer or enum outside expected range
- suspicious zero, negative, or sentinel value
- unchecked failure code propagation
- branch likely to force an error return
- value copied from a recently suspicious upstream local

Each finding should produce structured output:

- `kind`: suspiciousArgument | suspiciousReturn | likelyFailurePath | tracebackCandidate
- `summary`: short user-facing explanation
- `evidence`: list of observed facts
- `confidence`: low | medium | high
- `sourceLocation`: optional file and line

## Protocol shape

These messages are design targets, not current protocol commitments.

Commands:

- `debug.lookAhead.request`
- `debug.traceback.request`
- `debug.sandbox.request`

Events:

- `debug.lookAhead.ready`
- `debug.traceback.ready`
- `debug.sandbox.ready`
- `debug.analysis.failed`

Example request payload:

```json
{
  "sessionId": "debug-1",
  "frameId": "frame-0",
  "target": {
    "kind": "callSite",
    "filePath": "samples/tinyos/src/kernel.cpp",
    "line": 16
  }
}
```

Example result payload:

```json
{
  "summary": "InitializeScheduler is likely to return false because bootStage is 1.",
  "confidence": "high",
  "findings": [
    {
      "kind": "likelyFailurePath",
      "summary": "The comparison bootStage > 1 will evaluate to false.",
      "evidence": [
        "Observed local bootStage = 1",
        "Observed callee condition bootStage > 1"
      ],
      "confidence": "high",
      "sourceLocation": {
        "filePath": "samples/tinyos/src/kernel.cpp",
        "line": 10
      }
    }
  ]
}
```

## Frontend integration

The first UI should be lightweight.

Recommended entry points:

- context action near the active execution line
- button in the debug toolbar when paused on a call site
- side panel section showing latest analysis result

Recommended presentation:

- one-sentence summary at top
- flat list of findings
- explicit confidence and evidence tags
- direct jump-to-source links when available

## Delivery phases

### Phase 1: Look-ahead summary

Scope:

- analyze the next callee at the paused call site
- inspect arguments and relevant locals
- emit rule-based warnings and likely branch outcomes
- no live mutation
- no backward execution

Success criteria:

- user gets a short explanation before stepping over
- explanation references concrete values and source lines

### Phase 2: Sandboxed alternate values

Scope:

- run isolated what-if experiments
- compare original and hypothetical outcomes
- label output as simulated

Success criteria:

- user can test a small value change without disturbing the live session

### Phase 3: Ranked traceback

Scope:

- surface likely upstream writes, callers, or state transitions
- combine observed history with static source hints
- still avoid claiming certainty when evidence is incomplete

Success criteria:

- user gets a ranked suspect list with evidence

## Risks

- False confidence if inferred results are presented as facts.
- Slow analysis if tied directly to stepping latency.
- Misleading sandbox results if hidden invariants are violated.
- Excess scope if traceback is attempted before persistent-session support exists.

## Recommendation

Do not implement this feature on top of the current snapshot-stage debugger except for throwaway experiments.

The next real prerequisite is a persistent debugger session. After that, implement Phase 1 only, keep the UI compact, and require every finding to include evidence and confidence.