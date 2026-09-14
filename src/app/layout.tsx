import type { Metadata, Viewport } from "next";
import { Providers } from "@/providers/Providers";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: {
    default: "SWAC",
    template: "%s | SWAC",
  },
  description:
    "SWAC — Sistema Web de Asignación de Citas: agendamiento, portería, patio, muelles y analítica operativa. PREBEL S.A.S. BIC.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
