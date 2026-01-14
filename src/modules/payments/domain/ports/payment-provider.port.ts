/**
 * Preference creation data
 */
export interface CreatePreferenceData {
  title: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  currency: string;
  externalReference: string;
  backUrls: {
    success: string;
    failure: string;
    pending: string;
  };
  notificationUrl?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Preference response
 */
export interface PreferenceResponse {
  id: string; // Preference ID
  initPoint: string; // URL to redirect user for payment
  sandboxInitPoint?: string; // Sandbox URL for testing
}

/**
 * Payment details from payment provider
 */
export interface PaymentProviderDetails {
  id: string; // Provider Payment ID
  status: string;
  statusDetail: string | null;
  transactionAmount: number;
  currencyId: string;
  dateApproved: string | null;
  paymentMethodId: string | null;
  paymentTypeId: string | null;
  externalReference: string | null;
  metadata: Record<string, unknown> | null;
}

/**
 * Payment Provider Port (Interface)
 * Abstracts payment gateway integration
 */
export abstract class PaymentProviderPort {
  /**
   * Create payment preference
   */
  abstract createPreference(
    data: CreatePreferenceData,
  ): Promise<PreferenceResponse>;

  /**
   * Get payment details by ID
   */
  abstract getPaymentById(paymentId: string): Promise<PaymentProviderDetails>;

  /**
   * Verify webhook signature
   */
  abstract verifyWebhookSignature(
    signature: string,
    requestId: string,
    payload: string,
  ): boolean;
}
