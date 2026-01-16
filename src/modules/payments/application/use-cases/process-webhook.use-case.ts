import { Injectable } from '@nestjs/common';
import { PaymentRepositoryPort } from '../../domain/ports/payment.repository.port';
import { PaymentProviderPort } from '../../domain/ports/payment-provider.port';
import {
  PaymentNotFoundError,
  PaymentAlreadyProcessedError,
} from '../../domain/errors/payment.errors';
import { Payment } from '../../domain/entities/payment.entity';
import { PaymentProviderDetails } from '../../domain/ports/payment-provider.port';
import { LoggerPort } from 'src/shared/logger/domain/logger.port';
import { PaymentProviderFactory } from '../services/payment-provider.factory';
import { PAYMENT_REFERENCE_PREFIX } from '../../domain/constants/payment.constants';
import { OutboxEventRepositoryPort } from 'src/shared/events/domain/repositories/outbox-event.repository.port';
import { OutboxEvent } from 'src/shared/events/domain/entities/outbox-event.entity';
import { randomUUID } from 'node:crypto';
import { PrismaService } from 'src/shared/persistence/prisma/prisma.service';

export interface ProcessWebhookRequest {
  providerCode: string; // Which provider sent this webhook
  action: string;
  data: {
    id: string; // Provider Payment ID
  };
  signature?: string; // For webhook verification
}

/**
 * Process Webhook Use Case
 * Handles payment provider webhook notifications
 */
@Injectable()
export class ProcessWebhookUseCase {
  constructor(
    private readonly paymentRepository: PaymentRepositoryPort,
    private readonly providerFactory: PaymentProviderFactory,
    private readonly outboxRepository: OutboxEventRepositoryPort,
    private readonly prisma: PrismaService,
    private readonly logger: LoggerPort,
  ) {}

  async execute(request: ProcessWebhookRequest): Promise<void> {
    this.logger.log(
      `Processing webhook from ${request.providerCode}: ${request.action} for payment ${request.data.id}`,
      ProcessWebhookUseCase.name,
    );

    // Only process payment-related events
    if (!request.action.includes('payment')) {
      this.logger.debug(
        `Skipping non-payment event: ${request.action}`,
        ProcessWebhookUseCase.name,
      );
      return;
    }

    // 1. Get the correct adapter for this provider
    const adapter: PaymentProviderPort = this.providerFactory.getAdapter(
      request.providerCode,
    );

    // 2. Fetch payment details from provider API
    const providerPaymentDetails = await adapter.getPaymentById(
      request.data.id,
    );

    if (!providerPaymentDetails.externalReference) {
      this.logger.warn(
        `Payment ${request.data.id} has no external reference`,
        ProcessWebhookUseCase.name,
      );
      return;
    }

    // 3. Extract paymentId from external reference (format: "payment-{uuid}")
    const paymentId = providerPaymentDetails.externalReference.replace(
      PAYMENT_REFERENCE_PREFIX,
      '',
    );

    // 4. Find payment in our database by preference or provider payment ID
    let payment = await this.paymentRepository.findByProviderPaymentId(
      request.data.id,
    );

    if (!payment) {
      // Try finding by external reference (in case webhook arrives before we saved providerPaymentId)
      payment = await this.paymentRepository.findById(paymentId);
    }

    if (!payment) {
      throw new PaymentNotFoundError(paymentId);
    }

    // 4. Check if already processed
    if (payment.isFinal()) {
      this.logger.warn(
        `Payment ${payment.id} already in final state: ${payment.status}`,
        ProcessWebhookUseCase.name,
      );
      throw new PaymentAlreadyProcessedError(payment.id, payment.status);
    }

    // 5. Update payment based on provider status
    const providerStatus = providerPaymentDetails.status.toLowerCase();

    switch (providerStatus) {
      case 'approved':
        await this.handleApprovedPayment(payment, providerPaymentDetails);
        break;

      case 'rejected':
      case 'cancelled':
        payment.reject(providerPaymentDetails.statusDetail || 'Payment failed');
        await this.paymentRepository.save(payment);
        this.logger.log(
          `Payment ${providerStatus}: ${payment.id}`,
          ProcessWebhookUseCase.name,
        );
        break;

      default:
        this.logger.log(`Payment ${providerStatus}: ${payment.id}`);
        break;
    }
  }

  private async handleApprovedPayment(
    payment: Payment,
    providerPaymentDetails: PaymentProviderDetails,
  ): Promise<void> {
    // 1. Approve payment
    payment.approve(
      providerPaymentDetails.id,
      providerPaymentDetails.paymentMethodId || undefined,
      providerPaymentDetails.paymentTypeId || undefined,
    );

    // 2. Prepare outbox event
    const outboxEvent = OutboxEvent.create(randomUUID(), 'payment.approved', {
      paymentId: payment.id,
      userId: payment.userId,
      creditsAmount: payment.creditsAmount,
      amount: payment.amount,
      currency: payment.currency,
      providerPaymentId: providerPaymentDetails.id,
    });

    // 3. ATOMIC TRANSACTION: Save payment + outbox event together
    await this.prisma.$transaction(async (_tx) => {
      // Payment is saved
      await this.paymentRepository.save(payment);

      // Outbox event is saved
      await this.outboxRepository.create(outboxEvent);
    });

    this.logger.log(
      `Payment ${payment.id} approved and event saved to outbox (Provider ID: ${providerPaymentDetails.id}, Amount: ${providerPaymentDetails.transactionAmount})`,
      ProcessWebhookUseCase.name,
    );
  }
}
