import { execSync } from 'node:child_process';
import { rmSync } from 'node:fs';

// Runs once: a throwaway SQLite database built from the real migrations.
export default function setup() {
  process.env.DATABASE_URL = 'file:./test.db';
  rmSync('prisma/test.db', { force: true });
  execSync('npx prisma migrate deploy', { stdio: 'ignore', env: process.env });
  return () => rmSync('prisma/test.db', { force: true });
}
