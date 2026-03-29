import { z } from 'zod';

export const sendToJarvisRequestSchema = z.object({
  message: z.string().trim().min(1).max(4000),
  reason: z.string().trim().min(1).max(500).optional(),
  mode: z.enum(['default', 'safe']).default('default'),
  idempotencyKey: z.string().trim().min(1).max(200).optional()
});

export const commandListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(20),
  targetType: z.string().trim().min(1).optional(),
  targetId: z.string().trim().min(1).optional(),
  type: z.string().trim().min(1).optional(),
  status: z.enum(['pending', 'approved', 'executing', 'succeeded', 'failed', 'cancelled']).optional()
});

export type SendToJarvisRequestInput = z.infer<typeof sendToJarvisRequestSchema>;
export type CommandListQueryInput = z.infer<typeof commandListQuerySchema>;
