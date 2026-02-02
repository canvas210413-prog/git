# MySQL 마이그레이션 가이드

## 완료된 설정 변경사항

✅ 1. **docker-compose.yml**: PostgreSQL → MySQL 8.0으로 변경
✅ 2. **prisma/schema.prisma**: provider를 sqlite → mysql로 변경  
✅ 3. **.env**: DATABASE_URL을 MySQL 연결 문자열로 변경
✅ 4. **기존 마이그레이션**: SQLite용 마이그레이션 폴더 삭제

## 남은 작업 (수동 실행 필요)

### 1. Docker Desktop 설치 (선택)
- Docker가 설치되어 있지 않은 경우:
  - https://www.docker.com/products/docker-desktop 에서 설치
  - 또는 로컬에 MySQL 8.0 직접 설치

### 2. MySQL 서버 시작

#### Docker 사용 시:
```bash
cd c:\k-project\crm-ai-web
docker compose up -d
```

#### 로컬 MySQL 사용 시:
- MySQL 8.0 설치 후
- .env 파일의 DATABASE_URL을 로컬 MySQL 정보로 수정:
```
DATABASE_URL="mysql://root:your-password@localhost:3306/crm_ai_web"
```

### 3. Prisma 마이그레이션 생성 및 적용
```bash
cd c:\k-project\crm-ai-web

# Prisma Client 재생성 (MySQL용)
npx prisma generate

# 초기 마이그레이션 생성
npx prisma migrate dev --name init

# 또는 프로덕션 환경인 경우
npx prisma migrate deploy
```

### 4. 기존 데이터 마이그레이션 (필요시)
기존 SQLite에 중요한 데이터가 있다면:
```bash
# 1. SQLite 데이터 덤프
npx prisma db pull --schema=./prisma/schema-sqlite.prisma

# 2. 데이터 export/import 스크립트 작성 또는
# 3. seed 스크립트를 사용하여 테스트 데이터 재생성
npx prisma db seed
```

### 5. Prisma Client 사용 확인
```typescript
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

// MySQL 연결 테스트
async function main() {
  const users = await prisma.user.findMany()
  console.log(users)
}
```

## 주요 변경사항

### Database URL 형식
**이전 (SQLite):**
```
DATABASE_URL="file:./prisma/prisma/dev.db"
```

**이후 (MySQL):**
```
DATABASE_URL="mysql://dbuser:dbpassword@localhost:3306/crm_ai_web"
```

### Docker 설정
**컨테이너 정보:**
- 이미지: mysql:8.0
- 포트: 3306
- 데이터베이스명: crm_ai_web
- 사용자: dbuser
- 비밀번호: dbpassword
- Root 비밀번호: rootpassword

### Prisma Schema 변경점
- SQLite는 일부 데이터 타입과 기능을 제한적으로 지원
- MySQL로 변경 시 다음을 활용 가능:
  - `@db.VarChar(255)` 등 명시적 타입 지정
  - Full-text search
  - JSON 컬럼 타입
  - 더 나은 성능과 동시성

## 문제 해결

### 연결 실패 시
1. MySQL 서버가 실행 중인지 확인
2. .env의 DATABASE_URL이 정확한지 확인
3. 방화벽에서 3306 포트 허용 확인

### 마이그레이션 에러 시
```bash
# 마이그레이션 상태 확인
npx prisma migrate status

# 마이그레이션 초기화 (주의: 데이터 삭제됨)
npx prisma migrate reset
```

### Docker 컨테이너 확인
```bash
# 실행 중인 컨테이너 확인
docker ps

# 컨테이너 로그 확인
docker logs crm-ai-mysql

# MySQL 접속
docker exec -it crm-ai-mysql mysql -u dbuser -p
```

## 다음 단계

1. MySQL 서버 시작
2. `npx prisma migrate dev --name init` 실행
3. 애플리케이션 테스트
4. 기존 데이터가 필요하면 마이그레이션 스크립트 작성
