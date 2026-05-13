import { z } from 'zod';
import { FileIdSchema, FrameIdSchema, ModuleIdSchema, SessionIdSchema, ThreadIdSchema } from '../common/identifiers';

export const BreakpointSchema = z.object({
  id: z.string().min(1),
  fileId: FileIdSchema,
  line: z.number().int().positive(),
  condition: z.string().min(1).optional(),
  enabled: z.boolean(),
});

export const DebugSessionSchema = z.object({
  sessionId: SessionIdSchema,
  status: z.enum(['running', 'paused', 'stopped']),
  target: z.string().min(1),
  moduleIds: z.array(ModuleIdSchema),
});

export const ThreadSchema = z.object({
  threadId: ThreadIdSchema,
  name: z.string().optional(),
  status: z.enum(['running', 'paused', 'stopped']),
  activeFrameId: FrameIdSchema.optional(),
});

export const FrameSchema = z.object({
  frameId: FrameIdSchema,
  filePath: z.string().min(1),
  line: z.number().int().positive(),
  functionName: z.string().min(1),
});

export const VariableSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  value: z.string(),
  address: z.string().optional(),
  hasChildren: z.boolean().default(false),
});

export const RegisterSchema = z.object({
  name: z.string().min(1),
  value: z.string().min(1),
  category: z.enum(['gpr', 'fpu', 'simd']),
  changed: z.boolean().default(false),
});

export const MemoryChunkSchema = z.object({
  address: z.string().min(1),
  bytes: z.array(z.number().int().min(0).max(255)),
  ascii: z.string(),
});
