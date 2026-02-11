import { Injectable } from '@nestjs/common';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { createHmac } from 'crypto';
import {
  PaymentProviderPort,
  CreatePreferenceData,
  PreferenceResponse,
  PaymentProviderDetails,
} from '../../domain/ports/payment-provider.port';
import { MercadoPagoApiError } from '../../domain/errors/payment.errors';
import { EnvironmentConfigService } from 'src/shared/config/infrastructure/environment-config.service';
import { PaymentStatus } from '../../domain/enums/payment-status.enum';
import { PAYMENT_CONFIG } from '../../domain/constants/payment.constants';
import { LoggerPort } from 'src/shared/logger/domain/logger.port';

const statusMap: Record<string, PaymentStatus> = {
  approved: PaymentStatus.APPROVED,
  pending: PaymentStatus.PENDING,
  in_process: PaymentStatus.PENDING,
  rejected: PaymentStatus.REJECTED,
  cancelled: PaymentStatus.CANCELLED,
  refunded: PaymentStatus.REFUNDED,
  charged_back: PaymentStatus.REFUNDED,
};

/**
 * Mercado Pago Adapter
 * Implements PaymentProviderPort using official Mercado Pago SDK
 *
 * @see https://www.mercadopago.com.pe/developers/en/docs/sdks-library/server-side/nodejs
 */
@Injectable()
export class MercadoPagoAdapter implements PaymentProviderPort {
  private readonly client: MercadoPagoConfig;
  private readonly preferenceClient: Preference;
  private readonly paymentClient: Payment;

  constructor(
    private readonly config: EnvironmentConfigService,
    private readonly logger: LoggerPort,
  ) {
    const accessToken = this.config.getMercadoPagoAccessToken();

    this.client = new MercadoPagoConfig({
      accessToken,
      options: {
        timeout: 5000,
        idempotencyKey: undefined, // Will be set per-request if needed
      },
    });

    this.preferenceClient = new Preference(this.client);
    this.paymentClient = new Payment(this.client);

    this.logger.log(
      'Mercado Pago adapter initialized successfully',
      MercadoPagoAdapter.name,
    );
  }

  /**
   * Create payment preference
   */
  async createPreference(
    data: CreatePreferenceData,
  ): Promise<PreferenceResponse> {
    if (
      !data.backUrls.success ||
      !data.backUrls.failure ||
      !data.backUrls.pending
    ) {
      throw new MercadoPagoApiError(
        `Missing required back_urls: success=${data.backUrls.success}, failure=${data.backUrls.failure}, pending=${data.backUrls.pending}`,
      );
    }

    try {
      this.logger.debug(
        `Creating preference for: ${data.title} (${data.currency} ${data.unitPrice})`,
        MercadoPagoAdapter.name,
      );

      const preference = await this.preferenceClient.create({
        body: {
          items: [
            {
              id: data.externalReference,
              title: data.title,
              description: data.description || undefined,
              quantity: data.quantity,
              unit_price: data.unitPrice,
              currency_id: data.currency,
            },
          ],
          back_urls: {
            success: data.backUrls.success,
            failure: data.backUrls.failure,
            pending: data.backUrls.pending,
          },
          notification_url: data.notificationUrl,
          external_reference: data.externalReference,
          metadata: data.metadata || {},
          auto_return: 'approved',
          statement_descriptor: PAYMENT_CONFIG.STATEMENT_DESCRIPTOR,
          expires: true,
          expiration_date_from: new Date().toISOString(),
          expiration_date_to: this.calculateExpirationDate().toISOString(),
        },
      });

      if (!preference.id || !preference.init_point) {
        throw new MercadoPagoApiError(
          'Invalid preference response from Mercado Pago',
        );
      }

      this.logger.log(`Preference created successfully: ${preference.id}`);

      return {
        id: preference.id,
        initPoint:
          process.env.NODE_ENV === 'production'
            ? preference.init_point
            : preference.sandbox_init_point || preference.init_point,
      };
    } catch (error) {
      // MercadoPago SDK throws plain objects, not Error instances
      const errorMessage = this.extractErrorMessage(error);

      this.logger.error(
        `Failed to create preference: ${errorMessage}`,
        MercadoPagoAdapter.name,
      );

      if (error instanceof MercadoPagoApiError) {
        throw error;
      }

      throw new MercadoPagoApiError(errorMessage);
    }
  }

