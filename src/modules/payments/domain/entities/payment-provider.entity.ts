import { HealthStatus } from '../enums/health-status.enum';

export interface DisplayConfig {
  displayName: string;
  description: string;
  logoUrl?: string;
  supportedCurrencies: string[];
  supportedCountries: string[];
  fees: number;
  estimatedTime: string;
  minAmount: number;
  maxAmount: number;
}

export interface PaymentProviderProps {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  displayConfig: DisplayConfig | null;
  healthStatus: HealthStatus;
  lastHealthCheck: Date | null;
  failureCount: number;
  lastFailureAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Payment Provider Entity
 * Represents available payment gateways (MercadoPago, Culqi, Crypto)
 */
export class PaymentProvider {
  private constructor(private props: PaymentProviderProps) {}

  // Getters
  get id(): string {
    return this.props.id;
  }

  get code(): string {
    return this.props.code;
  }

  get name(): string {
    return this.props.name;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get displayConfig(): DisplayConfig | null {
    return this.props.displayConfig;
  }

  get healthStatus(): HealthStatus {
    return this.props.healthStatus;
  }

  get failureCount(): number {
    return this.props.failureCount;
  }

  // Business Logic

  /**
   * Check if provider is healthy enough to use
   */
  isHealthy(): boolean {
    return (
      this.props.isActive &&
      (this.props.healthStatus === HealthStatus.HEALTHY ||
        this.props.healthStatus === HealthStatus.DEGRADED)
    );
  }

  /**
   * Check if provider is available for users
   */
  isAvailable(): boolean {
    return this.props.isActive && this.props.healthStatus !== HealthStatus.DOWN;
  }

  /**
   * Activate provider
   */
  activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  /**
   * Deactivate provider
   */
  deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  /**
   * Record successful operation (circuit breaker)
   */
  recordSuccess(): void {
    this.props.failureCount = 0;
    this.props.healthStatus = HealthStatus.HEALTHY;
    this.props.lastHealthCheck = new Date();
    this.props.updatedAt = new Date();
  }

  /**
   * Record failed operation (circuit breaker)
   */
  recordFailure(): void {
    this.props.failureCount += 1;
    this.props.lastFailureAt = new Date();
    this.props.lastHealthCheck = new Date();

    // Circuit breaker logic
    if (this.props.failureCount >= 10) {
      this.props.healthStatus = HealthStatus.DOWN;
    } else if (this.props.failureCount >= 5) {
      this.props.healthStatus = HealthStatus.DEGRADED;
    }

    this.props.updatedAt = new Date();
  }

  /**
   * Reset circuit breaker
   */
  resetCircuitBreaker(): void {
    this.props.failureCount = 0;
    this.props.healthStatus = HealthStatus.HEALTHY;
    this.props.lastHealthCheck = new Date();
    this.props.updatedAt = new Date();
  }

  /**
   * Get all props (for persistence)
   */
  toObject(): PaymentProviderProps {
    return { ...this.props };
  }

  /**
   * Restore from persistence
   */
  static restore(props: PaymentProviderProps): PaymentProvider {
    return new PaymentProvider(props);
  }
}
