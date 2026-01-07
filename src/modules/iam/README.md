# Identity and Access Management (IAM) Module

## Descripción General

El módulo IAM es el corazón de la seguridad y autenticación de **APIPHOTOEXPERT**. Implementa un sistema robusto de autenticación y autorización basado en **Arquitectura Hexagonal**, siguiendo principios de **Domain-Driven Design (DDD)** y **Clean Architecture**.

Este módulo maneja:

- ✅ Registro y verificación de usuarios
- ✅ Autenticación por email/contraseña
- ✅ Gestión de sesiones y tokens JWT
- ✅ Control de acceso basado en roles (RBAC)
- ✅ Recuperación de contraseñas con verificación por email
- ✅ Auditoría de operaciones sensibles
- ✅ Protección contra ataques comunes (timing attacks, token reuse)

---

## 🌟 Características Implementadas

### 1. **Autenticación Segura**

#### Registro de Usuarios (`POST /auth/register`)

```typescript
// Request
{
  "email": "usuario@ejemplo.com",
  "password": "SecurePassword123!",
  "fullName": "Juan Pérez"
}

// Response (201 Created)
{
  "id": "cuid123xyz",
  "email": "usuario@ejemplo.com"
}
```

**Flujo de Registro (Atomic with Compensation):**

1. **Validación de Unicidad:** Se verifica que el email no exista en la BD
2. **Hash de Contraseña:** Se aplica **Argon2id** (estándar OWASP 2024) al password
3. **Creación de Entidades:** Se crean registros `User` (estado `PENDING`) y `AuthCredential` en transacción
4. **Generación de Token Criptográfico:** Se genera un token de verificación de email con `crypto.randomBytes(32)`
5. **Almacenamiento Seguro:** El hash del token se guarda en BD (nunca el token en texto plano)
6. **Envío de Email:** Se intenta enviar email con el token de verificación
7. **Compensación en Fallos:** Si el email falla, se ejecuta un **Rollback Manual** (eliminación de usuario) para evitar usuarios "zombies"

**Justificación Técnica:**

- **¿Por qué Argon2?** Es la función de hash más moderna y segura contra ataques de GPU/ASIC
- **¿Por qué guardar hash del token?** Si la BD se filtra, los atacantes no pueden usar los tokens directamente
- **¿Por qué compensación manual?** En el MVP, es más simple que implementar colas (BullMQ/RabbitMQ) y suficiente para la escala actual

#### Login (`POST /auth/login`)

```typescript
// Request
{
  "email": "usuario@ejemplo.com",
  "password": "SecurePassword123!"
}

// Response (200 OK)
{
  "access_token": "eyJhbGc...",
  "refresh_token": "hash_token_opaco",
  "user": {
    "id": "cuid123xyz",
    "email": "usuario@ejemplo.com",
    "role": "USER"
  }
}
```

**Validaciones:**

- Email debe existir
- Contraseña debe coincidir (Argon2 verification)
- Email debe estar verificado (`emailVerifiedAt IS NOT NULL`)
- Cuenta no debe estar suspendida (`status != SUSPENDED`)

#### Verificación de Email (`POST /auth/verify-email`)

```typescript
// Request
{
  "token": "raw_token_enviado_por_email",
  "userId": "cuid123xyz"
}

// Response (200 OK)
{
  "message": "Email verificado exitosamente"
}
```

**Flujo:**

1. Hash del token para buscarlo en BD
2. Validar que el token no haya expirado (TTL: 24 horas)
3. Marcar usuario como `ACTIVE` (actualizar `emailVerifiedAt`)
4. Limpiar token de la BD

---

### 2. **Gestión de Sesiones y Tokens**

#### Tipos de Tokens

| Token                    | Propósito            | Duración | Storage                | Revocable          |
| ------------------------ | -------------------- | -------- | ---------------------- | ------------------ |
| **Access JWT**           | Autorizar requests   | 1 hora   | Cliente (localStorage) | No (stateless)     |
| **Refresh Token**        | Renovar Access Token | 7 días   | BD (hash SHA-256)      | Sí (manual delete) |
| **Email Verify Token**   | Verificar email      | 24 horas | BD (hash SHA-256)      | Sí (auto-expira)   |
| **Password Reset Token** | Resetear contraseña  | 1 hora   | BD (hash SHA-256)      | Sí (auto-expira)   |

