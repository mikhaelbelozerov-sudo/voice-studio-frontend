import { ButtonHTMLAttributes, forwardRef } from "react";
import { twMerge } from "tailwind-merge";
import { clsx } from "clsx";

type Variant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400",
  secondary: "bg-slate-200 text-slate-900 hover:bg-slate-300 disabled:bg-slate-200",
  ghost: "bg-transparent text-slate-800 hover:bg-slate-200 disabled:text-slate-400"
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", loading = false, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      className={twMerge(
        clsx(
          "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition-colors",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed",
          variantClasses[variant]
        ),
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {children}
    </button>
  )
);

Button.displayName = "Button";
