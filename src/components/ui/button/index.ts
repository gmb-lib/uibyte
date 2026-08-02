import { cva, type VariantProps } from 'class-variance-authority'

export { default as Button } from './Button.vue'

// Ink is the primary action. The accent variant is deliberately not the default:
// a status colour used for decoration stops meaning anything.
export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-btn text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-ink text-white hover:bg-ink/90',
        outline: 'border border-line bg-surface text-ink hover:bg-band',
        ghost: 'text-ink hover:bg-band',
        accent: 'bg-status-ontrack text-white hover:bg-status-ontrack-fg',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3 text-[13px]',
        lg: 'h-11 px-6',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

export type ButtonVariants = VariantProps<typeof buttonVariants>
