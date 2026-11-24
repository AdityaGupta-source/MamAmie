import type { FastifyPluginAsync } from 'fastify';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../db.js';
import { publicUser } from '../lib/session.js';

export const meRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('onRequest', app.authenticate);

  app.get('/me', async (req, reply) => {
    const user = await prisma.user.findUnique({ where: { id: req.user.sub } });
    if (!user) return reply.code(401).send({ error: 'unauthorized' });
    return publicUser(user);
  });

  app.patch('/me', async (req) => {
    const body = z.object({ displayName: z.string().trim().max(80).nullable() }).parse(req.body);
    return publicUser(await prisma.user.update({ where: { id: req.user.sub }, data: { displayName: body.displayName } }));
  });

  app.post('/me/password', { config: { rateLimit: { max: 5, timeWindow: '1 minute' } } }, async (req, reply) => {
    const body = z.object({ currentPassword: z.string().max(128), newPassword: z.string().min(8).max(128) }).parse(req.body);
    const user = await prisma.user.findUnique({ where: { id: req.user.sub } });
    if (!user || !(await bcrypt.compare(body.currentPassword, user.passwordHash)))
      return reply.code(403).send({ error: 'invalid_credentials', message: 'Current password is incorrect.' });
    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(body.newPassword, 12) } }),
      prisma.refreshToken.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: new Date() } }),
    ]);
    return reply.code(204).send();
  });

  // Erases the account and all of its synced health data (cascade).
  app.delete('/me', async (req, reply) => {
    await prisma.user.delete({ where: { id: req.user.sub } });
    return reply.code(204).send();
  });
};