#### Refresh Token (`POST /auth/refresh`)

```typescript
// Request
{
  "refresh_token": "hash_opaco"
}

// Response (200 OK)
{
  "access_token": "nuevo_jwt",
  "refresh_token": "nuevo_hash_opaco"
}
```

**Implementación de Rotación Segura:**

- Cada refresh generan un nuevo `refresh_token` y `access_token`
- El token anterior se invalida automáticamente
- Se detecta **Token Reuse** (intento de usar un token revocado) y se marca la sesión como comprometida
- Se revocan todas las sesiones del usuario por seguridad

**Justificación:**

- **¿Por qué no guardar JWT en BD?** Los JWT son stateless por diseño; guardar en BD los hace stateful innecesariamente
- **¿Por qué solo los opacos (Refresh)?** Los tokens opacos son revocables; los JWT no, así que solo estos necesitan ser almacenados

#### Logout (`POST /auth/logout`)

```typescript
// Request (Headers)
Authorization: Bearer eyJhbGc...

// Response (200 OK)
{
  "message": "Sesión cerrada"
}
```

**Acción:** Se elimina el `refresh_token` de la BD, invalidando la sesión.

---

### 3. **Recuperación de Contraseña**

#### Solicitar Reset (`POST /auth/forgot-password`)

```typescript
// Request
{
  "email": "usuario@ejemplo.com"
}

// Response (200 OK)
{
  "message": "Si el email existe, recibirá instrucciones para resetear la contraseña"
}
```

**Nota de Seguridad:** La respuesta es idéntica aunque el email no exista. Esto previene **Email Enumeration Attacks**.

#### Resetear Contraseña (`POST /auth/reset-password`)

```typescript
// Request
{
  "token": "raw_token_enviado_por_email",
  "newPassword": "NewSecurePassword456!"
}

// Response (200 OK)
{
  "message": "Contraseña actualizada. Por favor inicia sesión."
}
```

**Flujo:**

1. Hash del token para buscarlo
2. Validar que no haya expirado (TTL: 1 hora)
3. Hash de nueva contraseña con Argon2id
4. Actualizar `passwordHash` en `AuthCredential`
5. **Revocación de sesiones:** Eliminar todos los `refresh_tokens` del usuario para forzar relogin

**Justificación:** Al resetear contraseña, otros dispositivos deben reauthenticarse por seguridad.

---

### 4. **Control de Acceso Basado en Roles (RBAC)**

#### Roles Soportados

```typescript
enum UserRole {
  USER = 'USER', // Usuario normal
  ADMIN = 'ADMIN', // Administrador del sistema
  SUPPORT = 'SUPPORT', // Soporte técnico
}
```

#### Decorador `@Roles()`

Especifica qué roles pueden acceder a un endpoint. Siempre usa `@UseGuards(JwtAuthGuard, RolesGuard)`.

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Get('/admin/users')
getAllUsers(@ActiveUser() user: ActiveUserData) {
  // Solo ADMINS pueden acceder
  return ...
}

// Múltiples roles
@Roles(UserRole.ADMIN, UserRole.SUPPORT)
@Get('/support/reports')
getReports() { ... }
```

#### Decorador `@ActiveUser()`

Extrae los datos del usuario autenticado del JWT de forma segura y tipada.

```typescript
@UseGuards(JwtAuthGuard)
@Get('/me')
getProfile(@ActiveUser() user: ActiveUserData) {
  // `user` es: { id: string, email: string, role: UserRole }
  return user;
}
```

**Ventajas:**

- Type-safe: El compilador TS garantiza que `user` existe
- Legible: No necesitas acceder a `request.user` manualmente
- Reutilizable: Se aplica automáticamente en cualquier endpoint protegido

---

### 5. **Sistema de Guardias (Guards)**

#### `JwtAuthGuard`

Valida que el request tenga un JWT válido en el header `Authorization: Bearer <token>`.

```typescript
@UseGuards(JwtAuthGuard)
@Get('/protected')
protectedRoute() { ... }
```

**Comportamiento:**

- ✅ Token válido → Extrae `user` y continúa
- ⚠️ Token expirado → `UnauthorizedException` "El token ha expirado, por favor inicia sesión nuevamente"
- ❌ Token inválido → `UnauthorizedException` "Token inválido o malformado"
- ❌ Sin token → `UnauthorizedException` "No autorizado"

**Implementación:**

```typescript
export class JwtAuthGuard extends AuthGuard('jwt') {
  override handleRequest<TUser = ActiveUserData>(
    err: Error | null,
    user: TUser | false,
    info: JsonWebTokenError | TokenExpiredError | Error | undefined,
  ): TUser {
    if (err || !user) {
      if (info instanceof TokenExpiredError) {
        throw new UnauthorizedException(
          'El token ha expirado, por favor inicia sesión nuevamente',
        );
      }
      if (info instanceof JsonWebTokenError) {
        throw new UnauthorizedException('Token inválido o malformado');
      }
      throw err || new UnauthorizedException('No autorizado');
    }
    return user;
  }
}
```

#### `RolesGuard`

Valida que el usuario tenga al menos uno de los roles requeridos en el endpoint.

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Delete('/admin/users/:id')
deleteUser() { ... }
```

