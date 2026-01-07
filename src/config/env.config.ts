import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().default(3000),

  DATABASE_URL: z.string().url(),

  JWT_SECRET: z.string().min(10),
  JWT_ACCESS_TOKEN_TTL: z.string().default('15m'),
  JWT_REFRESH_TOKEN_TTL: z.string().default('7d'),
  CORS_ORIGINS: z.string(),
  // Rate Limiting
  THROTTLE_TTL: z.coerce.number().default(60000), // Default 1 min
  THROTTLE_LIMIT: z.coerce.number().default(100),
  // EMAIL (SMTP)
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().min(1),
  SMTP_PASS: z.string().min(1),

  MAIL_FROM: z.string().default('"No Reply" <noreply@gmail.com>'),

  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
});

export type EnvVars = z.infer<typeof envSchema>;

export const validate = (config: Record<string, unknown>) => {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    console.error('❌ Invalid environment variables:', result.error.format());
    throw new Error('Invalid environment variables');
  }

  return result.data;
};
