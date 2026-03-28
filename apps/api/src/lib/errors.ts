import type { ApiError } from '@mission-control/shared';
import type { FastifyReply } from 'fastify';

export const sendApiError = (
  reply: FastifyReply,
  statusCode: number,
  code: ApiError['error']['code'],
  message: string,
  details?: Record<string, unknown>,
) => {
  return reply.status(statusCode).send({
    error: {
      code,
      message,
      details,
    },
  } satisfies ApiError);
};
