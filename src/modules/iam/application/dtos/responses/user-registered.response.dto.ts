import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

/**
 * DTO de respuesta para el registro de un nuevo usuario.
 * Retorna el ID y email del usuario registrado.
 */
@Exclude()
export class UserRegisteredResponseDto {
  @Expose()
  @ApiProperty({
    description: 'Identificador único del usuario',
    example: 'uuid-v4-string',
  })
  readonly id: string;

  @Expose()
  @ApiProperty({
    description: 'Email del usuario registrado',
    example: 'usuario@dominio.com',
  })
  readonly email: string;

  constructor(partial: Partial<UserRegisteredResponseDto>) {
    Object.assign(this, partial);
  }
}
