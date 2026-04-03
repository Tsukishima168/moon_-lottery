/**
 * KiwimuDialog — 品牌 Modal 積木
 * wrap shadcn Dialog + 月島品牌風格（backdrop blur, 圓角, 動畫）
 *
 * 注意：此元件用來替換現有的手寫 framer-motion Modal 容器，
 * 但不強制使用。現有 Modal（EventModal / ResultModal）已用 framer-motion
 * 做了精緻的 spring 動畫，保留 framer-motion 動畫邏輯不變，
 * KiwimuDialog 主要用於未來新 Modal 的基底。
 */
import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

type KiwimuDialogContentProps = React.ComponentProps<typeof DialogContent> & {
  /** 頂部色條顏色（CSS class），例如 "bg-gradient-to-r from-amber-400 to-orange-400" */
  accentColor?: string
}

function KiwimuDialogContent({
  className,
  accentColor,
  children,
  ...props
}: KiwimuDialogContentProps) {
  return (
    <DialogContent
      className={cn(
        "rounded-2xl border-0 shadow-2xl bg-white/95 backdrop-blur-xl",
        "w-full max-w-[340px] p-0 overflow-hidden gap-0",
        className
      )}
      {...props}
    >
      {accentColor && (
        <div className={cn("w-full h-1.5 opacity-90", accentColor)} />
      )}
      {children}
    </DialogContent>
  )
}

export {
  Dialog as KiwimuDialog,
  DialogTrigger as KiwimuDialogTrigger,
  KiwimuDialogContent,
  DialogHeader as KiwimuDialogHeader,
  DialogFooter as KiwimuDialogFooter,
  DialogTitle as KiwimuDialogTitle,
  DialogDescription as KiwimuDialogDescription,
  DialogClose as KiwimuDialogClose,
}
