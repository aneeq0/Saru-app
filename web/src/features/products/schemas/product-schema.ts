import { z } from 'zod'

export const productFormSchema = z.object({
  sku: z
    .string()
    .min(3, 'SKU must be at least 3 characters')
    .max(40, 'SKU is too long')
    .regex(/^[A-Z0-9-]+$/i, 'SKU may contain letters, numbers, and hyphens only'),
  name: z.string().min(2, 'Product name is required').max(160),
  description: z.string().max(2000).optional().or(z.literal('')),
  categoryName: z.string().min(1, 'Category is required'),
  manufacturerName: z.string().min(1, 'Manufacturer is required'),
  brand: z.string().max(80).optional().or(z.literal('')),
  countryOfOrigin: z.string().max(80).optional().or(z.literal('')),
  packagingUnit: z.string().min(1, 'Packaging unit is required'),
  status: z.enum(['active', 'inactive', 'draft']),
})

export type ProductFormValues = z.infer<typeof productFormSchema>
