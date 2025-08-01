import User from "@/model/User";
import { NextAuthOptions } from "next-auth";
import bcrypt from "bcryptjs";
import CredentialsProvider from "next-auth/providers/credentials";
import dbConnect from "@/lib/dbConnect";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        identifier: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials: any): Promise<any> {
        try {
          await dbConnect();
          const user = await User.findOne({ email: credentials.identifier });

          if (!user) {
            throw new Error("Invalid credentials");
          }

          const isPasswordCorrect = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordCorrect) {
            throw new Error("Invalid credentials");
          }

          return {
            id: user._id.toString(),
            _id: user._id.toString(),
            name: user.name,
            role: user.role,
          };
        } catch (err: any) {
          console.error("Authorization error:", err);
          throw new Error("Unable to log in");
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ user, token }) {
      if (user) {
        token._id = user.id || (user as any)._id;
        token.name = user.name;
        token.role = user.role;
      } else {
        if (!token._id && token.sub) {
          token._id = token.sub;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          _id: token._id as string,
          name: token.name as string,
          role: token.role as string,
        };
      }

      return session;
    },
  },
  pages: {
    signIn: "/sign-in",
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60,
  },
  jwt: {
    maxAge: 7 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
};
//next auth 