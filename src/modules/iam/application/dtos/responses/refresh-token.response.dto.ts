import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de respuesta para el refresco de tokens.
 * Retorna nuevos tokens de acceso y refresco.
 */
export class RefreshTokenResponseDto {
  @ApiProperty({
    description: 'Nuevo JWT Access Token con validez corta',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Nuevo JWT Refresh Token con validez larga',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;
}
