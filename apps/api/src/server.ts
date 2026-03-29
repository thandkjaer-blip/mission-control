import { buildApp } from './app';
import { env } from './config/env';
import { startCommandExecutor } from './modules/commands/executor.js';

const app = await buildApp();
startCommandExecutor(app);

try {
  await app.listen({ port: env.PORT, host: '0.0.0.0' });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
