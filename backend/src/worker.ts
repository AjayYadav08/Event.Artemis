import { prisma } from './lib/prisma';
import { startBackgroundWorker, stopBackgroundWorker } from './worker/workerRunner';

async function main() {
  console.log('Starting Event Artemis standalone background worker & scheduler...');
  await prisma.$connect();
  await startBackgroundWorker();
}

const shutdown = async () => {
  console.log('Shutting down Event Artemis worker...');
  await stopBackgroundWorker();
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

main().catch(async (err) => {
  console.error('Worker fatal error:', err);
  await prisma.$disconnect();
  process.exit(1);
});

