/**
 * KiwimuButton — 品牌按鈕積木
 * wrap shadcn Button + 月島品牌風格
 */
import * as React from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type KiwimuButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "accent" | "line" | "ghost"
  size?: "sm" | "md" | "lg"
  asChild?: boolean
}

function KiwimuButton({
  className,
  variant = "default",
  size = "md",
  asChild = false,
  ...props
}: KiwimuButtonProps) {
  const sizeClasses = {
    sm: "h-8 px-4 text-xs",
    md: "h-10 px-6 text-sm",
    lg: "h-12 px-8 text-base",
  }

  const variantClasses = {
    default: [
      "bg-white border-[1.5px] border-stone-200 text-stone-800",
      "shadow-sm hover:bg-stone-50 hover:shadow-md",
      "active:scale-[0.98] transition-all",
    ].join(" "),
    accent: [
      "bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0",
      "shadow-lg shadow-amber-400/30 hover:shadow-amber-400/50",
      "active:scale-[0.98] transition-all",
    ].join(" "),
    line: [
      "bg-[#06C755] hover:bg-[#05b34c] text-white border-0",
      "shadow-lg shadow-[#06C755]/30",
      "active:scale-[0.98] transition-all",
    ].join(" "),
    ghost: [
      "bg-stone-100 hover:bg-stone-200 text-stone-600 border-0",
      "transition-colors",
    ].join(" "),
  }

  return (
    <Button
      asChild={asChild}
      variant="outline"
      className={cn(
        "rounded-xl font-bold cursor-pointer select-none",
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      {...props}
    />
  )
}

export { KiwimuButton }
