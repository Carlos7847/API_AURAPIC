import { UserRole } from '../enums/user-role.enum';
import { UserStatus } from '../enums/user-status.enum';

export class User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly fullName: string | null,

    public readonly role: UserRole,
    public readonly status: UserStatus,
    public readonly emailVerifiedAt: Date | null,

    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null,

    // se evita sobrecargar información con relaciones - lista de Entidades 'Credential' se puede consultar en repository
  ) {}

  public get isEmailVerified(): boolean {
    return this.emailVerifiedAt !== null;
  }

  public get isActive(): boolean {
    return this.status === UserStatus.ACTIVE;
  }

  public get isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }

  static create(id: string, email: string, fullName?: string): User {
    const now = new Date();

    return new User(
      id,
      email,
      fullName || null,
      UserRole.USER,
      UserStatus.PENDING,
      null, // emailVerifiedAt
      now, // createdAt
      now, // updatedAt
      null, // deletedAt
    );
  }

  /**
   * Método para reconstruir la entidad desde la DB(Hydration)
   * Este método lo usará el Mapper.
   */
  static restore(
    id: string,
    email: string,
    fullName: string | null,
    role: UserRole,
    status: UserStatus,
    emailVerifiedAt: Date | null,
    createdAt: Date,
    updatedAt: Date,
    deletedAt: Date | null,
  ): User {
    return new User(
      id,
      email,
      fullName,
      role,
      status,
      emailVerifiedAt,
      createdAt,
      updatedAt,
      deletedAt,
    );
  }
}
