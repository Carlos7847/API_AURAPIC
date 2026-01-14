import { JobStatus } from '../enums/job-status.enum';
import {
  InvalidJobDataError,
  JobInvalidStateError,
} from '../errors/job.exceptions';
import { JOB_CONFIG } from '../constants/job.constants';

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

/**
 * Job Domain Entity
 *
 * Represents an AI processing job.
 * Implements Rich Domain Model pattern to encapsulate state transitions and business logic.
 */
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

  /**
   * Reconstitute from persistence
   */
  static fromPersistence(props: JobProps): Job {
    return new Job(props);
  }

  /**
   * Factory method to create a new Job
   */
  static create(
    userId: string,
    imageId: string,
    mode: string,
    id: string,
    prompt?: string,
    meta?: Record<string, unknown>,
  ): Job {
    if (!userId) throw new InvalidJobDataError('User ID is required');
    if (!imageId) throw new InvalidJobDataError('Image ID is required');
    if (!mode) throw new InvalidJobDataError('Mode is required');

    return new Job({
      id,
      userId,
      imageId,
      mode,
      status: JobStatus.QUEUED,
      attempts: 0,
      maxAttempts: JOB_CONFIG.MAX_ATTEMPTS,
      createdAt: new Date(),
      updatedAt: new Date(),
      prompt,
      meta,
    });
  }

  // --- Domain Behaviors ---

  /**
   * Mark job as processing
   */
  markAsProcessing(): void {
    if (this.isFinalState()) {
      throw new JobInvalidStateError(
        this.id,
        this.status,
        `Cannot start processing job in ${this.props.status} state`,
      );
    }

    this.updateStatus(JobStatus.PROCESSING);
    this.incrementAttempts();
  }

  /**
   * Complete the job successfully
   */
  complete(resultUrl: string): void {
    if (this.props.status !== JobStatus.PROCESSING) {
      throw new JobInvalidStateError(
        this.id,
        this.status,
        `Cannot complete job in ${this.props.status} state`,
      );
    }

    this.props.resultUrl = resultUrl;
    this.props.completedAt = new Date();
    this.updateStatus(JobStatus.COMPLETED);
  }

  /**
   * Fail the job
   */
  fail(errorMessage: string): void {
    this.props.errorMessage = errorMessage;
    this.updateStatus(JobStatus.FAILED);
  }

  /**
   * Check if job can be retried
   */
  canRetry(): boolean {
    return this.props.attempts < this.props.maxAttempts && !this.isSuccess();
  }

  /**
   * Check if job is in a final state
   */
  isFinalState(): boolean {
    return (
      this.props.status === JobStatus.COMPLETED ||
      this.props.status === JobStatus.FAILED ||
      this.props.status === JobStatus.CANCELLED
    );
  }

  isSuccess(): boolean {
    return this.props.status === JobStatus.COMPLETED;
  }

  incrementAttempts(): void {
    this.props.attempts++;
    this.touch();
  }

  isMaxAttemptsExceeded(): boolean {
    return this.props.attempts >= this.props.maxAttempts;
  }

  private updateStatus(status: JobStatus): void {
    this.props.status = status;
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }
}
