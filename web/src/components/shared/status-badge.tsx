import { Badge } from '@/components/ui/badge'

type Tone = 'success' | 'warning' | 'danger' | 'info' | 'secondary' | 'teal' | 'outline'

const STATUS_MAP: Record<string, { label: string; tone: Tone }> = {
  active: { label: 'Active', tone: 'success' },
  inactive: { label: 'Inactive', tone: 'secondary' },
  draft: { label: 'Draft', tone: 'secondary' },
  archived: { label: 'Archived', tone: 'outline' },
  pending: { label: 'Pending', tone: 'warning' },
  pending_approval: { label: 'Pending Approval', tone: 'warning' },
  approved: { label: 'Approved', tone: 'success' },
  rejected: { label: 'Rejected', tone: 'danger' },
  returned: { label: 'Returned', tone: 'warning' },
  cancelled: { label: 'Cancelled', tone: 'secondary' },
  closed: { label: 'Closed', tone: 'secondary' },
  completed: { label: 'Completed', tone: 'success' },
  issued: { label: 'Issued', tone: 'success' },
  paid: { label: 'Paid', tone: 'success' },
  partially_paid: { label: 'Partially Paid', tone: 'info' },
  amended: { label: 'Amended', tone: 'info' },
  identified: { label: 'Identified', tone: 'secondary' },
  under_review: { label: 'Under Review', tone: 'info' },
  preparing: { label: 'Preparing', tone: 'info' },
  submitted: { label: 'Submitted', tone: 'teal' },
  awarded: { label: 'Awarded', tone: 'success' },
  partially_awarded: { label: 'Partially Awarded', tone: 'info' },
  in_transit: { label: 'In Transit', tone: 'info' },
  arrived: { label: 'Arrived', tone: 'teal' },
  partially_received: { label: 'Partially Received', tone: 'warning' },
  received: { label: 'Received', tone: 'success' },
  discrepancy: { label: 'Discrepancy', tone: 'danger' },
  ordered: { label: 'Ordered', tone: 'info' },
  scheduled: { label: 'Scheduled', tone: 'info' },
  dispatched: { label: 'Dispatched', tone: 'teal' },
  delivered: { label: 'Delivered', tone: 'success' },
  acknowledged: { label: 'Acknowledged', tone: 'success' },
  prepared: { label: 'Prepared', tone: 'secondary' },
  release_requested: { label: 'Release Requested', tone: 'warning' },
  released: { label: 'Released', tone: 'success' },
  expired: { label: 'Expired', tone: 'danger' },
  encashed: { label: 'Encashed', tone: 'danger' },
  valid: { label: 'Valid', tone: 'success' },
  expiring: { label: 'Expiring', tone: 'warning' },
  pending_review: { label: 'Pending Review', tone: 'warning' },
  locked: { label: 'Locked', tone: 'danger' },
  open: { label: 'Open', tone: 'info' },
  in_progress: { label: 'In Progress', tone: 'info' },
  done: { label: 'Done', tone: 'success' },
  success: { label: 'Success', tone: 'success' },
  failure: { label: 'Failure', tone: 'danger' },
  recorded: { label: 'Recorded', tone: 'info' },
  allocated: { label: 'Allocated', tone: 'success' },
  reversed: { label: 'Reversed', tone: 'danger' },
  partially_rejected: { label: 'Partially Rejected', tone: 'warning' },
  posted: { label: 'Posted', tone: 'success' },
  quarantined: { label: 'Quarantined', tone: 'warning' },
  passed: { label: 'Passed', tone: 'success' },
  failed: { label: 'Failed', tone: 'danger' },
  won: { label: 'Won', tone: 'success' },
  lost: { label: 'Lost', tone: 'danger' },
  complete: { label: 'Complete', tone: 'success' },
  overdue: { label: 'Overdue', tone: 'danger' },
  connected: { label: 'Connected', tone: 'success' },
  disconnected: { label: 'Disconnected', tone: 'secondary' },
  error: { label: 'Error', tone: 'danger' },
  consumed: { label: 'Consumed', tone: 'info' },
  under_evaluation: { label: 'Under Evaluation', tone: 'info' },
  up: { label: 'Up', tone: 'success' },
  down: { label: 'Down', tone: 'danger' },
  flat: { label: 'Flat', tone: 'secondary' },
  email: { label: 'Email', tone: 'info' },
  in_app: { label: 'In App', tone: 'teal' },
  push: { label: 'Push', tone: 'secondary' },
}

function humanize(value: string): string {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

interface StatusBadgeProps {
  status: string
  label?: string
  className?: string
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const mapped = STATUS_MAP[status]
  return (
    <Badge variant={mapped?.tone ?? 'outline'} className={className}>
      <span className="sr-only">Status: </span>
      {label ?? mapped?.label ?? humanize(status)}
    </Badge>
  )
}
