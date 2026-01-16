import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/persistence/prisma/prisma.service';
import { ProcessedEventRepositoryPort } from '../../domain/repositories/processed-event.repository.port';
import {
  ProcessedEvent,
  ProcessedEventProps,
} from '../../domain/entities/processed-event.entity';
import { Prisma, ProcessedEvent as ProcessedEventModel } from '@prisma/client';

@Injectable()
export class PrismaProcessedEventRepository extends ProcessedEventRepositoryPort {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(event: ProcessedEvent): Promise<ProcessedEvent> {
    const props = event.toObject();

    const created = await this.prisma.processedEvent.create({
      data: {
        id: props.id,
        eventId: props.eventId,
        eventName: props.eventName,
        processedAt: props.processedAt,
        processedBy: props.processedBy,
        metadata: props.metadata as unknown as Prisma.InputJsonValue,
      },
    });

    return this.toDomain(created);
  }

  async findByEventId(eventId: string): Promise<ProcessedEvent | null> {
    const event = await this.prisma.processedEvent.findUnique({
      where: { eventId },
    });

    return event ? this.toDomain(event) : null;
  }

  async wasProcessedBy(eventId: string, handlerName: string): Promise<boolean> {
    const count = await this.prisma.processedEvent.count({
      where: {
        eventId,
        processedBy: handlerName,
      },
    });

    return count > 0;
  }

  private toDomain(raw: ProcessedEventModel): ProcessedEvent {
    const props: ProcessedEventProps = {
      id: raw.id,
      eventId: raw.eventId,
      eventName: raw.eventName,
      processedAt: raw.processedAt,
      processedBy: raw.processedBy,
      metadata: raw.metadata as unknown as Record<string, unknown> | null,
    };

    return ProcessedEvent.restore(props);
  }
}
