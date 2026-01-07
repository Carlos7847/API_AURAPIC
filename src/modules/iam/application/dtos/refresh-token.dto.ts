import { IsNotEmpty, IsString } from 'class-validator';
import { AuthValidationMessages } from '../../domain/constants/iam.constants';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Token de refresco obtenido en el login',
  })
  @IsString()
  @IsNotEmpty({ message: AuthValidationMessages.TOKEN_INVALID })
  readonly refreshToken: string;
}
