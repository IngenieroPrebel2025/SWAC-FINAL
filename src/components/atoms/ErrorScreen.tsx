"use client";

import Link from "next/link";
import { Home, RotateCcw } from "lucide-react";
import { Button } from "@/components/atoms/Button";

interface ErrorScreenProps {
  /** "404", "500", etc — rendered as a large decorative background number. */
  code?: string;
  title: string;
  subtitle: string;
  /** When provided, a "Reintentar" button is shown. */
  onReset?: () => void;
  /** Fill the entire viewport (for standalone pages without a sidebar). */
  fullPage?: boolean;
}

export function ErrorScreen({
  code,
  title,
  subtitle,
  onReset,
  fullPage = false,
}: ErrorScreenProps) {
  return (
    <div
      style={{
        ...(fullPage
          ? { position: "fixed", inset: 0, background: "var(--page-bg)" }
          : { flex: 1, minHeight: "60vh" }),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
      }}
    >
      {/* Ambient gradient (only useful on full-page variant) */}
      {fullPage && (
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "var(--page-gradient)",
            pointerEvents: "none",
          }}
        />
      )}

      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 24,
          textAlign: "center",
          maxWidth: 420,
          animation: "error-rise 0.45s ease both",
        }}
      >
        {/* Decorative background code */}
        {code && (
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              top: -56,
              left: "50%",
              transform: "translateX(-50%)",
              fontSize: 120,
              fontWeight: 800,
              letterSpacing: -6,
              lineHeight: 1,
              color: "var(--atom-navy-700)",
              opacity: 0.06,
              userSelect: "none",
              whiteSpace: "nowrap",
              pointerEvents: "none",
            }}
          >
            {code}
          </span>
        )}

        {/* Brand icon mark */}
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: "linear-gradient(135deg, #143259 0%, #6595BF 100%)",
            boxShadow: "0 8px 24px rgba(20,50,89,0.22)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 1.5,
                  background:
                    i === 3 ? "rgba(255,255,255,0.38)" : "rgba(255,255,255,0.85)",
                }}
              />
            ))}
          </div>
        </div>

        {/* Text */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <h1
            style={{
              margin: 0,
              fontSize: 19,
              fontWeight: 600,
              color: "var(--sect-title)",
              lineHeight: 1.3,
            }}
          >
            {title}
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: 13.5,
              color: "var(--sect-sub)",
              lineHeight: 1.55,
            }}
          >
            {subtitle}
          </p>
        </div>

        {/* Divider */}
        <div
          style={{
            width: 40,
            height: 1,
            background: "var(--kpi-divider)",
            borderRadius: 1,
          }}
        />

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
          {onReset && (
            <Button variant="secondary" onClick={onReset} leftIcon={<RotateCcw size={13} />}>
              Reintentar
            </Button>
          )}
          <Link href="/inicio">
            <Button leftIcon={<Home size={13} />}>Ir a inicio</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
