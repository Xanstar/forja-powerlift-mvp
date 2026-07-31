import { cn } from "@/lib/utils";
import { InputHTMLAttributes, LabelHTMLAttributes, forwardRef } from "react";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-chalk placeholder:text-chalk-faint outline-none transition-colors focus:border-accent",
        className
      )}
      {...props}
    />
  );
});
Input.displayName = "Input";

export function Label({
  className,
  ...props
}: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "mb-1.5 block text-xs font-medium uppercase tracking-wide text-chalk-muted",
        className
      )}
      {...props}
    />
  );
}
