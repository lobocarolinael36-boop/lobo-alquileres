import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina clases de Tailwind de forma segura, resolviendo conflictos.
 * Ejemplo: cn("px-4", condition && "px-8") → "px-8" si condition es true.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
