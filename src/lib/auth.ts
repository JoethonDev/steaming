import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import { sessionService } from "@/lib/services/session";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db) as any,
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          throw new Error("User not found");
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isValid) {
          throw new Error("Invalid password");
        }

        return {
          id: user.id,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
        token.sessionCreated = Date.now();
      }
      
      // Check if session needs refresh due to user changes
      if (token.id && trigger === "update") {
        // Force token refresh by fetching fresh user data
        try {
          const freshUser = await db.user.findUnique({
            where: { id: token.id as string },
            select: { id: true, email: true, role: true, updatedAt: true }
          });
          
          if (freshUser) {
            token.role = freshUser.role;
            token.email = freshUser.email;
            token.sessionCreated = Date.now();
            // Clear the invalidation flag
            sessionService.clearUserUpdate(token.id as string);
          }
        } catch (error) {
          console.error("Failed to refresh user data:", error);
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
        
        // Check if session needs refresh
        const needsRefresh = sessionService.shouldRefreshSession(
          token.id as string,
          new Date(token.sessionCreated as number)
        );
        
        if (needsRefresh) {
          // Mark session as stale - client should refresh
          (session as any)._needsRefresh = true;
        }
      }
      return session;
    },
  },
};
