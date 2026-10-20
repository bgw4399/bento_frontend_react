# Bento · CDM Explorer Frontend

의료 연구용 CDM 데이터를 탐색하고 코호트를 정의하는 React 프런트엔드입니다.
코호트 목록·조건 편집, 대상자 조회, 도메인별 데이터 탐색과 차트 화면을 제공합니다.

**React 19 · Vite 7 · JavaScript / TypeScript · Tailwind CSS · D3 · Recharts**

## 주요 화면

| 화면 | 구현 위치 |
| :--- | :--- |
| 코호트 목록과 정의 | [CohortListPage](src/pages/CohortListPage/) · [CohortDefinitionPage](src/pages/CohortDefinitionPage/) |
| 데이터 브라우저 | [DataBrowserPage](src/pages/DataBrowserPage/) |
| 대상자 검색과 상세 | [PersonSearchPage](src/pages/PersonSearchPage/) · [PersonDetailPage](src/pages/PersonDetailPage/) |
| 사용자 정의 차트 | [CustomChartPage](src/pages/CustomChartPage/) |
| API 호출 | [src/api](src/api/) |

## 로컬 개발

```bash
npm ci
npm run dev
```

루트에 `.env.local`을 만들고 연결할 서버의 API 주소를 지정합니다.

```dotenv
VITE_PUBLIC_API_URI=http://localhost:8000
```

주소는 실제 백엔드에 맞춰 바꿔야 합니다. 인증과 데이터 조회에는 호환되는 백엔드가 필요하며, 이 저장소만으로 의료 데이터가 준비되지는 않습니다.

| 명령 | 용도 |
| :--- | :--- |
| `npm run dev` | Vite 개발 서버 |
| `npm run build` | TypeScript 검사와 배포 빌드 |
| `npm run lint` | ESLint 검사 |
| `npm run preview` | 생성한 빌드 미리보기 |

관련 팀 프로젝트는 [capstone-2025](https://github.com/bgw4399/capstone-2025), 설계 설명은 [프로젝트 노트](https://github.com/bgw4399/bgw4399/blob/main/docs/projects/medical-cdm-explorer.md)에서 볼 수 있습니다.
