import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventBusPort } from 'src/shared/events/domain/event-bus.port';
import { DomainEvent } from 'src/shared/events/domain/domain-event';
import { SubscriptionRepositoryPort } from '../../domain/ports/subscription.repository.port';
import { LoggerPort } from 'src/shared/logger/domain/logger.port';
import { SubscriptionNotFoundError } from '../../domain/errors/billing.errors';
import { ProcessedEventRepositoryPort } from 'src/shared/events/domain/repositories/processed-event.repository.port';
import { ProcessedEvent } from 'src/shared/events/domain/entities/processed-event.entity';
import { EventEmitterPort } from 'src/shared/events/domain/ports/event-emitter.port';
import { randomUUID } from 'node:crypto';

/**
 * Event Handler: Payment Approved
 * Listens to payment.approved events and adds credits to user subscription
 * Implements idempotency to prevent duplicate credit additions
 */
@Injectable()
export class PaymentApprovedHandler implements OnModuleInit {
  private readonly HANDLER_NAME = 'PaymentApprovedHandler';

  constructor(
    private readonly eventBus: EventBusPort,
    private readonly subscriptionRepository: SubscriptionRepositoryPort,
    private readonly processedEventRepository: ProcessedEventRepositoryPort,
    private readonly eventEmitter: EventEmitterPort,
    private readonly logger: LoggerPort,
  ) {}

  onModuleInit() {
    const handler = async (event: DomainEvent): Promise<void> => {
      await this.handle(event);
    };
    this.eventBus.subscribe('payment.approved', handler);
    this.logger.log(
      'PaymentApprovedHandler subscribed to payment.approved events',
      PaymentApprovedHandler.name,
    );
  }

  private async handle(event: DomainEvent): Promise<void> {
    const payload = event.payload;

    // Extract with proper type guards
    const userId =
      typeof payload['userId'] === 'string' ? payload['userId'] : '';
    const creditsAmount =
      typeof payload['creditsAmount'] === 'number'
        ? payload['creditsAmount']
        : 0;
    const paymentId =
      typeof payload['paymentId'] === 'string' ? payload['paymentId'] : '';
    const eventId =
      typeof payload['eventId'] === 'string'
        ? payload['eventId']
        : randomUUID();

    if (!userId || !paymentId || creditsAmount <= 0) {
      this.logger.warn(
        `Invalid payment.approved event payload`,
        PaymentApprovedHandler.name,
      );
      return;
    }

    // IDEMPOTENCY CHECK
    const alreadyProcessed = await this.processedEventRepository.wasProcessedBy(
      eventId,
      this.HANDLER_NAME,
    );

    if (alreadyProcessed) {
      this.logger.log(
        `Event ${eventId} already processed, skipping`,
        PaymentApprovedHandler.name,
      );
      return;
    }

    this.logger.log(
      `Handling payment.approved for user ${userId}, adding ${creditsAmount} credits`,
      PaymentApprovedHandler.name,
    );

    const subscription = await this.subscriptionRepository.findByUserId(userId);

    if (!subscription) {
      this.logger.error(
        `Subscription not found for payment ${paymentId}`,
        '',
        PaymentApprovedHandler.name,
      );
      throw new SubscriptionNotFoundError(userId);
    }

    subscription.addCredits(creditsAmount);
    await this.subscriptionRepository.save(subscription);

    const processedEvent = ProcessedEvent.create(
      randomUUID(),
      eventId,
      'payment.approved',
      this.HANDLER_NAME,
      { paymentId, userId, creditsAmount },
    );
    await this.processedEventRepository.create(processedEvent);

    this.logger.log(
      `Credits added: ${creditsAmount} to user ${userId}. New balance: ${subscription.creditsRemaining}`,
      PaymentApprovedHandler.name,
    );

    // 🚀 REAL-TIME NOTIFICATION: Emit WebSocket event
    try {
      this.eventEmitter.emitCreditsUpdate({
        userId,
        creditsAdded: creditsAmount,
        newTotal: subscription.creditsRemaining,
        source: 'payment',
        timestamp: new Date(),
        paymentId,
      });

      this.logger.debug(
        `WebSocket notification sent for user ${userId} - ${creditsAmount} credits added`,
        PaymentApprovedHandler.name,
      );
    } catch (wsError) {
      // Non-critical: Log but don't fail the entire handler
      this.logger.warn(
        `Failed to emit WebSocket notification: ${wsError instanceof Error ? wsError.message : 'Unknown error'}`,
        PaymentApprovedHandler.name,
      );
    }
  }
}
