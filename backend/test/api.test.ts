import { afterAll, beforeAll, describe, expect, it } from 'vitest';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'x'.repeat(48);
process.env.DATABASE_URL = 'file:./test.db';

const { buildApp } = await import('../src/app.js');
const { prisma } = await import('../src/db.js');

let app: Awaited<ReturnType<typeof buildApp>>;
beforeAll(async () => {
  app = await buildApp();
});
afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

const post = (url: string, payload: object, token?: string) =>
  app.inject({ method: 'POST', url: `/api/v1${url}`, payload, headers: token ? { authorization: `Bearer ${token}` } : {} });
const get = (url: string, token?: string) =>
  app.inject({ method: 'GET', url: `/api/v1${url}`, headers: token ? { authorization: `Bearer ${token}` } : {} });

async function register(email: string) {
  const res = await post('/auth/register', { email, password: 'password123', displayName: 'Asha' });
  expect(res.statusCode).toBe(201);
  return res.json() as { accessToken: string; refreshToken: string; user: { id: string } };
}

describe('auth', () => {
  it('registers, rejects duplicates, logs in and reads /me', async () => {
    const a = await register('Asha@Example.com');
    expect((await post('/auth/register', { email: 'asha@example.com', password: 'password123' })).statusCode).toBe(409);
    expect((await post('/auth/login', { email: 'asha@example.com', password: 'wrongpass1' })).statusCode).toBe(401);
    expect((await post('/auth/login', { email: 'asha@example.com', password: 'password123' })).statusCode).toBe(200);
    expect((await get('/me', a.accessToken)).json().email).toBe('asha@example.com');
    expect((await get('/me')).statusCode).toBe(401);
    expect((await post('/auth/register', { email: 'not-an-email', password: 'password123' })).statusCode).toBe(400);
  });

  it('rotates refresh tokens and revokes everything on reuse', async () => {
    const a = await register('rotate@example.com');
    const r1 = await post('/auth/refresh', { refreshToken: a.refreshToken });
    expect(r1.statusCode).toBe(200);
    expect((await post('/auth/refresh', { refreshToken: a.refreshToken })).statusCode).toBe(401);
    expect((await post('/auth/refresh', { refreshToken: r1.json().refreshToken })).statusCode).toBe(401);
  });
});

describe('sync', () => {
  it('pushes, pulls incrementally, resolves conflicts by last write, propagates deletes, isolates users', async () => {
    const a = await register('sync-a@example.com');
    const b = await register('sync-b@example.com');
    const t = a.accessToken;
    const entry = { id: 'e1', title: 'Scan', category: 'appointment', dayKey: '2026-12-01' };

    const push1 = await post('/sync/push', { changes: [{ collection: 'entries', id: 'e1', modifiedAt: 1000, data: entry }, { collection: 'documents', id: 'habits', modifiedAt: 1000, data: { list: [] } }] }, t);
    expect(push1.statusCode).toBe(200);
    expect(push1.json().accepted).toHaveLength(2);

    const pull1 = await get('/sync/pull?since=0', t);
    expect(pull1.json().changes).toHaveLength(2);
    const cursor = pull1.json().cursor as number;

    // An older write loses and the server copy comes back.
    const stale = await post('/sync/push', { changes: [{ collection: 'entries', id: 'e1', modifiedAt: 500, data: { ...entry, title: 'Old' } }] }, t);
    expect(stale.json().accepted).toHaveLength(0);
    expect(stale.json().conflicts[0].data.title).toBe('Scan');

    // A newer write wins and shows up in the next incremental pull only.
    await post('/sync/push', { changes: [{ collection: 'entries', id: 'e1', modifiedAt: 2000, data: { ...entry, title: 'Scan v2' } }] }, t);
    const pull2 = await get(`/sync/pull?since=${cursor}`, t);
    expect(pull2.json().changes).toHaveLength(1);
    expect(pull2.json().changes[0].data.title).toBe('Scan v2');

    // A delete becomes a tombstone.
    await post('/sync/push', { changes: [{ collection: 'entries', id: 'e1', modifiedAt: 3000, deleted: true }] }, t);
    const pull3 = await get(`/sync/pull?since=${pull2.json().cursor}`, t);
    expect(pull3.json().changes[0]).toMatchObject({ id: 'e1', deleted: true, data: null });

    // Another user sees nothing; unknown collections and missing data are rejected.
    expect((await get('/sync/pull', b.accessToken)).json().changes).toHaveLength(0);
    expect((await post('/sync/push', { changes: [{ collection: 'nope', id: 'x', modifiedAt: 1, data: {} }] }, t)).statusCode).toBe(400);
    expect((await post('/sync/push', { changes: [{ collection: 'entries', id: 'x', modifiedAt: 1 }] }, t)).statusCode).toBe(422);
  });

  it('deleting the account erases its data', async () => {
    const a = await register('gone@example.com');
    await post('/sync/push', { changes: [{ collection: 'entries', id: 'z', modifiedAt: 1, data: { id: 'z' } }] }, a.accessToken);
    const del = await app.inject({ method: 'DELETE', url: '/api/v1/me', headers: { authorization: `Bearer ${a.accessToken}` } });
    expect(del.statusCode).toBe(204);
    expect(await prisma.syncRecord.count({ where: { userId: a.user.id } })).toBe(0);
  });
});