**Implementación:**

```typescript
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get<UserRole[]>(
      ROLES_KEY,
      context.getHandler(),
    );
    if (!roles) return true; // Sin @Roles() = todos pueden acceder

    const request = context.switchToHttp().getRequest();
    const user = request.user as ActiveUserData;
    return roles.some((role) => user.role === role);
  }
}
```

**Orden Importante:**

```typescript
// ✅ CORRECTO
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)

// ❌ INCORRECTO (RolesGuard sin validar JWT antes)
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
```

---

## 🏗️ Arquitectura del Módulo

### Estructura de Carpetas

```
iam/
├── README_IAM.md              # Este archivo
├── iam.module.ts              # Módulo raíz (DI container)
│
├── application/               # CAPA DE APLICACIÓN
│   ├── dtos/                  # Data Transfer Objects
│   │   ├── register-user.dto.ts
│   │   ├── login-user.dto.ts
│   │   ├── refresh-token.dto.ts
│   │   ├── forgot-password.dto.ts
│   │   ├── reset-password.dto.ts
│   │   ├── verify-email.dto.ts
│   │   └── responses/         # Response DTOs tipados
│   │       ├── user.response.dto.ts
│   │       ├── login.response.dto.ts
│   │       └── ...
│   ├── services/              # Servicios de Aplicación
│   │   └── audit.service.ts   # Auditoría de acciones sensibles
│   └── use-cases/             # Casos de Uso (Orquestación de Lógica)
│       ├── register-user.use-case.ts
│       ├── login-user.use-case.ts
│       ├── refresh-token.use-case.ts
│       ├── logout.use-case.ts
│       ├── forgot-password.use-case.ts
│       ├── reset-password.use-case.ts
│       └── verify-email.use-case.ts
│
├── domain/                    # CAPA DE DOMINIO (Lógica Pura)
│   ├── constants/             # Constantes de negocio
│   │   └── iam.constants.ts   # Códigos de error, valores por defecto
│   ├── entities/              # Entidades ricas del dominio
│   │   └── user.entity.ts     # Lógica de reglas de negocio
│   ├── enums/                 # Enumeraciones del dominio
│   │   ├── user-role.enum.ts
│   │   └── user-status.enum.ts
│   ├── errors/                # Excepciones de dominio (Domain Events)
│   │   ├── user-already-exists.error.ts
│   │   ├── invalid-credentials.error.ts
│   │   ├── email-not-verified.error.ts
│   │   ├── invalid-token.error.ts
│   │   ├── account-locked.error.ts
│   │   ├── account-suspended.error.ts
│   │   ├── token-reuse-detected.error.ts
│   │   ├── tfa-required.error.ts
│   │   ├── invalid-tfa-code.error.ts
│   │   └── weak-password.error.ts
│   ├── interfaces/            # Interfaces de dominio
│   │   └── active-user.interface.ts
│   └── ports/                 # ABSTRACCIONES (Puertos Hexagonales)
│       ├── user.repository.port.ts
│       ├── auth-credential.repository.port.ts
│       ├── session.repository.port.ts
│       ├── audit-log.repository.port.ts
│       ├── hashing.service.port.ts
│       └── token.service.port.ts
│
└── infrastructure/            # CAPA DE INFRAESTRUCTURA (Implementaciones)
    ├── adapters/              # Implementaciones de Servicios
    │   ├── argon2-hashing.service.ts
    │   ├── jwt-token.service.ts
    │   └── mock-email.service.ts
    ├── constants/             # Constantes técnicas
    ├── decorators/            # Custom Decorators de NestJS
    │   ├── active-user.decorator.ts
    │   └── roles.decorator.ts
    ├── guards/                # NestJS Guards
    │   ├── jwt-auth.guard.ts
    │   └── roles.guard.ts
    ├── http/                  # Controladores HTTP (Presentación)
    │   ├── auth.controller.ts
    │   └── dtos/              # DTOs HTTP específicos
    ├── persistence/           # Repositories de BD (Prisma)
    │   ├── prisma-user.repository.ts
    │   ├── prisma-auth-credential.repository.ts
    │   ├── prisma-session.repository.ts
    │   ├── prisma-audit-log.repository.ts
    │   └── mappers/           # Mapeo Prisma ↔ Entidades
    │       └── user.mapper.ts
    └── strategies/            # Passport Strategies
        └── jwt.strategy.ts
```

