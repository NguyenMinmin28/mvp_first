export const adminRoutes = {
  ADMIN: "/admin",
  DEVELOPER_PROFILE: "/admin/developer-profile",
  USER_MANAGEMENT: "/admin/users",
  ANALYTICS: "/admin/analytics",
  SETTINGS: "/admin/settings",
  LOGS: "/admin/logs",
  SECURITY: "/admin/security",
} as const;

export const userRoutes = {
  HOME: "/",
  SIGNIN: "/auth/signin",
  SIGNUP: "/auth/signup",
  // COMPLETE_PROFILE: "/complete-profile",
  PROFILE: "/profile",
} as const;

export const publicRoutes = {
  HOME: "/",
  ABOUT: "/about",
  CONTACT: "/contact",
} as const;
