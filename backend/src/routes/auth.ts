import type { FastifyPluginAsync } from 'fastify';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../db.js';
import { config } from '../config.js';
import { issueTokens, publicUser } from '../lib/session.js';
import { hashToken } from '../lib/tokens.js';

const credentials = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email().max(254)),
  password: z.string().min(8).max(128),
  displayName: z.string().trim().max(80).optional(),
});
const refreshBody = z.object({ refreshToken: z.string().min(20).max(200) });

// A real hash to compare against when the email is unknown, so timing doesn't reveal which emails exist.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 12);

export const authRoutes: FastifyPluginAsync = async (app) => {
  const strict = { config: { rateLimit: { max: config.NODE_ENV === 'test' ? 1000 : 10, timeWindow: '1 minute' } } };

  app.post('/auth/register', strict, async (req, reply) => {
    const body = credentials.parse(req.body);
    const exists = await prisma.user.findUnique({ where: { email: body.email } });
    if (exists) return reply.code(409).send({ error: 'email_taken', message: 'An account with this email already exists.' });
    const user = await prisma.user.create({
      data: { email: body.email, passwordHash: await bcrypt.hash(body.password, 12), displayName: body.displayName ?? null },
    });
    return reply.code(201).send({ user: publicUser(user), ...(await issueTokens(app, user)) });
  });

  app.post('/auth/login', strict, async (req, reply) => {
    const body = credentials.pick({ email: true, password: true }).parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: body.email } });
    const ok = await bcrypt.compare(body.password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !ok) return reply.code(401).send({ error: 'invalid_credentials', message: 'Email or password is incorrect.' });
    return { user: publicUser(user), ...(await issueTokens(app, user)) };
  });

  // Rotates the refresh token. Presenting an already-used token revokes every session for that user.
  app.post('/auth/refresh', strict, async (req, reply) => {
    const { refreshToken } = refreshBody.parse(req.body);
    const row = await prisma.refreshToken.findUnique({ where: { tokenHash: hashToken(refreshToken) }, include: { user: true } });
    if (!row || row.expiresAt < new Date()) return reply.code(401).send({ error: 'invalid_refresh_token', message: 'Please sign in again.' });
    if (row.revokedAt) {
      await prisma.refreshToken.updateMany({ where: { userId: row.userId, revokedAt: null }, data: { revokedAt: new Date() } });
      return reply.code(401).send({ error: 'invalid_refresh_token', message: 'Please sign in again.' });
    }
    await prisma.refreshToken.update({ where: { id: row.id }, data: { revokedAt: new Date() } });
    return issueTokens(app, row.user);
  });

  app.post('/auth/logout', async (req, reply) => {
    const { refreshToken } = refreshBody.parse(req.body);
    await prisma.refreshToken.updateMany({ where: { tokenHash: hashToken(refreshToken), revokedAt: null }, data: { revokedAt: new Date() } });
    return reply.code(204).send();
  });
};