### Patrón Hexagonal (Ports & Adapters)

```
┌─────────────────────────────────────────────────────────┐
│                    APLICACIÓN                            │
│  (Use Cases, DTOs, Servicios de App)                     │
└────────────┬────────────────────────────────┬────────────┘
             │                                │
    ┌────────▼─────────┐          ┌──────────▼────────┐
    │ DOMINIO          │          │ INFRAESTRUCTURA   │
    │ (Lógica Pura)    │          │ (Implementaciones)│
    │                  │          │                   │
    │ - Entidades      │          │ - Argon2Hashing  │
    │ - Errores        │          │ - JwtToken       │
    │ - Puertos        │◄────────►│ - PrismaRepos    │
    │   (Interfaces)   │          │ - Guards         │
    │                  │          │ - Decoradores    │
    └──────────────────┘          └───────────────────┘
```

**Beneficio:** Cambiar de Argon2 a Bcrypt, o de Prisma a TypeORM, solo requiere crear nuevas implementaciones sin tocar dominio ni aplicación.

---

## 📡 Códigos de Error (API Error Codes)

El módulo sigue un esquema de códigos de error consistente: `AUTH_[ENTIDAD]_[CONDICIÓN]`.

```typescript
// src/modules/iam/domain/constants/iam.constants.ts

export enum IamErrorCodes {
  // Errores de Usuario
  USER_ALREADY_EXISTS = 'AUTH_USER_ALREADY_EXISTS',
  USER_NOT_FOUND = 'AUTH_USER_NOT_FOUND',

  // Errores de Autenticación
  INVALID_CREDENTIALS = 'AUTH_INVALID_CREDENTIALS',
  EMAIL_NOT_VERIFIED = 'AUTH_EMAIL_NOT_VERIFIED',

  // Errores de Token
  TOKEN_EXPIRED = 'AUTH_TOKEN_EXPIRED',
  TOKEN_INVALID = 'AUTH_TOKEN_INVALID',
  TOKEN_REUSE_DETECTED = 'AUTH_TOKEN_REUSE_DETECTED',

  // Errores de Cuenta
  ACCOUNT_LOCKED = 'AUTH_ACCOUNT_LOCKED',
  ACCOUNT_SUSPENDED = 'AUTH_ACCOUNT_SUSPENDED',

  // Errores de 2FA (Roadmap)
  TFA_REQUIRED = 'AUTH_TFA_REQUIRED',
  INVALID_TFA_CODE = 'AUTH_INVALID_TFA_CODE',

  // Errores de Contraseña
  WEAK_PASSWORD = 'AUTH_WEAK_PASSWORD',
}
```

### Mapeo de Errores a HTTP

