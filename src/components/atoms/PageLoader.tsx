import React from "react";

const RING_BASE: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  borderRadius: "50%",
  border: "1.5px solid rgba(101,149,191,0.55)",
  animation: "pulse-ring 2.4s cubic-bezier(0.22,1,0.36,1) infinite",
};

export function PageLoader({ label = "Cargando sesión…" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--page-bg)",
      }}
    >
      {/* Ambient gradient */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          background: "var(--page-gradient)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 28,
        }}
      >
        {/* Pulsing rings + brand mark */}
        <div style={{ position: "relative", width: 60, height: 60 }}>
          <div style={{ ...RING_BASE, animationDelay: "0s" }} />
          <div style={{ ...RING_BASE, animationDelay: "0.8s" }} />
          <div style={{ ...RING_BASE, animationDelay: "1.6s" }} />

          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 15,
              background: "linear-gradient(135deg, #143259 0%, #6595BF 100%)",
              boxShadow: "0 8px 28px rgba(20,50,89,0.30), 0 2px 6px rgba(20,50,89,0.20)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{ width: 7, height: 7, borderRadius: 2, background: "rgba(255,255,255,0.88)" }}
                />
              ))}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            animation: "loader-rise 0.5s ease both 0.25s",
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--sect-sub)", letterSpacing: 0.1 }}>
            {label}
          </span>
          <span style={{ fontSize: 11.5, color: "var(--kpi-label)" }}>
            SWAC · Sistema Web de Asignación de Citas
          </span>
        </div>
      </div>
    </div>
  );
}
