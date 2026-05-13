import { z } from 'zod';
import { createEnvelopeSchema } from '../common/envelope';
import { ProjectMetadataSchema } from '../project/types';

export const ProjectFileChangedEventSchema = createEnvelopeSchema('project.fileChanged', z.object({ path: z.string().min(1) }));
export const ProjectMetadataLoadedEventSchema = createEnvelopeSchema('project.metadataLoaded', ProjectMetadataSchema);
