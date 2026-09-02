import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Botão base do design system.
 * - Alvos de toque com no mínimo 40px de altura (44px no tamanho `lg`).
 * - Feedback tátil consistente: leve escala no `:active` em todas as variantes.
 * - Foco visível padronizado via `focus-visible` (acessibilidade por teclado).
 */
const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl",
    "text-sm font-display font-semibold tracking-tight",
    "ring-offset-background transition-[background-color,box-shadow,transform,color] duration-200 ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "active:scale-[0.98]",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm hover:bg-primary/92 hover:shadow-elevated",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-border bg-card text-foreground font-medium hover:border-primary/40 hover:bg-primary/5 hover:text-foreground",
        secondary:
          "bg-secondary text-secondary-foreground font-medium hover:bg-secondary/70",
        ghost:
          "font-medium text-muted-foreground hover:bg-secondary hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline font-medium",
        hero:
          "hero-gradient text-primary-foreground font-bold shadow-glow hover:shadow-glow-lg hover:brightness-[1.03]",
        accent:
          "bg-accent text-accent-foreground font-bold shadow-sm hover:bg-accent/90 hover:shadow-elevated",
        success:
          "bg-success text-success-foreground shadow-sm hover:bg-success/90",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3 text-xs",
        lg: "h-11 rounded-xl px-6 text-base tracking-normal sm:h-12 sm:px-8",
        xl: "h-13 rounded-2xl px-8 text-base tracking-normal sm:h-14 sm:px-10 sm:text-lg",
        icon: "h-10 w-10",
        "icon-sm": "h-9 w-9 rounded-lg",
      },
      /** Ocupa 100% da largura — útil em formulários mobile. */
      block: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, block, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, block, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
