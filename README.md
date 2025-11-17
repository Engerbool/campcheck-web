# CampCheck Web

캠핑 장비를 효율적으로 관리하는 웹 애플리케이션입니다.

![CampCheck](https://img.shields.io/badge/version-1.0.0-green.svg)
![React](https://img.shields.io/badge/React-19.2-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

## ✨ 주요 기능

### 📦 장비 관리
- 장비 추가/수정/삭제
- 13개 카테고리 분류 (텐트/타프, 침구류, 취사도구 등)
- 상태 관리 (정상/교체 필요/구매 필요)
- 수량 및 메모 관리
- 카테고리별 필터링

### 📚 모듈 시스템
- 장비를 그룹으로 묶어 관리
- 여름 캠핑, 겨울 캠핑 등 상황별 모듈 생성
- 정렬 및 관리 기능

### ✅ 체크리스트
- 캠핑 일정별 체크리스트 생성
- 모듈 기반 빠른 체크리스트 작성
- 실시간 진행률 확인
- 체크 상태 자동 저장

### ⚙️ 설정
- 다크/라이트 모드 지원
- 알림 설정
- 데이터 관리

## 🛠️ 기술 스택

- **프레임워크**: React 19 + TypeScript
- **빌드 도구**: Vite 7
- **UI 라이브러리**: shadcn/ui + Tailwind CSS 3.4
- **아이콘**: Lucide React
- **데이터 저장**: IndexedDB (오프라인 지원)
- **번들링**: Parcel (단일 HTML 파일로 패키징)

## 🚀 시작하기

### 필수 조건
- Node.js 18 이상
- pnpm (권장) 또는 npm

### 설치 및 실행

```bash
# 의존성 설치
pnpm install

# 개발 서버 실행 (http://localhost:5173)
pnpm dev

# 프로덕션 빌드
pnpm build

# 빌드 결과 미리보기
pnpm preview
```

## 📦 단일 HTML 파일로 번들링

```bash
# artifacts-builder 스크립트 사용
bash scripts/bundle.sh

# 또는 직접 번들링
pnpm build:bundle
```

생성된 `bundle.html` 파일은:
- 크기: ~430KB
- 모든 자산 인라인 포함 (CSS, JS, 폰트 등)
- 인터넷 연결 없이 실행 가능
- 브라우저에서 바로 열기 가능

## 📂 프로젝트 구조

```
campcheck-web/
├── src/
│   ├── components/ui/      # shadcn/ui 컴포넌트 (40+개)
│   ├── pages/              # 메인 페이지 컴포넌트
│   │   ├── EquipmentPage.tsx
│   │   ├── ModulesPage.tsx
│   │   ├── ChecklistsPage.tsx
│   │   └── SettingsPage.tsx
│   ├── lib/
│   │   ├── db.ts          # IndexedDB 래퍼
│   │   └── db-context.tsx # React Context
│   ├── types/             # TypeScript 타입 정의
│   ├── constants/         # 상수 (카테고리 등)
│   ├── App.tsx           # 메인 앱
│   └── main.tsx          # 엔트리 포인트
├── public/               # 정적 파일
└── index.html           # HTML 템플릿
```

## 💾 데이터 저장

모든 데이터는 브라우저의 IndexedDB에 저장되므로:
- ✅ 오프라인에서도 사용 가능
- ✅ 데이터가 로컬에 안전하게 보관
- ✅ 서버나 인터넷 연결 불필요
- ✅ 브라우저 저장 공간만큼 사용 가능

### 데이터베이스 구조
- **equipment**: 장비 정보
- **modules**: 모듈 정보
- **moduleEquipment**: 모듈-장비 연결
- **checklists**: 체크리스트
- **checklistItems**: 체크리스트 항목
- **settings**: 설정

## 🎨 디자인 시스템

- **색상**: 캠핑 테마 (녹색 계열)
- **컴포넌트**: shadcn/ui 기반
- **반응형**: 모바일, 태블릿, 데스크톱 대응
- **다크모드**: 완벽 지원
- **접근성**: WCAG 2.1 AA 준수

## 🌐 배포

### Netlify Drop
1. [netlify.com/drop](https://app.netlify.com/drop) 접속
2. `bundle.html` 파일 드래그 앤 드롭
3. 즉시 배포 완료!

### GitHub Pages
1. GitHub 저장소 Settings → Pages
2. Source: main branch 선택
3. Save 후 1~2분 대기
4. `https://username.github.io/repository/bundle.html` 접속

### Vercel
```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel
```

## 📱 모바일 앱

React Native로 개발된 안드로이드/iOS 버전도 있습니다:
- 저장소: [campingcheck](https://github.com/Engerbool/campingcheck)

## 🤝 기여

이슈나 풀 리퀘스트는 언제든 환영합니다!

## 📄 라이선스

MIT License

## 🔗 관련 링크

- [React](https://react.dev/)
- [Vite](https://vite.dev/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [artifacts-builder](https://github.com/anthropics/skills/tree/main/artifacts-builder)

---

**Made with ❤️ using [Claude Code](https://claude.com/claude-code)**
