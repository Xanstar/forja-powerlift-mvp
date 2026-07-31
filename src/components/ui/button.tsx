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
          "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-150 disabled:opacity-40 disabled:pointer-events-none",
          variant === "primary" &&
            "bg-accent text-white hover:bg-accent-hover",
          variant === "secondary" &&
            "bg-surface text-chalk border border-border-strong hover:bg-surface-hover",
          variant === "ghost" &&
            "text-chalk-muted hover:text-chalk hover:bg-surface",
          variant === "danger" &&
            "bg-transparent text-accent border border-accent/40 hover:bg-accent/10",
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
