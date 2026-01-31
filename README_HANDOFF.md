# API Handoff

## Global Context

- **Base URL**: `/api` (Assumed based on standard interaction, verify relative to deployment)
- **Auth Header**: `Authorization: Bearer <access_token>`
- **Date Format**: ISO 8601 Strings(UTC)
- **Common Errors**:
  - `400 Bad Request`: Validation failure (body contains `message` array or string)
  - `401 Unauthorized`: Invalid or missing token
  - `403 Forbidden`: Insufficient permissions (role mismatch)
  - `429 Too Many Requests`: Rate limit exceeded

---

# Module: IAM (Identity & Access Management)

## Business Context

Handles user registration, authentication (via JWT), password management, and role-based access control.

## Endpoints

### [POST] /auth/register

- **Purpose**: Register a new user account.
- **Auth**: Public
- **Request**:
  ```json
  {
    "email": "user@example.com",
    "password": "securePassword123",
    "firstName": "John",
    "lastName": "Doe"
  }
  ```
- **Response** (201 Created):
  ```json
  {
    "id": "uuid-string",
    "email": "user@example.com"
  }
  ```

### [POST] /auth/login

- **Purpose**: Authenticate and receive tokens.
- **Auth**: Public
- **Request**:
  ```json
  {
    "email": "user@example.com",
    "password": "securePassword123"
  }
  ```
- **Response** (200 OK):
  ```json
  {
    "accessToken": "jwt-token-string",
    "refreshToken": "uuid-string",
    "user": {
      "id": "uuid-string",
      "email": "user@example.com",
      "roles": ["USER"]
    }
  }
  ```

### [POST] /auth/refresh

- **Purpose**: Get a new access token using a valid refresh token.
- **Auth**: Public
- **Request**:
  ```json
  {
    "refreshToken": "uuid-string"
  }
  ```
- **Response** (200 OK):
  ```json
  {
    "accessToken": "new-jwt-token-string",
    "refreshToken": "new-uuid-string"
  }
  ```

### [POST] /auth/logout

- **Purpose**: Invalidate the refresh token.
- **Auth**: Public (but requires valid refresh token in body)
- **Request**:
  ```json
  {
    "refreshToken": "uuid-string"
  }
  ```
- **Response** (204 No Content): Empty.

### [POST] /auth/verify-email

- **Purpose**: Verify user email using token.
- **Auth**: Public
- **Request**:
  ```json
  {
    "token": "verification-token-string"
  }
  ```
- **Response** (200 OK): `{"message": "Email verificado exitosamente."}`

### [POST] /auth/forgot-password

- **Purpose**: Request a password reset email.
- **Auth**: Public
- **Request**: `{"email": "user@example.com"}`
- **Response** (200 OK): `{"message": "Se enviaron instrucciones..."}`

### [POST] /auth/reset-password

- **Purpose**: Reset password using token.
- **Auth**: Public
- **Request**:
  ```json
  {
    "token": "reset-token-string",
    "newPassword": "newSecurePassword123"
  }
  ```
- **Response** (200 OK): `{"message": "Contraseña restablecida exitosamente."}`

### [GET] /auth/profile

- **Purpose**: Get current user details.
- **Auth**: **Required** (User)
- **Response** (200 OK):
  ```json
  {
    "userId": "uuid",
    "email": "user@example.com",
    "role": "USER"
  }
  ```

---

# Module: Jobs

## Business Context

Manages image processing jobs. Users create jobs to process images based on prompts/modes, check status, and retrieve results.

## Endpoints

### [POST] /jobs

- **Purpose**: Create a new image processing job.
- **Auth**: **Required** (User + Credit Check)
- **Request**:
  ```json
  {
    "imageId": "uuid-string",
    "mode": "upscale", // or other modes
    "prompt": "optional text prompt",
    "meta": { "key": "value" } // optional metadata
  }
  ```
- **Response** (201 Created):
  ```json
  {
    "id": "job-uuid",
    "status": "PENDING",
    "createdAt": "2024-01-01T00:00:00Z"
    // ...other job fields
  }
  ```
- **Notes**: Checks for sufficient credits before creation.

### [GET] /jobs

- **Purpose**: List user's jobs with filtering and pagination.
- **Auth**: **Required** (User)
- **Query Params**:
  - `status`: Filter by status (PENDING, COMPLETED, FAILED, etc.)
  - `limit`: items per page (default 50)
  - `offset`: pagination offset (default 0)
- **Response** (200 OK):
  ```json
  {
    "data": [{ "id": "..." }], // Array of JobResponseDto
    "total": 100
  }
  ```

### [GET] /jobs/:id

- **Purpose**: Get details of a specific job.
- **Auth**: **Required** (Owner of the job)
- **Response** (200 OK): JobResponseDto object.

### [DELETE] /jobs/:id

- **Purpose**: Cancel a pending job.
- **Auth**: **Required** (Owner)
- **Response** (204 No Content): If successful.
- **Response** (400 Bad Request): If job cannot be cancelled (e.g. already completed).

