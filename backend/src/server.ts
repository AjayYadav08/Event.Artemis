import http from 'http';
import { createApp } from './app';
import { env } from './config/env';
import { prisma } from './lib/prisma';
import { initSocket } from './lib/socket';

const app = createApp();
const server = http.createServer(app);
initSocket(server);

server.listen(env.port, () => {
  console.log(`Event Artemis API running on http://localhost:${env.port}`);
  console.log(`Swagger Docs available at http://localhost:${env.port}/api/docs`);
});

const shutdown = async () => {
  console.log('Shutting down gracefully...');
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

