import { PrismaClient } from "@prisma/client";
import { compare } from "bcryptjs";

const prisma = new PrismaClient();

async function checkAdmin() {
  try {
    const email = "admin@company.co.kr";
    
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        isActive: true,
        isLocked: true,
        role: true,
        failedLoginAttempts: true,
        passwordChangedAt: true,
      },
    });

    if (!user) {
      console.log(`계정을 찾을 수 없습니다: ${email}`);
      return;
    }

    console.log("\n=== 현재 DB 계정 상태 ===");
    console.log(`이메일: ${user.email}`);
    console.log(`이름: ${user.name}`);
    console.log(`역할: ${user.role}`);
    console.log(`활성화: ${user.isActive}`);
    console.log(`잠김: ${user.isLocked}`);
    console.log(`로그인 실패 횟수: ${user.failedLoginAttempts}`);
    console.log(`비밀번호 변경일: ${user.passwordChangedAt}`);
    console.log(`비밀번호 해시 길이: ${user.password?.length || 0}`);
    
    // 비밀번호 테스트
    const testPassword = "Admin123!@#";
    const isValid = await compare(testPassword, user.password);
    console.log(`\n비밀번호 "Admin123!@#" 검증: ${isValid ? "✅ 일치" : "❌ 불일치"}`);

    if (user.isActive && !user.isLocked && isValid) {
      console.log("\n✅ 계정 상태 정상 - 로그인 가능해야 함");
    } else {
      console.log("\n❌ 로그인 불가 원인:");
      if (!user.isActive) console.log("  - 계정이 비활성화됨");
      if (user.isLocked) console.log("  - 계정이 잠김");
      if (!isValid) console.log("  - 비밀번호 불일치");
    }

  } catch (error) {
    console.error("오류:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdmin();
