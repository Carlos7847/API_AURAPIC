import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number(),

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

  FRONTEND_URL: z.string().url(),

  // AWS S3
  AWS_REGION: z.string().default('us-east-1'),
  AWS_ACCESS_KEY_ID: z.string().min(1),
  AWS_SECRET_ACCESS_KEY: z.string().min(1),
  S3_BUCKET: z.string().min(1),
  S3_PRESIGNED_URL_EXPIRY: z.coerce.number().default(300), // 5 min default

  // Redis & Worker
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  ENABLE_WORKER: z
    .string()
    .transform((val) => val === 'true')
    .optional()
    .default(false),

  // Mercado Pago
  MP_ACCESS_TOKEN: z.string().min(10),
  MP_NOTIFICATION_URL: z.string().url(),
  API_URL: z.string().url(), // NEW: For webhook URL generation
  MERCADOPAGO_WEBHOOK_SECRET: z.string().min(10), // NEW: For signature verification

  // Gemini AI
  GEMINI_API_KEY: z.string().min(10),
  GEMINI_MODEL: z.string().optional().default('gemini-2.0-flash-exp'),
  GEMINI_MAX_TOKENS: z.coerce.number().optional().default(2048),
  GEMINI_TEMPERATURE: z.coerce.number().optional().default(0.7),

  // Sentry
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_ENVIRONMENT: z.string().default('development'),
  SENTRY_ENABLED: z
    .string()
    .transform((val) => val === 'true')
    .optional()
    .default(false),
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
