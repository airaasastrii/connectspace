import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

// Prisma membuat semua query berparameter => aman dari SQL Injection.
export const prisma = new PrismaClient();
