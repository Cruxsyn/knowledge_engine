import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
        // Custom variants for Knowledge Engine
        new: "border-deep-azure/30 bg-deep-azure/20 text-deep-azure",
        processing: "border-icon-gold/30 bg-icon-gold/20 text-icon-gold",
        distilled: "border-verdigris/30 bg-verdigris/20 text-verdigris",
        linked: "border-verdigris/50 bg-verdigris/30 text-verdigris",
        published: "border-parchment/30 bg-parchment/20 text-parchment",
        // Mastery
        unknown: "border-warm-gray/30 bg-warm-gray/20 text-warm-gray",
        learning: "border-deep-azure/30 bg-deep-azure/20 text-deep-azure",
        solid: "border-verdigris/30 bg-verdigris/20 text-verdigris",
        teachable: "border-icon-gold/30 bg-icon-gold/20 text-icon-gold",
        // Priority
        low: "border-warm-gray/30 bg-transparent text-warm-gray",
        medium: "border-icon-gold/30 bg-transparent text-icon-gold",
        high: "border-oxide-red/30 bg-transparent text-oxide-red",
      },
    },
    defaultVariants: {
      variant: "default",
    },
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