| Código de Error             | HTTP Status                 | Descripción                             | Ejemplo                                   |
| --------------------------- | --------------------------- | --------------------------------------- | ----------------------------------------- |
| `AUTH_USER_ALREADY_EXISTS`  | **409** (Conflict)          | Email ya registrado                     | El email usuario@ejemplo.com ya existe    |
| `AUTH_INVALID_CREDENTIALS`  | **401** (Unauthorized)      | Password incorrecto o usuario no existe | Email o contraseña incorrectos            |
| `AUTH_EMAIL_NOT_VERIFIED`   | **403** (Forbidden)         | Email no verificado en login            | Por favor verifica tu email               |
| `AUTH_TOKEN_EXPIRED`        | **401** (Unauthorized)      | Token de reset/verify expirado          | El token ha expirado                      |
| `AUTH_TOKEN_INVALID`        | **400** (Bad Request)       | Token malformado                        | Token inválido                            |
| `AUTH_ACCOUNT_SUSPENDED`    | **403** (Forbidden)         | Cuenta baneada                          | Tu cuenta ha sido suspendida              |
| `AUTH_ACCOUNT_LOCKED`       | **429** (Too Many Requests) | Demasiados intentos fallidos            | Cuenta bloqueada por seguridad            |
| `AUTH_TOKEN_REUSE_DETECTED` | **401** (Unauthorized)      | Intento de usar token revocado          | Token revocado, por favor inicia sesión   |
| `AUTH_WEAK_PASSWORD`        | **400** (Bad Request)       | Password no cumple requisitos           | Password debe tener al menos 8 caracteres |

### Uso en Controllers

```typescript
// src/modules/iam/infrastructure/http/auth.controller.ts

@Post('login')
@HttpCode(HttpStatus.OK)
@ApiResponse({
  status: 200,
  description: 'Login exitoso',
  type: LoginResponseDto,
})
@ApiResponse({
  status: 401,
  description: 'Credenciales inválidas o email no verificado',
})
@ApiResponse({
  status: 403,
  description: 'Cuenta suspendida',
})
async login(@Body() dto: LoginUserDto) {
  return await this.loginUserUseCase.execute(dto);
}
```

El mapping a HTTP status se realiza automáticamente en el `ExceptionFilter` global:

```typescript
// src/shared/filters/all-exceptions.filter.ts

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const config = ERROR_MAPPING.get(exception.constructor);
    // Si existe mapeo, usar el status HTTP configurado
    // Si no, usar 500
  }
}
```

---

## 🔐 Justificación Técnica de Seguridad

### 1. **Hashing de Contraseñas: Argon2id**

```typescript
// Función de hash
const hash = await argon2.hash(password, {
  type: argon2.argon2id, // Resistente a GPU/ASIC attacks
  timeCost: 4, // Iteraciones (más = más lento pero seguro)
  memoryCost: 65536, // 64MB de memoria
  parallelism: 3, // 3 threads
});

// Verificación
const isValid = await argon2.verify(hash, password);
```

**¿Por qué Argon2?**

- ✅ OWASP 2024 lo recomienda como estándar de oro
- ✅ Resistente a ataques de GPU y ASIC (a diferencia de bcrypt/scrypt)
- ✅ Configurable (tiempo/memoria/paralelismo)
- ❌ Bcrypt: Diseñado en 1999, vulnerable a GPU brute-force

### 2. **Token Hashing: SHA-256**

```typescript
// Los tokens opacos (Refresh, Reset, Verify) se guardan hasheados
const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

// En BD: `sessionTokenHash` = "a3f9b2c1..."
// Nunca se guarda el token en texto plano
```

**¿Por qué SHA-256?**

- ✅ Es rápido (no es computacionalmente caro como Argon2)
- ✅ Es determinístico (token "abc" → siempre mismo hash)
- ✅ Es unidireccional (no se puede revertir)
- ✅ La BD solo tiene hashes; si se filtra, tokens no son válidos

**Flujo de Seguridad:**

```
Cliente:                  Servidor:
rawToken = "abc123..."   Recibe "abc123..."
                         hash = SHA256("abc123...") = "xyz789..."
                         Busca en BD: WHERE tokenHash = "xyz789..."
                         ✓ Encontrado, válido
```

### 3. **Prevención de Ataques**

#### Timing Attacks

```typescript
// ❌ VULNERABLE: Termina en cuanto encuentra el primer carácter diferente
if (inputPassword === storedHash) { ... }

// ✅ SEGURO: Siempre verifica todos los caracteres
await argon2.verify(storedHash, inputPassword);
```

#### Email Enumeration

```typescript
// ❌ VULNERABLE
async forgotPassword(email) {
  const user = await repo.findByEmail(email);
  if (!user) return error("Usuario no encontrado");  // Revela que no existe
  return success("Email enviado");
}

// ✅ SEGURO
async forgotPassword(email) {
  const user = await repo.findByEmail(email);
  if (user) await sendEmail(user);
  return success("Si el email existe, recibirá instrucciones");
  // Respuesta idéntica en ambos casos
}
```

