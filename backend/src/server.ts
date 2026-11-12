import http from 'http';
import { createApp } from './app';
import { env } from './config/env';
import { prisma } from './lib/prisma';
import { initSocket } from './lib/socket';
import { startBackgroundWorker, stopBackgroundWorker } from './worker/workerRunner';

const app = createApp();
const server = http.createServer(app);
initSocket(server);

server.listen(env.port, '0.0.0.0', () => {
  console.log(`Event Artemis API running on http://0.0.0.0:${env.port}`);
  console.log(`Allowed CORS origins: ${env.corsOrigins.join(', ')}`);
  console.log(`Swagger Docs available at http://0.0.0.0:${env.port}/api/docs`);
  if (env.worker.enableInProcess && env.nodeEnv !== 'test') {
    void startBackgroundWorker();
  }
});

const shutdown = async () => {
  console.log('Shutting down gracefully...');
  await stopBackgroundWorker();
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

