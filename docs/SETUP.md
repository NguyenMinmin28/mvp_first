# 🚀 Todo App Setup Guide

Next.js 14 + Hono + Prisma + MongoDB + NextAuth

## Quick Start

1. **Setup Environment**

```bash
cp .env.example .env
# Edit .env with your MongoDB and GitHub OAuth credentials
```

2. **Generate Prisma Client**

```bash
npx prisma generate
npx prisma db push
```

3. **Run Development Server**

```bash
npm run dev
```

## Environment Variables

Create `.env` file:

```env
DATABASE_URL="mongodb://localhost:27017/todoapp"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to "Credentials" > "Create Credentials" > "OAuth client ID"
5. Configure OAuth consent screen first if required
6. Application type: Web application
   - Authorized JavaScript origins: `http://localhost:3000`
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
7. Copy Client ID and Client Secret to `.env`

## Project Structure

```
src/
├── app/api/
│   ├── auth/[...nextauth]/route.ts   # NextAuth
│   └── todos/route.ts                # Hono API
├── lib/
│   ├── api/todos.ts                  # Hono routes
│   ├── services/todos.service.ts     # Business logic
│   ├── schemas/todo.schema.ts        # Zod validation
│   └── types/todo.type.ts            # TypeScript types
└── components/                       # UI components
```

## Features

- ✅ Google OAuth Authentication
- ✅ CRUD Operations for Todos
- ✅ Modern UI with shadcn/ui
- ✅ Type-safe API with Hono + Zod
- ✅ MongoDB with Prisma ORM
