import { z } from 'zod';
import { createEnvelopeSchema } from '../common/envelope';

export const BuildStartPayloadSchema = z.object({ configuration: z.enum(['Debug', 'Release']) });
export const BuildStopPayloadSchema = z.object({});
export const BuildCleanPayloadSchema = z.object({});

export const BuildStartCommandSchema = createEnvelopeSchema('build.start', BuildStartPayloadSchema);
export const BuildStopCommandSchema = createEnvelopeSchema('build.stop', BuildStopPayloadSchema);
export const BuildCleanCommandSchema = createEnvelopeSchema('build.clean', BuildCleanPayloadSchema);
