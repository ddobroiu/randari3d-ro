// lib/auth.ts
import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Email & Parolă",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Parolă", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email și parolă obligatorii");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          throw new Error("Cont inexistent");
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          throw new Error("Parolă greșită");
        }

        if (!user.emailVerified) {
          throw new Error("Te rugăm să îți verifici emailul");
        }

        return user;
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async session({ session, token }) {
      if (token && session.user) {
        const user = await prisma.user.findUnique({
          where: { email: session.user.email! },
          select: {
            id: true,
            email: true,
            name: true,
            credits: true,
            emailVerified: true,
          },
        });

        if (user) {
          session.user.id = user.id;
          session.user.credits = user.credits;
          session.user.emailVerified = user.emailVerified !== null;
        }
      }
      return session;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email ?? "";
        token.credits = user.credits;
        token.emailVerified = user.emailVerified !== null;
      }
      return token;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login?error=1",
  },

  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);
