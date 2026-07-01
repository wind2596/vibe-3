# Operation

## 1. 현재 확인된 개발 환경
- Node.js: 설치됨
- npm: 설치됨
- `uv`: 설치됨
- Python 실행 파일: `backend/.venv/Scripts/python.exe`
- SQLite: Python 내장 모듈로 사용 예정

## 2. 실행 전 준비
현재는 문서화 단계이므로 실제 앱 코드는 아직 생성하지 않았다.  
다만 환경은 다음 전제를 만족한다.

- FE는 `frontend` 폴더에서 Vite 기반 React 앱을 띄운다.
- BE는 `backend` 폴더의 `.venv`를 사용한다.
- SQLite는 별도 서버 없이 로컬 파일로 운영한다.

## 3. 백엔드 운영 방법

### 3.1 가상환경 활성화
```powershell
cd backend
.\.venv\Scripts\activate
```

### 3.2 서버 실행
FastAPI 앱 파일이 생성되면 보통 아래 형식으로 실행한다.
```powershell
uv run fastapi dev app.main:app
```

또는 일반 실행 방식:
```powershell
uv run python -m uvicorn app.main:app --reload
```

### 3.3 FE와 BE를 함께 실행
루트의 [`start-dev.ps1`](/C:/Users/admin/Desktop/day2/day3_rpa/start-dev.ps1)를 실행하면
백엔드와 프론트엔드를 동시에 띄울 수 있다.
```powershell
.\start-dev.ps1
```

### 3.4 SQLite 사용
- DB 파일은 `backend/data/app.db` 같은 경로를 권장한다.
- 최초 실행 시 테이블 생성 로직이 필요하다.
- 백업 시 DB 파일만 보관하면 된다.

## 4. 프론트엔드 운영 방법

### 4.1 의존성 확인
```powershell
cd frontend
npm install
```

### 4.2 개발 서버 실행
Vite 프로젝트가 구성되면 보통 아래와 같이 실행한다.
```powershell
npm run dev
```

## 5. 자주 발생하는 에러

### 5.1 `python` 명령을 찾을 수 없음
원인:
- 시스템 전역 Python이 설치되어 있지 않음

대응:
- `backend/.venv/Scripts/python.exe`를 사용한다.
- PowerShell에서 `.venv`를 활성화한 뒤 실행한다.

### 5.2 `uv`는 있는데 패키지가 안 보임
원인:
- 가상환경이 활성화되지 않았거나 다른 Python을 참조함

대응:
- `uv run ...` 형식으로 실행한다.
- 또는 `.venv` 활성화 후 확인한다.

### 5.3 FE 실행 시 `vite` 명령을 찾을 수 없음
원인:
- `node_modules`가 설치되지 않았거나 삭제됨

대응:
- `frontend`에서 `npm install`을 다시 수행한다.

### 5.4 SQLite 파일 생성 실패
원인:
- 디렉터리 권한 부족 또는 경로가 존재하지 않음

대응:
- DB 파일 경로의 상위 폴더를 먼저 생성한다.
- 상대경로 대신 명시적 경로를 사용한다.

## 6. 사용 방법

### 6.1 일정 관리
- 팀원을 선택한다.
- 일정을 등록한다.
- 휴가/근무/출장 여부를 구분한다.
- 달력에서 충돌 여부를 확인한다.

### 6.2 엑셀 자동화
- 엑셀 파일을 업로드한다.
- 기준 컬럼을 선택한다.
- 분할 또는 병합을 선택한다.
- 결과 파일을 다운로드한다.

### 6.3 민원 챗봇
- 민원 매뉴얼을 업로드한다.
- 질문을 입력한다.
- 대응 스크립트 또는 답변 초안을 확인한다.

### 6.4 뉴스 수집
- 수집 키워드를 설정한다.
- 매일 아침 자동 수집을 수행한다.
- 목록과 요약을 확인한다.

## 7. 운영 체크리스트
- 백엔드 `.venv`가 존재하는지 확인
- FE `node_modules`가 설치되어 있는지 확인
- DB 파일 경로가 유효한지 확인
- 업로드 파일 크기 제한 설정
- 민감 정보 접근 정책 정의
