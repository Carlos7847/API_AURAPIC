import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { AuthValidationMessages } from '../../domain/constants/iam.constants';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterUserDto {
  @ApiProperty({
    example: 'juan784@email.com',
    description: 'Correo electrónico del usuario',
  })
  @IsEmail({}, { message: AuthValidationMessages.EMAIL_INVALID })
  readonly email: string;

  @ApiProperty({
    example: 'SuperSecret123!',
    description: 'Contraseña segura (mínimo 8 caracteres)',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: AuthValidationMessages.PASSWORD_TOO_SHORT })
  @MaxLength(64, { message: AuthValidationMessages.PASSWORD_TOO_LONG })
  @Matches(/[A-Z]/, { message: AuthValidationMessages.PASSWORD_NO_UPPERCASE })
  @Matches(/[a-z]/, { message: AuthValidationMessages.PASSWORD_NO_LOWERCASE })
  @Matches(/\d/, { message: AuthValidationMessages.PASSWORD_NO_NUMBER })
  @Matches(/[\W_]/, {
    message: AuthValidationMessages.PASSWORD_NO_SPECIAL_CHAR,
  })
  // @Matches(
  //   /((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/,
  //   {
  //     message: 'La contraseña es demasiado débil. Debe contener mayúsculas, minúsculas, números o caracteres especiales.'
  //   }
  // )
  readonly password: string;

  @ApiProperty({
    example: 'Juan Pérez',
    description: 'Nombre completo del usuario',
  })
  @IsString()
  @IsNotEmpty()
  readonly fullName: string;
}
