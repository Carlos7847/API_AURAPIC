/**
 * Payment Module Constants
 * Domain-level constants for payment processing
 */

export const PAYMENT_PROVIDERS = {
  MERCADO_PAGO: 'mercadopago',
  CULQI: 'culqi',
  CRYPTO: 'crypto',
} as const;

export type PaymentProviderCode =
  (typeof PAYMENT_PROVIDERS)[keyof typeof PAYMENT_PROVIDERS];

export const PAYMENT_REFERENCE_PREFIX = 'payment-';

export const PAYMENT_CONFIG = {
  PREFERENCE_EXPIRY_HOURS: 24,
  MAX_RETRY_ATTEMPTS: 3,
  WEBHOOK_TIMEOUT_MS: 30000,
  DEFAULT_TIMEOUT_MS: 5000,
  MAX_AMOUNT_LIMIT: 50000.0,
  DEFAULT_MAX_AMOUNT: 999999,
  PREFERENCE_EXPIRATION_HOURS: 24,
  MILLISECONDS_PER_HOUR: 60 * 60 * 1000,
  STATEMENT_DESCRIPTOR: 'AURAPIC',
} as const;
