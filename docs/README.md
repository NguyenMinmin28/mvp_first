# 🚀 Next.js Fullstack Starter

A modern, production-ready Next.js 14+ fullstack application template with authentication, database, and API routes. Perfect for quickly bootstrapping your next project.

## ✨ Features

- **🔥 Next.js 14+** - App Router, Server Components, and latest features
- **🔐 Authentication** - NextAuth.js with Google OAuth integration
- **🗄️ Database** - Prisma ORM with MongoDB support
- **🌐 API Routes** - Type-safe APIs with Hono framework and Zod validation
- **🎨 Modern UI** - shadcn/ui components with Tailwind CSS
- **🎯 TypeScript** - Full type safety throughout the application
- **🌙 Theme Support** - Dark/Light mode with next-themes
- **📱 Responsive** - Mobile-first responsive design
- **🚀 Performance** - Optimized for speed and SEO
- **🔧 Developer Experience** - ESLint, Prettier, and auto-formatting

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui, Radix UI
- **Backend**: Hono, NextAuth.js
- **Database**: MongoDB, Prisma ORM
- **Authentication**: NextAuth.js with Google OAuth
- **Validation**: Zod schemas
- **Icons**: Lucide React
- **Development**: ESLint, Prettier, TypeScript

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MongoDB database (local or cloud)
- Google OAuth credentials

### Installation

1. **Clone or use this template**

```bash
git clone https://github.com/your-username/next-fullstack-starter.git
cd next-fullstack-starter
```

Or use as template:

```bash
npx create-next-app@latest my-app -e https://github.com/your-username/next-fullstack-starter
```

2. **Install dependencies**

```bash
npm install
# or
pnpm install
# or
yarn install
```

3. **Setup environment variables**

```bash
cp .env.example .env
```

Update `.env` with your credentials:

```env
# Database
DATABASE_URL="mongodb://localhost:27017/next-fullstack-starter"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

4. **Setup database**

```bash
npx prisma generate
npx prisma db push
```

5. **Run development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 🔧 Configuration

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to "Credentials" > "Create Credentials" > "OAuth client ID"
5. Configure OAuth consent screen first if required
6. Application type: Web application
   - Authorized JavaScript origins: `http://localhost:3000`
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
7. Copy Client ID and Client Secret to `.env`

### Database Options

This starter supports MongoDB by default, but you can easily switch to other databases supported by Prisma:

- PostgreSQL
- MySQL
- SQLite
- SQL Server

Just update the `DATABASE_URL` in your `.env` file and modify the Prisma schema accordingly.

## 📁 Project Structure

```
src/
├── app/                              # Next.js App Router
│   ├── api/                         # API routes
│   │   ├── auth/[...nextauth]/      # NextAuth endpoints
│   │   ├── revalidate/              # Revalidation endpoints
│   │   └── routes/                  # Hono API routes
│   ├── layout.tsx                   # Root layout
│   └── page.tsx                     # Home page
├── core/                            # Core utilities
│   ├── config/                      # App configuration
│   ├── database/                    # Database connection
│   ├── types/                       # Global types
│   └── utils/                       # Utility functions
├── features/                        # Feature modules
│   ├── auth/                        # Authentication logic
│   ├── shared/                      # Shared components
│   └── todos/                       # Todo feature
│       ├── components/              # Todo-specific components
│       ├── schemas/                 # Validation schemas
│       ├── services/                # Business logic
│       └── types/                   # Todo types
└── ui/                              # UI components
    ├── components/                  # shadcn/ui components
    └── styles/                      # Global styles
```

## 📝 Available Scripts

```bash
# Development
npm run dev          # Start development server

# Building
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
npm run format:check # Check formatting

# Database
npx prisma generate  # Generate Prisma client
npx prisma db push   # Push schema to database
npx prisma studio    # Open Prisma Studio
```

## 🔐 Authentication

The application includes a complete authentication system with:

- **Google OAuth** - Secure login with Google
- **Session Management** - Persistent sessions with NextAuth.js
- **Protected Routes** - API route protection middleware
- **User Context** - Access user information throughout the app

### Usage

```typescript
// In API routes
import { requireAuth } from "@/features/auth/hono-auth";

app.use("/api/protected/*", requireAuth());

// In components
import { useSession } from "next-auth/react";

const { data: session, status } = useSession();
```

## 🗄️ Database & API

### Prisma Schema

The application includes a flexible Prisma schema that you can extend:

```prisma
// Example model
model Todo {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  title     String
  completed Boolean  @default(false)
  userId    String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### API Routes

Built with Hono for type-safe, fast API routes:

```typescript
// Type-safe API endpoints
app.get("/api/todos", requireAuth(), async (c) => {
  const userId = c.get("userId");
  const todos = await getTodos(userId);
  return c.json(todos);
});
```

## 🎨 UI Components

Uses shadcn/ui for a consistent, beautiful design system:

- **Composable** - Build complex UIs from simple components
- **Accessible** - Built on Radix UI primitives
- **Customizable** - Easy to theme and modify
- **Modern** - Latest design patterns and best practices

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Other Platforms

This application can be deployed to any platform that supports Next.js:

- Netlify
- Railway
- Render
- AWS
- DigitalOcean

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful UI components
- [Prisma](https://prisma.io/) - Next-generation ORM
- [NextAuth.js](https://next-auth.js.org/) - Authentication for Next.js
- [Hono](https://hono.dev/) - Fast web framework
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework

---

⭐ If this project helped you, please consider giving it a star on GitHub!
