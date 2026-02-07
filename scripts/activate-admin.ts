import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function activateAdmin() {
  try {
    const email = "admin@company.co.kr";
    
    // 계정 조회
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        isLocked: true,
        role: true,
      },
    });

    if (!user) {
      console.log(`❌ ${email} 계정을 찾을 수 없습니다.`);
      return;
    }

    console.log("\n현재 계정 상태:");
    console.log("================");
    console.log(`이메일: ${user.email}`);
    console.log(`이름: ${user.name}`);
    console.log(`역할: ${user.role}`);
    console.log(`활성화: ${user.isActive}`);
    console.log(`잠김: ${user.isLocked}`);
    console.log("");

    // 새 비밀번호 설정
    const newPassword = "Admin123!@#";
    const hashedPassword = await hash(newPassword, 10);

    // 계정 활성화 및 비밀번호 재설정
    await prisma.user.update({
      where: { email },
      data: {
        isActive: true,
        isLocked: false,
        password: hashedPassword,
        failedLoginAttempts: 0,
        passwordChangedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log("✅ 계정이 성공적으로 활성화되었습니다!");
    console.log("");
    console.log("로그인 정보:");
    console.log("================");
    console.log(`이메일: ${email}`);
    console.log(`비밀번호: ${newPassword}`);
    console.log("");
    console.log("⚠️  보안을 위해 로그인 후 즉시 비밀번호를 변경해주세요!");

  } catch (error) {
    console.error("오류 발생:", error);
  } finally {
    await prisma.$disconnect();
  }
}

activateAdmin();
