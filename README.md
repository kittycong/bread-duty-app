# bread-duty-app

빵 수령 당번표를 주 단위로 생성하고 확인하는 Next.js 앱입니다.

## 주요 기능

- 주차별 백업팀 순환
- 백업팀을 제외한 팀에서 수령 담당자 자동 선정
- 기본 수령 멤버에 `근로지원인` 포함
- Supabase 공동 저장으로 직원 순서, 직원 추가/삭제, 당번 교체값 공유

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
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_ADMIN_PASSWORD=bread2026
```

Supabase SQL Editor에서 `supabase.sql` 내용을 실행하면 공동 저장용 `app_settings` 테이블이 생성됩니다.
`SUPABASE_SERVICE_ROLE_KEY`가 있으면 서버에서 해당 키로 저장하고, 없으면 `NEXT_PUBLIC_SUPABASE_ANON_KEY`와 `supabase.sql`의 공개 정책으로 저장합니다.
`SUPABASE_SERVICE_ROLE_KEY`는 Vercel 환경변수에만 저장하고 브라우저에 노출하지 마세요.

## 폴더 구조

```text
app/
components/
lib/
types/
utils/
```
