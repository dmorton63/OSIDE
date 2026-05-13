import { z } from 'zod';

export const ErrorCodeSchema = z.enum([
  'invalid_message',
  'unknown_message_type',
  'validation_failed',
  'backend_unavailable',
  'request_timeout',
  'internal_error',
]);

export const ErrorPayloadSchema = z.object({
  code: ErrorCodeSchema,
  message: z.string().min(1),
  details: z.unknown().optional(),
});

export type ErrorPayload = z.infer<typeof ErrorPayloadSchema>;
