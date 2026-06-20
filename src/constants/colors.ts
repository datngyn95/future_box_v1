// FutureBoxes Design System — Color Tokens
//
// MIGRATED to Dark Theme (design/uiuxguides.md): `Colors` giờ là FACADE
// ánh xạ từ `ThemeColors` (src/constants/theme.ts) — nguồn chân lý duy nhất.
// Giữ nguyên toàn bộ tên key cũ để mọi màn hình tự động dùng token dark,
// không cần đổi call-site. Box-type colors gộp về 1 accent cam (single accent).

import { ThemeColors } from './theme';

const T = ThemeColors;

export const Colors = {
  // Box type colors — gộp về accent duy nhất, phân biệt bằng icon
  boxType: {
    message: T.accent,
    messageBg: T.accentSoft,
    goal: T.accent,
    goalBg: T.accentSoft,
    memory: T.accent,
    memoryBg: T.accentSoft,
    decision: T.accent,
    decisionBg: T.accentSoft,
    secret: T.accent,
    secretBg: T.accentSoft,
    challenge: T.accent,
    challengeBg: T.accentSoft,
    letter: T.accent,
    letterBg: T.accentSoft,
  },

  // Primary brand → accent cam
  primary: T.accent,
  primaryLight: T.accentSoft,
  primaryDark: T.accentPressed,

  // Backgrounds
  background: T.background,
  surface: T.surfaceSolid,
  surfaceSecondary: T.backgroundElevated,
  surfaceElevated: T.surfaceSolid,

  // Text
  textPrimary: T.textPrimary,
  textSecondary: T.textSecondary,
  textMuted: T.textMuted,
  textOnColor: T.textOnAccent,

  // Semantic
  success: T.success,
  successLight: 'rgba(60,203,127,0.14)',
  warning: T.warning,
  warningLight: 'rgba(242,176,31,0.14)',
  warningBg: 'rgba(242,176,31,0.14)',
  warningText: T.warning,
  danger: T.danger,
  dangerLight: 'rgba(255,90,90,0.14)',

  // Section headers
  sectionReadyToOpen: T.accent,
  sectionLocked: T.textMuted,
  sectionOpened: T.textMuted,

  // Borders
  borderLight: T.borderGlass,
  borderMedium: T.borderGlassStrong,

  // Overlay
  overlay: T.overlay,
  overlayLight: 'rgba(255,255,255,0.08)',

  // Card shadow (cho StyleSheet shadow*)
  shadow: '#000000',

  // Badge
  badgeReady: T.accent,
  badgeOpened: T.textMuted,

  // Progress bar track
  progressTrack: T.trackOff,

  // Transparent
  transparent: 'transparent',
} as const;

export type ColorKey = keyof typeof Colors;
