import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[96px] w-full rounded-xl border border-input bg-card px-3.5 py-3 text-base text-foreground shadow-sm",
        "transition-[border-color,box-shadow] duration-200 leading-relaxed",
        "placeholder:text-muted-foreground/70",
        "hover:border-border focus-visible:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15",
        "disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-muted",
        "aria-[invalid=true]:border-destructive aria-[invalid=true]:focus-visible:ring-destructive/20",
        "md:text-sm",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
