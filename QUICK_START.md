# CRM AI Web - 빠른 시작 가이드

## 📦 필수 요구사항

- Node.js (v18 이상)
- Docker Desktop
- Git

## 🚀 개발 서버 시작하기

### 1. Git 클론
```bash
git clone https://github.com/canvas210413-prog/git.git
cd git
```

### 2. Docker로 MySQL 시작
```bash
docker-compose up -d
```

### 3. 패키지 설치
```bash
npm install
```

### 4. 환경변수 설정 (`.env` 파일 생성)
```env
DATABASE_URL="mysql://dbuser:dbpassword@localhost:3306/crm_ai_web"
NEXTAUTH_SECRET="your-secret-key-change-this-in-production"
NEXTAUTH_URL="http://localhost:3000"
```

### 5. 데이터베이스 초기화
```bash
npx prisma db push
```

### 6. 관리자 계정 생성 (선택)
```bash
npx tsx scripts/create-admin.ts
```

### 7. 개발 서버 실행
```bash
npm run dev
```

## 🌐 접속하기

- **개발 서버**: http://localhost:3000
- **관리자 로그인**
  - 이메일: `admin@company.co.kr`
  - 비밀번호: `admin1234`

## 🛑 서버 중지하기

### 개발 서버 중지
터미널에서 `Ctrl + C`

### Docker MySQL 중지
```bash
docker-compose down
```

## 🔄 다음 실행 시

이미 설정이 완료되었다면:

```bash
# 1. MySQL 시작
docker-compose up -d

# 2. 개발 서버 실행
npm run dev
```

## 🛠️ 유용한 명령어

```bash
# Prisma Studio (데이터베이스 GUI)
npx prisma studio

# Docker 컨테이너 상태 확인
docker ps

# 전체 사용자 목록 확인
npx tsx scripts/create-admin.ts list
```

## ⚠️ 문제 해결

### Docker가 실행되지 않을 때
- Docker Desktop이 실행 중인지 확인
- 약 30초 정도 대기 후 다시 시도

### 포트 충돌 (3000번)
```bash
# 다른 포트로 실행
npm run dev -- -p 3001
```

---

**참고**: 첫 로그인 후 보안을 위해 비밀번호를 변경하세요!
