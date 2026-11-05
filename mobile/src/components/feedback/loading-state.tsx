import { SkeletonLoader } from '@/components/motion/skeleton'

export function LoadingState({ variant = 'list' }: { variant?: 'list' | 'dashboard' | 'detail' }) {
  return <SkeletonLoader variant={variant} />
}
