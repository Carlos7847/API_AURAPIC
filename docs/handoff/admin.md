# API Handoff: Admin (Internal Tools)

## Business Context

The Admin module provides endpoints for internal administration and support. It allows administrators to intervene in system processes, such as manually completing jobs that may have stalled or failed in the worker queue.

## Endpoints

### POST /admin/jobs/:id/complete

- **Purpose**: Manually marks a job as completed and provides the result URL. Useful for support scenarios.
- **Auth**: Bearer Token + Role `admin`
- **Request**:
  ```json
  {
    "resultUrl": "https://s3.aws.../output.jpg"
  }
  ```
- **Response** (success - 201 Created):
  ```json
  {
    "success": true,
    "message": "Job 123 manually completed"
  }
  ```
- **Response** (error):
  - 403 Forbidden: User is not an admin.
  - 404 Not Found: Job not found.

## Integration Notes

- **Admin Panel**: These endpoints should only be used in a dedicated Admin Dashboard, not the main user application.
- **Security**: Double check that the user has the `admin` role in their encoded JWT before allowing access to these routes in the UI.
