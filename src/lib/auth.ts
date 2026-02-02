import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email,
            },
            include: {
              userrole: {
                include: {
                  role: {
                    include: {
                      rolepermission: {
                        include: {
                          permission: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          });

          if (!user || !user.password) {
            return null;
          }

          // 怨꾩젙 ?곹깭 ?뺤씤
          if (user.isLocked) {
            throw new Error('怨꾩젙???좉꺼?덉뒿?덈떎.');
          }

          if (!user.isActive) {
            throw new Error('鍮꾪솢?깊솕??怨꾩젙?낅땲??');
          }

          const isPasswordValid = await compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            // 濡쒓렇???ㅽ뙣 ?잛닔 利앷?
            const newFailedAttempts = user.failedLoginAttempts + 1;
            await prisma.user.update({
              where: { id: user.id },
              data: {
                failedLoginAttempts: newFailedAttempts,
                isLocked: newFailedAttempts >= 5,
              },
            });
            return null;
          }

          // 濡쒓렇???깃났 - ?ㅽ뙣 ?잛닔 珥덇린??
          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: 0,
              lastLoginAt: new Date(),
            },
          });

          // ??븷怨?沅뚰븳 異붿텧
          const roles = user.userrole.map((ur) => ur.role.name);
          const permissions = user.userrole.flatMap((ur) =>
            ur.role.rolepermission.map((rp) => ({
              resource: rp.permission.resource,
              action: rp.permission.action,
              scope: rp.permission.scope,
            }))
          );

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            roles: roles,
            permissions: permissions,
            assignedPartner: user.assignedPartner, // ?묐젰??怨좉컼二쇰Ц泥섎챸) 異붽?
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id as string,
          role: token.role as string,
          roles: token.roles as string[],
          permissions: token.permissions as Array<{resource: string; action: string; scope: string}>,
          assignedPartner: token.assignedPartner as string | null, // ?묐젰???뺣낫 異붽?
        },
      };
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.roles = (user as any).roles || [];
        token.permissions = (user as any).permissions || [];
        token.assignedPartner = (user as any).assignedPartner || null; // ?묐젰???뺣낫 異붽?
      }
      return token;
    },
  },
};
