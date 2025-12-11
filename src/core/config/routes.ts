export const adminRoutes = {
  ADMIN: "/admin",
  DEVELOPER_PROFILE: "/admin/developer-profile",
  USER_MANAGEMENT: "/admin/users",
  ANALYTICS: "/admin/analytics",
  SETTINGS: "/admin/settings",
  LOGS: "/admin/logs",
  SECURITY: "/admin/security",
  SKILLS: "/admin/skills",
} as const;

export const userRoutes = {
  HOME: "/",
  SIGNIN: "/auth/signin",
  SIGNUP: "/auth/signup",
  ROLE_SELECTION: "/role-selection",
  PROFILE: "/profile",
} as const;

export const publicRoutes = {
  HOME: "/",
  ABOUT: "/about",
  CONTACT: "/contact",
} as const;
