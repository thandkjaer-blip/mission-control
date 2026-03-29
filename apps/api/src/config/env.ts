import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4001),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  MISSION_CONTROL_AUTH_MODE: z.enum(['dev']).default('dev'),
  OPENCLAW_SESSION_INDEX_PATH: z.string().default('/home/open/.openclaw/agents/main/sessions/sessions.json'),
  OPENCLAW_SESSION_SOURCE_ROOT: z.string().optional(),
  RUNTIME_REFRESH_ENABLED: z.coerce.boolean().default(true)
});

export type AppEnv = z.infer<typeof envSchema>;

export const env = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT ?? process.env.API_PORT,
  LOG_LEVEL: process.env.LOG_LEVEL,
  DATABASE_URL: process.env.DATABASE_URL,
  REDIS_URL: process.env.REDIS_URL,
  MISSION_CONTROL_AUTH_MODE: process.env.MISSION_CONTROL_AUTH_MODE,
  OPENCLAW_SESSION_INDEX_PATH: process.env.OPENCLAW_SESSION_INDEX_PATH,
  OPENCLAW_SESSION_SOURCE_ROOT: process.env.OPENCLAW_SESSION_SOURCE_ROOT,
  RUNTIME_REFRESH_ENABLED: process.env.MISSION_CONTROL_RUNTIME_REFRESH_ENABLED ?? process.env.RUNTIME_REFRESH_ENABLED
});
