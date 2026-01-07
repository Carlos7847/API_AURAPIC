export class AuthCredential {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly provider: string, // 'EMAIL', 'GOOGLE', etc.
    public readonly passwordHash: string | null,
    public readonly passwordResetTokenHash: string | null = null,
    public readonly passwordResetExpiresAt: Date | null = null,
    public readonly emailVerificationTokenHash: string | null = null,
    public readonly emailVerificationExpiresAt: Date | null = null,
  ) {}

  public get hasPassword(): boolean {
    return this.provider === 'EMAIL' && this.passwordHash !== null;
  }
}
