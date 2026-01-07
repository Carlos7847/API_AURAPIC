export class Session {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly tokenHash: string,
    public readonly expiresAt: Date,
    public readonly createdAt: Date,
    public readonly lastActiveAt: Date,
    public readonly deviceInfo?: string | null,
    public readonly ipAddress?: string | null,
    public readonly userAgent?: string | null,
    public readonly revokedAt?: Date | null,
    public readonly replacedById?: string | null,
  ) {}

  static create(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
    meta?: {
      deviceInfo?: string;
      ipAddress?: string;
      userAgent?: string;
    },
  ): Session {
    return new Session(
      '', // ID (Prisma lo genera)
      userId,
      tokenHash,
      expiresAt,
      new Date(), // createdAt
      new Date(), // lastActiveAt
      meta?.deviceInfo ?? null,
      meta?.ipAddress ?? null,
      meta?.userAgent ?? null,
      null, // revokedAt
      null, // replacedById
    );
  }

  // si la sesión estárevocada o expirada
  get isValid(): boolean {
    return !this.revokedAt && this.expiresAt > new Date();
  }

  public rotate(newTokenHash: string, newExpiresAt: Date): Session {
    return new Session(
      this.id,
      this.userId,
      newTokenHash,
      newExpiresAt,
      this.createdAt,
      new Date(), // <--- lastActiveAt actualizado a "ahora"
      this.deviceInfo,
      this.ipAddress,
      this.userAgent,
      this.revokedAt, // Mantenemos estado (si estaba revocada, sigue revocada)
      this.replacedById,
    );
  }

  public revoke(): Session {
    return new Session(
      this.id,
      this.userId,
      this.tokenHash,
      this.expiresAt,
      this.createdAt,
      this.lastActiveAt,
      this.deviceInfo,
      this.ipAddress,
      this.userAgent,
      new Date(),
      this.replacedById,
    );
  }
}
