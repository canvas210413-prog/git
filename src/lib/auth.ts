import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import { compare } from "bcryptjs";

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("이메일과 비밀번호를 입력해주세요.");
        }

        console.log("[Auth] 로그인 시도:", credentials.email);

        let user;
        try {
          user = await prisma.user.findUnique({
            where: { email: credentials.email },
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
          console.log("[Auth] DB 쿼리 완료, user:", user ? "found" : "not found");
        } catch (dbError) {
          console.error("[Auth] DB 쿼리 에러:", dbError);
          throw new Error("데이터베이스 오류가 발생했습니다.");
        }

        if (!user) {
          console.log("[Auth] 사용자 없음:", credentials.email);
          throw new Error("존재하지 않는 계정입니다.");
        }

        console.log("[Auth] ===== 사용자 정보 =====");
        console.log("[Auth] ID:", user.id);
        console.log("[Auth] Email:", user.email);
        console.log("[Auth] Name:", user.name);
        console.log("[Auth] isActive:", user.isActive);
        console.log("[Auth] isLocked:", user.isLocked);
        console.log("[Auth] Password hash length:", user.password?.length);
        console.log("[Auth] =======================");

        console.log("[Auth] 사용자 찾음:", user.email);
        console.log("[Auth] 계정 상태 - isActive:", user.isActive, ", isLocked:", user.isLocked);

        // 계정 상태 확인
        if (user.isLocked) {
          console.log("[Auth] 계정 잠김");
          throw new Error("계정이 잠겨있습니다.");
        }

        if (!user.isActive) {
          console.log("[Auth] 계정 비활성화됨");
          throw new Error("비활성화된 계정입니다.");
        }

        console.log("[Auth] 비밀번호 검증 시작");
        console.log("[Auth] 저장된 비밀번호 해시 길이:", user.password?.length);
        
        const isPasswordValid = await compare(
          credentials.password,
          user.password
        );

        console.log("[Auth] 비밀번호 검증 결과:", isPasswordValid);

        if (!isPasswordValid) {
          // 로그인 실패 횟수 증가
          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: (user.failedLoginAttempts || 0) + 1,
            },
          });
          console.log("[Auth] 비밀번호 불일치");
          throw new Error("비밀번호가 일치하지 않습니다.");
        }

        // 로그인 성공 시 실패 횟수 초기화 및 마지막 로그인 시간 업데이트
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: 0,
            lastLoginAt: new Date(),
          },
        });

        console.log("[Auth] 로그인 성공:", user.email);

        // 권한 목록 추출
        const permissions = user.userrole.flatMap((ur) =>
          ur.role.rolepermission.map((rp) => ({
            resource: rp.permission.resource,
            action: rp.permission.action,
            scope: rp.permission.scope,
          }))
        );

        // 역할 목록 추출
        const roles = user.userrole.map((ur) => ur.role.name);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          assignedPartner: user.assignedPartner,
          isOnline: user.isOnline,
          maxChats: user.maxChats,
          permissions,
          roles,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        token.assignedPartner = user.assignedPartner;
        token.isOnline = user.isOnline;
        token.maxChats = user.maxChats;
        token.permissions = user.permissions;
        token.roles = user.roles;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.role = token.role as string;
        session.user.assignedPartner = token.assignedPartner as string;
        session.user.isOnline = token.isOnline as boolean;
        session.user.maxChats = token.maxChats as number;
        session.user.permissions = token.permissions as Array<{
          resource: string;
          action: string;
          scope: string;
        }>;
        session.user.roles = token.roles as string[];
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
