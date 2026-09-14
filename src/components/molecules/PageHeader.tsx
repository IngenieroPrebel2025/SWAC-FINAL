import * as React from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

/** Standard page title block: heading + description + optional actions. */
export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1
          className="text-[20px] font-semibold"
          style={{ color: "var(--sect-title)", letterSpacing: "-0.025em" }}
        >
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-[13px]" style={{ color: "var(--sect-sub)" }}>
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
