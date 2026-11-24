import type { FastifyInstance } from 'fastify';
import { prisma } from '../db.js';
import { config } from '../config.js';
import { hashToken, newRefreshToken } from './tokens.js';

// Issues an access token plus a fresh single-use refresh token for the user.
export async function issueTokens(app: FastifyInstance, user: { id: string; email: string }) {
  const refreshToken = newRefreshToken();
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + config.REFRESH_TOKEN_DAYS * 86_400_000),
    },
  });
  const accessToken = app.jwt.sign({ sub: user.id }, { expiresIn: config.ACCESS_TOKEN_TTL });
  return { accessToken, refreshToken };
}

export const publicUser = (u: { id: string; email: string; displayName: string | null; createdAt: Date }) => ({
  id: u.id,
  email: u.email,
  displayName: u.displayName,
  createdAt: u.createdAt,
});
