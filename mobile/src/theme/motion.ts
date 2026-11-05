import { Easing } from 'react-native-reanimated'

/** Shared motion tokens. Durations stay short so daily use stays fast. */
export const motion = {
  press: 130,
  tab: 220,
  cardEnter: 360,
  sheet: 300,
  status: 220,
  progress: 680,
  stagger: 42,
  staggerCap: 6,
  spring: { damping: 18, stiffness: 240, mass: 0.7 },
  springSoft: { damping: 22, stiffness: 190, mass: 0.8 },
  easing: Easing.out(Easing.cubic),
} as const

export function staggerDelay(index: number): number {
  return Math.min(index, motion.staggerCap) * motion.stagger
}
