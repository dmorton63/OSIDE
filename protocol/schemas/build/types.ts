import { z } from 'zod';

export const BuildConfigurationSchema = z.object({
  name: z.enum(['Debug', 'Release']),
  optimization: z.string().min(1),
  debugSymbols: z.boolean(),
  toolchainPrefix: z.string().min(1),
});

export const DiagnosticSchema = z.object({
  filePath: z.string().min(1),
  line: z.number().int().positive(),
  column: z.number().int().positive().optional(),
  severity: z.enum(['error', 'warning', 'info']),
  message: z.string().min(1),
});

export const ArtifactSchema = z.object({
  kind: z.enum(['object', 'kernel', 'module', 'map', 'log']),
  path: z.string().min(1),
});

export const BuildResultSchema = z.object({
  success: z.boolean(),
  diagnostics: z.array(DiagnosticSchema),
  artifacts: z.array(ArtifactSchema),
});
