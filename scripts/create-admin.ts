import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function createAdminAccount() {
  console.log("========================================");
  console.log("  어드민 계정 생성/초기화");
  console.log("========================================\n");

  const adminEmail = "admin@company.co.kr";
  const adminPassword = "admin1234";
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  try {
    // 기존 어드민 계정 확인
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (existingAdmin) {
      // 기존 계정 업데이트
      const updated = await prisma.user.update({
        where: { email: adminEmail },
        data: {
          password: hashedPassword,
          role: "ADMIN",
          name: "관리자",
        },
      });

      console.log("✓ 어드민 계정이 초기화되었습니다.\n");
    } else {
      // 새 어드민 계정 생성
      const created = await prisma.user.create({
        data: {
          email: adminEmail,
          password: hashedPassword,
          role: "ADMIN",
          name: "관리자",
        },
      });

      console.log("✓ 새로운 어드민 계정이 생성되었습니다.\n");
    }

    console.log("========================================");
    console.log("  어드민 로그인 정보");
    console.log("========================================");
    console.log(`이메일: ${adminEmail}`);
    console.log(`비밀번호: ${adminPassword}`);
    console.log("========================================\n");
    console.log("⚠️  보안을 위해 첫 로그인 후 비밀번호를 변경하세요!\n");

  } catch (error) {
    console.error("❌ 오류 발생:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function listAllUsers() {
  console.log("\n========================================");
  console.log("  전체 사용자 목록");
  console.log("========================================\n");

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        role: 'asc',
      },
    });

    if (users.length === 0) {
      console.log("사용자가 없습니다.\n");
    } else {
      console.log(`총 ${users.length}명의 사용자\n`);
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name || '이름없음'} (${user.email})`);
        console.log(`   역할: ${user.role}`);
        console.log(`   가입일: ${user.createdAt.toLocaleDateString('ko-KR')}\n`);
      });
    }
  } catch (error) {
    console.error("❌ 오류 발생:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 실행
const action = process.argv[2] || "create";

if (action === "list") {
  listAllUsers();
} else {
  createAdminAccount();
}
