import * as React from "react";
import { cn } from "@/lib/utils";

/** Consistent page max-width + responsive gutters for every route. */
export function PageContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full flex-1",
        "px-4 py-6 sm:px-6 sm:py-8 lg:px-9",
        className
      )}
      style={{ maxWidth: 1320 }}
    >
      {children}
    </div>
  );
}
