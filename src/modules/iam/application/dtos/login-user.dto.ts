import { IsEmail, IsString, MinLength } from 'class-validator';
import { AuthValidationMessages } from '../../domain/constants/iam.constants';
import { ApiProperty } from '@nestjs/swagger';

export class LoginUserDto {
  @ApiProperty({
    example: 'juan784@email.com',
    description: 'Correo electrónico del usuario',
  })
  @IsEmail({}, { message: AuthValidationMessages.EMAIL_INVALID })
  readonly email: string;

  @ApiProperty({
    example: 'SuperSecret123!',
    description: 'Contraseña del usuario',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: AuthValidationMessages.PASSWORD_TOO_SHORT })
  readonly password: string; // se podría agregar un regex para mayor seguridad
}
