# MySQL 마이그레이션 완전 가이드

## 🚀 빠른 시작 (권장)

**관리자 PowerShell에서 다음 명령 실행:**

```powershell
cd c:\k-project\crm-ai-web
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
.\setup-mysql.ps1
```

이 스크립트가 자동으로:
1. ✅ MySQL 서비스 설치 및 시작
2. ✅ 데이터베이스 및 사용자 생성
3. ✅ 기존 SQLite 데이터 백업
4. ✅ Prisma 마이그레이션 실행
5. ✅ MySQL 연결 설정

---

## 📋 수동 설치 단계

관리자 권한이 없거나 수동으로 진행하려면:

### 1단계: 관리자 PowerShell 열기
1. Windows 검색에서 "PowerShell" 검색
2. 우클릭 → "관리자 권한으로 실행"

### 2단계: MySQL 서비스 설치
```powershell
cd "C:\Program Files\MySQL\MySQL Server 8.4\bin"

# 데이터 디렉토리 초기화
.\mysqld --initialize-insecure --datadir="C:\ProgramData\MySQL\MySQL Server 8.4\Data"

# MySQL 서비스 설치
.\mysqld --install MySQL

# 서비스 시작
Start-Service MySQL
```

### 3단계: 데이터베이스 생성
```powershell
# MySQL 접속 (비밀번호 없음)
cd "C:\Program Files\MySQL\MySQL Server 8.4\bin"
.\mysql -u root

# MySQL 프롬프트에서:
CREATE DATABASE crm_ai_web CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'dbuser'@'localhost' IDENTIFIED BY 'dbpassword';
GRANT ALL PRIVILEGES ON crm_ai_web.* TO 'dbuser'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 4단계: .env 파일 확인
`c:\k-project\crm-ai-web\.env` 파일에 이미 설정됨:
```
DATABASE_URL="mysql://dbuser:dbpassword@localhost:3306/crm_ai_web"
```

### 5단계: Prisma 마이그레이션
```powershell
cd c:\k-project\crm-ai-web

# Prisma Client 재생성
npx prisma generate

# 마이그레이션 생성 및 적용
npx prisma migrate dev --name init_mysql
```

### 6단계: 기존 데이터 마이그레이션 (선택사항)
기존 SQLite 데이터가 있다면:

```powershell
# 데이터 마이그레이션 스크립트 실행
node migrate-data-sqlite-to-mysql.js
```

---

## 🔍 문제 해결

### MySQL 서비스가 시작되지 않음
```powershell
# 서비스 상태 확인
Get-Service MySQL

# 로그 확인
Get-Content "C:\ProgramData\MySQL\MySQL Server 8.4\Data\*.err" | Select-Object -Last 50

# 서비스 재시작
Restart-Service MySQL
```

### "Access Denied" 오류
```powershell
# root 비밀번호 재설정
Stop-Service MySQL
cd "C:\Program Files\MySQL\MySQL Server 8.4\bin"
.\mysqld --skip-grant-tables --shared-memory

# 다른 PowerShell 창에서:
.\mysql -u root
ALTER USER 'root'@'localhost' IDENTIFIED BY 'your-new-password';
FLUSH PRIVILEGES;
EXIT;

# mysqld 프로세스 종료 후 서비스 재시작
Stop-Process -Name mysqld
Start-Service MySQL
```

### Node.js가 인식되지 않음
```powershell
# Node.js 경로 확인
where.exe node

# PATH에 추가 (예시)
$env:Path += ";C:\Program Files\nodejs"
```

### Prisma 마이그레이션 오류
```powershell
# 마이그레이션 상태 확인
npx prisma migrate status

# 마이그레이션 재설정 (주의: 데이터 삭제됨)
npx prisma migrate reset

# 처음부터 다시
npx prisma migrate dev --name init_mysql
```

---

## 📊 데이터 마이그레이션 옵션

### 옵션 1: 자동 스크립트 사용 (권장)
```powershell
node migrate-data-sqlite-to-mysql.js
```

### 옵션 2: Seed 스크립트로 테스트 데이터 생성
```powershell
npx prisma db seed
```

### 옵션 3: 수동 데이터 Export/Import
```powershell
# SQLite 데이터 확인
npx prisma studio

# MySQL에서 확인
cd "C:\Program Files\MySQL\MySQL Server 8.4\bin"
.\mysql -u dbuser -pdbpassword crm_ai_web
```

---

## ✅ 마이그레이션 검증

```powershell
# MySQL 접속 테스트
cd "C:\Program Files\MySQL\MySQL Server 8.4\bin"
.\mysql -u dbuser -pdbpassword crm_ai_web

# 테이블 확인
SHOW TABLES;

# 데이터 확인 (예: 사용자 수)
SELECT COUNT(*) FROM User;
EXIT;

# 애플리케이션 시작
cd c:\k-project\crm-ai-web
npm run dev
```

---

## 🎯 다음 단계

1. **애플리케이션 테스트**: 모든 기능이 정상 작동하는지 확인
2. **성능 모니터링**: MySQL 성능 확인
3. **백업 설정**: 정기적인 MySQL 백업 구성
4. **인덱스 최적화**: 필요시 추가 인덱스 생성

---

## 📝 유용한 MySQL 명령어

```sql
-- 데이터베이스 크기 확인
SELECT 
  table_schema AS 'Database',
  ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)'
FROM information_schema.tables
WHERE table_schema = 'crm_ai_web'
GROUP BY table_schema;

-- 테이블별 레코드 수
SELECT 
  table_name,
  table_rows
FROM information_schema.tables
WHERE table_schema = 'crm_ai_web';

-- 연결 상태 확인
SHOW PROCESSLIST;
```

---

## 🔗 추가 리소스

- [MySQL 공식 문서](https://dev.mysql.com/doc/)
- [Prisma MySQL 가이드](https://www.prisma.io/docs/concepts/database-connectors/mysql)
- [MySQL Workbench 다운로드](https://dev.mysql.com/downloads/workbench/) (GUI 관리 도구)

---

**마이그레이션 중 문제가 발생하면 위의 문제 해결 섹션을 참고하세요!**
