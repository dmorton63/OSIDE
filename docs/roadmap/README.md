# Roadmap

## Deferred debugger intelligence

The following debugger features are explicitly deferred until the core build and live-debugging workflow is stable:

- Look-ahead call analysis that inspects the next callee before or during a step-over and explains likely failure paths.
- Traceback analysis that ranks likely upstream sources of a bad return value, corrupted field, or invalid argument.
- Sandboxed alternate-value experiments that test hypothetical inputs outside the live session.
- Editor-level execution highlighting that follows the active source line during debugging.

These features are future work, not Version 1 commitments. They should not block current debugger delivery.

## Future design constraints

Any implementation of debugger intelligence should follow these rules:

- Treat results as investigative guidance, not authoritative proof.
- Prefer ranked suspects, confidence notes, and observed evidence over absolute claims.
- Keep speculative analysis isolated from the live debug session unless the user explicitly accepts state changes.
- Build on a persistent debugger session and richer execution history before attempting automated traceback.
- Support incremental delivery: call-site explanation first, sandbox experiments second, backward tracing last.
