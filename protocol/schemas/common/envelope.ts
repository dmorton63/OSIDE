import { z } from 'zod';
import { RequestIdSchema } from './identifiers';
import { ProtocolVersionSchema } from './version';

export const createEnvelopeSchema = <TType extends string, TPayload extends z.ZodTypeAny>(type: TType, payload: TPayload) =>
  z.object({
    protocolVersion: ProtocolVersionSchema,
    type: z.literal(type),
    requestId: RequestIdSchema.optional(),
    payload,
  });
