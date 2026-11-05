/** Saru Flow design tokens. Light palette is the primary theme. */

export const lightColors = {
  deepNavy: '#0B1F33',
  navy: '#102A43',
  teal: '#0D9488',
  deepTeal: '#0F766E',
  tealPressed: '#0F766E',
  tealHighlight: '#CCFBF1',
  background: '#F5F7FA',
  surface: '#FFFFFF',
  text: '#172B4D',
  textSecondary: '#64748B',
  mutedText: '#94A3B8',
  border: '#E6EBF0',
  muted: '#F1F5F9',
  gold: '#C9A46A',
  amber: '#C9A46A',
  success: '#16A34A',
  warning: '#D97706',
  danger: '#DC2626',
  info: '#2563EB',
  neutral: '#64748B',
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(11, 31, 51, 0.52)',
  successSoft: '#DCFCE7',
  warningSoft: '#FEF3C7',
  dangerSoft: '#FEE2E2',
  infoSoft: '#DBEAFE',
  heroText: '#F8FAFC',
  heroMuted: 'rgba(248, 250, 252, 0.72)',
  cardShadow: 'rgba(11, 31, 51, 0.08)',
} as const

export type Palette = { [K in keyof typeof lightColors]: string }

export const darkColors: Palette = {
  deepNavy: '#07131F',
  navy: '#0E2236',
  teal: '#14B8A6',
  deepTeal: '#0D9488',
  tealPressed: '#0F766E',
  tealHighlight: '#134E4A',
  background: '#07131F',
  surface: '#102A43',
  text: '#F8FAFC',
  textSecondary: '#CBD5E1',
  mutedText: '#94A3B8',
  border: '#1E3A52',
  muted: '#0E2236',
  gold: '#C9A46A',
  amber: '#C9A46A',
  success: '#4ADE80',
  warning: '#FBBF24',
  danger: '#F87171',
  info: '#60A5FA',
  neutral: '#94A3B8',
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0, 0, 0, 0.62)',
  successSoft: '#052E16',
  warningSoft: '#451A03',
  dangerSoft: '#450A0A',
  infoSoft: '#172554',
  heroText: '#F8FAFC',
  heroMuted: 'rgba(248, 250, 252, 0.72)',
  cardShadow: 'rgba(0, 0, 0, 0.28)',
}

/** Light palette kept as the default static export for non-themed call sites. */
export const colors = lightColors

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
} as const

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  full: 999,
} as const

export const typography = {
  hero: { fontSize: 30, fontWeight: '700' as const, lineHeight: 36, letterSpacing: -0.6 },
  screenTitle: { fontSize: 26, fontWeight: '700' as const, lineHeight: 32, letterSpacing: -0.4 },
  sectionTitle: { fontSize: 18, fontWeight: '600' as const, lineHeight: 24, letterSpacing: -0.2 },
  cardTitle: { fontSize: 16, fontWeight: '600' as const, lineHeight: 22 },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  label: { fontSize: 13, fontWeight: '500' as const, lineHeight: 18 },
  meta: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
  button: { fontSize: 15, fontWeight: '600' as const, lineHeight: 20 },
  metric: { fontSize: 28, fontWeight: '700' as const, lineHeight: 34, letterSpacing: -0.6 },
} as const

export const shadows = {
  card: {
    shadowColor: '#0B1F33',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 2,
  },
  float: {
    shadowColor: '#0B1F33',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.14,
    shadowRadius: 28,
    elevation: 10,
  },
  soft: {
    shadowColor: '#0B1F33',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
} as const

export const hitSlop = { top: 8, bottom: 8, left: 8, right: 8 } as const

/** Clearance so scroll content stays above the floating tab bar. */
export const TAB_BAR_CLEARANCE = 112

export const fontFamily = {
  display: 'PlusJakartaSans_600SemiBold',
  displayMedium: 'PlusJakartaSans_500Medium',
  displayBold: 'PlusJakartaSans_700Bold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemibold: 'Inter_600SemiBold',
} as const
