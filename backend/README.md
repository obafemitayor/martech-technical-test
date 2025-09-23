# Event Forwarding API

## Description

This API provides an endpoint that allows the forwarding of events to the AdEventsX API for further processing. The event payload is first transformed before forwarding to the AdEventsX API. 
The transformed event payload looks like this:

```json
{
    "id": "event_id",
    "user": "user_id",
    "name": "event_name",
    "ts": "event_time_epoch converted to epoch seconds",
    "value_cents": "event value converted to cents",
    "campaign": "campaign_id",
    "source": "internal_martech"
}
```

## Tech Stack

- **API Framework**: Node.js, Express
- **Language**: TypeScript
- **Testing Framework**: Jest, Supertest
- **Linting & Formatting**: ESLint, Prettier
- **Containerization**: Docker, Docker Compose

## Project Structure

```
backend/
├── src/
│   ├── __tests__/         # End-to-end and integration tests
│   ├── controllers/       # Express route handlers
│   ├── external-services/ # Services for communicating with external APIs
│   ├── interfaces/        # TypeScript interfaces
│   ├── middleware/        # Express middleware
│   ├── services/          # Business logic
│   ├── types/             # TypeScript type definitions
│   ├── validation-schemas/ # Joi validation schemas
│   ├── app.ts             # Express app configuration
│   └── server.ts          # Server entry point
├── Dockerfile
├── docker-compose.yml
├── jest.config.js
├── package.json
└── tsconfig.json
```

## Resilience Strategy

To handle temporary failures when forwarding events to the external AdEvents API, the service implements a retry mechanism with exponential backoff. If there is an error while forwarding an event to the API, the service will automatically retry up to 3 times. The delay between these retries increases exponentially (e.g., 1, 2, then 4 seconds) to avoid overwhelming the external API during periods of instability. Retries are only attempted when the HTTP response code is either a 429 (Too Many Requests) or a 5xx (Server Error).

---

## Authentication

This challenge did not explicitly require authentication, but I included a minimal JWT-based security layer to demonstrate how I would secure this API in a real-world scenario.

### `/auth` Endpoint

- A dedicated `/auth` endpoint is provided to generate JWT tokens.  
- It accepts a simple payload `{"clientId": "marketing-dashboard"}` and returns a signed JWT.  
- The generated JWT can then be used to access the `/events` endpoint by including it in the `Authorization` header as a Bearer token:

```http Authorization: Bearer <token> ```


## Running the Application

### 1. Running Locally

1.  **Navigate to the `backend` directory**:
    ```sh
    cd backend
    ```
2.  **Create a `.env` file** from the example:
    ```sh
    cp .env.example .env
    ```
    Update the `JWT_SECRET` in the `.env` file with a secure key.

3.  **Install dependencies**:
    ```sh
    npm install
    ```
4.  **Run the development server**:
    The service will start on `http://localhost:3000`.
    ```sh
    npm run dev
    ```

### 2. Running with Docker

1.  **Navigate to the `backend` directory**.
2.  **Build the container**:
    ```sh
    docker-compose build
    ```
3.  **Run the container**:
    ```sh
    docker-compose up backend-service
    ```
    The service will be available at `http://localhost:3000`.

---

## Running Tests

### 1. Locally

Ensure you have a `.env` file as described in the local setup.

```sh
npm test
```

### 2. With Docker

```sh
docker-compose up --abort-on-container-exit test
```

---

## Future Improvements

-   **Distributed Cache for Idempotency**: The current idempotency check uses an in-memory cache, which is not suitable for a load-balanced or multi-instance environment. Replacing this with an external cache like **Redis** would ensure that `event_id` uniqueness is enforced across all instances.

-   **Asynchronous Event Forwarding**: Currently, the event forwarding happens synchronously within the API request-response cycle. This sometimes leads to longer response times especially during the retry process. A better approach would be to use a background job queue or an event-driven architecture with a message broker like **Kafka**. This would allow the API to accept the event, respond to the client immediately, and process the forwarding asynchronously, making the system more responsive and scalable.

-   **Proper JWT Implementation**: The current JWT implementation is not that secure. A better approach would be to use a more secure secret key and build a proper authentication system that requires a username and password when generating the JWT token.
