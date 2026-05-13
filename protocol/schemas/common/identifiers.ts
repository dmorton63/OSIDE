import { z } from 'zod';

export const RequestIdSchema = z.string().min(1);
export const SessionIdSchema = z.string().min(1);
export const ThreadIdSchema = z.string().min(1);
export const FrameIdSchema = z.string().min(1);
export const FileIdSchema = z.string().min(1);
export const ModuleIdSchema = z.string().min(1);
