import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex h-5 items-center rounded-full border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap",
  {
    variants: {
      tone: {
        green:  "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
        yellow: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
        red:    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        blue:   "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
        slate:  "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
      },
    },
    defaultVariants: {
      tone: "slate",
    },
  }
)

interface BadgeProps
  extends React.ComponentProps<"span">,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, tone, ...props }: BadgeProps) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ tone }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
