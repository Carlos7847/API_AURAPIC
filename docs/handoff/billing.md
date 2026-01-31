# API Handoff: Billing (Credits & Subscriptions)

## Business Context

The Billing module manages user credits and subscriptions. Currently, it interacts closely with the Payments and Jobs modules to deduct credits when jobs are created and add credits when payments are approved.

> **Note**: This module primarily operates in the background. Real-time updates are delivered via WebSockets.

## Endpoints

_No public HTTP endpoints for Billing._
(Credit balance is currently tracked via WebSocket events or internal guards).

## WebSockets (Real-time)

The application uses **Socket.IO** for real-time updates. Billing events are emitted through the **Jobs Gateway**.

- **Namespace**: `/jobs`
- **Auth**: JWT Token (send as `auth: { token: '...' }` or query param `?token=...`).

### Events (Server -> Client)

#### `credits:updated`

Emitted when a user's credit balance changes (e.g., after a successful payment).

- **Payload**:
  ```json
  {
    "userId": "string",
    "creditsAdded": 60,
    "newTotal": 120, // Current total balance
    "source": "payment", // 'payment' | 'refund' | 'bonus'
    "timestamp": "2024-01-01T12:00:00Z",
    "paymentId": "string"
  }
  ```

## Integration Notes

- **Real-time Balance**: Frontend should listen to `credits:updated` to update the user's displayed balance immediately after purchase.
- **Initial Balance**: currently relies on the user profile or needs to be inferred. **Gap**: `UserResponseDto` in Auth module does not currently return `credits`. Frontend may need to request this be added or rely solely on WS updates (which is unreliable for initial state).
- **Credit Deduction**: Credits are deducted when `POST /jobs` is called. If 403 Forbidden is returned, it means insufficient credits.
