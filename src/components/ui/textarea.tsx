import * as React from "react"
import { cn } from "@/lib/utils"

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-")
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-[#171B19] mb-1.5">
            {label}
          </label>
        )}
        <textarea
          id={inputId}
          className={cn(
            "flex min-h-[80px] w-full rounded-lg border border-[#173D35]/20 bg-white px-3 py-2 text-sm text-[#171B19] placeholder:text-[#9c9c8f] transition-colors resize-none",
            "focus:outline-none focus:ring-2 focus:ring-[#173D35]/30 focus:border-[#173D35]",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-red-400",
            className
          )}
          ref={ref}
          {...props}
        />
        {hint && !error && <p className="mt-1 text-xs text-[#9c9c8f]">{hint}</p>}
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
    )
  }
)
Textarea.displayName = "Textarea"
export { Textarea }
