import { z } from 'zod';
import { createEnvelopeSchema } from '../common/envelope';
import { BuildResultSchema, DiagnosticSchema } from '../build/types';

export const BuildOutputEventSchema = createEnvelopeSchema('build.output', z.object({ stream: z.enum(['stdout', 'stderr']), text: z.string() }));
export const BuildDiagnosticEventSchema = createEnvelopeSchema('build.diagnostic', DiagnosticSchema);
export const BuildCompleteEventSchema = createEnvelopeSchema('build.complete', BuildResultSchema);