#### Token Reuse Detection

```typescript
// Si alguien intenta usar un refresh_token ya gastado
async refreshToken(oldToken) {
  const session = await repo.findByToken(oldToken);

  if (!session) {
    // Token ya fue usado o no existe
    // ¡COMPROMISO DETECTADO! Revocar todas las sesiones
    await repo.deleteAllSessionsByUserId(session.userId);
    throw new TokenReuseDetectedError();
  }
}
```

#### Rate Limiting (Planeado)

```typescript
// Roadmap: Implementar @Throttle para endpoints sensibles
@Throttle({ default: { limit: 5, ttl: 60000 } })  // 5 intentos por minuto
@Post('login')
async login() { ... }
```

---

## 📊 Modelo de Datos (Prisma Schema)

```prisma
model User {
  id              String   @id @default(cuid())
  email           String   @unique
  fullName        String?

  // Acceso y Estado
  role            UserRole     @default(USER)
  status          UserStatus   @default(PENDING)  // PENDING hasta verificar email
  emailVerifiedAt DateTime?                        // null hasta verificar

  // Relaciones
  credentials     AuthCredential[]
  sessions        Session[]
  auditLogs       AuditLog[]

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  deletedAt       DateTime?  // Soft delete
}

model AuthCredential {
  id              String   @id @default(cuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  provider        AuthProvider  // EMAIL, GOOGLE, GITHUB, APPLE
  providerUserId  String        // email para EMAIL, google_id para GOOGLE

  passwordHash    String?       // Solo si provider = EMAIL

  // Password Reset Flow
  passwordResetTokenHash  String?  @unique
  passwordResetExpiresAt  DateTime?

  // Email Verification Flow
  emailVerificationTokenHash String?  @unique
  emailVerificationExpiresAt DateTime?

  // 2FA (Roadmap)
  tfaEnabled      Boolean   @default(false)
  tfaSecret       String?   // Encriptado AES-256
  tfaRecoveryCodes String[]  // Encriptados

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@unique([provider, providerUserId])  // No dos Google logins iguales
  @@unique([userId, provider])          // Un usuario, un Google login máximo
}

model Session {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  tokenHash   String   @unique   // Hash SHA-256 del refresh token
  expiresAt   DateTime

  createdAt   DateTime @default(now())
}

model AuditLog {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  action      String   // LOGIN, LOGOUT, PASSWORD_RESET, VERIFY_EMAIL
  ipAddress   String
  userAgent   String

  createdAt   DateTime @default(now())
}
```

---

## 🛠️ Guía de Desarrollo

### Añadir un Nuevo Caso de Uso

**Ejemplo:** Implementar "Change Password"

#### 1. Crear el DTO

```typescript
// src/modules/iam/application/dtos/change-password.dto.ts
import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  @MinLength(8)
  newPassword: string;
}
```

#### 2. Crear el Caso de Uso

```typescript
// src/modules/iam/application/use-cases/change-password.use-case.ts
export class ChangePasswordUseCase {
  constructor(
    private readonly credentialRepository: AuthCredentialRepositoryPort,
    private readonly hashingService: HashingServicePort,
    private readonly sessionRepository: SessionRepositoryPort,
  ) {}

  async execute(userId: string, dto: ChangePasswordDto): Promise<void> {
    // 1. Obtener credenciales del usuario
    const credential = await this.credentialRepository.findByUserId(userId);

    if (!credential) {
      throw new InvalidCredentialsError();
    }

    // 2. Validar contraseña actual
    const isValid = await this.hashingService.verify(
      credential.passwordHash,
      dto.currentPassword,
    );

    if (!isValid) {
      throw new InvalidCredentialsError();
    }

    // 3. Hash nueva contraseña
    const newHash = await this.hashingService.hash(dto.newPassword);

    // 4. Actualizar en BD
    await this.credentialRepository.updatePassword(userId, newHash);

    // 5. Revocar sesiones (forzar relogin)
    await this.sessionRepository.deleteByUserId(userId);
  }
}
```

#### 3. Registrar en el Módulo

