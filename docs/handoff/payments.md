# API Handoff: Payments (Credits & Packages)

## Business Context

The Payments module handles the purchase of credit packages. Users buy credits to perform actions in the system (like processing images). The system integrates with **Mercado Pago** to process payments securely.

## Endpoints

### GET /payments/providers

- **Purpose**: Lists available payment providers (e.g., Mercado Pago).
- **Auth**: Public
- **Response** (success - 200 OK):
  ```json
  {
    "providers": [
      {
        "code": "mercadopago",
        "name": "Mercado Pago",
        "displayName": "Tarjeta de crédito/débito",
        "description": "Acepta Visa, Mastercard, American Express",
        "logoUrl": "https://...",
        "supportedCurrencies": ["PEN", "USD"],
        "minAmount": 1.0,
        "maxAmount": 50000.0,
        "isHealthy": true
      }
    ]
  }
  ```

### GET /payments/packages

- **Purpose**: Lists available credit packages that users can buy.
- **Auth**: Public
- **Response** (success - 200 OK):
  ```json
  {
    "packages": [
      {
        "id": "pkg-pro",
        "name": "Pro",
        "credits": 60,
        "price": 20.0,
        "currency": "PEN",
        "description": "Ideal para usuarios regulares",
        "active": true,
        "metadata": {
          "popular": true,
          "discount": 0.17,
          "badge": "Más popular"
        }
      }
    ]
  }
  ```

### POST /payments/create-preference

- **Purpose**: Creates a payment session (preference) with the provider to initiate checkout.
- **Auth**: Bearer Token
- **Request**:
  ```json
  {
    "providerCode": "mercadopago", // Only 'mercadopago' supported for now
    "packageId": "string — ID of the package to buy",
    "successUrl": "https://myapp.com/payment/success",
    "failureUrl": "https://myapp.com/payment/failure",
    "pendingUrl": "https://myapp.com/payment/pending"
  }
  ```
- **Response** (success - 201 Created):
  ```json
  {
    "preferenceId": "string",
    "initPoint": "https://www.mercadopago.com.pe/checkout/v1/redirect?pref_id=...", // Redirect user here
    "paymentId": "string (internal UUID)"
  }
  ```
- **Response** (error):
  - 404 Not Found: Invalid package or provider.
  - 400 Bad Request: Inactive package.

### POST /payments/webhook/mercadopago

- **Purpose**: Receives status updates from Mercado Pago.
- **Auth**: Public (Validated via signature/IP in backend).
- **Note**: Frontend does not call this. It's for the payment gateway.

## Integration Notes

- **Checkout Flow**:
  1. Frontend fetches packages (`GET /payments/packages`).
  2. User selects a package.
  3. Frontend calls `POST /payments/create-preference`.
  4. Backend returns `initPoint` URL.
  5. Frontend redirects user to `initPoint`.
  6. User completes payment on Mercado Pago.
  7. Mercado Pago redirects user back to `successUrl` / `failureUrl`.
- **Status Updates**: The user's credits are updated asynchronously via webhook (`POST /payments/webhook...`). Frontend should poll the user profile or listen for WebSocket events to see updated credit balance.
