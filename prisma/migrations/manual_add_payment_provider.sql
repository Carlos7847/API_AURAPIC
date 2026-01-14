-- Step 1: Create PaymentProvider table
CREATE TABLE "PaymentProvider" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "code" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "displayConfig" JSONB,
  "healthStatus" TEXT NOT NULL DEFAULT 'HEALTHY',
  "lastHealthCheck" TIMESTAMP(3),
  "failureCount" INTEGER NOT NULL DEFAULT 0,
  "lastFailureAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Step 2: Create indexes
CREATE INDEX "PaymentProvider_isActive_idx" ON "PaymentProvider"("isActive");
CREATE INDEX "PaymentProvider_healthStatus_idx" ON "PaymentProvider"("healthStatus");
CREATE INDEX "PaymentProvider_displayConfig_idx" ON "PaymentProvider" USING GIN ("displayConfig");

-- Step 3: Insert default MercadoPago provider
INSERT INTO "PaymentProvider" ("id", "code", "name", "isActive", "displayConfig", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid()::text,
  'mercadopago',
  'Mercado Pago',
  true,
  '{"displayName":"Tarjeta de crédito/débito","description":"Acepta Visa, Mastercard, American Express y más","logoUrl":"https://http2.mlstatic.com/frontend-assets/ui-navigation/5.18.9/mercadopago/logo__large@2x.png","supportedCurrencies":["PEN","USD"],"supportedCountries":["PE","AR","CL","MX"],"fees":3.99,"estimatedTime":"instantáneo","minAmount":1.00,"maxAmount":50000.00}'::jsonb,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- Step 4: Add providerId column to Payment (nullable first)
ALTER TABLE "Payment" ADD COLUMN "providerId" TEXT;

-- Step 5: Update existing payments with default provider
UPDATE "Payment" 
SET "providerId" = (SELECT "id" FROM "PaymentProvider" WHERE "code" = 'mercadopago' LIMIT 1)
WHERE "providerId" IS NULL;

-- Step 6: Make providerId NOT NULL and add foreign key
ALTER TABLE "Payment" ALTER COLUMN "providerId" SET NOT NULL;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_providerId_fkey" 
  FOREIGN KEY ("providerId") REFERENCES "PaymentProvider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 7: Add index for providerId
CREATE INDEX "Payment_providerId_idx" ON "Payment"("providerId");

-- Step 8: Insert Culqi provider (inactive by default)
INSERT INTO "PaymentProvider" ("id", "code", "name", "isActive", "displayConfig", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid()::text,
  'culqi',
  'Culqi',
  false,
  '{"displayName":"Tarjetas peruanas","description":"Optimizado para tarjetas emitidas en Perú","logoUrl":"https://static.culqi.com/brand/logo.svg","supportedCurrencies":["PEN"],"supportedCountries":["PE"],"fees":3.49,"estimatedTime":"instantáneo","minAmount":3.00,"maxAmount":20000.00}'::jsonb,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- Step 9: Insert Crypto provider (inactive, for future)
INSERT INTO "PaymentProvider" ("id", "code", "name", "isActive", "displayConfig", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid()::text,
  'crypto',
  'Criptomonedas',
  false,
  '{"displayName":"Bitcoin, USDT","description":"Paga con criptomonedas (BTC, USDT, ETH)","logoUrl":"https://cryptologos.cc/logos/bitcoin-btc-logo.svg","supportedCurrencies":["BTC","USDT","ETH"],"supportedCountries":["GLOBAL"],"fees":0.5,"estimatedTime":"15-30 minutos","minAmount":0.0001,"maxAmount":100.0}'::jsonb,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);
