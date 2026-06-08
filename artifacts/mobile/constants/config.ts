import type { ThemeName } from "./colors";

/**
 * App configuration — change these values per deployment / CI-CD pipeline.
 *
 * TENANT_ID  — sent on every API request so multiple tenants share one codebase.
 * APP_LOGO   — swap to any local image asset.
 * THEME      — one of: "terracotta" | "ocean" | "forest" | "violet" | "rose"
 *              Change this single value to redeploy the app with a different
 *              colour identity. Both light and dark palettes are swapped together.
 */

const APP_CONFIG = {
  APP_NAME:    "leo-learning",
  TENANT_ID:   "8f31d2ed-1134-4376-9e1c-14cb15377800",
  API_BASE_URL:"https://api.teachers-eg.com",
  APP_LOGO:    require("../assets/images/icon.png") as ReturnType<typeof require>,
  THEME:       "terracotta" as ThemeName,
} as const;

export default APP_CONFIG;
