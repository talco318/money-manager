import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import prisma from '@/lib/prisma';

// Allowed email addresses (can be configured via env variable)
const ALLOWED_EMAILS = process.env.ALLOWED_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || [];

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // If no allowed emails configured, allow anyone
      if (ALLOWED_EMAILS.length === 0) {
        return true;
      }
      
      // Check if user's email is in the allowed list
      const userEmail = user.email?.toLowerCase();
      if (userEmail && ALLOWED_EMAILS.includes(userEmail)) {
        return true;
      }
      
      // Deny access
      console.log(`Access denied for email: ${user.email}`);
      return false;
    },
    async session({ session, user }) {
      // Add user id to session
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60, // 30 days (for "remember me")
  },
});

export { handler as GET, handler as POST };
