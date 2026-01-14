export enum HealthStatus {
  HEALTHY = 'HEALTHY',
  DEGRADED = 'DEGRADED',
  DOWN = 'DOWN',
}

export function isProviderHealthy(status: HealthStatus): boolean {
  return status === HealthStatus.HEALTHY;
}

export function canUseProvider(status: HealthStatus): boolean {
  return status === HealthStatus.HEALTHY || status === HealthStatus.DEGRADED;
}
