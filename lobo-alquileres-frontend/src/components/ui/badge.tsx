import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default:     "border-transparent bg-primary text-primary-foreground",
        secondary:   "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline:     "text-foreground",
        // Estados de inmueble
        disponible:  "border-green-200   bg-green-50   text-green-800",
        alquilado:   "border-[#9DD5DB]  bg-[#EFF7F8]  text-[#1A4F59]",
        reservado:   "border-amber-200   bg-amber-50   text-amber-800",
        reparacion:  "border-orange-200  bg-orange-50  text-orange-800",
        inactivo:    "border-gray-200    bg-gray-100   text-gray-600",
        // Estados de cuota
        pagada:      "border-green-200   bg-green-50   text-green-800",
        vencida:     "border-red-200     bg-red-50     text-red-800",
        parcial:     "border-orange-200  bg-orange-50  text-orange-800",
        pendiente:   "border-yellow-200  bg-yellow-50  text-yellow-800",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
