import { JobStatusChangedEvent } from '../events/job-status-changed.event';

export abstract class EventEmitterPort {
  abstract emitJobStatus(event: JobStatusChangedEvent): void;

  abstract emitCreditsUpdate(event: {
    userId: string;
    creditsAdded: number;
    newTotal: number;
    source: string;
    timestamp: Date;
    paymentId?: string;
  }): void;
}
