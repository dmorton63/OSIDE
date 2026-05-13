import { z } from 'zod';

export const ProjectMetadataSchema = z.object({
  name: z.string().min(1),
  type: z.literal('oside.os-project'),
  toolchainPrefix: z.string().min(1),
  includePaths: z.array(z.string().min(1)),
  linkerScript: z.string().min(1),
  modules: z.array(z.string().min(1)),
});

export const FileStateSchema = z.object({
  path: z.string().min(1),
  dirty: z.boolean(),
});

export const ModuleStateSchema = z.object({
  name: z.string().min(1),
  sourceFiles: z.array(z.string().min(1)),
  buildFlags: z.array(z.string().min(1)),
});

export const WorkspaceStateSchema = z.object({
  projectName: z.string().min(1),
  buildConfiguration: z.string().min(1),
  openFiles: z.array(FileStateSchema),
  modules: z.array(ModuleStateSchema),
});
