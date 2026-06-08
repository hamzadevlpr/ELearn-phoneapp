export type ThemeName = "terracotta" | "ocean" | "forest" | "violet" | "rose";

export interface ColorPalette {
  text: string;
  tint: string;
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  success: string;
  warning: string;
}

export interface Theme {
  light: ColorPalette;
  dark: ColorPalette;
  radius: number;
}

// ─── 1. Terracotta — warm earth & clay ───────────────────────────────────────
const terracotta: Theme = {
  radius: 12,
  light: {
    text:                 "#3B1D0F",
    tint:                 "#A94222",
    background:           "#FDF5F0",
    foreground:           "#3B1D0F",
    card:                 "#FFFFFF",
    cardForeground:       "#3B1D0F",
    primary:              "#A94222",
    primaryForeground:    "#FFFFFF",
    secondary:            "#F5E8E0",
    secondaryForeground:  "#5C3B28",
    muted:                "#EDD9CC",
    mutedForeground:      "#8A6B5D",
    accent:               "#5C3B28",
    accentForeground:     "#FFFFFF",
    destructive:          "#DC2626",
    destructiveForeground:"#FFFFFF",
    border:               "#E8D0C4",
    input:                "#E8D0C4",
    success:              "#16A34A",
    warning:              "#D97706",
  },
  dark: {
    text:                 "#F5E8E0",
    tint:                 "#D4623A",
    background:           "#1A0D07",
    foreground:           "#F5E8E0",
    card:                 "#2D1710",
    cardForeground:       "#F5E8E0",
    primary:              "#D4623A",
    primaryForeground:    "#FFFFFF",
    secondary:            "#3D2018",
    secondaryForeground:  "#F5E8E0",
    muted:                "#3D2018",
    mutedForeground:      "#A07060",
    accent:               "#C07050",
    accentForeground:     "#FFFFFF",
    destructive:          "#EF4444",
    destructiveForeground:"#FFFFFF",
    border:               "#4D2818",
    input:                "#4D2818",
    success:              "#22C55E",
    warning:              "#F59E0B",
  },
};

// ─── 2. Ocean — deep blue & teal ─────────────────────────────────────────────
const ocean: Theme = {
  radius: 14,
  light: {
    text:                 "#0A1E3D",
    tint:                 "#1A6FC4",
    background:           "#F0F7FE",
    foreground:           "#0A1E3D",
    card:                 "#FFFFFF",
    cardForeground:       "#0A1E3D",
    primary:              "#1A6FC4",
    primaryForeground:    "#FFFFFF",
    secondary:            "#E0EFFD",
    secondaryForeground:  "#1A3D6B",
    muted:                "#C8DFF8",
    mutedForeground:      "#5B7FA8",
    accent:               "#0A9396",
    accentForeground:     "#FFFFFF",
    destructive:          "#DC2626",
    destructiveForeground:"#FFFFFF",
    border:               "#B8D4F0",
    input:                "#B8D4F0",
    success:              "#16A34A",
    warning:              "#D97706",
  },
  dark: {
    text:                 "#D6E8FF",
    tint:                 "#4B9EF5",
    background:           "#060E1A",
    foreground:           "#D6E8FF",
    card:                 "#0C1A2E",
    cardForeground:       "#D6E8FF",
    primary:              "#4B9EF5",
    primaryForeground:    "#FFFFFF",
    secondary:            "#102240",
    secondaryForeground:  "#A8C8F0",
    muted:                "#102240",
    mutedForeground:      "#5B82A8",
    accent:               "#14B8BD",
    accentForeground:     "#FFFFFF",
    destructive:          "#EF4444",
    destructiveForeground:"#FFFFFF",
    border:               "#1A3050",
    input:                "#1A3050",
    success:              "#22C55E",
    warning:              "#F59E0B",
  },
};

