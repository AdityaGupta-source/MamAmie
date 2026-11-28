import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  CORS_ORIGINS: z.string().default(''),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_DAYS: z.coerce.number().default(60),
  GEMINI_API_KEY: z.string().default(''),
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_FILE_BYTES: z.coerce.number().default(10 * 1024 * 1024),
});

export const config = schema.parse(process.env);
