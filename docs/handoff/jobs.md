# API Handoff: Jobs (Image Processing)

## Business Context

The Jobs module manages asynchronous image processing tasks. Users submit images for processing (e.g., background removal, enhancement), and the system queues them for workers to handle. Users can track the status of their jobs, search for past jobs using semantic search, and cancel pending jobs.

## Endpoints

### POST /jobs

- **Purpose**: Creates a new image processing job.
- **Auth**: Bearer Token
- **Request**:
  ```json
  {
    "imageId": "string — ID of the uploaded image",
    "mode": "string — processing mode (e.g., 'remove-bg', 'upscale')",
    "prompt": "string — optional text prompt for generative tasks",
    "meta": { "key": "value" } // optional metadata
  }
  ```
- **Response** (success - 201 Created):
  - Returns the created `JobResponseDto`.
- **Response** (error):
  - 403 Forbidden: Insufficient credits.
  - 400 Bad Request: Invalid data.

### GET /jobs/:id

- **Purpose**: Retrieves the current status and details of a specific job.
- **Auth**: Bearer Token
- **Response** (success - 200 OK): `JobResponseDto`
- **Response** (error):
  - 404 Not Found.
  - 403 Forbidden: Not the job owner.

### GET /jobs

- **Purpose**: Lists the user's jobs with pagination and filtering.
- **Auth**: Bearer Token
- **Query Params**:
  - `status`: Filter by `queued`, `processing`, `completed`, `failed`, `cancelled`.
  - `limit`: Number of items (default 50).
  - `offset`: Pagination offset (default 0).
- **Response** (success - 200 OK):
  ```json
  {
    "data": [ ...JobResponseDto... ],
    "total": 100
  }
  ```

### GET /jobs/search

- **Purpose**: Performs a semantic search on the user's jobs using vector memory.
- **Auth**: Bearer Token
- **Query Params**:
  - `q`: Search query text (Required).
  - `limit`: Max results (default 5).
- **Response** (success - 200 OK): Array of similar jobs.

### DELETE /jobs/:id

- **Purpose**: Cancels a job if it hasn't completed yet.
- **Auth**: Bearer Token
- **Response** (success - 204 No Content): Empty body.
- **Response** (error):
  - 400 Bad Request: Job cannot be cancelled (already done).

## Data Models / DTOs

### JobResponseDto

```typescript
{
  id: string; // UUID
  userId: string;
  imageId: string;
  mode: string;
  status: JobStatus; // 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled'
  prompt?: string;
  meta?: object;
  attempts: number;
  maxAttempts: number;
  createdAt: string; // ISO Date
  updatedAt: string; // ISO Date
  completedAt?: string; // ISO Date
  resultUrl?: string; // URL of the processed image (if completed)
  errorMessage?: string; // If failed
}
```

### JobStatus Enum

| Value        | Meaning                   |
| :----------- | :------------------------ |
| `queued`     | Waiting for a worker      |
| `processing` | Currently being processed |
| `completed`  | Finished successfully     |
| `failed`     | Error occurred            |
| `cancelled`  | User cancelled            |

## Integration Notes

- **Polling**: Frontend must poll `GET /jobs/:id` or `GET /jobs` to check if status changed from `queued`/`processing` to `completed`.
- **Real-time**: Check if WebSocket events are available (not documented here, but common for jobs). If not, use polling (e.g., every 3-5 seconds).
- **Cancellation**: Only `queued` jobs can be reliably cancelled. `processing` jobs might depend on worker logic.
