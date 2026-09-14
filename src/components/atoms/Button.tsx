import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Spinner } from "./Spinner";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 rounded-[7px] font-semibold",
    "transition-all duration-150 cursor-pointer select-none",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--atom-blue-500)] focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
  ],
  {
    variants: {
      variant: {
        primary: [
          "bg-[var(--atom-navy-700)] text-white border-none",
          "hover:bg-[var(--atom-navy-600)]",
          "shadow-[0_1px_8px_rgba(20,50,89,0.22)]",
        ],
        secondary: [
          "bg-transparent text-[var(--ctrl-text)]",
          "border border-[var(--ctrl-border)]",
          "hover:bg-[var(--ctrl-bg-active)] hover:text-[var(--ctrl-text-active)]",
        ],
        ghost: [
          "bg-transparent border-transparent text-[var(--ctrl-text)]",
          "hover:bg-[var(--sb-item-bg-hover)]",
        ],
        danger: [
          "bg-[var(--atom-coral-500)] text-white border-none",
          "hover:opacity-90",
        ],
        nav: [
          "bg-[rgba(101,149,191,0.11)] text-[var(--atom-blue-300)]",
          "border border-[rgba(101,149,191,0.32)]",
          "hover:bg-[rgba(101,149,191,0.22)] hover:border-[rgba(101,149,191,0.55)]",
        ],
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-9 px-4 text-sm",
        lg: "h-10 px-5 text-sm",
        icon: "h-8 w-8 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      leftIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <Spinner size={14} />
        ) : (
          leftIcon && <span className="flex shrink-0">{leftIcon}</span>
        )}
        {children}
      </Comp>
    );
  }
);
Button.displayName = "Button";
