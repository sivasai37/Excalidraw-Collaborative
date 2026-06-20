# Collaborative Drawing Application

A high-performance, real-time collaborative drawing platform built with a modern TypeScript monorepo architecture.

## Architecture & Components

This monorepo is managed with Turborepo and includes the following apps and packages:

### Applications

*   **`apps/excelidraw-frontend`**: Next.js client application featuring a premium drawing canvas interface with multiplayer synchronization, visual editing tools, and user authentication.
*   **`apps/web`**: Next.js main web page.
*   **`apps/http-backend`**: Express REST API backend handling user sign-up, sign-in, room creation, and database queries.
*   **`apps/ws-backend`**: WebSocket server handling low-latency room events, active user status updates, and real-time brush coordinates synchronization.

### Packages

*   **`packages/db`**: Database client layer powered by Prisma ORM connected to PostgreSQL.
*   **`packages/common`**: Shared type definitions and Zod validation schemas reused across the client, backend, and WebSocket servers.
*   **`packages/typescript-config`**: Centralized compiler configuration.
*   **`packages/eslint-config`**: Shared linting guidelines.

---

## Technical Stack

*   **Frontend**: Next.js, React, Tailwind CSS (for styled interactive panels), Canvas API.
*   **Backend**: Node.js, Express, WebSocket (`ws`), JWT Authentication.
*   **Database**: Prisma ORM, PostgreSQL.
*   **Build System**: Turborepo, pnpm workspaces.

---

## Local Development Setup

### 1. Prerequisites

Ensure you have **Node.js (>=18)** and **pnpm** installed.

### 2. Install Dependencies

Install project workspace packages (this automatically triggers database client generation):

```bash
pnpm install
```

### 3. Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL="your-postgresql-connection-string"
JWT_SECRET="your-jwt-auth-secret"
```

### 4. Database Migrations

Deploy database schemas to your database:

```bash
pnpm --filter @repo/db prisma db push
```

### 5. Start Servers

Run all client apps and backend servers in development mode simultaneously:

```bash
pnpm dev
```

---

## Build for Production

Compile all packages and build target applications:

```bash
pnpm build
```
