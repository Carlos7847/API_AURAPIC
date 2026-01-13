import { JobStatus } from '../enums/job-status.enum';
import {
  InvalidJobDataError,
  JobInvalidStateError,
} from '../errors/job.exceptions';

export const MAX_JOB_ATTEMPTS = 3;

export interface JobProps {
  id: string;
  userId: string;
  imageId: string;
  mode: string;
  status: JobStatus;
  prompt?: string;
  meta?: Record<string, unknown>;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  resultUrl?: string;
  errorMessage?: string;
}

export class Job {
  constructor(private props: JobProps) {}

  // Getters
  get id(): string {
    return this.props.id;
  }
  get userId(): string {
    return this.props.userId;
  }
  get imageId(): string {
    return this.props.imageId;
  }
  get mode(): string {
    return this.props.mode;
  }
  get status(): JobStatus {
    return this.props.status;
  }
  get prompt(): string | undefined {
    return this.props.prompt;
  }
  get meta(): Record<string, unknown> | undefined {
    return this.props.meta;
  }
  get attempts(): number {
    return this.props.attempts;
  }
  get maxAttempts(): number {
    return this.props.maxAttempts;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
  get completedAt(): Date | undefined {
    return this.props.completedAt;
  }
  get resultUrl(): string | undefined {
    return this.props.resultUrl;
  }
  get errorMessage(): string | undefined {
    return this.props.errorMessage;
  }

  // Factory Method with Domain Validations
  static create(props: JobProps): Job {
    if (!props.userId || props.userId.trim() === '') {
      throw new InvalidJobDataError('UserId is required');
    }

    if (!props.imageId || props.imageId.trim() === '') {
      throw new InvalidJobDataError('ImageId is required');
    }

    if (!props.mode || props.mode.trim() === '') {
      throw new InvalidJobDataError('Mode is required');
    }

    if (props.prompt && props.prompt.length > 2000) {
      throw new InvalidJobDataError('Prompt cannot exceed 2000 characters');
    }

    if (props.attempts < 0) {
      throw new InvalidJobDataError('Attempts cannot be negative');
    }

    if (props.maxAttempts < 1) {
      throw new InvalidJobDataError('MaxAttempts must be at least 1');
    }

    return new Job(props);
  }

  // Business Logic

  startProcessing(): void {
    if (this.props.status === JobStatus.COMPLETED) {
      throw new JobInvalidStateError(this.id, this.status, 'start processing');
    }
    this.props.status = JobStatus.PROCESSING;
    this.props.updatedAt = new Date();
  }

  complete(resultUrl: string): void {
    if (this.props.status !== JobStatus.PROCESSING) {
      // Allow completing if it was retrying, but typically from processing
    }
    this.props.status = JobStatus.COMPLETED;
    this.props.resultUrl = resultUrl;
    this.props.completedAt = new Date();
    this.props.updatedAt = new Date();
  }

  fail(errorMessage: string): void {
    this.props.status = JobStatus.FAILED;
    this.props.errorMessage = errorMessage;
    this.props.completedAt = new Date();
    this.props.updatedAt = new Date();
  }

  incrementAttempts(): void {
    this.props.attempts++;
    this.props.updatedAt = new Date();

    if (this.props.attempts >= this.props.maxAttempts) {
      this.fail('Max attempts exceeded');
    }
  }

  isMaxAttemptsExceeded(): boolean {
    return this.props.attempts >= this.props.maxAttempts;
  }
}
