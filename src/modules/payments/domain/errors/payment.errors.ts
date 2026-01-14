export class PaymentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PaymentError';
  }
}

export class PackageNotFoundError extends PaymentError {
  constructor(packageId: string) {
    super(`Credit package not found: ${packageId}`);
    this.name = 'PackageNotFoundError';
  }
}

export class PackageInactiveError extends PaymentError {
  constructor(packageId: string, packageName: string) {
    super(`Credit package is not active: ${packageName} (${packageId})`);
    this.name = 'PackageInactiveError';
  }
}

export class PaymentNotFoundError extends PaymentError {
  constructor(paymentId: string) {
    super(`Payment not found: ${paymentId}`);
    this.name = 'PaymentNotFoundError';
  }
}

export class PaymentAlreadyProcessedError extends PaymentError {
  constructor(paymentId: string, currentStatus: string) {
    super(`Payment already processed: ${paymentId} (status: ${currentStatus})`);
    this.name = 'PaymentAlreadyProcessedError';
  }
}

export class InvalidPaymentAmountError extends PaymentError {
  constructor(expected: number, received: number) {
    super(
      `Invalid payment amount. Expected: ${expected}, Received: ${received}`,
    );
    this.name = 'InvalidPaymentAmountError';
  }
}

export class MercadoPagoApiError extends PaymentError {
  constructor(
    message: string,
    public readonly statusCode?: number,
  ) {
    super(`Mercado Pago API error: ${message}`);
    this.name = 'MercadoPagoApiError';
  }
}

// NEW: Multi-provider errors

export class PaymentProviderNotFoundError extends PaymentError {
  constructor(providerCode: string) {
    super(`Payment provider not found: ${providerCode}`);
    this.name = 'PaymentProviderNotFoundError';
  }
}

export class PaymentProviderNotAvailableError extends PaymentError {
  constructor(providerCode: string, reason?: string) {
    const message = reason
      ? `Payment provider not available: ${providerCode} (${reason})`
      : `Payment provider not available: ${providerCode}`;
    super(message);
    this.name = 'PaymentProviderNotAvailableError';
  }
}

export class UnsupportedPaymentProviderError extends PaymentError {
  constructor(providerCode: string) {
    super(
      `Unsupported payment provider: ${providerCode}. Please check available providers.`,
    );
    this.name = 'UnsupportedPaymentProviderError';
  }
}

export class InvalidPaymentStateError extends PaymentError {
  constructor(paymentId: string, currentStatus: string, operation: string) {
    super(
      `Cannot ${operation} payment ${paymentId} in status: ${currentStatus}`,
    );
    this.name = 'InvalidPaymentStateError';
  }
}
