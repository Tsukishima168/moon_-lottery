/**
 * KiwimuToast — 品牌 Toast 積木
 * re-export Sonner Toaster + toast()，統一月島風格
 */
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"

function KiwimuToaster() {
  return (
    <Toaster
      position="bottom-center"
      offset={24}
      toastOptions={{
        className:
          "bg-[#1F2F1F] text-[#F5F0E8] rounded-xl border border-[#D7C678] px-5 py-3 text-sm font-medium",
      }}
    />
  )
}

export { KiwimuToaster, toast as kiwimuToast }
