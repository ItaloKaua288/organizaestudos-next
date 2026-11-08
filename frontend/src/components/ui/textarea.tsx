import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-20 w-full min-w-0 resize-y rounded-xl border border-input bg-foreground/4 px-3 py-2 text-base shadow-[inset_0_1px_0_var(--glass-edge)] backdrop-blur-sm transition-[background-color,border-color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:bg-foreground/6 focus-visible:ring-3 focus-visible:ring-ring/35 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
