# LeadTech Frontend

## Description

This App is used to capture the key user details and then forward these details to the LeadTech API. It features a simple form where users can enter their email address and provide consent that they agree to their data being sent to the LeadTech API.

## Tech Stack

- **Framework**: React, ChakraUI
- **Language**: TypeScript
- **Testing**: Jest, React Testing Library
- **Linting & Formatting**: ESLint, Prettier

## Project Structure

```
frontend/
├── public/              # Static assets
├── src/
│   ├── hooks/           # Custom React hooks
│   ├── pages/           # Application pages
│   ├── services/        # services that handles business logic
│   ├── theme/           # Chakra UI theme configuration
│   ├── App.tsx          # Main application component
│   └── index.tsx        # Application entry point
├── .env.example         # Example environment variables
├── package.json
└── tsconfig.json
```

## Running the Application

1.  **Navigate to the `frontend` directory**:
    ```sh
    cd frontend
    ```

2.  **Install dependencies**:
    ```sh
    npm install --legacy-peer-deps
    ```

3.  **Run the development server**:
    The application will start on `http://localhost:3001`.
    ```sh
    npm start
    ```

## Running Tests

To run the test suite, use the following command:

```sh
npm test
```
