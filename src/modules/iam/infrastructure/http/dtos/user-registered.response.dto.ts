import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class UserRegisteredResponseDto {
  @Expose()
  readonly id: string;

  @Expose()
  readonly email: string;

  // @Expose()
  // readonly createdAt: Date;

  constructor(partial: Partial<UserRegisteredResponseDto>) {
    Object.assign(this, partial);
  }
}