### [GET] /jobs/search

- **Purpose**: Semantic search for jobs using vector memory.
- **Auth**: **Required**
- **Query Params**:
  - `q`: Search query text (Required)
  - `limit`: Number of results (default 5)
- **Response** (200 OK): Array of similar jobs.

---

# Module: Payments

## Business Context

Handles credit purchases, payment provider integration (Mercado Pago), and webhook processing to credit user accounts.

## Endpoints

### [GET] /payments/packages

- **Purpose**: List available credit packages.
- **Auth**: Public
- **Response** (200 OK):
  ```json
  {
    "packages": [
      {
        "id": "pkg-pro",
        "name": "Pro",
        "credits": 60,
        "price": 20.0,
        "currency": "PEN",
        "active": true
      }
    ]
  }
  ```

### [GET] /payments/providers

- **Purpose**: List active payment providers.
- **Auth**: Public
- **Response** (200 OK): List of providers (e.g., Mercado Pago).

### [POST] /payments/create-preference

- **Purpose**: Initiate a payment session.
- **Auth**: **Required** (User)
- **Request**:
  ```json
  {
    "providerCode": "mercadopago",
    "packageId": "pkg-id",
    "successUrl": "https://...",
    "failureUrl": "https://...",
    "pendingUrl": "https://..."
  }
  ```
- **Response** (201 Created):
  ```json
  {
    "preferenceId": "mp-preference-id",
    "initPoint": "https://www.mercadopago.com.pe/...",
    "paymentId": "payment-uuid"
  }
  ```

### [POST] /payments/webhook

- **Purpose**: Receive payment notifications (Generic).
- **Auth**: Public (Signature verification recommended)
- **Notes**: Processing this webhook updates the user's credit balance.

### [POST] /payments/webhook/mercadopago

- **Purpose**: Mercado Pago specific webhook.
- **Auth**: Public (Signature verification recommended)

---

# Module: Uploads

## Business Context

Handles file uploads via Presigned URLs (direct to S3) and manages image assets (inputs, outputs, thumbnails).

## Endpoints

### [POST] /uploads/presign

- **Purpose**: Generate a presigned URL for direct client-to-S3 upload.
- **Auth**: **Required** (User)
- **Request**:
  ```json
  {
    "filename": "my-image.jpg",
    "contentType": "image/jpeg",
    "kind": "input" // or "output", "thumbnail"
  }
  ```
- **Response** (200 OK):
  ```json
  {
    // Implementation specific fields, usually contains the upload URL and headers
    "url": "https://s3.amazonaws.com/...",
    "fields": { ... }
  }
  ```

### [GET] /uploads/gallery

- **Purpose**: List user's image assets.
- **Auth**: **Required** (User)
- **Query Params**:
  - `kind`: Filter by asset type (`input`, `output`, `thumbnail`)
  - `limit`: items per page (default 50)
  - `offset`: pagination offset (default 0)
- **Response** (200 OK):
  ```json
  {
    "data": [{ "id": "...", "url": "..." }],
    "total": 100
  }
  ```

### [GET] /uploads/gallery/:id

- **Purpose**: Get details of a specific image asset.
- **Auth**: **Required** (User + Access Check)
- **Response** (200 OK): ImageAssetResponseDto.

### [DELETE] /uploads/gallery/:id

- **Purpose**: Delete an image asset.
- **Auth**: **Required** (User + Access Check)
- **Response** (204 No Content): If successful.

---

# Module: Billing & Credits

## Business Context

Manages user credit balances and consumption. Credits are deducted when creating jobs and added via payments.

## Endpoints

**Note**: There is no explicit HTTP controller for Billing found in the current codebase.

- **Credit Check**: Enforced via `CreditGuard` on Job creation.
- **Balance Retrieval**: Currently, the credit balance is **NOT** explicitly visible via `ActiveUserData` or user profile endpoints.
  - **Status**: The backend strictly enforces credit limits but might not be exposing the balance to the frontend yet.

---

# Module: Admin (Backoffice)

## Business Context

Restricted area for administrators to manage the platform, specifically manual job completion.

## Endpoints

### [POST] /admin/jobs/:id/complete

- **Purpose**: Manually complete a job (e.g. if the worker failed or for testing).
- **Auth**: **Required** (Admin Role)
- **Request**:
  ```json
  {
    "resultUrl": "https://s3.amazonaws.com/path/to/result.jpg"
  }
  ```
- **Response** (201 Created):
  ```json
  {
    "success": true,
    "message": "Job job-id manually completed"
  }
  ```

---

## Open Questions / TODOs

1.  **Credit Balance**: How does the frontend display the user's current valid credits? `GetProfile` currently returns `ActiveUserData` which does NOT contain credits.
2.  **Billing History**: No endpoint found to list past transactions or credit usage history.
3.  **Uploads**: Cleanup policy for `input` vs `output` images is not visible in API.
