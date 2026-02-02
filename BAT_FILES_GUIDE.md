# CRM AI Web - 배치 파일 가이드

## 📁 생성된 배치 파일 목록

### 🚀 메인 런처
- **START.bat** - 메인 런처 (모든 기능을 메뉴로 제공)
  - 더블클릭으로 실행하면 모든 작업을 메뉴에서 선택 가능

### 🔧 설치 및 설정
- **install-nodejs.bat** - Node.js 자동 설치
  - winget으로 Node.js LTS 버전 자동 설치
  - 수동 설치 링크 제공
  - ⚠️ 설치 후 컴퓨터 재시작 필요

- **install-mysql-and-migrate.bat** - MySQL 설치 + 전체 데이터 마이그레이션
  - ⚠️ 관리자 권한 필요 (우클릭 → "관리자 권한으로 실행")
  - MySQL 서비스 설치
  - 데이터베이스 생성
  - SQLite 데이터 백업
  - Prisma 마이그레이션
  - 기존 데이터를 MySQL로 자동 이전

### 💻 서버 실행
- **run-server.bat** - 개발 서버 시작 (npm run dev)
  - 더블클릭으로 바로 실행
  - http://localhost:3000 에서 접속
  
- **run-server-production.bat** - 프로덕션 서버 시작 (npm run start)
  - 빌드 후 실행하는 프로덕션 서버

- **build.bat** - 프로덕션 빌드 (npm run build)
  - 배포용 빌드 생성

### 🛠️ 유틸리티
- **mysql-service.bat** - MySQL 서비스 관리
  - 서비스 시작/중지/재시작
  - 상태 확인
  - MySQL 접속

- **prisma-tools.bat** - Prisma 관리 도구
  - Client 생성
  - Studio 실행
  - 마이그레이션 관리
  - Seed 데이터 생성

- **diagnose-database.bat** - 데이터베이스 종합 진단 및 수정 (신규)
  - MySQL 서비스 상태 확인 및 시작
  - 데이터베이스 존재 확인 및 생성
  - Prisma 상태 확인
  - 마이그레이션 상태 확인
  - 자동 수정 기능 포함
nodejs.bat** 더블클릭
   - Node.js 자동 설치
   - 설치 후 컴퓨터 재시작

2. **install-mysql-and-migrate.bat** 우클릭 → "관리자 권한으로 실행"
   - MySQL 설치부터 데이터 마이그레이션까지 자동 완료

3## 1️⃣ 처음 설정하는 경우

1. **install-mysql-and-migrate.bat** 우클릭 → "관리자 권한으로 실행"
   - MySQL 설치부터 데이터 마이그레이션까지 자동 완료

2. **run-server.bat** 더블클릭
   - 개발 서버 시작

### 2️⃣ 일반적인 개발 작업

**방법 1: 메인 런처 사용**
- **START.bat** 더블클릭
- 메뉴에서 원하는 작업 선택

**방법 2: 직접 실행**
- **run-server.bat** 더블클릭하여 개발 서버 시작

### 3️⃣ 데이터베이스 작업

- **prisma-tools.bat** 실행
  - Prisma Studio로 데이터 확인/수정
  - 마이그레이션 관리
  - Seed 데이터 생성

- **mysql-service.bat** 실행
  - MySQL 서비스 관리
  - MySQL 직접 접속
nodejs.bat (더블클릭) - Node.js 설치 후 재시작
2. install-mysql-and-migrate.bat (관리자 권한으로 실행) - 최초 1회
3. run-server.bat (더블클릭) - 개발 서버 시작
4
```
1. install-mysql-and-migrate.bat (관리자 권한으로 실행) - 최초 1회
2. run-server.bat (더블클릭) - 개발 서버 시작
3. 브라우저에서 http://localhost:3000 접속
```

## 📝 주의사항

### 관리자 권한이 필요한 파일
- install-mysql-and-migrate.bat
- mysql-service.bat (서비스 시작/중지 시)

이 파일들은 우클릭 → "관리자 권한으로 실행"으로 실행하세요.

### 관리자 권한이 필요 없는 파일
- run-server.bat
- run-server-production.bat
- build.bat
- prisma-tools.bat
- START.bat (관리자 작업 제외)

## 🎨 각 파일의 색상

- START.bat - 흰색 (메인)
- run-server.bat - 밝은 녹색 (개발)
- run-server-production.bat - 밝은 청록색 (프로덕션)
- build.bat - 노란색 (빌드)
- mysql-service.bat - 빨간색 (서비스)
- prisma-tools.bat - 밝은 자주색 (도구)
- install-mysql-and-migrate.bat - 기본색 (설치)

## 🔄 작업 흐름 예시

### 처음 시작
```
1. install-mysql-and-migrate.bat (관리자)
2. run-server.bat
```

### 매일 개발
```
1. run-server.bat (또는 START.bat → 3번 선택)
```

### 데이터베이스 수정
```
1. schema.prisma 수정
2. prisma-tools.bat → 마이그레이션 생성
3. run-server.bat 재시작
```

### 프로덕션 배포
```
1. build.bat
2. run-server-production.bat
```

## ❓ 문제 해결

### MySQL 서비스가 시작되지 않음
```
mysql-service.bat → 상태 확인
또는
install-mysql-and-migrate.bat 다시 실행 (관리자)
```

### 서버가 시작되지 않음
```
1. mysql-service.bat → MySQL 시작
2. prisma-tools.bat → Prisma Client 생성
3. run-server.bat 다시 실행
```

### 데이터베이스 연결 오류
```
1. .env 파일 확인
2. MySQL 서비스 확인 (mysql-service.bat)
3. prisma-tools.bat → 마이그레이션 상태 확인
```

## 🚀 추천 사용법

**일상적인 개발:**
- **START.bat** 실행 → 메뉴에서 선택

**빠른 서버 시작:**
- **run-server.bat** 바로 실행

**데이터베이스 관리:**
- **prisma-tools.bat** → Prisma Studio 선택
