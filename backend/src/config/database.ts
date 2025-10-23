import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

// Test connection
prisma.$connect()
  .then(() => console.log('Database connected'))
  .catch((error) => console.error('Database connection failed:', error));

export { prisma };