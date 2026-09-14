import { BrandBar } from "@/components/atoms/BrandBar";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="no-print"
      style={{
        background: "var(--ft-bg)",
        backdropFilter: "var(--ft-blur)",
        WebkitBackdropFilter: "var(--ft-blur)",
        borderTop: "1px solid var(--ft-border)",
        marginTop: "auto",
        flexShrink: 0,
      }}
    >
      <div
        className="px-4 sm:px-9"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: 14,
          paddingBottom: 14,
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <span style={{ fontSize: 11, color: "var(--ft-text)" }}>
          SWAC v1.0.0 — Sistema Web de Asignación de Citas y Muelles
        </span>
        <span
          style={{
            fontSize: 11,
            color: "var(--ft-text)",
            fontFamily: "'DM Mono', monospace",
            letterSpacing: "0.02em",
          }}
        >
          © {year} Todos los derechos reservados. PREBEL S.A.S. BIC
        </span>
      </div>
      <BrandBar />
    </footer>
  );
}