```typescript
// src/modules/iam/iam.module.ts
@Module({
  // ...
  providers: [
    // ... otros providers
    {
      provide: ChangePasswordUseCase,
      useFactory: (
        credRepo: AuthCredentialRepositoryPort,
        hashingService: HashingServicePort,
        sessionRepo: SessionRepositoryPort,
      ) => {
        return new ChangePasswordUseCase(credRepo, hashingService, sessionRepo);
      },
      inject: [
        AuthCredentialRepositoryPort,
        HashingServicePort,
        SessionRepositoryPort,
      ],
    },
  ],
})
export class IamModule {}
```

#### 4. Exponer en el Controlador

```typescript
// src/modules/iam/infrastructure/http/auth.controller.ts
export class AuthController {
  constructor(
    // ... otros use cases
    private readonly changePasswordUseCase: ChangePasswordUseCase,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cambiar contraseña' })
  async changePassword(
    @ActiveUser() user: ActiveUserData,
    @Body() dto: ChangePasswordDto,
  ) {
    await this.changePasswordUseCase.execute(user.id, dto);
    return { message: 'Contraseña actualizada' };
  }
}
```

---

## 📝 Decisiones de Arquitectura (ADR)

### ADR-001: Por qué Hexagonal + DDD (Lite)

**Contexto:** Necesitábamos escalabilidad sin complejidad excesiva.

**Decisión:** Implementar Hexagonal Architecture con principios de DDD.

**Rationale:**

- ✅ **Desacoplamiento:** La lógica de negocio (dominio) no depende de frameworks
- ✅ **Testabilidad:** Los casos de uso pueden testearse sin base de datos (mock repositories)
- ✅ **Mantenibilidad:** Cambios en la persistencia (Prisma → TypeORM) no afectan aplicación
- ✅ **Escalabilidad:** Fácil adicionar nuevos providers (Google OAuth, Apple Sign-In)

**Alternativas rechazadas:**

- ❌ Controlador directo a repositorio: Problemas de escalabilidad y testing
- ❌ Full DDD Enterprise: Demasiada complejidad para un MVP

---

### ADR-002: Por qué Argon2 y no Bcrypt

**Contexto:** Elegir función de hash para contraseñas.

**Decisión:** Usar Argon2id.

**Rationale:**

- ✅ **Seguridad moderna:** Argon2 ganó Password Hashing Competition (2015)
- ✅ **Resistencia GPU:** Usa mucha memoria, haciendo ataques con GPU inviables
- ✅ **OWASP:** Recomendación oficial 2024
- ❌ **Bcrypt (1999):** Vulnerable a GPU attacks; tiempo configurable pero no memoria

---

### ADR-003: Por qué no implementar 2FA en el MVP

**Contexto:** Seguridad vs velocidad de desarrollo.

**Decisión:** Postponer 2FA al roadmap.

**Rationale:**

- ✅ **MVP:** Cerrar ciclo básico de seguridad es prioridad
- ✅ **Fricción:** 2FA requiere cambios frontend (QR scanner, 6-digit input)
- ✅ **Usuarios:** Fase inicial no requiere 2FA para todos (solo admins después)
- 📋 **Roadmap:** Se implementará cuando requiera mayor seguridad de roles admin

---

### ADR-004: Por qué Compensating Transactions en lugar de Queues

**Contexto:** Garantizar atomicidad de "Crear usuario + Enviar email".

**Decisión:** Implementar Rollback Manual (Compensating Transactions).

**Rationale:**

- ✅ **Simplicidad:** Sin necesidad de Redis/BullMQ/RabbitMQ
- ✅ **MVP Scale:** Suficiente para carga inicial
- ✅ **Desarrollo rápido:** Lógica sincrónica es más fácil de debuggear
- 📋 **Roadmap:** Migrar a Eventual Consistency (Queues) en fase de escalado

**Alternativa (Roadmap):**

```typescript
// Eventual Consistency: Email se envía async via queue
async register(dto) {
  // 1. Crear usuario
  const user = await createUser(dto);

  // 2. Encolar email
  await emailQueue.add('send-verification', { userId: user.id });

  // 3. Retornar inmediatamente
  return user;

  // Si queue falla: existirá usuario pero sin email enviado
  // → Otro worker puede reintentar o admin notifica al usuario
}
```

---

### ADR-005: No guardar JWT en Base de Datos

**Contexto:** Gestión de revocación de tokens.

