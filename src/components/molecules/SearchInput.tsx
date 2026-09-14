import * as React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/atoms/Input";
import { cn } from "@/lib/utils";

type SearchInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  containerClassName?: string;
};

/** Input de búsqueda con icono (patrón de filtros de listados). */
export function SearchInput({ className, containerClassName, ...props }: SearchInputProps) {
  return (
    <div className={cn("relative flex flex-1 items-center", containerClassName)}>
      <Search
        size={13}
        strokeWidth={2}
        aria-hidden="true"
        className="pointer-events-none absolute left-2.5"
        style={{ color: "var(--ctrl-text)" }}
      />
      <Input type="search" className={cn("h-9 pl-8 text-[12.5px]", className)} {...props} />
    </div>
  );
}
