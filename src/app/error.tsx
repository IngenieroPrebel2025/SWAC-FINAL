"use client";

import { ErrorScreen } from "@/components/atoms/ErrorScreen";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ reset }: ErrorProps) {
  return (
    <ErrorScreen
      code="500"
      title="Algo salió mal"
      subtitle="Ocurrió un error inesperado. Puedes intentarlo de nuevo o regresar al inicio."
      onReset={reset}
      fullPage
    />
  );
}