  /**
   * Extract error message from various error types
   * MercadoPago SDK throws plain objects with { message, error, status, cause }
   */
  private extractErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === 'object' && error !== null) {
      const mpError = error as {
        message?: string;
        error?: string;
        cause?: unknown;
      };

      // Try to get the most descriptive message
      if (mpError.message) {
        return mpError.message;
      }
      if (mpError.error) {
        return mpError.error;
      }

      // Fallback to JSON stringify for debugging
      try {
        return JSON.stringify(error);
      } catch {
        return 'Unknown error (could not serialize)';
      }
    }

    return String(error);
  }

  /**
   * Get payment details by ID
   */
  async getPaymentById(paymentId: string): Promise<PaymentProviderDetails> {
    try {
      this.logger.debug(`Fetching payment details: ${paymentId}`);

      const payment = await this.paymentClient.get({
        id: paymentId,
        requestOptions: {
          timeout: PAYMENT_CONFIG.DEFAULT_TIMEOUT_MS,
        },
      });

      if (!payment) {
        throw new MercadoPagoApiError(`Payment not found: ${paymentId}`);
      }

      this.logger.log(
        `Payment details fetched: ${paymentId} - Status: ${payment.status}, Amount: ${payment.transaction_amount}`,
        MercadoPagoAdapter.name,
      );

      return {
        id: payment.id!.toString(),
        status: statusMap[payment.status!] || PaymentStatus.PENDING,
        statusDetail: payment.status_detail || null,
        transactionAmount: payment.transaction_amount!,
        currencyId: payment.currency_id!,
        dateApproved: payment.date_approved
          ? new Date(payment.date_approved).toISOString()
          : null,
        paymentMethodId: payment.payment_method_id || null,
        paymentTypeId: payment.payment_type_id || null,
        externalReference: payment.external_reference || null,
        metadata: (payment.metadata as Record<string, unknown>) || null,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to fetch payment ${paymentId}: ${errorMessage}`,
      );

      if (error instanceof MercadoPagoApiError) {
        throw error;
      }

      throw new MercadoPagoApiError(
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  }

  /**
   * Verify webhook signature from Mercado Pago (HMAC SHA-256)
   *
   * @see https://www.mercadopago.com.pe/developers/en/docs/your-integrations/notifications/webhooks#editor_3
   */
  verifyWebhookSignature(
    signature: string,
    requestId: string,
    _payload: string,
  ): boolean {
    try {
      const signatureComponents = this.parseSignatureHeader(signature);
      const timestamp = signatureComponents['ts'];
      const receivedHash = signatureComponents['v1'];

      if (!timestamp || !receivedHash) {
        this.logger.warn('Invalid signature format - missing ts or v1');
        return false;
      }

      const generatedHash = this.computeSignatureHash(requestId, timestamp);
      const isSignatureValid = generatedHash === receivedHash;

      if (!isSignatureValid) {
        this.logger.warn(
          `Webhook signature mismatch - computed: ${generatedHash}, received: ${receivedHash}`,
        );
      }

      return isSignatureValid;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Error verifying webhook signature: ${errorMessage}`);
      return false;
    }
  }

  private calculateExpirationDate(): Date {
    const expirationTimeMs =
      Date.now() +
      PAYMENT_CONFIG.PREFERENCE_EXPIRATION_HOURS *
        PAYMENT_CONFIG.MILLISECONDS_PER_HOUR;
    return new Date(expirationTimeMs);
  }

  private parseSignatureHeader(signature: string): Record<string, string> {
    const components: Record<string, string> = {};
    const parts = signature.split(',');

    parts.forEach((part) => {
      const [key, value] = part.split('=');
      if (key && value) {
        components[key.trim()] = value.trim();
      }
    });

    return components;
  }

  private computeSignatureHash(requestId: string, timestamp: string): string {
    const secret = this.config.getMercadoPagoWebhookSecret();
    const manifest = `id:${requestId};request-id:${requestId};ts:${timestamp};`;

    return createHmac('sha256', secret).update(manifest).digest('hex');
  }
}
