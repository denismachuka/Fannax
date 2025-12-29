import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { prisma } from './db'

// #region agent log
const authSecretExists = !!process.env.AUTH_SECRET;
const authSecretLength = process.env.AUTH_SECRET?.length || 0;
fetch('http://127.0.0.1:7242/ingest/716151d5-b5ff-4d89-a3f2-8421e03cf581',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth.ts:module-load',message:'Auth module loading',data:{authSecretExists,authSecretLength,nodeEnv:process.env.NODE_ENV},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
// #endregion

declare module 'next-auth' {
  interface User {
    username?: string
  }
  interface Session {
    user: {
      id: string
      username: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }
}

// #region agent log
fetch('http://127.0.0.1:7242/ingest/716151d5-b5ff-4d89-a3f2-8421e03cf581',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth.ts:before-nextauth-init',message:'Initializing NextAuth',data:{hasSecret:!!process.env.AUTH_SECRET},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
// #endregion

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        login: { label: 'Username or Email', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/716151d5-b5ff-4d89-a3f2-8421e03cf581',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth.ts:authorize',message:'Authorize called',data:{hasCredentials:!!credentials,hasLogin:!!credentials?.login},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        if (!credentials?.login || !credentials?.password) {
          return null
        }

        const login = credentials.login as string
        const password = credentials.password as string

        // Find user by username or email
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { username: login.toLowerCase() },
              { email: login.toLowerCase() }
            ]
          }
        })

        if (!user) {
          return null
        }

        // Verify password
        const isValidPassword = await compare(password, user.password)

        if (!isValidPassword) {
          return null
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          username: user.username,
          image: user.profilePhoto
        }
      }
    })
  ],
  pages: {
    signIn: '/login',
    newUser: '/signup'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.username = (user as { username?: string }).username
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.username = token.username as string
      }
      return session
    }
  },
  session: {
    strategy: 'jwt'
  }
})
