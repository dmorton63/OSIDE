import { z } from 'zod';
import { createEnvelopeSchema } from '../common/envelope';

export const DebugStartPayloadSchema = z.object({ target: z.string().min(1) });
export const DebugStopPayloadSchema = z.object({});
export const DebugPausePayloadSchema = z.object({});
export const DebugContinuePayloadSchema = z.object({});
export const DebugStepIntoPayloadSchema = z.object({});
export const DebugStepOverPayloadSchema = z.object({});
export const DebugStepOutPayloadSchema = z.object({});
export const DebugSetBreakpointPayloadSchema = z.object({ filePath: z.string().min(1), line: z.number().int().positive() });
export const DebugRemoveBreakpointPayloadSchema = z.object({ breakpointId: z.string().min(1) });
export const DebugReadMemoryPayloadSchema = z.object({ address: z.string().min(1), length: z.number().int().positive() });
export const DebugEvaluateExpressionPayloadSchema = z.object({ expression: z.string().min(1) });

export const DebugStartCommandSchema = createEnvelopeSchema('debug.start', DebugStartPayloadSchema);
export const DebugStopCommandSchema = createEnvelopeSchema('debug.stop', DebugStopPayloadSchema);
export const DebugPauseCommandSchema = createEnvelopeSchema('debug.pause', DebugPausePayloadSchema);
export const DebugContinueCommandSchema = createEnvelopeSchema('debug.continue', DebugContinuePayloadSchema);
export const DebugStepIntoCommandSchema = createEnvelopeSchema('debug.stepInto', DebugStepIntoPayloadSchema);
export const DebugStepOverCommandSchema = createEnvelopeSchema('debug.stepOver', DebugStepOverPayloadSchema);
export const DebugStepOutCommandSchema = createEnvelopeSchema('debug.stepOut', DebugStepOutPayloadSchema);
export const DebugSetBreakpointCommandSchema = createEnvelopeSchema('debug.setBreakpoint', DebugSetBreakpointPayloadSchema);
export const DebugRemoveBreakpointCommandSchema = createEnvelopeSchema('debug.removeBreakpoint', DebugRemoveBreakpointPayloadSchema);
export const DebugReadMemoryCommandSchema = createEnvelopeSchema('debug.readMemory', DebugReadMemoryPayloadSchema);
export const DebugEvaluateExpressionCommandSchema = createEnvelopeSchema('debug.evaluateExpression', DebugEvaluateExpressionPayloadSchema);
