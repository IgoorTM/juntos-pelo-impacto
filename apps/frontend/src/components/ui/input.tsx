import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "@/lib/utils"

interface InputProps extends React.ComponentProps<"input"> {
  label?: string
  error?: string
}

function Input({ label, error, id, className, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={id}
          className="text-sm font-medium text-foreground"
        >
          {label}
        </label>
      )}
      <InputPrimitive
        id={id}
        data-slot="input"
        aria-invalid={error ? true : undefined}
        aria-describedby={error && id ? `${id}-error` : undefined}
        className={cn(
          "h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-3 py-1 text-sm transition-colors outline-none",
          "placeholder:text-muted-foreground",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
          "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
          "dark:bg-input/30",
          className
        )}
        {...props}
      />
      {error && (
        <p
          id={id ? `${id}-error` : undefined}
          className="text-xs text-destructive"
        >
          {error}
        </p>
      )}
    </div>
  )
}

export { Input }