// ─── 3. Forest — emerald & deep green ────────────────────────────────────────
const forest: Theme = {
  radius: 10,
  light: {
    text:                 "#0E2A14",
    tint:                 "#1A7A3C",
    background:           "#F0FAF3",
    foreground:           "#0E2A14",
    card:                 "#FFFFFF",
    cardForeground:       "#0E2A14",
    primary:              "#1A7A3C",
    primaryForeground:    "#FFFFFF",
    secondary:            "#DCF5E3",
    secondaryForeground:  "#1A4D28",
    muted:                "#BEE8CB",
    mutedForeground:      "#4D8060",
    accent:               "#2D6A4F",
    accentForeground:     "#FFFFFF",
    destructive:          "#DC2626",
    destructiveForeground:"#FFFFFF",
    border:               "#A8DCBA",
    input:                "#A8DCBA",
    success:              "#16A34A",
    warning:              "#D97706",
  },
  dark: {
    text:                 "#C8F0D4",
    tint:                 "#3DBF6B",
    background:           "#071409",
    foreground:           "#C8F0D4",
    card:                 "#0D2414",
    cardForeground:       "#C8F0D4",
    primary:              "#3DBF6B",
    primaryForeground:    "#FFFFFF",
    secondary:            "#12321A",
    secondaryForeground:  "#90D4A8",
    muted:                "#12321A",
    mutedForeground:      "#4A8060",
    accent:               "#52B788",
    accentForeground:     "#FFFFFF",
    destructive:          "#EF4444",
    destructiveForeground:"#FFFFFF",
    border:               "#1C3C24",
    input:                "#1C3C24",
    success:              "#22C55E",
    warning:              "#F59E0B",
  },
};

// ─── 4. Violet — rich purple & indigo ────────────────────────────────────────
const violet: Theme = {
  radius: 16,
  light: {
    text:                 "#1A0E38",
    tint:                 "#6B35CC",
    background:           "#F6F2FF",
    foreground:           "#1A0E38",
    card:                 "#FFFFFF",
    cardForeground:       "#1A0E38",
    primary:              "#6B35CC",
    primaryForeground:    "#FFFFFF",
    secondary:            "#EDE5FF",
    secondaryForeground:  "#3D1E7A",
    muted:                "#D8C8F8",
    mutedForeground:      "#7055A0",
    accent:               "#4C1D95",
    accentForeground:     "#FFFFFF",
    destructive:          "#DC2626",
    destructiveForeground:"#FFFFFF",
    border:               "#C8B0F0",
    input:                "#C8B0F0",
    success:              "#16A34A",
    warning:              "#D97706",
  },
  dark: {
    text:                 "#E8D8FF",
    tint:                 "#9966EE",
    background:           "#0E0820",
    foreground:           "#E8D8FF",
    card:                 "#1A0D33",
    cardForeground:       "#E8D8FF",
    primary:              "#9966EE",
    primaryForeground:    "#FFFFFF",
    secondary:            "#241048",
    secondaryForeground:  "#C0A0F0",
    muted:                "#241048",
    mutedForeground:      "#7050A8",
    accent:               "#7C3AED",
    accentForeground:     "#FFFFFF",
    destructive:          "#EF4444",
    destructiveForeground:"#FFFFFF",
    border:               "#321060",
    input:                "#321060",
    success:              "#22C55E",
    warning:              "#F59E0B",
  },
};

// ─── 5. Rose — bold pink & rose ──────────────────────────────────────────────
const rose: Theme = {
  radius: 18,
  light: {
    text:                 "#3A0A1E",
    tint:                 "#C7245E",
    background:           "#FFF1F7",
    foreground:           "#3A0A1E",
    card:                 "#FFFFFF",
    cardForeground:       "#3A0A1E",
    primary:              "#C7245E",
    primaryForeground:    "#FFFFFF",
    secondary:            "#FFE0EE",
    secondaryForeground:  "#7A1040",
    muted:                "#FFBDD8",
    mutedForeground:      "#A0587A",
    accent:               "#9D174D",
    accentForeground:     "#FFFFFF",
    destructive:          "#DC2626",
    destructiveForeground:"#FFFFFF",
    border:               "#F0B0CC",
    input:                "#F0B0CC",
    success:              "#16A34A",
    warning:              "#D97706",
  },
  dark: {
    text:                 "#FFD8EC",
    tint:                 "#F05090",
    background:           "#1A0710",
    foreground:           "#FFD8EC",
    card:                 "#2D0E1E",
    cardForeground:       "#FFD8EC",
    primary:              "#F05090",
    primaryForeground:    "#FFFFFF",
    secondary:            "#3D1028",
    secondaryForeground:  "#F0A8CC",
    muted:                "#3D1028",
    mutedForeground:      "#A05878",
    accent:               "#DB2777",
    accentForeground:     "#FFFFFF",
    destructive:          "#EF4444",
    destructiveForeground:"#FFFFFF",
    border:               "#581232",
    input:                "#581232",
    success:              "#22C55E",
    warning:              "#F59E0B",
  },
};

// ─── Registry ────────────────────────────────────────────────────────────────
const themes: Record<ThemeName, Theme> = {
  terracotta,
  ocean,
  forest,
  violet,
  rose,
};

export default themes;
