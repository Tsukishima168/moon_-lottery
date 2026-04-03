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
          "bg-stone-900 text-stone-50 rounded-full shadow-lg border-0 px-6 py-3 text-sm font-medium",
      }}
    />
  )
}

export { KiwimuToaster, toast as kiwimuToast }
