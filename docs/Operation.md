# Operation

## 1. 실행 환경
- Node.js: 설치되어 있어야 함
- npm: 설치되어 있어야 함
- `uv`: 설치되어 있어야 함
- Python 실행 파일: `backend/.venv/Scripts/python.exe`
- SQLite: Python 내장 모듈로 사용

## 2. 실행 전 준비
- 프런트엔드는 `frontend` 폴더에서 Vite 기반 React 앱으로 실행
- 백엔드는 `backend` 폴더의 `.venv`를 사용
- SQLite는 별도 서버 없이 로컬 파일로 운영

## 3. 백엔드 실행 방법

### 3.1 가상환경 활성화
```powershell
cd backend
.\.venv\Scripts\activate
```

### 3.2 서버 실행
FastAPI 서버는 다음 형식으로 실행한다.
```powershell
uv run fastapi dev app.main:app
```

또는 일반적인 실행 방식은 다음과 같다.
```powershell
uv run python -m uvicorn app.main:app --reload
```

### 3.3 FE와 BE를 함께 실행
루트의 [`start-dev.ps1`](../start-dev.ps1)를 실행하면
백엔드와 프런트엔드를 함께 띄울 수 있다.
```powershell
.\start-dev.ps1
```

### 3.4 SQLite 사용
- DB 파일은 `backend/data/app.db` 경로 사용을 권장
- 최초 실행 시 테이블 생성 로직이 필요할 수 있음
- 운영 중에는 DB 파일만 백업해도 복구에 도움이 됨

## 4. 프런트엔드 실행 방법

### 4.1 의존성 확인
```powershell
cd frontend
npm install
```

### 4.2 개발 서버 실행
Vite 프로젝트이므로 아래 명령으로 실행한다.
```powershell
npm run dev
```

`frontend` 폴더에서 `npm run dev`를 실행하면 프런트엔드만 따로 실행된다.

## 5. 자주 발생하는 오류

### 5.1 `python` 명령을 찾을 수 없음
원인:
- 시스템 전역 Python이 설치되어 있지 않음

대안:
- `backend/.venv/Scripts/python.exe`를 사용
- PowerShell에서 `.venv`를 활성화한 뒤 실행

### 5.2 `uv`가 없는 경우
원인:
- 가상환경이 활성화되지 않았거나 `uv` 경로를 찾지 못함

대안:
- `uv run ...` 형식으로 실행
- 또는 `.venv` 활성화 여부를 다시 확인

### 5.3 FE 실행 시 `vite` 명령을 찾을 수 없음
원인:
- `node_modules`가 설치되지 않았거나 삭제됨

대안:
- `frontend`에서 `npm install`을 다시 실행

### 5.4 SQLite 파일 생성 실패
원인:
- 디렉터리 권한 부족
- 경로가 존재하지 않음

대안:
- DB 파일 경로 상위 폴더를 먼저 생성
- 상대 경로 대신 명시된 경로를 사용

## 6. 사용 흐름

### 6.1 일정 관리
- 사용자를 선택
- 일정을 등록
- 당일/주간/월간 기준으로 구분
- 우측 패널에서 충돌 여부 확인

### 6.2 작업 자동화
- 작업 파일을 업로드
- 기준 컬럼을 선택
- 분할 또는 병합을 실행
- 결과 파일을 다운로드

### 6.3 문서 챗봇
- 문서 매뉴얼을 업로드
- 질문을 입력
- 출력 스크립트 또는 응답 초안을 확인

### 6.4 뉴스 수집
- 수집 대상을 설정
- 매일 자동 수집을 실행
- 목록과 요약을 확인

## 7. 운영 체크리스트
- 백엔드 `.venv`가 존재하는지 확인
- 프런트엔드 `node_modules`가 설치되어 있는지 확인
- DB 파일 경로가 유효한지 확인
- 업로드 파일 크기 제한을 적절히 설정
- 민감 정보 접근 정책을 점검
