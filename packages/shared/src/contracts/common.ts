import { z } from 'zod';

export const roleSchema = z.enum(['viewer', 'operator', 'admin', 'auditor']);

export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.string(), z.unknown()).optional()
  })
});
export type ApiError = z.infer<typeof apiErrorSchema>;

export const paginationSchema = z.object({
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().positive()
});
export type Pagination = z.infer<typeof paginationSchema>;

export type PaginatedResult<T> = {
  items: T[];
  pagination: Pagination;
};
