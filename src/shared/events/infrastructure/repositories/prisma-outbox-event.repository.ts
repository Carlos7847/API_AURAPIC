import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/persistence/prisma/prisma.service';
import { OutboxEventRepositoryPort } from '../../domain/repositories/outbox-event.repository.port';
import {
  OutboxEvent,
  OutboxEventProps,
  OutboxEventStatus,
} from '../../domain/entities/outbox-event.entity';
import { Prisma, OutboxEvent as OutboxEventModel } from '@prisma/client';

@Injectable()
export class PrismaOutboxEventRepository extends OutboxEventRepositoryPort {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(event: OutboxEvent): Promise<OutboxEvent> {
    const props = event.toObject();

    const created = await this.prisma.outboxEvent.create({
      data: {
        id: props.id,
        eventName: props.eventName,
        payload: props.payload as unknown as Prisma.InputJsonValue,
        status: props.status,
        attempts: props.attempts,
        maxAttempts: props.maxAttempts,
        error: props.error,
        createdAt: props.createdAt,
        processedAt: props.processedAt,
      },
    });

    return this.toDomain(created);
  }

  async findPending(limit: number = 10): Promise<OutboxEvent[]> {
    const events = await this.prisma.outboxEvent.findMany({
      where: {
        status: 'PENDING',
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: limit,
    });

    return events.map((e) => this.toDomain(e));
  }

  async update(event: OutboxEvent): Promise<OutboxEvent> {
    const props = event.toObject();

    const updated = await this.prisma.outboxEvent.update({
      where: { id: props.id },
      data: {
        status: props.status,
        attempts: props.attempts,
        error: props.error,
        processedAt: props.processedAt,
      },
    });

    return this.toDomain(updated);
  }

  async findById(id: string): Promise<OutboxEvent | null> {
    const event = await this.prisma.outboxEvent.findUnique({
      where: { id },
    });

    return event ? this.toDomain(event) : null;
  }

  private toDomain(raw: OutboxEventModel): OutboxEvent {
    const props: OutboxEventProps = {
      id: raw.id,
      eventName: raw.eventName,
      payload: raw.payload as unknown as Record<string, unknown>,
      status: raw.status as OutboxEventStatus,
      attempts: raw.attempts,
      maxAttempts: raw.maxAttempts,
      error: raw.error,
      createdAt: raw.createdAt,
      processedAt: raw.processedAt,
    };

    return OutboxEvent.restore(props);
  }
}
