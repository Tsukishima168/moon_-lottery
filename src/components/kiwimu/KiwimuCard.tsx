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
        "rounded-xl border-2 border-[#111111] shadow-[4px_4px_0px_#111111]",
        "transition-[box-shadow,transform] duration-300",
        "hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_#111111]",
        variant === "paper" ? "bg-[#F4F4F0]" : "bg-[#FFFDF7]",
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
