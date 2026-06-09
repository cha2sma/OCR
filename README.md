# GD31-AB17 Relay Simulator

## 목적

실제 GD31-AB17 과전류 계전기를 조작하기 전, 웹에서 세팅값 확인, 미터링 확인, 접점 확인을 모의 수행하여 인적 실수를 예방하기 위한 웹 기반 시뮬레이터.

## 기술 스택

- Vite
- React
- TypeScript
- CSS (외부 UI 라이브러리 미사용)

## 실행 방법

```bash
npm install
npm run dev
npm run build
```

## 주요 기능

| 기능 | 설명 |
|------|------|
| 계전기 이미지 기반 UI | 전면부 이미지 위에 LCD / LED / 버튼 overlay |
| LCD 시뮬레이션 | 20자 × 4줄, 초록 backlight, 모노스페이스 폰트 |
| 버튼 조작 | DIS / SET / UP / DOWN / LEFT / RIGHT / ENT / RESET |
| LED 상태 표시 | PWR, RUN, ERR, Pickup(x2), Trip(x8), 50B, UBOCR |
| 비밀번호 입력 | SET 진입 시 Password 화면 (기본: 0000) |
| Setting 메뉴 | 보호 정정값(Pickup) 변경 가능 |
| 전류 입력 | IA / IB / IC / IN 수동 입력 |
| Pickup / Trip 로직 | IOCR / IOCGR / UBOCR 단순 보호 로직 |
| 접점 출력 | T/S1~T/S5 상태 표시 |
| Event Log | 버튼 조작, Fault, Reset 이력 |
| Debug Overlay | LCD / 버튼 / LED 위치 시각화 (개발용) |

## 버튼 사용법

| 버튼 | 동작 |
|------|------|
| DIS | 표시 화면 순환 (STATUS → MEASURE → CONTACT_OUTPUT → SELF_DIAGNOSIS) |
| SET | 비밀번호 입력 후 Setting 메뉴 진입 |
| UP / DOWN | 메뉴 이동 / 값 증감 |
| LEFT / RIGHT | 메뉴 depth 이동 / 비밀번호 커서 이동 |
| ENT | 선택 / 저장 확인 |
| RESET | Latch 상태 초기화 또는 STATUS 화면 표시 |

## 파일 구조

```
src/
  assets/          - 계전기 이미지 (gd31-ab17.svg or .png)
  components/      - React 컴포넌트
    RelaySimulator.tsx  - 루트 컴포넌트, useReducer 상태 관리
    RelayPanel.tsx      - 계전기 이미지 + overlay 컨테이너
    LcdDisplay.tsx      - LCD 표시창
    LedIndicator.tsx    - LED 상태 표시
    RelayButtonOverlay.tsx - 투명 버튼 클릭 영역
    ControlPanel.tsx    - 전류/설정값 입력, Fault 시뮬레이션
    EventLog.tsx        - 이벤트 이력 표시
  data/
    relayLayout.ts  - LCD/버튼/LED 좌표 (조정 가능)
    menuTree.ts     - Setting 메뉴 트리
    relayDefaults.ts - 초기 상태 생성
  logic/
    relayState.ts   - TypeScript 상태 타입 정의
    relayEngine.ts  - 순수 함수 기반 상태 변환 로직
  styles/
    relay.css       - 전체 스타일
```

## 이미지 교체 방법

`src/assets/gd31-ab17.svg`는 레이아웃 확인용 플레이스홀더입니다.
실제 GD31-AB17 사진으로 교체하려면:

1. `src/assets/gd31-ab17.png` 파일로 교체
2. `src/components/RelayPanel.tsx`의 import를 `.png`로 변경
3. Debug Overlay를 ON으로 설정하여 overlay 위치 확인
4. `src/data/relayLayout.ts`의 좌표값을 실제 사진에 맞게 조정

## 보안 주의사항

본 프로젝트는 프론트엔드 정적 배포 구조이므로 민감한 API Key를 클라이언트 코드에 포함하지 않습니다.

- `.env.local`은 절대 git에 커밋하지 마세요 (`.gitignore`에 포함됨)
- `VITE_*` 환경변수는 빌드 번들에 포함되어 브라우저에 노출됩니다
- 외부 API 연동이 필요한 경우 Vercel Serverless Function 또는 별도 백엔드 서버를 통해 처리하세요
- 커밋 전 `token`, `secret`, `password`, `apiKey` 등의 문자열이 소스코드에 없는지 확인하세요

## Vercel 배포

1. GitHub에 Push
2. Vercel에서 Import Project 선택
3. Framework: Vite 자동 감지
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Deploy

## 주의사항

> 본 앱은 교육 및 사전 점검용 시뮬레이터이며 실제 보호계전기 동작을 대체하지 않습니다.
> 실제 설비 조작은 반드시 공인된 전문가와 정식 절차에 따라 수행하십시오.
