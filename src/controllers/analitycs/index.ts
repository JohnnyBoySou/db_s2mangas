import { Request, Response } from 'express'
import prisma from '@/prisma/client';

export async function ping(req: Request, res: Response) {
  try {
    await prisma.$connect();
    res.status(200).json({ message: 'pong', dbStatus: 'connected' });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ error: 'Failed to connect to database' });
  } finally {
    await prisma.$disconnect();
  }
}