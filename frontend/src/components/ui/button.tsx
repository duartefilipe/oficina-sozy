import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 rounded border border-transparent text-sm font-medium transition-colors focus-visible:outline focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-blue-600 text-white hover:bg-blue-700",
        secondary: "bg-slate-600 text-white hover:bg-slate-700",
        outline: "border-slate-300 bg-white text-slate-800 hover:bg-slate-50",
        warning: "bg-amber-600 text-white hover:bg-amber-700",
        danger: "bg-red-600 text-white hover:bg-red-700",
        success: "bg-emerald-700 text-white hover:bg-emerald-800",
        dark: "bg-slate-900 text-white hover:bg-slate-800"
      },
      size: {
        sm: "h-8 min-w-[2rem] px-2.5 text-xs",
        md: "h-9 min-w-[2.25rem] px-3.5",
        lg: "h-10 min-w-[2.5rem] px-4"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "md"
    }
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = "button", ...props }, ref) => {
    return <button ref={ref} type={type} className={cn(buttonVariants({ variant, size, className }))} {...props} />;
  }
);
Button.displayName = "Button";

export { buttonVariants };
