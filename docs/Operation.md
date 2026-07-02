# Operation

## 1. 실행 환경
- Node.js: 설치되어 있어야 함
- npm: 설치되어 있어야 함
- `uv`: 설치되어 있어야 함
- Python 실행 파일: `backend/.venv/Scripts/python.exe`
- SQLite: Python 내장 모듈로 사용
- Cloudflared Tunnel 사용 시 `cloudflared` 실행 파일이 설치되어 있어야 함

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

Cloudflared Tunnel로 외부에 공개할 때는 로컬 바인딩 주소와 포트를 명확히 고정한다.
```powershell
cd backend
uv run python -m uvicorn app.main:app --host 127.0.0.1 --port 8001
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

### 3.5 CORS 허용 Origin 설정
GitHub Pages 프런트엔드나 별도 프런트엔드 도메인에서 백엔드를 호출하려면 백엔드 실행 전에
`APP_CORS_ORIGINS`를 설정한다. 여러 Origin은 쉼표로 구분한다.
```powershell
$env:APP_CORS_ORIGINS = "http://127.0.0.1:5173,http://localhost:5173,https://wind2596.github.io"
uv run python -m uvicorn app.main:app --host 127.0.0.1 --port 8001
```

기본값에는 로컬 개발 주소와 `https://wind2596.github.io`가 포함되어 있다.

## 4. Cloudflared Tunnel 실행 방법

### 4.1 설치 확인
```powershell
cloudflared --version
```

명령을 찾을 수 없으면 Cloudflare 공식 다운로드 페이지에서 Windows용 `cloudflared.exe`를 설치하고
실행 파일 경로를 `PATH`에 추가한다.

### 4.2 임시 터널 실행
백엔드 서버가 `http://127.0.0.1:8001`에서 실행 중인 상태에서 새 PowerShell 창을 열고 실행한다.
```powershell
cloudflared tunnel --url http://127.0.0.1:8001
```

정상 실행되면 다음과 같은 임시 공개 URL이 출력된다.
```text
https://example.trycloudflare.com
```

이 URL은 프런트엔드 대시보드의 `백엔드 URL` 입력란에 넣고 `연결 테스트`로 확인한다.

### 4.3 고정 도메인 터널 실행
운영 환경에서 URL이 바뀌면 안 되는 경우 Cloudflare 계정과 도메인을 연결한 뒤 Named Tunnel을 사용한다.
```powershell
cloudflared tunnel login
cloudflared tunnel create vibe3-backend
cloudflared tunnel route dns vibe3-backend api.example.com
cloudflared tunnel run vibe3-backend
```

고정 도메인을 사용하는 경우 백엔드 CORS에도 프런트엔드 Origin을 유지해야 한다. 백엔드 자체 Origin이 아니라
브라우저에서 요청을 보내는 프런트엔드 주소를 허용한다.

### 4.4 종료 방법
Cloudflared가 실행 중인 PowerShell 창에서 `Ctrl+C`를 누른다. 백그라운드로 남은 경우 다음 명령으로 종료한다.
```powershell
Get-Process cloudflared -ErrorAction SilentlyContinue | Stop-Process -Force
```

## 5. 프런트엔드 실행 방법

### 5.1 의존성 확인
```powershell
cd frontend
npm install
```

### 5.2 개발 서버 실행
Vite 프로젝트이므로 아래 명령으로 실행한다.
```powershell
npm run dev
```

`frontend` 폴더에서 `npm run dev`를 실행하면 프런트엔드만 따로 실행된다.

### 5.3 백엔드 URL 연결 테스트
프런트엔드 대시보드에서 백엔드 URL을 직접 설정할 수 있다.
- 로컬 개발: 입력값을 비워두면 Vite proxy를 통해 `/api`가 `http://127.0.0.1:8001`로 전달됨
- GitHub Pages: Cloudflared URL 또는 고정 API 도메인을 입력
- 입력 예시: `https://example.trycloudflare.com`
- `연결 테스트` 버튼은 `${백엔드 URL}/api/health`를 호출해 연결 상태를 확인

빌드 시 기본 백엔드 URL을 지정하려면 `VITE_API_BASE_URL`을 사용한다.
```powershell
$env:VITE_API_BASE_URL = "https://example.trycloudflare.com"
npm run build:pages
```

## 6. 자주 발생하는 오류

### 6.1 `python` 명령을 찾을 수 없음
원인:
- 시스템 전역 Python이 설치되어 있지 않음

대안:
- `backend/.venv/Scripts/python.exe`를 사용
- PowerShell에서 `.venv`를 활성화한 뒤 실행

### 6.2 `uv`가 없는 경우
원인:
- 가상환경이 활성화되지 않았거나 `uv` 경로를 찾지 못함

대안:
- `uv run ...` 형식으로 실행
- 또는 `.venv` 활성화 여부를 다시 확인

### 6.3 FE 실행 시 `vite` 명령을 찾을 수 없음
원인:
- `node_modules`가 설치되지 않았거나 삭제됨

대안:
- `frontend`에서 `npm install`을 다시 실행

### 6.4 SQLite 파일 생성 실패
원인:
- 디렉터리 권한 부족
- 경로가 존재하지 않음

대안:
- DB 파일 경로 상위 폴더를 먼저 생성
- 상대 경로 대신 명시된 경로를 사용

### 6.5 `cloudflared` 명령을 찾을 수 없음
원인:
- Cloudflared가 설치되지 않았거나 `PATH`에 등록되지 않음

대안:
- Windows용 `cloudflared.exe`를 설치
- 설치 경로를 `PATH`에 추가
- 새 PowerShell 창에서 `cloudflared --version`으로 재확인

### 6.6 GitHub Pages에서 백엔드 연결 실패
원인:
- 대시보드에 백엔드 URL을 입력하지 않음
- Cloudflared Tunnel이 꺼져 있음
- 백엔드 CORS에 프런트엔드 Origin이 없음
- `http://` 백엔드 URL을 사용해 HTTPS 페이지에서 Mixed Content로 차단됨

대안:
- Cloudflared URL처럼 `https://`로 시작하는 URL 사용
- `APP_CORS_ORIGINS`에 `https://wind2596.github.io` 포함
- 백엔드의 `/api/health`가 직접 열리는지 확인

## 7. 사용 흐름

### 7.1 일정 관리
- 사용자를 선택
- 일정을 등록
- 당일/주간/월간 기준으로 구분
- 우측 패널에서 충돌 여부 확인

### 7.2 작업 자동화
- 작업 파일을 업로드
- 기준 컬럼을 선택
- 분할 또는 병합을 실행
- 결과 파일을 다운로드

### 7.3 문서 챗봇
- 문서 매뉴얼을 업로드
- 질문을 입력
- 출력 스크립트 또는 응답 초안을 확인

### 7.4 뉴스 수집
- 수집 대상을 설정
- 매일 자동 수집을 실행
- 목록과 요약을 확인

## 8. 운영 체크리스트
- 백엔드 `.venv`가 존재하는지 확인
- 프런트엔드 `node_modules`가 설치되어 있는지 확인
- DB 파일 경로가 유효한지 확인
- 업로드 파일 크기 제한을 적절히 설정
- 민감 정보 접근 정책을 점검
- Cloudflared 사용 시 백엔드와 터널 프로세스가 모두 살아 있는지 확인
- GitHub Pages에서 사용할 백엔드 URL이 HTTPS인지 확인
