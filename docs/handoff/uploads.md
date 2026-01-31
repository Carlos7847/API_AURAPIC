# API Handoff: Uploads (Image Management)

## Business Context

The Uploads module manages image assets. To ensure scalability and security, files are uploaded directly from the Frontend to the Object Storage (S3) using **Presigned URLs**. The backend only orchestrates the permission and tracks the file metadata.

## Endpoints

### POST /uploads/presign

- **Purpose**: Generates a short-lived URL that allows the frontend to upload a file directly to S3.
- **Auth**: Bearer Token
- **Request**:
  ```json
  {
    "filename": "my-image.jpg",
    "contentType": "image/jpeg",
    "kind": "input" // usually 'input' for new uploads
  }
  ```
- **Response** (success - 200 OK):
  ```json
  {
    "imageId": "string (UUID or CUID)",
    "storageKey": "inputs/user-123/timestamp-my-image.jpg",
    "presignedUrl": "https://s3.aws... (long url)",
    "expiresIn": 300, // seconds
    "contentType": "image/jpeg",
    "generatedAt": "2024-01-01T00:00:00Z"
  }
  ```
- **Response** (error):
  - 400 Bad Request: Invalid file type.
  - 429 Too Many Requests: Limit 10 per minute.

### GET /uploads/gallery

- **Purpose**: Lists the user's image assets (gallery).
- **Auth**: Bearer Token
- **Query Params**:
  - `kind`: Filter by 'input', 'output', 'thumbnail'.
  - `limit`: Default 50.
  - `offset`: Default 0.
- **Response** (success - 200 OK):
  ```json
  {
    "data": [ ...ImageAssetResponseDto... ],
    "total": 50,
    "limit": 50,
    "offset": 0
  }
  ```

### GET /uploads/gallery/:id

- **Purpose**: Gets details of a specific image asset.
- **Auth**: Bearer Token
- **Response** (success - 200 OK): `ImageAssetResponseDto`
- **Response** (error): 404 Not Found.

### DELETE /uploads/gallery/:id

- **Purpose**: Deletes an image asset from storage and database.
- **Auth**: Bearer Token
- **Response** (success - 204 No Content): Empty body.

## Data Models / DTOs

### ImageAssetResponseDto

```typescript
{
  id: string;
  userId: string;
  storageKey: string;
  url: string; // Public accessible URL
  kind: "input" | "output" | "thumbnail";
  width?: number;
  height?: number;
  sizeBytes?: number;
  createdAt: string; // ISO Date
}
```

## Integration Notes

- **Upload Flow**:
  1. User selects file in UI.
  2. Frontend calls `POST /uploads/presign` with file metadata.
  3. Backend returns `presignedUrl` and `imageId`.
  4. Frontend makes a **PUT** request to `presignedUrl` with the file binary body and `Content-Type` header matching the one requested.
  5. Upon success (200 OK from S3), the image is safely stored.
  6. Frontend can then use `imageId` to create a Job (see Jobs module).
