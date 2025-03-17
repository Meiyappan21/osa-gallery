import * as React from "react";
import { Slot } from "@radix-ui/react-slot"; // Import Radix Slot
import { cn } from "../../lib/utils";

// Define the button variants
const buttonVariants = {
  default: "bg-black text-white hover:bg-gray-800",
  destructive: "bg-red-600 text-white hover:bg-red-700",
  outline: "border-2 border-black text-black hover:bg-gray-100",
  ghost: "bg-transparent text-black hover:bg-gray-200", // Added the "ghost" variant
};

// Define button sizes
const buttonSizes = {
  sm: "text-xs px-2 py-1",
  md: "text-sm px-4 py-2",
  lg: "text-lg px-6 py-3",
};

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean; // Add asChild prop
  variant?: keyof typeof buttonVariants; // Add variant prop
  size?: keyof typeof buttonSizes; // Add size prop
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, asChild, variant = "default", size = "md", ...props }, ref) => {
    const Comp = asChild ? Slot : "button"; // Use Slot if asChild is true
    return (
      <Comp
        className={cn(
          "rounded-lg", // Base styles
          buttonVariants[variant], // Apply styles based on variant
          buttonSizes[size], // Apply styles based on size
          className // Allow additional custom classes
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
