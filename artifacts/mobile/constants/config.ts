/**
 * App configuration — change these values per deployment / CI-CD pipeline.
 * TENANT_ID is sent on every API request so multiple tenants can share the same codebase.
 * APP_LOGO can be swapped to any local image asset.
 */

const APP_CONFIG = {
  APP_NAME: "leo-learning",
  TENANT_ID: "8f31d2ed-1134-4376-9e1c-14cb15377800",
  API_BASE_URL: "https://api.teachers-eg.com",
  APP_LOGO: require("../assets/images/icon.png") as ReturnType<typeof require>,
} as const;

export default APP_CONFIG;
