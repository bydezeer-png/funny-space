import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "البريد الإلكتروني", type: "email" },
        password: { label: "كلمة المرور", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        })
        
        if (!user) return null

        // Check if currently locked out
        if (user.lockoutUntil && user.lockoutUntil > new Date()) {
          return null
        }
        
        const passwordsMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        )
        
        if (passwordsMatch) {
          // Reset attempts on successful login
          if (user.failedAttempts > 0) {
            await prisma.user.update({
              where: { id: user.id },
              data: { failedAttempts: 0, lockoutUntil: null }
            })
          }
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
          }
        }

        // Incorrect password: increment failed attempts
        const newAttempts = user.failedAttempts + 1
        const updates: { failedAttempts: number; lockoutUntil?: Date | null } = {
          failedAttempts: newAttempts
        }
        
        const settings = await prisma.systemSettings.findUnique({
          where: { id: "default" }
        })
        const maxFailedAttempts = settings?.maxFailedAttempts ?? 5
        const lockoutDurationMinutes = settings?.lockoutDurationMinutes ?? 15

        if (newAttempts >= maxFailedAttempts) {
          updates.lockoutUntil = new Date(Date.now() + lockoutDurationMinutes * 60 * 1000)
        }
        await prisma.user.update({
          where: { id: user.id },
          data: updates
        })

        return null
      }
    }),
    CredentialsProvider({
      id: "client",
      name: "Client Login",
      credentials: {
        phone: { label: "رقم الهاتف", type: "text" },
        password: { label: "كلمة المرور", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.password) return null
        
        const client = await prisma.client.findUnique({
          where: { phone: credentials.phone as string }
        })
        
        if (!client || !client.password) return null
        
        const passwordsMatch = await bcrypt.compare(
          credentials.password as string,
          client.password
        )
        
        if (passwordsMatch) {
          return {
            id: client.id,
            name: client.name,
            email: client.phone, // map phone to email just to satisfy User type if needed, but we can pass role
            role: "CLIENT"
          }
        }
        return null
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role as string
        (session.user as any).id = token.id as string
      }
      return session
    }
  },
  pages: {
    signIn: "/login",
  }
})
