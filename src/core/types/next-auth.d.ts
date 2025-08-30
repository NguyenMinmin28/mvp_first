// @ts-nocheck
import type { Prisma } from "@prisma/client";
type Role = Prisma.$Enums.Role;
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      phoneE164?: string;
      role?: Role;
      isProfileCompleted?: boolean;
    };
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    phoneE164?: string;
    role?: Role;
    isProfileCompleted?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    phoneE164?: string;
    role?: Role;
    isProfileCompleted?: boolean;
  }
}
