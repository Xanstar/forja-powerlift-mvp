import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex min-h-11 items-center justify-center gap-2 border font-semibold transition-[background-color,border-color,color] duration-150 disabled:pointer-events-none disabled:opacity-40",
          variant === "primary" &&
            "border-accent bg-accent text-white hover:border-accent-hover hover:bg-accent-hover",
          variant === "secondary" &&
            "border-border-strong bg-surface text-chalk hover:border-chalk hover:bg-surface-hover",
          variant === "ghost" &&
            "border-transparent text-chalk-muted hover:border-border hover:bg-surface hover:text-chalk",
          variant === "danger" &&
            "border-accent/60 bg-transparent text-accent-ink hover:bg-accent hover:text-white",
          size === "sm" && "px-3 py-1.5 text-sm",
          size === "md" && "px-4 py-2.5 text-sm",
          size === "lg" && "px-6 py-3.5 text-base",
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
