import { z } from 'zod';

export const PROTOCOL_VERSION = '1.0.0';
export const ProtocolVersionSchema = z.literal(PROTOCOL_VERSION);

export type ProtocolVersion = z.infer<typeof ProtocolVersionSchema>;
