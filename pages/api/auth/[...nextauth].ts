// pages/api/auth/[...nextauth].ts
import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),

  secret: process.env.NEXTAUTH_SECRET,

  session: {
    strategy: "jwt",
  },

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
        email: { label: "Email", type: "email", placeholder: "email@exemplu.com" },
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

  callbacks: {
    async jwt({ token, user }) {
      // La logare/adăugare token
      if (user) {
        token.id = user.id;
        token.email = user.email ?? "";
        token.credits = user.credits;
        token.emailVerified = !!user.emailVerified;
      }
      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.credits = token.credits as number;
        session.user.emailVerified = token.emailVerified as boolean;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login?error=1", // pagina pentru erori autentificare
  },
};

export default NextAuth(authOptions);
