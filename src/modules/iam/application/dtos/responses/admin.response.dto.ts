import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de respuesta para el acceso a datos exclusivos de administradores.
 */
export class AdminResponseDto {
  @ApiProperty({
    description: 'Mensaje de bienvenida para administradores',
    example: 'Hola Admin, tienes acceso al dashboard secreto.',
  })
  message: string;
}
