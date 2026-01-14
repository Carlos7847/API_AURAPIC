/**
 * Job Module Constants
 *
 * Centralizes configuration for job processing, retries, and limitations.
 */

export const JOB_CONFIG = {
  MAX_ATTEMPTS: 3,
  DEFAULT_PRIORITY: 1,
} as const;

export const JOB_ERRORS = {
  MAX_ATTEMPTS_EXCEEDED: 'Max attempts exceeded',
  INVALID_MODE: 'Invalid job mode',
} as const;
