import { z } from 'zod';

import { BuildCleanCommandSchema, BuildStartCommandSchema, BuildStopCommandSchema } from './commands/build';
import {
	DebugContinueCommandSchema,
	DebugEvaluateExpressionCommandSchema,
	DebugPauseCommandSchema,
	DebugReadMemoryCommandSchema,
	DebugRemoveBreakpointCommandSchema,
	DebugSetBreakpointCommandSchema,
	DebugStartCommandSchema,
	DebugStepIntoCommandSchema,
	DebugStepOutCommandSchema,
	DebugStepOverCommandSchema,
	DebugStopCommandSchema,
} from './commands/debug';
import { ProjectLoadMetadataCommandSchema, ProjectOpenFileCommandSchema, ProjectSaveFileCommandSchema } from './commands/project';
import { BuildCompleteEventSchema, BuildDiagnosticEventSchema, BuildOutputEventSchema } from './events/build';
import {
	DebugBreakpointHitEventSchema,
	DebugCallStackUpdatedEventSchema,
	DebugMemoryChunkEventSchema,
	DebugPausedEventSchema,
	DebugRegistersUpdatedEventSchema,
	DebugResumedEventSchema,
	DebugSessionEndedEventSchema,
	DebugSessionStartedEventSchema,
	DebugStepCompleteEventSchema,
	DebugVariablesUpdatedEventSchema,
} from './events/debug';
import { ProjectFileChangedEventSchema, ProjectMetadataLoadedEventSchema } from './events/project';

export * from './common/envelope';
export * from './common/error';
export * from './common/identifiers';
export * from './common/version';
export * from './commands/debug';
export * from './commands/build';
export * from './commands/project';
export * from './events/debug';
export * from './events/build';
export * from './events/project';
export * from './debug/types';
export * from './build/types';
export * from './project/types';

export const CommandSchema = z.union([
	DebugStartCommandSchema,
	DebugStopCommandSchema,
	DebugPauseCommandSchema,
	DebugContinueCommandSchema,
	DebugStepIntoCommandSchema,
	DebugStepOverCommandSchema,
	DebugStepOutCommandSchema,
	DebugSetBreakpointCommandSchema,
	DebugRemoveBreakpointCommandSchema,
	DebugReadMemoryCommandSchema,
	DebugEvaluateExpressionCommandSchema,
	BuildStartCommandSchema,
	BuildStopCommandSchema,
	BuildCleanCommandSchema,
	ProjectOpenFileCommandSchema,
	ProjectSaveFileCommandSchema,
	ProjectLoadMetadataCommandSchema,
]);

export const EventSchema = z.union([
	DebugSessionStartedEventSchema,
	DebugSessionEndedEventSchema,
	DebugPausedEventSchema,
	DebugResumedEventSchema,
	DebugStepCompleteEventSchema,
	DebugBreakpointHitEventSchema,
	DebugVariablesUpdatedEventSchema,
	DebugCallStackUpdatedEventSchema,
	DebugRegistersUpdatedEventSchema,
	DebugMemoryChunkEventSchema,
	BuildOutputEventSchema,
	BuildDiagnosticEventSchema,
	BuildCompleteEventSchema,
	ProjectFileChangedEventSchema,
	ProjectMetadataLoadedEventSchema,
]);

export const MessageSchema = z.union([CommandSchema, EventSchema]);

export type Command = z.infer<typeof CommandSchema>;
export type Event = z.infer<typeof EventSchema>;
export type Message = z.infer<typeof MessageSchema>;
