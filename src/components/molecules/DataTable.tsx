"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  /** Cell renderer. */
  render: (row: T) => React.ReactNode;
  /** Optional fixed/relative width for the column. */
  width?: string;
  /** Hide below the lg breakpoint (responsive). */
  hideOnMobile?: boolean;
  align?: "left" | "right" | "center";
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  onRowClick?: (row: T) => void;
  caption?: string;
  emptyState?: React.ReactNode;
  /** Highlights rows (e.g. current session user). */
  isRowHighlighted?: (row: T) => boolean;
  /** "comfortable" enlarges rows for touch / tablet use. */
  density?: "compact" | "comfortable";
}

/**
 * Generic, accessible, responsive table.
 * On mobile, columns flagged `hideOnMobile` are dropped; the rest scroll horizontally if needed.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  caption,
  emptyState,
  isRowHighlighted,
  density = "compact",
}: DataTableProps<T>) {
  if (rows.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  const comfortable = density === "comfortable";

  return (
    <div
      className="overflow-hidden rounded-xl border"
      style={{
        background: "var(--list-bg)",
        borderColor: "var(--list-border)",
        backdropFilter: "var(--card-blur)",
        WebkitBackdropFilter: "var(--card-blur)",
      }}
    >
      <div className="scrollbar-thin overflow-x-auto">
        <table className="w-full border-collapse text-left">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            <tr style={{ background: "var(--list-header-bg)" }}>
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={cn(
                    "whitespace-nowrap px-5 py-2.5 text-[10.5px] font-semibold uppercase tracking-[0.07em]",
                    col.hideOnMobile && "hidden lg:table-cell",
                    col.align === "right" && "text-right",
                    col.align === "center" && "text-center"
                  )}
                  style={{
                    color: "var(--list-header-text)",
                    width: col.width,
                    borderBottom: "1px solid var(--list-row-divider)",
                  }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const baseBg = isRowHighlighted?.(row) ? "var(--chip-bg-active)" : "transparent";
              return (
                <tr
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn("transition-colors", onRowClick && "cursor-pointer")}
                  style={{ borderBottom: "1px solid var(--list-row-divider)", background: baseBg }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--list-row-hover)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = baseBg)}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        "px-5 align-middle",
                        comfortable ? "py-4 text-[14px]" : "py-3 text-[12.5px]",
                        col.hideOnMobile && "hidden lg:table-cell",
                        col.align === "right" && "text-right",
                        col.align === "center" && "text-center"
                      )}
                      style={{ color: "var(--list-text)" }}
                    >
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
