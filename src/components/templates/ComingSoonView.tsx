import { Construction } from "lucide-react";
import { PageHeader } from "@/components/molecules/PageHeader";

interface ComingSoonViewProps {
  title: string;
  description?: string;
}

export function ComingSoonView({ title, description }: ComingSoonViewProps) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <span
          className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{ background: "var(--chip-bg-active)", color: "var(--atom-blue-500)" }}
        >
          <Construction size={26} strokeWidth={1.6} />
        </span>
        <h2 className="text-[16px] font-semibold" style={{ color: "var(--sect-title)" }}>
          Próximamente
        </h2>
        <p className="mt-2 max-w-xs text-[13px] leading-relaxed" style={{ color: "var(--sect-sub)" }}>
          Este módulo está en desarrollo. Será habilitado en una próxima versión de la plataforma.
        </p>
      </div>
    </>
  );
}
