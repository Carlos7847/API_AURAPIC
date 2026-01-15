import { JobStatusChangedEvent } from '../events/job-status-changed.event';

export abstract class EventEmitterPort {
  abstract emitJobStatus(event: JobStatusChangedEvent): void;
}
