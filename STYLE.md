# KNUE Design System

> Version 1.1 – 2025‑07‑31

## 1. 브랜드 정신 (Key Concept)

| 상징                 | 의미                                         | 디자이너에게 주는 시사점                                       |
| -------------------- | -------------------------------------------- | -------------------------------------------------------------- |
| **촛불**             | 자신을 태워 세상을 밝히는 ‘살신성인’-형 헌신 | 온화하지만 힘 있는 메인 비주얼·아이콘, 따뜻한 광원/글로우 효과 |
| **펴 놓은 책**       | 학문 연구·면학 의지                          | 지식 플랫폼 느낌의 카드·탭 구조, 여백이 넉넉한 레이아웃        |
| **퍼져 나가는 빛살** | 이상적 교육의 발전·행복                      | Radial gradient, 확산 애니메이션, CTA 주변 하이라이트          |
| **KNUE(약칭)**       | 선도적·중심적 대학                           | 헤더·푸터에 단순 영문 로고 사용, 일관된 브랜드 마커            |
| **靑出於藍**         | 청출어람 – 제자(학생)가 스승보다 푸르다      | 성장을 암시하는 단계별 인터랙션(Progress bar, Timeline)        |

> **Tone** : Warm & Bold | **Voice** : Inspiring Growth

---

## 2. 컬러 시스템

### 2.1 팔레트

| Token           | HEX       | RGB         | CMYK        | WCAG 대비     | 주요 용도                        |
| --------------- | --------- | ----------- | ----------- | ------------- | -------------------------------- |
| **KNUE Navy**   | `#072D6E` | 7 45 110    | 100 95 47 3 | 12.2:1 AA/AAA | 헤더, 푸터, 기본 텍스트          |
| **KNUE Blue**   | `#03519C` | 3 81 156    | 94 72 14 0  | 4.5:1 AA      | 버튼, 링크, 강조 라벨            |
| **Candle Gold** | `#FFB800` | 255 184 0   | 0 28 100 0  | 1.9:1         | 포인트 아이콘, 그래프 하이라이트 |
| **Light Beam**  | `#FAFAFD` | 250 250 253 | 2 1 0 0     | —             | 배경 그라디언트, 섹션 구분       |

> **Design Token 예시**
>
> ```css
> :root {
>   --color-primary: #072d6e;
>   --color-accent: #03519c;
>   --color-highlight: #ffb800;
>   --color-surface: #fafafd;
> }
> ```

### 2.2 사용 가이드

- **배경 대비**: 텍스트 vs 배경 대비 비율을 **4.5 : 1** 이상으로 유지
- **Gradient**: `#072D6E → #03519C` 120° 선형 그래디언트를 기본으로 사용
- **Dark Mode**: 밝기 ‑6 %, 채도 ‑10 % 변형 후 테스트

---

## 3. 타이포그래피

| 스타일             | Typeface              | Size / Weight  | 용도              |
| ------------------ | --------------------- | -------------- | ----------------- |
| Headline (KR)      | Pretendard Bold       | 36‑48 px / 700 | Hero, 섹션 타이틀 |
| Logo / Slogan (EN) | Montserrat SemiBold   | 28‑32 px / 600 | 로고, 슬로건      |
| Body (KR/EN)       | Noto Sans KR Regular  | 16 px / 400    | 일반 본문         |
| Caption            | Noto Sans KR Regular  | 14 px / 400    | 캡션, 보조 텍스트 |
| Emphasis           | Noto Sans KR SemiBold | +1 weight      | 강조 구간, Quote  |

> `line‑height`는 최소 **1.6** 유지 → 가독성 확보

---

## 4. 아이콘·일러스트

- **모티프**: 촛불, 책, 빛살을 단순화한 **라인** 스타일
- **Stroke**: 1.5 px, Round Cap, Round Join
- **Corner Radius**: 8 px
- **Animation**
  - Hover : **Glow**(`drop‑shadow`) 0 → 4 px @ 200 ms ease‑out
  - Motion 반복 간격 ≥ 3 s (지나친 주의 분산 방지)

---

## 5. 레이아웃·컴포넌트

### 5.1 Grid & Spacing

| Breakpoint | Width       | Columns | Gutter | Margin |
| ---------- | ----------- | ------- | ------ | ------ |
| Mobile     | ≤ 599 px    | 4       | 16 px  | 16 px  |
| Tablet     | 600–1023 px | 8       | 20 px  | 24 px  |
| Desktop    | ≥ 1024 px   | 12      | 24 px  | 32 px  |

### 5.2 주요 섹션 패턴

| 섹션             | 구조                               | 핵심 UX 포인트                          |
| ---------------- | ---------------------------------- | --------------------------------------- |
| **Hero**         | Full‑bleed, 촛불 + 확산 그래디언트 | Scroll Down indicator에 빛살 애니메이션 |
| Mission & Vision | 2‑Column (Text / Illustration)     | Chapter 넘버링에 Gold 토큰              |
| 학과·프로그램    | Masonry 또는 3‑Grid 카드           | Hover 시 카드 상단 빛 Mask              |
| 연구 / 뉴스      | 탭 또는 필터 가능 리스트           | 성장 그래프/바 아트 사용                |
| **Footer**       | Navy 배경, White/Gold 텍스트       | Social 아이콘: Line + Hover Glow        |

---

## 6. 톤 & 보이스

- **Warm 담대**: 친근하지만 전문성 유지
- **성장 지향**: 학생 → 미래 교육 리더로 성장 서사
- **책임 있는 헌신**: ‘촛불’ 은유를 텍스트와 마이크로카피에 사용

> 예시 문구 : **“당신의 빛으로 교육의 내일을 밝혀주세요.”**

---

## 7. 인터랙션·애니메이션

| Trigger        | 효과                          | 지속 시간 / Easing | 접근성                        |
| -------------- | ----------------------------- | ------------------ | ----------------------------- |
| Scroll         | 책이 펼쳐지며 콘텐츠 Slide‑Up | 500 ms / ease‑out  | `prefers‑reduced‑motion` 대응 |
| Hover (Button) | Border Gold 점화 → Fade       | 250 ms / ease‑in   | Focus 상태 동일 효과          |
| Page Load      | 촛불 심지 → 불꽃 로딩 스피너  | 0.8 s / linear     | ARIA `status`로 안내          |

---

## 8. 접근성 체크리스트

- 대비 비율 **AA** 이상 확인 (Navy #072D6E ↔ White)
- 모든 인터랙션에 **키보드 포커스 링**: 2 px `#FFB800`
- **Alt 텍스트**는 상징 의미 포함 (예: “촛불 아이콘 – 헌신”)
- Motion 감지 : `prefers‑reduced‑motion: reduce` 시 애니메이션 비활성화

---

Last updated: 2025-07-31