**Decisión:** JWT = stateless; solo guardar hash de tokens opacos (Refresh).

**Rationale:**

- ✅ **JWT Stateless:** Por diseño, no necesitan guardarse
- ✅ **Performance:** Menos queries a BD
- ✅ **Escalabilidad:** Sin necesidad de cache distribuido para revocación
- ✅ **Tokens Opacos:** Solo los Refresh/Reset/Verify se guardan (revocables)

**Estructura:**

```
Access Token (JWT):
  - Estructura: header.payload.signature
  - Guardado: Cliente (localStorage)
  - Validación: Verificar firma con JWT_SECRET
  - Revocación: Imposible hasta expiración (por eso es corta: 1h)

Refresh Token (Opaco):
  - Estructura: token aleatorio
  - Guardado: Hash en BD
  - Validación: Buscar hash en tabla sessions
  - Revocación: Eliminar fila en sessions → token inválido
```

---

## 🚀 Performance & Escalabilidad

### Índices de Base de Datos

```prisma
model User {
  id String @id
  email String @unique           // ← Índice único
  role UserRole
  status UserStatus

  @@index([email])               // ← Búsquedas rápidas por email
}

model Session {
  tokenHash String @unique       // ← Búsquedas O(1)
  expiresAt DateTime

  @@index([expiresAt])           // ← Limpieza de sesiones expiradas
}
```

### Query Optimization

```typescript
// ❌ N+1 Query Problem
const users = await User.findMany();
users.forEach(async (user) => {
  const sessions = await Session.findMany({ userId: user.id });
  // Executa query por cada usuario
});

// ✅ Eager Loading
const users = await User.findMany({
  include: {
    sessions: true, // Cargar relación en una sola query
  },
});
```

---

## 📈 Roadmap (Próximas Fases)

| Feature                    | Fase   | Justificación                                            |
| -------------------------- | ------ | -------------------------------------------------------- |
| **Social Login (OAuth)**   | Fase 2 | Requiere integración frontend (QR, redirecciones)        |
| **Two-Factor Auth (2FA)**  | Fase 2 | Para roles admin; mayor fricción que password            |
| **Rate Limiting avanzado** | Fase 2 | Implementar ThrottlerModule con políticas por endpoint   |
| **Eventual Consistency**   | Fase 3 | Migrar email a queue async (BullMQ)                      |
| **Webhook Hooks**          | Fase 3 | Permitir a terceros escuchar eventos (user.created, etc) |
| **API Keys**               | Fase 3 | Para integración programática de terceros                |
| **Audit Log Dashboard**    | Fase 2 | UI para ver logs de seguridad                            |
| **IP Whitelisting**        | Fase 3 | Restricción de login desde IPs sospechosas               |

---

## 🧪 Testing (Roadmap)

Se priorizó la velocidad de desarrollo de features. Los tests unitarios e integración se implementarán una vez estabilizados los contratos de la API.

```typescript
// ROADMAP: Unit Test Example
describe('RegisterUserUseCase', () => {
  it('should throw UserAlreadyExistsError if email exists', async () => {
    const mockUserRepo = {
      findByEmail: jest.fn().mockResolvedValue({ id: '123' }),
    };

    const useCase = new RegisterUserUseCase(mockUserRepo, ...);

    expect(() =>
      useCase.execute({ email: 'test@test.com', password: '123' })
    ).rejects.toThrow(UserAlreadyExistsError);
  });
});
```

---

## 📚 Referencias y Recursos

- **Arquitectura Hexagonal:** [Alistair Cockburn](https://alistair.cockburn.us/hexagonal-architecture/)
- **OWASP Password Storage:** [OWASP Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- **Argon2:** [Argon2 Official](https://argon2.online/)
- **JWT Best Practices:** [JWT.io](https://jwt.io/)
- **NestJS Docs:** [NestJS Official](https://docs.nestjs.com/)

---

## 📞 Contacto y Soporte

- **Documentación Técnica Completa:** Ver [README.md raíz](../../README.md)
- **Problemas de Seguridad:** Reportar a [SECURITY.md](../../SECURITY.md)
- **Issues y Features:** GitHub Issues del repositorio

---

**Última Actualización:** Enero 2025  
**Mantenedor:** Equipo de Desarrollo APIPHOTOEXPERT  
**Estado:** MVP en Producción
