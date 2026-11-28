import type { FastifyPluginAsync } from 'fastify';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { prisma } from '../db.js';
import { config } from '../config.js';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] as const;

const uploadBody = z.object({
  filename: z.string().trim().min(1).max(200),
  mimeType: z.enum(ALLOWED_MIME_TYPES),
  dataBase64: z.string().min(1),
});

const idParams = z.object({
  id: z.string().min(1).max(128),
});

function userUploadDir(userId: string) {
  return path.resolve(config.UPLOAD_DIR, userId);
}

export async function deleteUserFiles(userId: string) {
  await fs.rm(userUploadDir(userId), { recursive: true, force: true });
}

export const filesRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('onRequest', app.authenticate);

  // Phase 8: Upload a vault attachment (image or PDF) scoped to the authenticated user.
  app.post('/files', { bodyLimit: 16 * 1024 * 1024 }, async (req, reply) => {
    const { filename, mimeType, dataBase64 } = uploadBody.parse(req.body);
    const cleaned = dataBase64.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(cleaned, 'base64');

    if (buffer.byteLength === 0 || buffer.byteLength > config.MAX_FILE_BYTES) {
      return reply.code(413).send({
        error: 'file_too_large',
        message: `File must be between 1 byte and ${config.MAX_FILE_BYTES} bytes.`,
      });
    }

    const userId = req.user.sub;
    const storageKey = `${randomUUID()}${path.extname(filename).slice(0, 12)}`;
    const dir = userUploadDir(userId);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, storageKey), buffer);

    const attachment = await prisma.attachment.create({
      data: {
        userId,
        filename,
        mimeType,
        sizeBytes: buffer.byteLength,
        storageKey,
      },
      select: {
        id: true,
        filename: true,
        mimeType: true,
        sizeBytes: true,
        createdAt: true,
      },
    });

    return reply.code(201).send(attachment);
  });

  app.get('/files', async (req) => {
    const items = await prisma.attachment.findMany({
      where: { userId: req.user.sub },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        filename: true,
        mimeType: true,
        sizeBytes: true,
        createdAt: true,
      },
    });
    return { files: items };
  });

  app.get('/files/:id', async (req, reply) => {
    const { id } = idParams.parse(req.params);
    const attachment = await prisma.attachment.findFirst({
      where: { id, userId: req.user.sub },
    });
    if (!attachment) {
      return reply.code(404).send({ error: 'not_found', message: 'File not found.' });
    }

    const filePath = path.join(userUploadDir(req.user.sub), attachment.storageKey);
    try {
      const bytes = await fs.readFile(filePath);
      const safeName = attachment.filename.replace(/["\r\n]/g, '_');
      return reply
        .header('Content-Type', attachment.mimeType)
        .header('Content-Disposition', `inline; filename="${safeName}"`)
        .send(bytes);
    } catch {
      return reply.code(404).send({ error: 'not_found', message: 'File bytes missing.' });
    }
  });

  app.delete('/files/:id', async (req, reply) => {
    const { id } = idParams.parse(req.params);
    const attachment = await prisma.attachment.findFirst({
      where: { id, userId: req.user.sub },
    });
    if (!attachment) {
      return reply.code(404).send({ error: 'not_found', message: 'File not found.' });
    }

    await prisma.attachment.delete({ where: { id: attachment.id } });
    await fs.rm(path.join(userUploadDir(req.user.sub), attachment.storageKey), { force: true });
    return { deleted: true, id: attachment.id };
  });
};
