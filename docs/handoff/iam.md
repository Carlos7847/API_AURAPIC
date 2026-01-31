# API Handoff: IAM (Authentication & Users)

## Business Context

The IAM (Identity and Access Management) module handles all external user authentication and authorization flows. It allows users to register, log in, manage their sessions via JWT tokens (Access & Refresh), recover passwords, and verify their email addresses. It also provides role-based access control (RBAC) for securing endpoints (e.g., Admin only).

## Endpoints

### POST /auth/register

- **Purpose**: Registers a new user in the system.
- **Auth**: Public
- **Request**:
  ```json
  {
    "email": "string — valid email address",
    "password": "string — min 8 chars, 1 upper, 1 lower, 1 number, 1 special char",
    "fullName": "string — user's full name"
  }
  ```
- **Response** (success - 201 Created):
  ```json
  {
    "id": "string (UUID)",
    "email": "user@example.com"
  }
  ```
- **Response** (error):
  - 400 Bad Request: Validation failed (e.g., weak password).
  - 409 Conflict: Email already exists.

### POST /auth/login

- **Purpose**: Authenticates a user and issues JWT tokens.
- **Auth**: Public
- **Request**:
  ```json
  {
    "email": "string — valid email",
    "password": "string — min 8 chars"
  }
  ```
- **Response** (success - 200 OK):
  ```json
  {
    "accessToken": "string (JWT)",
    "refreshToken": "string (JWT)",
    "user": {
      "id": "string",
      "email": "string",
      "role": "user"
    }
  }
  // Note: Check actual response DTO for exact fields, assuming standard structure based on DTOs.
  ```
- **Response** (error):
  - 401 Unauthorized: Invalid credentials or email not verified.
  - 429 Too Many Requests: Rate limit exceeded (5 attempts per minute).

### POST /auth/refresh

- **Purpose**: Refreshes the Access Token using a valid Refresh Token.
- **Auth**: Public
- **Request**:
  ```json
  {
    "refreshToken": "string — the refresh token obtained during login"
  }
  ```
- **Response** (success - 200 OK):
  ```json
  {
    "accessToken": "string (new JWT)",
    "refreshToken": "string (new JWT)"
  }
  ```
- **Response** (error):
  - 401 Unauthorized: Invalid or expired refresh token.

### POST /auth/logout

- **Purpose**: Invalidates the user's session (conceptually).
- **Auth**: Public (Client should send refresh token to invalidate it if backend supports blocklisting, otherwise client expects to clear local storage).
- **Request**:
  ```json
  {
    "refreshToken": "string"
  }
  ```
- **Response** (success - 204 No Content): Empty body.

### POST /auth/forgot-password

- **Purpose**: Initiates the password recovery flow by sending an email.
- **Auth**: Public
- **Request**:
  ```json
  {
    "email": "string — registered email"
  }
  ```
- **Response** (success - 200 OK):
  ```json
  {
    "message": "Se enviaron instrucciones al correo ingresado."
  }
  ```
- **Response** (error):
  - 429 Too Many Requests: Limit 3 per minute.

### POST /auth/reset-password

- **Purpose**: Resets the password using the token received via email.
- **Auth**: Public
- **Request**:
  ```json
  {
    "token": "string — token from email link",
    "newPassword": "string — new secure password"
  }
  ```
- **Response** (success - 200 OK):
  ```json
  {
    "message": "Contraseña restablecida exitosamente."
  }
  ```

### GET /auth/profile

- **Purpose**: Retrieves the currently authenticated user's profile.
- **Auth**: Bearer Token (AccessToken)
- **Response** (success - 200 OK):
  ```json
  {
    "sub": "string (UUID)",
    "email": "string",
    "role": "string"
    // ...other active user properties
  }
  ```

### GET /auth/admin

- **Purpose**: Example of an admin-protected route.
- **Auth**: Bearer Token + Role 'admin'
- **Response** (success - 200 OK): Admin specific data.
- **Response** (error): 403 Forbidden if user is not admin.

### POST /auth/verify-email

- **Purpose**: Verifies a user's email address using a token.
- **Auth**: Public
- **Request**:
  ```json
  {
    "token": "string — verification token"
  }
  ```
- **Response** (success - 200 OK):
  ```json
  {
    "message": "Email verificado exitosamente."
  }
  ```

## Data Models / DTOs

### UserRole Enum

| Value     | Meaning       |
| :-------- | :------------ |
| `regular` | Standard user |
| `admin`   | Administrator |

## Validation Rules

- **Password**: Min 8 characters, must contain uppercase, lowercase, number, and special character.
- **Email**: Must be a valid email format.
- **Rate Limiting**:
  - Login: 5 requests / 60s
  - Forgot Password: 3 requests / 60s

## Integration Notes

- **Tokens**: Store `accessToken` in memory or short-lived state. Store `refreshToken` securely (e.g., HttpOnly cookie if possible, or secure storage).
- **Auth Flow**:
  1. Login -> Receive Tokens.
  2. Attach `Authorization: Bearer <accessToken>` to protected requests.
  3. If API returns 401, call `/auth/refresh` with `refreshToken`.
  4. If refresh fails, redirect to login.
