# Architecture

## 1. 기술 스택
- FE: TypeScript + Vite + React
- BE: Python + FastAPI
- Python 환경 관리: `uv`
- DB: SQLite

## 2. 아키텍처 개요
초기 버전은 단일 백엔드 API와 단일 프론트엔드 앱으로 구성한다.

- 프론트엔드는 사용자가 기능을 선택하고 결과를 확인하는 화면을 담당한다.
- 백엔드는 일정, 엑셀 처리, 챗봇, 뉴스 수집 API를 제공한다.
- SQLite는 사용자, 일정, 작업 로그, 뉴스 저장, 문서 메타데이터 저장에 사용한다.

## 3. 권장 프로젝트 구조

### 3.1 Frontend
```text
frontend/
  src/
    app/
    components/
    features/
      schedule/
      excel/
      chatbot/
      news/
    lib/
    styles/
```

#### 역할
- `app/`: 라우팅, 공통 레이아웃, 전역 상태
- `components/`: 재사용 UI
- `features/schedule/`: 캘린더, 일정 폼, 필터
- `features/excel/`: 파일 업로드, 기준 컬럼 선택, 결과 다운로드
- `features/chatbot/`: 민원 매뉴얼 업로드, 질문 입력, 답변 렌더링
- `features/news/`: 뉴스 목록, 검색, 필터, 상세 보기
- `lib/`: API 클라이언트, 포맷터, 공통 유틸
- `styles/`: 전역 스타일, 테마 변수

### 3.2 Backend
```text
backend/
  app/
    main.py
    api/
      routes/
    core/
    db/
    models/
    schemas/
    services/
    jobs/
    utils/
```

#### 역할
- `main.py`: FastAPI 앱 생성, 라우터 등록, CORS 설정
- `api/routes/`: 기능별 API 엔드포인트
- `core/`: 설정, 환경변수, 공통 보안/로깅
- `db/`: SQLite 연결, 세션, 마이그레이션 보조
- `models/`: DB 모델 정의
- `schemas/`: 요청/응답 스키마
- `services/`: 핵심 비즈니스 로직
- `jobs/`: 뉴스 수집 같은 배치 작업
- `utils/`: 파일 파싱, 날짜 처리, 공통 헬퍼

## 4. 모듈별 역할

### 4.1 일정 관리 모듈
- FE: 달력 UI, 일정 생성/수정 폼, 팀원별 필터
- BE: 일정 CRUD API, 충돌 체크, 조회 필터
- DB: 일정 테이블, 사용자 테이블, 일정 유형 코드

### 4.2 엑셀 자동화 모듈
- FE: 파일 업로드, 기준 컬럼 선택, 처리 옵션 입력, 결과 확인
- BE: 엑셀 파싱, 분할/병합 처리, 검증 결과 반환
- DB: 처리 이력, 작업 상태, 파일 메타데이터

### 4.3 민원 대응 챗봇 모듈
- FE: 매뉴얼 업로드, 질문 입력, 답변 표시, 출처 확인
- BE: 문서 분해, 검색, 답변 생성, 답변 근거 추적
- DB: 매뉴얼 메타데이터, 문서 청크, 질의 로그

### 4.4 뉴스 수집 모듈
- FE: 뉴스 목록, 키워드 필터, 날짜별 확인
- BE: 수집 스케줄러, 기사 파싱, 중복 제거, 저장
- DB: 기사 테이블, 수집 로그, 키워드 설정

## 5. 데이터 흐름
1. 사용자가 FE에서 기능을 선택한다.
2. FE가 BE API를 호출한다.
3. BE가 입력을 검증하고 처리 서비스를 실행한다.
4. 필요한 경우 SQLite에 결과와 이력을 저장한다.
5. FE가 결과를 표, 카드, 캘린더, 다운로드 링크 형태로 보여준다.

## 6. API 설계 방향
- `GET /health`: 상태 확인
- `GET/POST/PUT/DELETE /schedules`: 일정 관리
- `POST /excel/split`: 엑셀 분할
- `POST /excel/merge`: 엑셀 병합
- `POST /chatbot/ask`: 민원 응답 생성
- `POST /documents/manuals`: 민원 매뉴얼 업로드
- `GET /news`: 뉴스 조회
- `POST /news/sync`: 뉴스 수집 실행

## 7. SQLite 설계 방향
초기 테이블 후보는 다음과 같다.

- `users`
- `teams`
- `schedules`
- `excel_jobs`
- `manuals`
- `manual_chunks`
- `chat_queries`
- `news_articles`
- `job_runs`

## 8. 운영 고려사항
- 파일 업로드 크기 제한 필요
- 민감한 문서와 일정은 권한 검사 필요
- 뉴스 수집은 외부 사이트 구조 변경에 취약함
- 엑셀 처리와 문서 검색은 비동기 작업으로 분리하는 것이 좋음

## 9. 향후 확장 포인트
- 작업 이력 대시보드
- 사용자 권한 관리
- 승인 워크플로우
- 외부 메신저 알림
- 보고서 자동 생성

