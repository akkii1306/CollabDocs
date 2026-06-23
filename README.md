# CollabDocs

A production-grade Real-Time Collaborative Document Platform inspired by Notion and Google Docs.

## Features
- **Real-Time Collaboration**: Socket.io based document editing with active presence and cursors. Designed for future Yjs CRDT integration.
- **Workspaces**: Group documents by workspaces and invite members with role-based access control (OWNER, EDITOR, VIEWER).
- **Authentication**: JWT-based authentication with Refresh Tokens.
- **Rich Text Editor**: Powered by TipTap.
- **UI/UX**: Custom shadcn/ui components with Tailwind CSS in a responsive dashboard.
- **Backend Architecture**: Node.js, Express, Prisma, PostgreSQL, Redis with Service-Repository pattern.

## Quick Start (Docker)

To run the entire application using Docker Compose:

1. Copy environment variables:
   ```bash
   cd backend
   cp .env.example .env
   ```

2. Start the services:
   ```bash
   docker-compose up -d --build
   ```

3. Initialize Database (Inside the backend container):
   ```bash
   docker-compose exec backend npx prisma migrate dev --name init
   docker-compose exec backend npx prisma db seed
   ```

4. Open the application:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000/api
   - Healthcheck: http://localhost:5000/health

## Test Users (from Seed Script)
- **Alice**: `alice@example.com` (password: `password123`)
- **Bob**: `bob@example.com` (password: `password123`)

## Local Development (Without Docker)

### Backend
1. Start PostgreSQL and Redis locally.
2. Update `DATABASE_URL` and `REDIS_URL` in `backend/.env`.
3. Run `npm install` inside `backend/`.
4. Run `npx prisma db push` to push schema.
5. Run `npx prisma db seed` to insert dummy data.
6. Run `npm run dev` to start server on `http://localhost:5000`.

### Frontend
1. Run `npm install` inside `frontend/`.
2. Update `VITE_API_URL` and `VITE_SOCKET_URL` in `frontend/.env` (if applicable) or use defaults (`http://localhost:5000`).
3. Run `npm run dev` to start Vite server.
