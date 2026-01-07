import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto {
  @ApiProperty({ description: 'JWT Access Token (validez corta)' })
  accessToken: string;

  @ApiProperty({ description: 'JWT Refresh Token (validez larga)' })
  refreshToken: string;
}
