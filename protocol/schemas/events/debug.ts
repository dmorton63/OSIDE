import { z } from 'zod';
import { createEnvelopeSchema } from '../common/envelope';
import { BreakpointSchema, DebugSessionSchema, FrameSchema, MemoryChunkSchema, RegisterSchema, ThreadSchema, VariableSchema } from '../debug/types';

export const DebugSessionStartedEventSchema = createEnvelopeSchema('debug.sessionStarted', DebugSessionSchema);
export const DebugSessionEndedEventSchema = createEnvelopeSchema('debug.sessionEnded', z.object({ sessionId: z.string().min(1) }));
export const DebugPausedEventSchema = createEnvelopeSchema('debug.paused', z.object({ thread: ThreadSchema, frame: FrameSchema }));
export const DebugResumedEventSchema = createEnvelopeSchema('debug.resumed', z.object({ sessionId: z.string().min(1) }));
export const DebugStepCompleteEventSchema = createEnvelopeSchema('debug.stepComplete', z.object({ frame: FrameSchema }));
export const DebugBreakpointHitEventSchema = createEnvelopeSchema('debug.breakpointHit', z.object({ breakpoint: BreakpointSchema, frame: FrameSchema }));
export const DebugVariablesUpdatedEventSchema = createEnvelopeSchema('debug.variablesUpdated', z.object({ variables: z.array(VariableSchema) }));
export const DebugCallStackUpdatedEventSchema = createEnvelopeSchema('debug.callStackUpdated', z.object({ frames: z.array(FrameSchema) }));
export const DebugRegistersUpdatedEventSchema = createEnvelopeSchema('debug.registersUpdated', z.object({ registers: z.array(RegisterSchema) }));
export const DebugMemoryChunkEventSchema = createEnvelopeSchema('debug.memoryChunk', MemoryChunkSchema);
