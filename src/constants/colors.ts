// FutureBoxes Design System — Color Tokens

export const Colors = {
  // Box type colors
  boxType: {
    message: '#5B8DEF',
    messageBg: '#EEF4FF',
    goal: '#4CAF82',
    goalBg: '#EDFAF4',
    memory: '#9B7FD4',
    memoryBg: '#F3EEFF',
    decision: '#F0944D',
    decisionBg: '#FFF4EB',
  },

  // Primary brand
  primary: '#5B8DEF',
  primaryLight: '#EEF4FF',
  primaryDark: '#3A6FD8',

  // Backgrounds
  background: '#F8F9FC',
  surface: '#FFFFFF',
  surfaceSecondary: '#F2F4F8',
  surfaceElevated: '#FFFFFF',

  // Text
  textPrimary: '#1A1D23',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  textOnColor: '#FFFFFF',

  // Semantic
  success: '#4CAF82',
  successLight: '#EDFAF4',
  warning: '#F0944D',
  warningLight: '#FFF4EB',
  warningBg: '#FFF8E1',
  warningText: '#92600A',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',

  // Section headers
  sectionReadyToOpen: '#EF4444',
  sectionLocked: '#6B7280',
  sectionOpened: '#9CA3AF',

  // Borders
  borderLight: '#E5E7EB',
  borderMedium: '#D1D5DB',

  // Overlay
  overlay: 'rgba(0,0,0,0.5)',
  overlayLight: 'rgba(0,0,0,0.08)',

  // Card shadow (for StyleSheet shadow*)
  shadow: '#000000',

  // Badge
  badgeReady: '#EF4444',
  badgeOpened: '#9CA3AF',

  // Progress bar track
  progressTrack: '#E5E7EB',

  // Transparent
  transparent: 'transparent',
} as const;

export type ColorKey = keyof typeof Colors;
