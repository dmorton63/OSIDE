import { z } from 'zod';
import { createEnvelopeSchema } from '../common/envelope';

export const ProjectOpenFilePayloadSchema = z.object({ path: z.string().min(1) });
export const ProjectSaveFilePayloadSchema = z.object({ path: z.string().min(1), content: z.string() });
export const ProjectLoadMetadataPayloadSchema = z.object({ rootPath: z.string().min(1) });

export const ProjectOpenFileCommandSchema = createEnvelopeSchema('project.openFile', ProjectOpenFilePayloadSchema);
export const ProjectSaveFileCommandSchema = createEnvelopeSchema('project.saveFile', ProjectSaveFilePayloadSchema);
export const ProjectLoadMetadataCommandSchema = createEnvelopeSchema('project.loadMetadata', ProjectLoadMetadataPayloadSchema);
