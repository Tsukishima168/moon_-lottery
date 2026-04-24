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
      "bg-[#FFFDF7] border-2 border-[#111111] text-[#111111]",
      "shadow-[3px_3px_0px_#111111] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#111111]",
      "active:scale-[0.98] transition-all",
    ].join(" "),
    accent: [
      "bg-[#D4FF00] text-[#111111] border-2 border-[#111111]",
      "shadow-[3px_3px_0px_#111111] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#111111]",
      "active:scale-[0.98] transition-all",
    ].join(" "),
    line: [
      "bg-[#06C755] hover:bg-[#05b34c] text-white border-0",
      "shadow-lg shadow-[#06C755]/30",
      "active:scale-[0.98] transition-all",
    ].join(" "),
    ghost: [
      "bg-[#E5E5E5] hover:bg-[#d8d8d2] text-[#111111] border-2 border-transparent",
      "transition-colors",
    ].join(" "),
  }

  return (
    <Button
      asChild={asChild}
      variant="outline"
      className={cn(
        "rounded-lg font-black cursor-pointer select-none tracking-wide",
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      {...props}
    />
  )
}

export { KiwimuButton }
