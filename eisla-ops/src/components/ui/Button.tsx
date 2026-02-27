import { type ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md";
}

const VARIANTS = {
  primary: "bg-copper text-white hover:bg-copper/90",
  secondary: "bg-light text-teal hover:bg-light/80 border border-teal/20",
  danger: "bg-red-600 text-white hover:bg-red-700",
  ghost: "text-teal hover:bg-light",
};

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const sizeClass = size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm";

  return (
    <button
      className={`inline-flex items-center justify-center rounded-md font-medium transition-colors disabled:opacity-50 ${VARIANTS[variant]} ${sizeClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
