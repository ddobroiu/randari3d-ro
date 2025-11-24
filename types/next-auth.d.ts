import NextAuth, { DefaultSession, DefaultUser, DefaultJWT } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      credits: number;
      emailVerified: boolean | null; // boolean sau null în sesiune
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    id: string;
    emailVerified: Date | null; // așa cum este în Prisma
    credits: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    email: string;
    credits?: number;
    emailVerified?: boolean | null;
  }
}
