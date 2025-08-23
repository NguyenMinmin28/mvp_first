import { prisma } from "@/core/database/db"
import { OtpService } from "@/core/services/otp.service"
import { WhatsAppService } from "@/core/services/whatsapp.service"
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

        if (!credentials?.email || !credentials?.password) {
          console.log("❌ Missing email or password")
          return null
        }

        try {
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
            role: user.role,
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
      // Allow all sign ins to proceed
      // Role assignment for Google users will be handled in the callback page
      return true
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
        console.log("🔍 Final session user:", user)
      }

      console.log("🔍 Returning session:", session)
      return session
    },
    jwt: async ({ user, token, trigger }: any) => {
      console.log("🔍 JWT callback - user:", user)
      console.log("🔍 JWT callback - token:", token)
      console.log("🔍 JWT callback - trigger:", trigger)

      // Always refresh user data from database for fresh data
      // This ensures we get the latest role information
      if (token.sub) {
        if (token.sub) {
          try {
            console.log(
              "🔄 JWT callback: Refreshing user data from database, trigger:",
              trigger
            )

            const dbUser = await prisma.user.findUnique({
              where: { id: token.sub },
              select: {
                id: true,
                name: true,
                email: true,
                phoneE164: true,
                role: true,
                isProfileCompleted: true,
              },
            })

            if (dbUser) {
              console.log("🔄 JWT callback: Updated user data:", {
                oldRole: token.role,
                newRole: dbUser.role,
              })

              token.name = dbUser.name
              token.email = dbUser.email
              token.phoneE164 = dbUser.phoneE164
              token.role = dbUser.role
              token.isProfileCompleted = dbUser.isProfileCompleted
            }
          } catch (error) {
            console.error("Error fetching user data in JWT callback:", error)
          }
        }
      }

      if (user) {
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

      console.log("🔍 Returning token:", token)
      return token
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
  },
} satisfies NextAuthOptions
