import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Extend Express Request interface to include request ID
 */
export interface RequestWithId extends Request {
  id: string;
}

/**
 * Request ID Middleware
 *
 * Assigns a unique ID to each incoming request for tracing purposes.
 * The ID can come from:
 * 1. x-request-id header (if already set by load balancer/gateway)
 * 2. Auto-generated UUID v4
 *
 * The request ID is:
 * - Added to the request object
 * - Returned in response headers
 * - Available for logging throughout the request lifecycle
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    // Use existing request ID from header or generate new one
    const requestId = (req.headers['x-request-id'] as string) || uuidv4();

    // Attach to request for later use
    (req as RequestWithId).id = requestId;

    // Return in response headers for client tracking
    res.setHeader('x-request-id', requestId);

    next();
  }
}
