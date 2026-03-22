import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline" | "destructive" | "green" | "red" | "blue" | "glass";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        {
          "bg-primary text-primary-foreground": variant === "default",
          "bg-secondary text-secondary-foreground": variant === "secondary",
          "border border-border text-foreground": variant === "outline",
          "bg-destructive/10 text-destructive border border-destructive/20": variant === "destructive",
          "bg-value-green/10 text-value-green border border-value-green/20": variant === "green",
          "bg-value-red/10 text-value-red border border-value-red/20": variant === "red",
          "bg-value-blue/10 text-value-blue border border-value-blue/20": variant === "blue",
          "bg-background/40 backdrop-blur-md border border-white/10 text-foreground": variant === "glass",
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }
