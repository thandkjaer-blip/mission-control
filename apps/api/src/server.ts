import { buildApp } from './app.js';

const start = async () => {
  const app = buildApp();

  try {
    await app.listen({
      host: app.appEnv.host,
      port: app.appEnv.port,
    });
  } catch (error) {
    app.log.error(error);
    process.exitCode = 1;
  }
};

void start();
