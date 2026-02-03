import { prisma } from '../src/lib/prisma';
import { hash } from 'bcryptjs';

async function resetPassword() {
  try {
    // admin1234를 해싱
    const password = 'admin1234';
    const hashedPassword = await hash(password, 10);
    
    console.log('\n========================================');
    console.log('  비밀번호 재설정 중...');
    console.log('========================================\n');
    console.log('해싱된 비밀번호:', hashedPassword);
    console.log('해시 길이:', hashedPassword.length);
    console.log('해시 시작:', hashedPassword.substring(0, 20));
    
    // DB 업데이트
    const result = await prisma.user.update({
      where: { email: 'admin@company.co.kr' },
      data: {
        password: hashedPassword,
        passwordChangedAt: new Date(),
        updatedAt: new Date(),
      },
    });
    
    console.log('\n✓ 비밀번호가 성공적으로 재설정되었습니다!');
    console.log('\n========================================');
    console.log('  로그인 정보');
    console.log('========================================');
    console.log('이메일: admin@company.co.kr');
    console.log('비밀번호: admin1234');
    console.log('========================================\n');
    
  } catch (error) {
    console.error('오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword();
