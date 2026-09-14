import { ErrorScreen } from "@/components/atoms/ErrorScreen";

export default function NotFound() {
  return (
    <ErrorScreen
      code="404"
      title="Página no encontrada"
      subtitle="La ruta que buscas no existe o fue movida. Verifica la URL o regresa al inicio."
      fullPage
    />
  );
}
