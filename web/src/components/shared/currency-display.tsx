import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'

interface CurrencyDisplayProps {
  amount: number | string
  currency?: string
  className?: string
}

export function CurrencyDisplay({ amount, currency = 'PKR', className }: CurrencyDisplayProps) {
  return <span className={cn('tabular-nums', className)}>{formatCurrency(amount, currency)}</span>
}
