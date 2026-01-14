export interface CreditPackageProps {
  id: string;
  name: string;
  credits: number;
  price: number;
  currency: string;
  active: boolean;
  description: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * CreditPackage Domain Entity
 * Represents a purchasable credit package
 */
export class CreditPackage {
  constructor(private readonly props: CreditPackageProps) {}

  // Getters
  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get credits(): number {
    return this.props.credits;
  }

  get price(): number {
    return this.props.price;
  }

  get currency(): string {
    return this.props.currency;
  }

  get active(): boolean {
    return this.props.active;
  }

  get description(): string | null {
    return this.props.description;
  }

  get metadata(): Record<string, unknown> | null {
    return this.props.metadata;
  }

  // Business Logic

  /**
   * Check if package is available for purchase
   */
  isAvailable(): boolean {
    return this.props.active;
  }

  /**
   * Get price per credit
   */
  getPricePerCredit(): number {
    return this.props.price / this.props.credits;
  }

  deactivate(): CreditPackage {
    return new CreditPackage({
      ...this.props,
      active: false,
      updatedAt: new Date(),
    });
  }

  activate(): CreditPackage {
    return new CreditPackage({
      ...this.props,
      active: true,
      updatedAt: new Date(),
    });
  }

  /**
   * Factory method: Restore from persistence
   */
  static restore(props: CreditPackageProps): CreditPackage {
    return new CreditPackage(props);
  }

  /**
   * Get all properties (for persistence)
   */
  toObject(): CreditPackageProps {
    return { ...this.props };
  }
}
