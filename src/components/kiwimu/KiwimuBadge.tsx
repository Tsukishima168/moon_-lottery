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
    free: "bg-[#D4FF00] text-[#111111] border-[#111111]",
    done: "bg-[#E5E5E5] text-[#666666] border-[#111111]",
    new: "bg-[#111111] text-[#F4F4F0] border-[#111111]",
    rare: "bg-[#FFFDF7] text-[#111111] border-[#111111]",
    coming: "bg-[#E5E5E5] text-[#666666] border-[#111111]",
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-md text-[10px] font-black px-2 py-0.5 border tracking-wider",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  )
}

export { KiwimuBadge }
