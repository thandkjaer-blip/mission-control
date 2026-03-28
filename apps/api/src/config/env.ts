export interface AppEnv {
  nodeEnv: string;
  host: string;
  port: number;
  logLevel: string;
  databaseUrl: string;
  redisUrl: string;
  authMode: 'dev' | 'disabled';
}

const required = (key: string, fallback?: string): string => {
  const value = process.env[key] ?? fallback;

  if (!value) {
    throw new Error(`Missing required env var: ${key}`);
  }

  return value;
};

export const loadEnv = (): AppEnv => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  host: process.env.HOST ?? '0.0.0.0',
  port: Number(process.env.PORT ?? '4001'),
  logLevel: process.env.LOG_LEVEL ?? 'info',
  databaseUrl: required(
    'DATABASE_URL',
    'postgresql://mission_control:mission_control@localhost:5432/mission_control',
  ),
  redisUrl: required('REDIS_URL', 'redis://localhost:6379'),
  authMode: (process.env.AUTH_MODE ?? 'dev') as AppEnv['authMode'],
});
