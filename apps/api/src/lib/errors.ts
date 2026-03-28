import type { ApiError } from '@mission-control/shared';

export class AppError extends Error {
  statusCode: number;
  code: string;
  details?: Record<string, unknown>;

  constructor(statusCode: number, code: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }

  toResponse(): ApiError {
    return { error: { code: this.code, message: this.message, details: this.details } };
  }
}
