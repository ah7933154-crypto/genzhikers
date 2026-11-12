import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-[#173D35]/10 text-[#173D35]",
        secondary: "bg-[#A4AA83]/20 text-[#5a5f44]",
        outline: "border border-[#173D35]/30 text-[#173D35]",
        destructive: "bg-red-100 text-red-700",
        success: "bg-green-100 text-green-700",
        warning: "bg-amber-100 text-amber-700",
        info: "bg-blue-100 text-blue-700",
        easy: "bg-green-100 text-green-700",
        moderate: "bg-yellow-100 text-yellow-700",
        difficult: "bg-orange-100 text-orange-700",
        extreme: "bg-red-100 text-red-700",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
