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
      offset={96}
      toastOptions={{
        className:
          "bg-[#111111] text-[#F4F4F0] rounded-lg shadow-[4px_4px_0px_#D4FF00] border border-[#D4FF00] px-5 py-3 text-sm font-bold",
      }}
    />
  )
}

export { KiwimuToaster, toast as kiwimuToast }
