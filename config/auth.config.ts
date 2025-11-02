import { prisma } from "@/core/database/db"
import { OtpService } from "@/core/services/otp.service"
import { WhatsAppService } from "@/core/services/whatsapp.service"
import { DeveloperStatusService } from "@/core/services/developer-status.service"
import { PrismaAdapter } from "@auth/prisma-adapter"
import bcrypt from "bcryptjs"
import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"

export default {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // Allow linking a Google account to an existing email/password account
      // that has the same verified email. This avoids OAuthAccountNotLinked errors
      // when the user first registered via credentials.
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    CredentialsProvider({
      id: "credentials",
      name: "Email and Password",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "email@example.com",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },
      async authorize(credentials) {
        const DEBUG_AUTH = process.env.NEXT_PUBLIC_DEBUG_AUTH === "true"
        if (DEBUG_AUTH) {
          console.log("🔐 Email/Password authorize called")
          console.log("🔐 Environment check - NEXTAUTH_URL:", process.env.NEXTAUTH_URL)
          console.log("🔐 Environment check - NEXTAUTH_SECRET:", !!process.env.NEXTAUTH_SECRET)
          console.log("🔐 Environment check - DATABASE_URL:", !!process.env.DATABASE_URL)
          console.log("🔐 Environment check - NODE_ENV:", process.env.NODE_ENV)
        }

        if (!credentials?.email || !credentials?.password) {
          console.log("❌ Missing email or password")
          return null
        }

        try {
          if (DEBUG_AUTH) console.log("🔐 Attempting database connection...")
          // Find user by email
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            select: {
              id: true,
              name: true,
              email: true,
              passwordHash: true,
              role: true,
              isProfileCompleted: true,
              image: true,
            },
          })

          if (DEBUG_AUTH) console.log("🔐 Database query result:", !!user)

          if (!user || !user.passwordHash) {
            if (DEBUG_AUTH) console.log("❌ User not found or no password set")
            return null
          }

          // Verify password
          const isValidPassword = await bcrypt.compare(
            credentials.password,
            user.passwordHash
          )

          if (!isValidPassword) {
            if (DEBUG_AUTH) console.log("❌ Invalid password")
            return null
          }

          if (DEBUG_AUTH) console.log("✅ Email/Password authentication successful")
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role || undefined,
            isProfileCompleted: user.isProfileCompleted,
            image: user.image,
          }
        } catch (error) {
          console.error("Email/Password authorization error:", error)
          return null
        }
      },
    }),
    CredentialsProvider({
      id: "whatsapp",
      name: "WhatsApp",
      credentials: {
        phoneNumber: {
          label: "Phone Number",
          type: "text",
          placeholder: "+1234567890",
        },
        verificationCode: {
          label: "Verification Code",
          type: "text",
          placeholder: "123456",
        },
      },
      async authorize(credentials) {
        const DEBUG_AUTH = process.env.NEXT_PUBLIC_DEBUG_AUTH === "true"
        if (DEBUG_AUTH) console.log("🔐 NextAuth WhatsApp authorize called")

        if (!credentials?.phoneNumber || !credentials?.verificationCode) {
          console.log("❌ Missing credentials")
          return null
        }

        try {
          // Format phone number to E.164
          // const phoneE164 = WhatsAppService.formatPhoneNumber(
          //   credentials.phoneNumber
          // )
          // console.log("📱 Phone number formatted:", phoneE164)
          // // Validate phone number format
          // if (!WhatsAppService.validatePhoneNumber(phoneE164)) {
          //   console.log("❌ Invalid phone number format")
          //   return null
          // }
          // // Verify OTP with the database
          // console.log("🔐 Verifying OTP...")
          // const otpResult = await OtpService.verifyOtp(
          //   phoneE164,
          //   credentials.verificationCode
          // )
          // console.log("🔐 OTP verification result:", otpResult)
          // if (!otpResult.success) {
          //   console.log("❌ OTP verification failed")
          //   return null
          // }
          // // Check if user already exists
          // let user = await prisma.user.findUnique({
          //   where: { phoneE164: phoneE164 },
          // })
          // if (!user) {
          //   // Create new user if doesn't exist
          //   user = await prisma.user.create({
          //     data: {
          //       phoneE164: phoneE164,
          //       name: "",
          //       email: "",
          //     },
          //   })
          // }
          // return {
          //   id: user.id,
          //   name: user.name,
          //   email: user.email,
          //   phoneE164: user.phoneE164,
          //   image: user.image,
          //   role: user.role,
          //   isProfileCompleted: user.isProfileCompleted,
          // }
          return null
        } catch (error) {
          console.error("WhatsApp authorization error:", error)
          return null
        }
      },
    }),
  ],
  callbacks: {
  async signIn({ user, account, profile }: any) {
    const DEBUG_AUTH = process.env.NEXT_PUBLIC_DEBUG_AUTH === "true"
    if (DEBUG_AUTH) console.log("🔐 SignIn callback called")

    // Nếu là Google OAuth
    if (account?.provider === "google") {
      try {
        // Kiểm tra xem user đã tồn tại trong database chưa
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
          select: {
            id: true,
            role: true,
            isProfileCompleted: true,
          },
        })

        if (!existingUser) {
          if (DEBUG_AUTH) console.log("🔄 Google user not found, creating new user:", user.email)
          
          // Tự động tạo user mới với Google account (without password - user will set it later)
          const newUser = await prisma.$transaction(async (tx) => {
            // Create user with Google account
            const newUserRecord = await tx.user.create({
              data: {
                name: user.name || user.email!.split('@')[0],
                email: user.email!,
                image: user.image,
                emailVerified: new Date(), // Google accounts are pre-verified
                isProfileCompleted: false, // User needs to complete profile
                // No passwordHash - user will be prompted to set password
              },
            });

            // Create client profile
            const clientProfile = await tx.clientProfile.create({
              data: {
                userId: newUserRecord.id,
              },
            });

            // Tìm Basic Plan package
            const basicPackage = await tx.package.findFirst({
              where: {
                name: "Basic Plan",
                priceUSD: 0
              }
            });

            // Nếu có Basic Plan, tạo subscription
            if (basicPackage) {
              await tx.subscription.create({
                data: {
                  clientId: clientProfile.id,
                  packageId: basicPackage.id,
                  status: 'active',
                  provider: 'paypal',
                  providerSubscriptionId: `basic-${newUserRecord.id}-${Date.now()}`,
                  startAt: new Date(),
                  currentPeriodStart: new Date(),
                  currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
                  cancelAtPeriodEnd: false,
                  trialStart: null,
                  trialEnd: null
                }
              });
            }

            return newUserRecord;
          });

          if (DEBUG_AUTH) console.log("✅ Google user created successfully:", newUser.id)
          // Mark developer availability and last login if applicable
          try {
            await DeveloperStatusService.setDeveloperAvailable(newUser.id);
          } catch {}
          try {
            await prisma.user.update({ where: { id: newUser.id }, data: { lastLoginAt: new Date() } });
          } catch {}
          // New user created - will be redirected to setup-password page
          return true
        }

        if (DEBUG_AUTH) console.log("✅ Google user found in database:", existingUser)
        // Update activity on sign-in
        try {
          await prisma.user.update({ where: { id: existingUser.id }, data: { lastLoginAt: new Date() } });
        } catch {}
        try {
          await DeveloperStatusService.setDeveloperAvailable(existingUser.id);
        } catch {}
        // On successful Google sign in, mark active for developers later in jwt
        return true
      } catch (error) {
        console.error("Error handling Google user:", error)
        return false
      }
    }

    // Credentials sign-in: set availability and lastLoginAt
    if (account?.provider === "credentials" && user?.id) {
      try {
        await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
      } catch {}
      try {
        await DeveloperStatusService.setDeveloperAvailable(user.id);
      } catch {}
    }

    // Cho phép các provider khác (whatsapp)
    return true
  },
  
  // Avoid login redirect loops
  redirect({ url, baseUrl }) {
    const DEBUG_AUTH = process.env.NEXT_PUBLIC_DEBUG_AUTH === "true"
    try {
      const returnUrl = new URL(url, baseUrl);
      if (returnUrl.origin === baseUrl) {
        if (DEBUG_AUTH) console.log("🔍 Valid redirect URL:", returnUrl.toString());
        return returnUrl.toString();
      }
      if (DEBUG_AUTH) console.log("🔍 Invalid redirect URL, using baseUrl:", baseUrl);
      return baseUrl;
    } catch (err) {
      if (DEBUG_AUTH) console.log("🔍 Error parsing redirect URL, using baseUrl:", baseUrl);
      return baseUrl;
    }
  },
    session: async ({ session, token }: any) => {
      const DEBUG_AUTH = process.env.NEXT_PUBLIC_DEBUG_AUTH === "true"
      if (DEBUG_AUTH) {
        console.log("🔍 Session callback - token:", token)
        console.log("🔍 Session callback - session:", session)
      }

      if (session?.user) {
        if (DEBUG_AUTH) console.log(session.user)
        const user = session.user as typeof session.user & {
          id: string
          phoneE164?: string
          role?: string
          isProfileCompleted?: boolean
        }
        // Use token.sub for user ID (this is NextAuth standard)
        user.id = token.sub!
        // Add phone number if available (for WhatsApp auth)
        if (token.phoneE164) {
          user.phoneE164 = token.phoneE164
        }
        // Add role and profile completion status
        if (token.role) {
          user.role = token.role
        }
        if (typeof token.isProfileCompleted === "boolean") {
          user.isProfileCompleted = token.isProfileCompleted
        }
        if (token.adminApprovalStatus) {
          user.adminApprovalStatus = token.adminApprovalStatus
        }
        if (DEBUG_AUTH) console.log("🔍 Final session user:", user)
      }

      if (DEBUG_AUTH) {
        console.log("🔍 Returning session:", session)
        console.log("🔍 Session user role:", session?.user?.role)
      }
      return session
    },
    jwt: async ({ user, token, trigger }: any) => {
      const DEBUG_AUTH = process.env.NEXT_PUBLIC_DEBUG_AUTH === "true"
      if (DEBUG_AUTH) {
        console.log("🔍 JWT callback - user:", user)
        console.log("🔍 JWT callback - token:", token)
        console.log("🔍 JWT callback - trigger:", trigger)
      }

      // If no token.sub, return early to prevent session loss
      if (!token.sub) {
        if (DEBUG_AUTH) console.log("❌ No token.sub, returning early");
        return token;
      }

      // Throttle DB refresh to reduce load; refresh on first login, manual updates, or interval
      const REFRESH_INTERVAL_MS = 5 * 60 * 1000
      const shouldRefreshByTime = !token.lastRefreshedAt || (Date.now() - (token.lastRefreshedAt as number)) > REFRESH_INTERVAL_MS
      const shouldRefresh = shouldRefreshByTime || trigger === 'update' || !!user
      if (shouldRefresh) {
        try {
          if (DEBUG_AUTH) console.log("🔄 JWT: refreshing user snapshot from DB")
          const dbUser = await prisma.user.findUnique({
            where: { id: token.sub },
            select: {
              id: true,
              name: true,
              email: true,
              phoneE164: true,
              role: true,
              isProfileCompleted: true,
              developerProfile: { select: { adminApprovalStatus: true } },
            },
          })
          if (dbUser) {
            token.name = dbUser.name
            token.email = dbUser.email
            token.phoneE164 = dbUser.phoneE164
            token.role = dbUser.role
            token.isProfileCompleted = dbUser.isProfileCompleted
            token.adminApprovalStatus = dbUser.developerProfile?.adminApprovalStatus
          }
          token.lastRefreshedAt = Date.now()
        } catch (error) {
          console.error("❌ JWT: refresh error", error)
        }
      }

      // Also handle user object if it's available (on first login)
      if (user) {
        if (DEBUG_AUTH) console.log("🔍 JWT callback: Processing user object from login")
        // Store user ID in token.sub (NextAuth standard)
        // For database adapters, token.sub is automatically set
        if ("phoneE164" in user) {
          token.phoneE164 = user.phoneE164
        }
        if ("role" in user) {
          token.role = user.role
        }
        if ("isProfileCompleted" in user) {
          token.isProfileCompleted = user.isProfileCompleted
        }
      }

      if (DEBUG_AUTH) {
        console.log("🔍 JWT callback: Final token:", {
          sub: token.sub,
          email: token.email,
          role: token.role,
          isProfileCompleted: token.isProfileCompleted,
          adminApprovalStatus: token.adminApprovalStatus
        })
      }
      
      return token
    },
  },
  events: {
    async signOut({ token }: any) {
      try {
        if (token?.sub) {
          await DeveloperStatusService.setDeveloperBusy(token.sub);
          await prisma.user.update({
            where: { id: token.sub },
            data: { lastLoginAt: new Date() },
          });
        }
      } catch (e) {
        console.error("Error in events.signOut while recording activity:", e);
      }
    },
  },
  session: {
  strategy: "jwt",
  maxAge: 30 * 24 * 60 * 60, // 30 days
  updateAge: 24 * 60 * 60, // 24 hours
},
cookies: {
  sessionToken: {
    name: `${process.env.NODE_ENV === "production" ? "__Secure-" : ""}next-auth.session-token`,
    options: {
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax"
    }
  }
},
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin", // Redirect về trang signin khi có lỗi
  },
} satisfies NextAuthOptions
