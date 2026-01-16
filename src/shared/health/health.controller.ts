import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  PrismaHealthIndicator,
} from '@nestjs/terminus';
import { PrismaService } from 'src/shared/persistence/prisma/prisma.service';

/**
 * Health Check Controller
 *
 * Provides endpoints for container orchestration (Kubernetes, Docker, etc.)
 * to determine if the application is alive and ready to serve traffic.
 *
 * - /health: Liveness probe (is the app running?)
 * - /health/ready: Readiness probe (can the app handle requests?)
 *
 * Note: No authentication required - these endpoints must be publicly accessible
 * for Kubernetes/monitoring systems to function properly.
 */
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prismaHealth: PrismaHealthIndicator,
    private prisma: PrismaService,
  ) {}

  /**
   * Liveness Probe
   *
   * Returns 200 OK if the application process is running.
   * Kubernetes uses this to restart the pod if it fails.
   *
   * Should NEVER check external dependencies (DB, Redis, etc.)
   * because those failures shouldn't trigger a pod restart.
   */
  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      // No external dependency checks - just return OK
      () => ({ app: { status: 'up' } }),
    ]);
  }

  /**
   * Readiness Probe
   *
   * Returns 200 OK only if the app can handle requests.
   * Kubernetes uses this to decide if traffic should be routed to this pod.
   *
   * SHOULD check critical dependencies like database.
   * If DB is down, this pod shouldn't receive traffic.
   */
  @Get('ready')
  @HealthCheck()
  readiness() {
    return this.health.check([
      // Check database connectivity
      () => this.prismaHealth.pingCheck('database', this.prisma),
    ]);
  }
}
