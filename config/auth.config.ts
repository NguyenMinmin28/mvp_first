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
        console.log("🔐 Email/Password authorize called with:", credentials)
        console.log("🔐 Environment check - NEXTAUTH_URL:", process.env.NEXTAUTH_URL)
        console.log("🔐 Environment check - NEXTAUTH_SECRET:", !!process.env.NEXTAUTH_SECRET)
        console.log("🔐 Environment check - DATABASE_URL:", !!process.env.DATABASE_URL)
        console.log("🔐 Environment check - NODE_ENV:", process.env.NODE_ENV)

        if (!credentials?.email || !credentials?.password) {
          console.log("❌ Missing email or password")
          return null
        }

        try {
          console.log("🔐 Attempting database connection...")
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

          console.log("🔐 Database query result:", !!user)

          if (!user || !user.passwordHash) {
            console.log("❌ User not found or no password set")
            return null
          }

          // Verify password
          const isValidPassword = await bcrypt.compare(
            credentials.password,
            user.passwordHash
          )

          if (!isValidPassword) {
            console.log("❌ Invalid password")
            return null
          }

          console.log("✅ Email/Password authentication successful")
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
          console.error("Database connection error details:", error)
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
        console.log("🔐 NextAuth authorize called with:", credentials)

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
    console.log("🔐 SignIn callback called:", { user, account, profile })

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
          console.log("🔄 Google user not found, creating new user:", user.email)
          
          // Tự động tạo user mới với Google account
          const newUser = await prisma.$transaction(async (tx) => {
            // Create user with Google account
            const newUserRecord = await tx.user.create({
              data: {
                name: user.name || user.email!.split('@')[0],
                email: user.email!,
                image: user.image,
                emailVerified: new Date(), // Google accounts are pre-verified
                isProfileCompleted: false, // User needs to complete profile
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

          console.log("✅ Google user created successfully:", newUser.id)
          return true
        }

        console.log("✅ Google user found in database:", existingUser)
        return true
      } catch (error) {
        console.error("Error handling Google user:", error)
        return false
      }
    }

    // Cho phép các provider khác (credentials, whatsapp)
    return true
  },
  
  // Avoid login redirect loops
  redirect({ url, baseUrl }) {
    try {
      const returnUrl = new URL(url, baseUrl);
      if (returnUrl.origin === baseUrl) {
        console.log("🔍 Valid redirect URL:", returnUrl.toString());
        return returnUrl.toString();
      }
      console.log("🔍 Invalid redirect URL, using baseUrl:", baseUrl);
      return baseUrl;
    } catch (err) {
      console.log("🔍 Error parsing redirect URL, using baseUrl:", baseUrl);
      return baseUrl;
    }
  },
    session: async ({ session, token }: any) => {
      console.log("🔍 Session callback - token:", token)
      console.log("🔍 Session callback - session:", session)

      if (session?.user) {
        console.log(session.user)
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
        console.log("🔍 Final session user:", user)
      }

      console.log("🔍 Returning session:", session)
      console.log("🔍 Session user role:", session?.user?.role)
      return session
    },
    jwt: async ({ user, token, trigger }: any) => {
      console.log("🔍 JWT callback - user:", user)
      console.log("🔍 JWT callback - token:", token)
      console.log("🔍 JWT callback - trigger:", trigger)

      // If no token.sub, return early to prevent session loss
      if (!token.sub) {
        console.log("❌ No token.sub, returning early");
        return token;
      }

      // Always fetch fresh user data to ensure token has latest info
      try {
        console.log("🔄 JWT callback: Fetching fresh user data from database")

        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: {
            id: true,
            name: true,
            email: true,
            phoneE164: true,
            role: true,
            isProfileCompleted: true,
            developerProfile: {
              select: {
                adminApprovalStatus: true,
              },
            },
          },
        })

        if (dbUser) {
          console.log("🔄 JWT callback: Fresh user data:", {
            id: dbUser.id,
            email: dbUser.email,
            role: dbUser.role,
            isProfileCompleted: dbUser.isProfileCompleted,
            adminApprovalStatus: dbUser.developerProfile?.adminApprovalStatus
          })

          // Always update with fresh data from database
          token.name = dbUser.name
          token.email = dbUser.email
          token.phoneE164 = dbUser.phoneE164
          token.role = dbUser.role
          token.isProfileCompleted = dbUser.isProfileCompleted
          token.adminApprovalStatus = dbUser.developerProfile?.adminApprovalStatus

          // Update developer status to available when JWT is refreshed (user is active)
          if (dbUser.role === "DEVELOPER" && dbUser.developerProfile) {
            try {
              console.log("🔄 JWT callback: Updating developer status to available");
              await DeveloperStatusService.setDeveloperAvailable(dbUser.id);
            } catch (statusError) {
              console.error("❌ JWT callback: Failed to update developer status:", statusError);
              // Don't throw error to avoid breaking the session
            }
          }
        } else {
          console.log("❌ JWT callback: User not found in database");
        }
      } catch (error) {
        console.error("❌ JWT callback: Error fetching user data:", error)
      }

      // Also handle user object if it's available (on first login)
      if (user) {
        console.log("🔍 JWT callback: Processing user object from login")
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

      console.log("🔍 JWT callback: Final token:", {
        sub: token.sub,
        email: token.email,
        role: token.role,
        isProfileCompleted: token.isProfileCompleted,
        adminApprovalStatus: token.adminApprovalStatus
      })
      
      return token
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
