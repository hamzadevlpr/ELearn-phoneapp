# teachers-eg Mobile App

An Arabic/English e-learning mobile app for students (Android, iOS, Web/Windows) connected to the teachers-eg API.

## Run & Operate

- `pnpm --filter @workspace/mobile run dev` — run the Expo app
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Mobile: Expo SDK 54 (React Native), expo-router, expo-video
- API: Express 5 (internal); External: api.teachers-eg.com
- Fonts: Cairo (Arabic + English)
- State: React Query + AsyncStorage + React Context

## Where things live

- `artifacts/mobile/constants/config.ts` — **App config: APP_NAME, TENANT_ID, API_BASE_URL, APP_LOGO**
- `artifacts/mobile/lib/api.ts` — API client (all calls to api.teachers-eg.com)
- `artifacts/mobile/context/AuthContext.tsx` — Auth state (login/logout/token)
- `artifacts/mobile/context/LanguageContext.tsx` — Language (Arabic/English) + RTL
- `artifacts/mobile/i18n/ar.ts` + `en.ts` — All UI strings
- `artifacts/mobile/components/SecuredVideoPlayer.tsx` — Video player with watermark + screen capture protection
- `artifacts/mobile/components/AccessCodeModal.tsx` — Course access code popup

## Screens

1. `app/login.tsx` — Login (phone + password)
2. `app/(tabs)/index.tsx` — Teachers list (auto-skips to courses if single teacher)
3. `app/courses/[teacherId].tsx` — Courses for selected teacher
4. `app/course/[id].tsx` — Course detail + access code modal
5. `app/(tabs)/my-courses.tsx` — Purchased/enrolled courses
6. `app/player/[id].tsx` — Secured video player (watermark + screen capture block)
7. `app/exam/[id].tsx` — Exam with results
8. `app/(tabs)/profile.tsx` — Profile, language switch, logout

## Multi-tenant / CI-CD

To publish a new tenant version, change `constants/config.ts`:
```ts
const APP_CONFIG = {
  APP_NAME: "Your App Name",
  TENANT_ID: "42",           // ← change per tenant
  API_BASE_URL: "https://api.teachers-eg.com/api",
  APP_LOGO: require("..."),  // ← swap logo asset
};
```

## Video Security

- Phone number watermark overlay (randomly repositions every 7 seconds)
- `expo-screen-capture`: blocks screenshots and screen recording on iOS/Android
- Video served via API URL (no direct MP4 exposure)

## User preferences

- App supports Arabic (default, RTL) and English (LTR) — user toggles in Profile
- Dark mode: follows system theme (automatic)
- No emojis in the UI

## Architecture decisions

- All API calls go directly to `api.teachers-eg.com` — no proxy through internal API server
- `tenantId` header injected on every request via `lib/api.ts`
- RTL layout via `I18nManager.forceRTL()` stored in AsyncStorage
- Access code model (not wallet/payment) for course enrollment
