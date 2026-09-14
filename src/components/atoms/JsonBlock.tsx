"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

interface JsonBlockProps {
  data: unknown;
  title?: string;
  maxHeight?: number;
  className?: string;
}

/** Bloque de código para payloads JSON, tokens y trazas (con copiar). */
export function JsonBlock({ data, title = "JSON", maxHeight = 320, className }: JsonBlockProps) {
  const [copied, setCopied] = React.useState(false);
  const text = typeof data === "string" ? data : JSON.stringify(data, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard not available */
    }
  };

  return (
    <div
      className={cn("overflow-hidden rounded-lg border", className)}
      style={{ background: "var(--code-bg)", borderColor: "var(--code-border)" }}
    >
      <div
        className="flex items-center justify-between gap-2 border-b px-3 py-2"
        style={{ borderColor: "var(--code-border)" }}
      >
        <span className="flex min-w-0 items-center gap-1.5 truncate text-[11px] font-medium" style={{ color: "var(--code-muted)" }}>
          <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--atom-green-500)" }} />
          {title}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex shrink-0 items-center gap-1 rounded px-2 py-0.5 text-[11px] transition-opacity hover:opacity-80"
          style={{ color: "var(--code-accent)", background: "rgba(255,255,255,0.06)" }}
        >
          {copied ? <Check size={11} /> : <Copy size={11} />}
          {copied ? "Copiado" : "Copiar"}
        </button>
      </div>
      <pre
        className="scrollbar-thin m-0 overflow-auto whitespace-pre-wrap break-words p-3 text-[11.5px] leading-relaxed"
        style={{ maxHeight, color: "var(--code-text)", fontFamily: "var(--font-mono)" }}
      >
        {text}
      </pre>
    </div>
  );
}
