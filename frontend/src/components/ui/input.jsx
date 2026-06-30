import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({
  className,
  type,
  ...props
}) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-full border border-input bg-white dark:bg-[#1c1b19] px-4 py-1 text-sm text-[#202020] dark:text-[#edeae4] transition-colors outline-none placeholder:text-[#8d8d8d] dark:placeholder:text-[#8a8680] focus-visible:border-[#ea2804] focus-visible:ring-3 focus-visible:ring-[#ea2804]/20 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
        className
      )}
      {...props} />
  );
}

export { Input }
