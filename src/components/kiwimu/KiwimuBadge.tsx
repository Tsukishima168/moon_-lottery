/**
 * KiwimuBadge — 品牌標籤積木
 * wrap shadcn Badge + 月島品牌 pill 風格
 */
import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type KiwimuBadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "free" | "done" | "new" | "rare" | "coming"
}

function KiwimuBadge({
  className,
  variant = "free",
  ...props
}: KiwimuBadgeProps) {
  const variantClasses = {
    free: "bg-green-100 text-green-700 border-green-200",
    done: "bg-stone-100 text-stone-400 border-stone-200",
    new: "bg-purple-100 text-purple-700 border-purple-200",
    rare: "bg-amber-400 text-white border-amber-500",
    coming: "bg-stone-200 text-stone-500 border-stone-300",
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full text-[10px] font-bold px-2 py-0.5 border",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  )
}

export { KiwimuBadge }
