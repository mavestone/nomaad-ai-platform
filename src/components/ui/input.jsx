import * as React from "react";
import { cn } from "../../lib/utils";

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-9 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white shadow-sm transition-colors placeholder:text-white/40 focus-visible:border-[#ccfd01] focus-visible:outline-none focus:ring-1 focus:ring-[#ccfd01] disabled:cursor-not-allowed disabled:opacity-50",
        type === "search" &&
          "[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none [&::-webkit-search-results-button]:appearance-none [&::-webkit-search-results-decoration]:appearance-none",
        type === "file" &&
          "p-0 pr-3 italic text-white/40 file:me-3 file:h-full file:border-0 file:border-r file:border-solid file:border-white/10 file:bg-transparent file:px-3 file:text-sm file:font-medium file:not-italic file:text-white",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
