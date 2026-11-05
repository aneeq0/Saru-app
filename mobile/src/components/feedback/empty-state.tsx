import { Inbox } from 'lucide-react-native'
import { AnimatedEmptyState } from '@/components/motion/status'
import { useAppTheme } from '@/theme/theme-context'

interface EmptyStateProps {
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  const { colors } = useAppTheme()
  return (
    <AnimatedEmptyState
      title={title}
      description={description}
      actionLabel={actionLabel}
      onAction={onAction}
      icon={<Inbox color={colors.teal} size={28} />}
    />
  )
}
