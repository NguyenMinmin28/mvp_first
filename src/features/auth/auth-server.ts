import { getServerSession } from "next-auth/next";

import { authOptions } from "./auth";

export async function getServerSessionUser() {
  try {
    console.log("🔍 getServerSessionUser - Starting to get session");
    const session = await getServerSession(authOptions);
    console.log("🔍 getServerSessionUser - Session result:", !!session, session?.user?.email, session?.user?.role);

    if (!session?.user) {
      console.log("🔍 getServerSessionUser - No session or user");
      return null;
    }

    console.log("🔍 getServerSessionUser - Returning user:", session.user.email, session.user.role);
    return {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
      phoneE164: session.user.phoneE164,
      role: session.user.role,
      isProfileCompleted: session.user.isProfileCompleted,
      // Include developer admin approval status when available
      // This exists on the session (populated from JWT callback)
      adminApprovalStatus: (session.user as any)?.adminApprovalStatus,
    };
  } catch (error) {
    console.error("🔍 getServerSessionUser - Error:", error);
    return null;
  }
}

export async function requireServerAuth() {
  const user = await getServerSessionUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}
