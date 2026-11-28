import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db.js';

// Mirrors what the app keeps in AsyncStorage. `documents` holds singletons by name
// (profile, habits, checks, hydration, settings); the rest are lists of records with a stable id.
export const COLLECTIONS = [
  'entries',
  'medicationSchedules',
  'doseLogs',
  'kickSessions',
  'contractions',
  'documents',
  'meals',
  'chats',
  'readings',
] as const;

const MAX_RECORD_BYTES = 256 * 1024;
const MAX_PUSH = 500;

const change = z.object({
  collection: z.enum(COLLECTIONS),
  id: z.string().min(1).max(200),
  // Client's modifiedAt in ms. Last write wins on this value.
  modifiedAt: z.number().int().nonnegative(),
  deleted: z.boolean().default(false),
  data: z.record(z.string(), z.unknown()).nullish(),
});
const pushBody = z.object({ changes: z.array(change).max(MAX_PUSH) });
const pullQuery = z.object({
  since: z.coerce.number().int().nonnegative().default(0),
  limit: z.coerce.number().int().min(1).max(MAX_PUSH).default(MAX_PUSH),
});

type Row = { collection: string; recordId: string; data: string; clientModifiedAt: bigint; deleted: boolean; serverVersion: number };
const toWire = (r: Row) => ({
  collection: r.collection,
  id: r.recordId,
  modifiedAt: Number(r.clientModifiedAt),
  deleted: r.deleted,
  data: r.deleted ? null : JSON.parse(r.data),
  version: r.serverVersion,
});

export const syncRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('onRequest', app.authenticate);

  // Returns everything changed after `since` (the `cursor` from the previous response; 0 for a full pull).
  app.get('/sync/pull', async (req) => {
    const { since, limit } = pullQuery.parse(req.query);
    const rows = await prisma.syncRecord.findMany({
      where: { userId: req.user.sub, serverVersion: { gt: since } },
      orderBy: { serverVersion: 'asc' },
      take: limit + 1,
    });
    const page = rows.slice(0, limit);
    return {
      changes: page.map(toWire),
      cursor: page.length ? page[page.length - 1]!.serverVersion : since,
      hasMore: rows.length > limit,
    };
  });

  // Applies a batch of local changes. A change older than the server's copy is rejected and the
  // server copy is returned in `conflicts` so the app can adopt it.
  app.post('/sync/push', { bodyLimit: 4 * 1024 * 1024 }, async (req, reply) => {
    const { changes } = pushBody.parse(req.body);
    const userId = req.user.sub;

    for (const c of changes) {
      if (!c.deleted && (!c.data || Buffer.byteLength(JSON.stringify(c.data)) > MAX_RECORD_BYTES))
        return reply.code(422).send({ error: 'invalid_record', message: `Record ${c.collection}/${c.id} is missing data or is too large.` });
    }

    return prisma.$transaction(async (tx) => {
      let { syncVersion } = await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { syncVersion: true } });
      const accepted: string[] = [];
      const conflicts: ReturnType<typeof toWire>[] = [];

      for (const c of changes) {
        const where = { userId_collection_recordId: { userId, collection: c.collection, recordId: c.id } };
        const existing = await tx.syncRecord.findUnique({ where });
        if (existing && existing.clientModifiedAt > BigInt(c.modifiedAt)) {
          conflicts.push(toWire(existing));
          continue;
        }
        syncVersion += 1;
        const fields = {
          data: c.deleted ? '{}' : JSON.stringify(c.data),
          clientModifiedAt: BigInt(c.modifiedAt),
          deleted: c.deleted,
          serverVersion: syncVersion,
        };
        await tx.syncRecord.upsert({
          where,
          create: { userId, collection: c.collection, recordId: c.id, ...fields },
          update: fields,
        });
        accepted.push(`${c.collection}/${c.id}`);
      }
      await tx.user.update({ where: { id: userId }, data: { syncVersion } });
      return { accepted, conflicts, cursor: syncVersion };
    });
  });
};
