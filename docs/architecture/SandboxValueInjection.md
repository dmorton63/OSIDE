# Sandbox Value Injection

## Status

This is a future-feature design note. It is not part of the current Version 1 debugger implementation.

The purpose of sandbox value injection is to let a developer ask controlled what-if questions without mutating the live debug session.

## Goal

Let the developer test whether a suspicious value is responsible for an observed bad outcome.

Examples:

- What happens if `bootStage` is `2` instead of `1`?
- What happens if a null pointer is replaced with a valid test address?
- What happens if a failure code is overridden to the success path?

The feature should answer those questions in a clearly hypothetical way.

## Non-goals

- Editing live process state by default.
- Claiming the sandbox result proves the real fix.
- Supporting arbitrary heap surgery in the first version.
- Replacing test cases or real debugging with speculative execution.

## User experience

When paused on a frame, the user can choose a visible local, argument, or selected expression and run a sandbox experiment.

The UI should make the following explicit:

- original observed value
- proposed injected value
- whether the experiment is type-compatible
- whether the experiment succeeded or failed to run
- how the hypothetical outcome differed from the live path

Sandbox output should be shown as a comparison view:

- original return value or branch
- hypothetical return value or branch
- changed findings
- limits of the experiment

## Preconditions

These should exist before implementation:

1. Persistent debugger session support.
2. Reliable typed access to arguments, locals, and current frame context.
3. A way to snapshot or replay into an isolated execution context.
4. Stable source mapping so the result can point back to real code.
5. Clear UI state that distinguishes live values from hypothetical values.

The current staged snapshot debugger is not an adequate base for this feature beyond experiments.

## Safety model

Sandbox value injection must be isolated by design.

Rules:

- never mutate the live session unless the user explicitly requests an advanced unsafe operation
- treat every injected value as speculative
- keep sandbox output separate from ordinary stepping output
- discard sandbox state after the analysis completes unless explicit replay support exists
- mark results as low-confidence if hidden state makes the experiment unreliable

## Suggested architecture

### Layer 1: Live debugger session

Responsibilities:

- hold the authoritative paused state
- expose typed values eligible for sandboxing
- provide a capture point for isolated execution

### Layer 2: Sandbox runner

Responsibilities:

- clone or recreate the paused state
- apply one or more safe value substitutions
- execute a bounded analysis window
- capture output state and termination reason

### Layer 3: Comparison engine

Responsibilities:

- compare observed and hypothetical outcomes
- identify changed branches, return values, and locals
- emit a user-facing diff with confidence notes

## Initial scope

The first version should stay narrow.

Allowed targets:

- scalar arguments
- scalar locals
- boolean flags
- integer status codes

Deferred targets:

- arbitrary memory blocks
- pointer graph rewriting
- heap object reconstruction
- multi-threaded sandbox replay

## Analysis output model

Each sandbox result should include:

- `target`: the variable or expression being changed
- `originalValue`: observed live value
- `hypotheticalValue`: injected value
- `result`: changedReturn | changedBranch | noVisibleChange | failed
- `summary`: short explanation
- `differences`: flat list of changed observations
- `confidence`: low | medium | high
- `limitations`: flat list of caveats

## Protocol shape

These messages are design targets, not current protocol commitments.

Commands:

- `debug.sandbox.request`
- `debug.sandbox.cancel`

Events:

- `debug.sandbox.ready`
- `debug.sandbox.failed`

Example request payload:

```json
{
  "sessionId": "debug-1",
  "frameId": "frame-0",
  "target": {
    "kind": "local",
    "name": "bootStage"
  },
  "injection": {
    "type": "int",
    "value": "2"
  }
}
```

Example result payload:

```json
{
  "summary": "Changing bootStage from 1 to 2 causes InitializeScheduler to return true.",
  "result": "changedReturn",
  "confidence": "medium",
  "differences": [
    "Observed path returned statusCode = 1",
    "Hypothetical path returned statusCode = 0",
    "Hypothetical branch schedulerReady = true"
  ],
  "limitations": [
    "Only scalar local substitution was simulated.",
    "Heap and side-effect state was not reconstructed."
  ]
}
```

## Frontend integration

Recommended entry points:

- context action on a variable in the debug panel
- quick action beside the active execution line
- optional comparison drawer in the debug panel

Recommended presentation:

- original value and hypothetical value at top
- compact before/after summary
- changed outcomes list
- limitations list shown prominently

## Delivery phases

### Phase 1: Scalar local injection

Scope:

- pause-state scalar locals and arguments only
- bounded replay of a short execution window
- compare return value and selected locals

Success criteria:

- developer can test a single simple value without disturbing the live session

### Phase 2: Expression-target injection

Scope:

- derived expressions and selected fields
- richer change reporting

Success criteria:

- developer can test a slightly more realistic alternative state

### Phase 3: Structured-state sandboxing

Scope:

- small structs or bounded object state
- broader replay and comparison windows

Success criteria:

- sandbox remains credible without hiding its limitations

## Risks

- False confidence when the injected value violates hidden invariants.
- Poor performance if sandbox replay is too heavy for frequent use.
- User confusion if sandbox results are mixed with live debugger state.
- Excess scope if pointer-rich or concurrent state is allowed too early.

## Recommendation

Build this only after persistent-session support exists and after the look-ahead summary feature works.

Start with a narrow scalar-only sandbox, show explicit caveats, and never present a hypothetical outcome as proof of the real fix.