# Admin Module

**Purpose**: Secure administrative interface for manual operations and system management.

## 🎯 Responsibility

Provides privileged endpoints accessible only to admin users, enabling manual intervention in automated processes (e.g., "Wizard of Oz" MVP fulfillment).

## 🏗️ Architecture

```mermaid
graph LR
    Admin[Admin User] -->|POST /admin/jobs/:id/complete| Controller[AdminJobsController]
    Controller -->|@UseGuards| RolesGuard[RolesGuard]
    RolesGuard -->|Verify ADMIN role| UseCase[CompleteJobManuallyUseCase]
    UseCase -->|Update status| JobRepo[JobRepository]
    JobRepo --> DB[(PostgreSQL)]

    style Controller fill:#a29bfe
    style RolesGuard fill:#fab1a0
```

**Design**: Thin controller layer delegating to domain use cases

- **Infrastructure**: HTTP controllers + security guards
- **Application**: Use cases borrowed from `JobsModule`
- **No Domain Layer**: Admin is a pure interface module

## 📦 Components

### Controllers

#### `AdminJobsController`

Exposes administrative job management endpoints.

**Endpoints:**

| Method   | Path                       | Description           | Auth       |
| :------- | :------------------------- | :-------------------- | :--------- |
| **POST** | `/admin/jobs/:id/complete` | Manual job completion | Admin only |

**Request Example:**

```json
POST /admin/jobs/cljk12345/complete
Authorization: Bearer <admin-token>

{
  "resultUrl": "https://s3.amazonaws.com/bucket/result.jpg"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Job cljk12345 manually completed"
}
```

## 🔒 Security

### Role-Based Access Control (RBAC)

```typescript
@Controller('admin/jobs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN) // ← Only ADMIN role allowed
export class AdminJobsController {
  // ...
}
```

**Security Flow:**

1. `JwtAuthGuard` validates JWT token
2. `RolesGuard` checks user role from database
3. If role ≠ ADMIN → `403 Forbidden`
4. If role = ADMIN → proceed to handler

### Admin User Creation

Admins must be manually granted in database:

```sql
UPDATE "User"
SET role = 'ADMIN'
WHERE email = 'admin@example.com';
```

## 💡 Use Cases

### Manual Job Completion ("Wizard of Oz")

**Scenario**: During MVP phase, AI processing is simulated. An admin manually uploads the processed image.

**Workflow:**

1. User creates job → Status: `QUEUED`
2. Worker picks job → Status: `PROCESSING`
3. Admin processes image externally (Photoshop, etc.)
4. Admin uploads to S3
5. Admin calls `/admin/jobs/:id/complete` with S3 URL
6. Job status → `COMPLETED`
7. User retrieves result

**Code:**

```typescript
const useCase = new CompleteJobManuallyUseCase(jobRepository);
await useCase.execute(jobId, resultUrl);
```

## ⚠️ Error Handling

### Invalid Job State

**Error**: Job not in `QUEUED` or `PROCESSING` state  
**Response**: `400 Bad Request`  
**Message**: `"Job {id} is in status {status}, cannot manual complete."`

### Job Not Found

**Error**: Job ID doesn't exist  
**Response**: `404 Not Found`  
**Message**: `"Job {id} not found"`

## 🚀 Integration

### Module Dependencies

```typescript
@Module({
  imports: [
    JobsModule, // Access to job repositories
    SharedModule,
  ],
  controllers: [AdminJobsController],
})
export class AdminModule {}
```

### App Registration

```typescript
// app.module.ts
@Module({
  imports: [
    // ...
    AdminModule, // Register admin routes
  ],
})
export class AppModule {}
```

## 🔮 Future Enhancements

- [ ] Admin dashboard UI
- [ ] User management (ban, suspend)
- [ ] Credit manual adjustment
- [ ] Bulk job operations
- [ ] Audit log viewer
- [ ] System health monitoring
