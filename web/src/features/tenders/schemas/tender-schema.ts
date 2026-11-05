import { z } from 'zod'

export const tenderFormSchema = z.object({
  tenderNumber: z.string().min(3, 'Tender number is required').max(40),
  title: z.string().min(3, 'Title is required').max(200),
  departmentName: z.string().min(1, 'Department is required'),
  procurementAuthority: z.string().max(120).optional().or(z.literal('')),
  submissionDeadline: z.string().min(1, 'Submission deadline is required'),
  currency: z.string().min(3).max(3),
  estimatedValue: z.coerce.number().nonnegative().optional(),
})

export type TenderFormValues = z.infer<typeof tenderFormSchema>
