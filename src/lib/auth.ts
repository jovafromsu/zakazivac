import { NextAuthOptions, DefaultSession } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import bcrypt from "bcryptjs"
import User from "@/models/User"
import connectDB from "@/lib/mongodb"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      roles: string[]
    } & DefaultSession["user"]
  }
  
  interface User {
    id: string
    roles: string[]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    roles: string[]
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        await connectDB()
        
        const user = await User.findOne({ email: credentials.email })
        
        if (!user || !user.password) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
        
        if (!isPasswordValid) {
          return null
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          roles: user.roles,
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.roles = user.roles
      }
      return token
    },
    async session({ session, token }: any) {
      if (token) {
        session.user.id = token.sub!
        session.user.roles = token.roles as string[]
      }
      return session
    },
    async signIn({ user, account, profile }: any) {
      if (account?.provider === "google") {
        await connectDB()
        
        // Check if user exists, create if not
        let existingUser = await User.findOne({ email: user.email })
        
        if (!existingUser) {
          existingUser = await User.create({
            email: user.email,
            name: user.name,
            roles: ["client"], // Default role for Google sign-ins
          })
        }
        
        user.id = existingUser._id.toString()
        user.roles = existingUser.roles
      }
      return true
    },
    async redirect({ url, baseUrl, token }) {
      // If URL contains callbackUrl, use it
      if (url.includes('callbackUrl=')) {
        const callbackUrl = new URL(url).searchParams.get('callbackUrl')
        if (callbackUrl && callbackUrl.startsWith('/')) {
          return `${baseUrl}${callbackUrl}`
        }
      }
      
      // Allow relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Allow callback URLs on the same origin
      if (new URL(url).origin === baseUrl) return url
      
      // Default redirect to dashboard for role-based routing
      return `${baseUrl}/dashboard`
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
}