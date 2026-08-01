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
        "w-full border border-border-strong bg-surface px-3.5 py-2.5 text-sm text-chalk placeholder:text-chalk-faint outline-none transition-colors focus:border-steel focus:ring-1 focus:ring-steel",
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
        "mb-1.5 block text-sm font-semibold text-chalk",
        className
      )}
      {...props}
    />
  );
}
