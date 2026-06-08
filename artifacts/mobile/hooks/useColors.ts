import { useColorScheme } from "react-native";
import APP_CONFIG from "@/constants/config";
import themes from "@/constants/colors";

/**
 * Returns the design tokens for the current color scheme + configured theme.
 *
 * The active theme is set via APP_CONFIG.THEME in constants/config.ts.
 * Available themes: "terracotta" | "ocean" | "forest" | "violet" | "rose"
 *
 * Within each theme, light/dark palettes are selected automatically based
 * on the device's system appearance setting.
 */
export function useColors() {
  const scheme = useColorScheme();
  const theme = themes[APP_CONFIG.THEME] ?? themes.terracotta;
  const palette = scheme === "dark" ? theme.dark : theme.light;
  return { ...palette, radius: theme.radius };
}
