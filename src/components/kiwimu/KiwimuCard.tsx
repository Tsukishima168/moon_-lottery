/**
 * KiwimuCard — 品牌卡片積木
 * wrap shadcn Card + 月島品牌風格（圓角、陰影、hover 動效）
 */
import * as React from "react"
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

type KiwimuCardProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: "white" | "paper"
}

function KiwimuCard({ className, variant = "white", ...props }: KiwimuCardProps) {
  return (
    <Card
      className={cn(
        "rounded-2xl border-[1.5px] border-stone-200/60 shadow-md",
        "backdrop-blur-sm transition-[box-shadow,transform] duration-300",
        "hover:shadow-lg hover:-translate-y-0.5",
        variant === "paper" ? "bg-[#F9F8F2]" : "bg-white/90",
        className
      )}
      {...props}
    />
  )
}

export {
  KiwimuCard,
  CardHeader as KiwimuCardHeader,
  CardContent as KiwimuCardContent,
  CardFooter as KiwimuCardFooter,
  CardTitle as KiwimuCardTitle,
  CardDescription as KiwimuCardDescription,
}
