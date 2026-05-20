# bread-duty-app

빵 수령 당번표를 주 단위로 생성하고 확인하는 Next.js 앱입니다.

## 주요 기능

- 주차별 백업팀 순환
- 백업팀을 제외한 팀에서 수령 담당자 자동 선정
- 기본 수령 멤버에 `근로지원인` 포함
- Supabase 연동을 위한 클라이언트 설정 파일 포함

## 시작하기

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000`을 엽니다.

## Supabase 설정

`.env.local.example`을 참고해 `.env.local` 파일을 만들고 값을 입력하세요.

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## 폴더 구조

```text
app/
components/
lib/
types/
utils/
```
