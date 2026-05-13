# Architecture notes

## Debugger architecture boundary

The current debugger implementation is focused on reliable session control, pause state capture, and source/variable visibility. Advanced reasoning features such as look-ahead analysis, bad-value traceback, and hypothetical input testing are intentionally outside the present debugger boundary.

When this work begins, it should be treated as a separate analysis layer on top of the debugger rather than folded into basic stepping logic.

Planned layering:

1. Persistent debugger session with stable frame, variable, and source-line state.
2. Call-site analysis that can inspect arguments, locals, and callee metadata.
3. Optional sandbox/replay path for alternate-value experiments.
4. Heuristic traceback that reports likely origin points with confidence, not certainty.

This keeps the core debugger dependable while leaving room for smarter analysis later.
