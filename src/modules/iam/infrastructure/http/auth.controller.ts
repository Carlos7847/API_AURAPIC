import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Ip,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { RegisterUserUseCase } from '../../application/use-cases/register-user.use-case';
import { RegisterUserDto } from '../../application/dtos/register-user.dto';
import { LoginUserDto } from '../../application/dtos/login-user.dto';
import { LoginUserUseCase } from '../../application/use-cases/login-user.use-case';
import { RefreshTokenDto } from '../../application/dtos/refresh-token.dto';
import { RefreshTokenUseCase } from '../../application/use-cases/refresh-token.use-case';
import { LogoutUseCase } from '../../application/use-cases/logout.use-case';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { ActiveUser } from '../decorators/active-user.decorator';
import type { ActiveUserData } from '../../domain/interfaces/active-user.interface';
import { ForgotPasswordUseCase } from '../../application/use-cases/forgot-password.use-case';
import { ResetPasswordUseCase } from '../../application/use-cases/reset-password.use-case';
import { ResetPasswordDto } from '../../application/dtos/reset-password.dto';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserResponseDto } from '../../application/dtos/responses/user.response.dto';
import { LoginResponseDto } from '../../application/dtos/responses/login.response.dto';
import { UserRegisteredResponseDto } from '../../application/dtos/responses/user-registered.response.dto';
import { ForgotPasswordDto } from '../../application/dtos/forgot-password.dto';
import { MessageResponseDto } from '../../application/dtos/responses/message.response.dto';
import { RefreshTokenResponseDto } from '../../application/dtos/responses/refresh-token.response.dto';
import { AdminResponseDto } from '../../application/dtos/responses/admin.response.dto';
import { UserRole } from '../../domain/enums/user-role.enum';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { VerifyEmailDto } from '../../application/dtos/verify-email.dto';
import { VerifyEmailUseCase } from '../../application/use-cases/verify-email.use-case';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUserUseCase: LoginUserUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly forgotPasswordUseCase: ForgotPasswordUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
    private readonly verifyEmailUseCase: VerifyEmailUseCase,
  ) {}

  @ApiOperation({ summary: 'Registrar un nuevo usuario' })
  @ApiResponse({
    status: 201,
    description: 'Usuario creado exitosamente.',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  @ApiResponse({ status: 409, description: 'El email ya existe.' })
  @Post('register')
  async register(@Body() dto: RegisterUserDto) {
    const user = await this.registerUserUseCase.execute(dto);

    return new UserRegisteredResponseDto({
      id: user.id,
      email: user.email,
    });
  }

  @ApiOperation({
    summary: 'Iniciar sesión',
    description: 'Retorna Access y Refresh tokens.',
  })
  @ApiResponse({
    status: 200,
    description: 'Login exitoso, retorna tokens.',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciales inválidas o email no verificado.',
  })
  @ApiResponse({
    status: 429,
    description: 'Demasiados intentos.',
  })
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  // HttpCode(200) es importante porque por defecto POST devuelve 201 Created
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginUserDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string = 'unknown',
  ) {
    const tokens = await this.loginUserUseCase.execute(dto, { userAgent, ip });

    return tokens;
  }

  @ApiOperation({ summary: 'Refrescar tokens de autenticación' })
  @ApiResponse({
    status: 200,
    description: 'Tokens refrescados exitosamente.',
    type: RefreshTokenResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Token de refresco inválido o expirado.',
  })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshTokenDto) {
    const tokens = await this.refreshTokenUseCase.execute(dto);
    return tokens;
  }

  @ApiOperation({ summary: 'Cerrar sesión' })
  @ApiResponse({ status: 204, description: 'Logout exitoso.' })
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT) // 204 No Content (Estándar para logout exitoso)
  async logout(@Body() dto: RefreshTokenDto) {
    await this.logoutUseCase.execute(dto);
  }

  @ApiOperation({ summary: 'Solicitar restablecimiento de contraseña' })
  @ApiResponse({
    status: 200,
    description:
      'Instrucciones de restablecimiento enviadas si el email existe.',
    type: MessageResponseDto,
  })
  @ApiResponse({ status: 429, description: 'Límite de peticiones excedido.' })
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
  ): Promise<MessageResponseDto> {
    await this.forgotPasswordUseCase.execute(dto);
    return { message: 'Se enviaron instrucciones al correo ingresado.' };
  }

  @ApiOperation({ summary: 'Restablecer la contraseña usando un token' })
  @ApiResponse({
    status: 200,
    description: 'Contraseña restablecida exitosamente.',
    type: MessageResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Token inválido o expirado.' })
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body() dto: ResetPasswordDto,
  ): Promise<MessageResponseDto> {
    await this.resetPasswordUseCase.execute(dto);
    return { message: 'Contraseña restablecida exitosamente.' };
  }

  @ApiOperation({ summary: 'Obtener el perfil del usuario autenticado' })
  @ApiResponse({
    status: 200,
    description: 'Perfil del usuario obtenido.',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado (Token faltante o inválido).',
  })
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@ActiveUser() user: ActiveUserData) {
    return user;
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Acceder a datos exclusivos para administradores' })
  @ApiResponse({
    status: 200,
    description: 'Acceso concedido al admin.',
    type: AdminResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Acceso denegado.' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('admin')
  getAdminData() {
    return { message: 'Hola Admin, tienes acceso al dashboard secreto.' };
  }

  @ApiOperation({ summary: 'Verificar el email del usuario' })
  @ApiResponse({
    status: 200,
    description: 'Email verificado exitosamente.',
    type: MessageResponseDto,
  })
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    await this.verifyEmailUseCase.execute(dto.token);
    return { message: 'Email verificado exitosamente.' };
  }
}
