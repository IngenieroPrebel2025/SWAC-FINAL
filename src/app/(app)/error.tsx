"use client";

import { ErrorScreen } from "@/components/atoms/ErrorScreen";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AppError({ reset }: ErrorProps) {
  return (
    <ErrorScreen
      title="Algo salió mal"
      subtitle="Ocurrió un error en esta página. Puedes intentarlo de nuevo o regresar al inicio."
      onReset={reset}
    />
  );
}
