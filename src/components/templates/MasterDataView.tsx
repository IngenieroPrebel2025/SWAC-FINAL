"use client";

import { useMemo, useRef, useState } from "react";
import { CheckCircle2, Download, Edit3, FileUp, Package, Plus, Search, Upload, XCircle } from "lucide-react";
import { PageContainer } from "@/components/templates/PageContainer";
import { PageHeader } from "@/components/molecules/PageHeader";
import { EmptyState } from "@/components/molecules/EmptyState";
import { Surface } from "@/components/atoms/Surface";
import { Button } from "@/components/atoms/Button";
import { Badge } from "@/components/atoms/Badge";
import { Input } from "@/components/atoms/Input";
import { Select } from "@/components/atoms/Select";
import { Field } from "@/components/molecules/Field";
import { Modal } from "@/components/molecules/Modal";
import { useAuth } from "@/hooks/useAuth";
import { useGuardarMaterial, useMateriales, useTiposMaterial } from "@/hooks/useCatalogos";
import { toast } from "@/lib/toast";
import type { Material, TipoMaterial } from "@/types";

interface MaterialForm {
  sku: string;
  descripcion: string;
  tipoMaterialId: string;
  unidadMedida: Material["unidadMedida"];
  pesoPromedioKg: string;
  volumenM3: string;
  codRefSap: string;
  activo: boolean;
}

interface BulkMaterialRow extends MaterialForm {
  row: number;
  error?: string;
}

const CSV_HEADERS = "sku,descripcion,tipoMaterialId,unidadMedida,pesoPromedioKg,volumenM3,codRefSap,activo";

const splitCsvLine = (line: string) => {
  const values: string[] = [];
  let value = "";
  let quoted = false;
  for (const character of line) {
    if (character === '"') quoted = !quoted;
    else if ((character === "," || character === ";") && !quoted) {
      values.push(value.trim());
      value = "";
    } else value += character;
  }
  values.push(value.trim());
  return values;
};

const emptyForm = (tipoMaterialId = ""): MaterialForm => ({
  sku: "",
  descripcion: "",
  tipoMaterialId,
  unidadMedida: "ESTIBA",
  pesoPromedioKg: "",
  volumenM3: "",
  codRefSap: "",
  activo: true,
});

const formFromMaterial = (material: Material): MaterialForm => ({
  sku: material.sku,
  descripcion: material.descripcion,
  tipoMaterialId: material.tipoMaterialId,
  unidadMedida: material.unidadMedida,
  pesoPromedioKg: String(material.pesoPromedioKg),
  volumenM3: String(material.volumenM3),
  codRefSap: material.codRefSap ?? "",
  activo: material.activo,
});

export function MasterDataView() {
  const { isGlobalAdmin, isSiteAdmin } = useAuth();
  const { data: materiales = [], isLoading } = useMateriales();
  const { data: tipos = [] } = useTiposMaterial();
  const guardar = useGuardarMaterial();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [editor, setEditor] = useState<{ open: boolean; material: Material | null }>({ open: false, material: null });
  const [form, setForm] = useState<MaterialForm>(emptyForm(tipos[0]?.id));
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkRows, setBulkRows] = useState<BulkMaterialRow[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);

  const canManage = isGlobalAdmin || isSiteAdmin;
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return materiales.filter((material) => {
      const matchesSearch = !query || `${material.sku} ${material.descripcion} ${material.codRefSap ?? ""}`.toLowerCase().includes(query);
      const matchesStatus = status === "ALL" || (status === "ACTIVO" ? material.activo : !material.activo);
      return matchesSearch && matchesStatus;
    });
  }, [materiales, search, status]);

  const openEditor = (material: Material | null) => {
    setForm(material ? formFromMaterial(material) : emptyForm(tipos[0]?.id));
    setEditor({ open: true, material });
  };

  const save = () => {
    if (!form.sku.trim() || !form.descripcion.trim() || !form.tipoMaterialId || Number(form.pesoPromedioKg) <= 0 || Number(form.volumenM3) <= 0) {
      toast.error("Completa SKU, descripción, tipo, peso y volumen con valores válidos.");
      return;
    }
    guardar.mutate(
      {
        id: editor.material?.id,
        sku: form.sku.trim().toUpperCase(),
        descripcion: form.descripcion.trim(),
        tipoMaterialId: form.tipoMaterialId,
        unidadMedida: form.unidadMedida,
        pesoPromedioKg: Number(form.pesoPromedioKg),
        volumenM3: Number(form.volumenM3),
        codRefSap: form.codRefSap.trim() || undefined,
        activo: form.activo,
      },
      {
        onSuccess: () => {
          toast.success(`Material ${editor.material ? "actualizado" : "creado"} correctamente.`);
          setEditor({ open: false, material: null });
        },
        onError: (error) => toast.error(error instanceof Error ? error.message : "No se pudo guardar el material."),
      }
    );
  };

  const parseBulk = (content: string) => {
    const lines = content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const dataLines = lines[0]?.toLowerCase().startsWith("sku") ? lines.slice(1) : lines;
    const rows = dataLines.map((line, index): BulkMaterialRow => {
      const [sku = "", descripcion = "", tipoMaterialId = "", unidadMedida = "ESTIBA", pesoPromedioKg = "", volumenM3 = "", codRefSap = "", activo = "true"] = splitCsvLine(line);
      const tipo = tipos.find((item) => item.id === tipoMaterialId || item.codigo.toLowerCase() === tipoMaterialId.toLowerCase());
      const normalizedActivo = ["true", "1", "si", "sí", "activo", "habilitado"].includes(activo.toLowerCase());
      const row: BulkMaterialRow = {
        row: index + 1,
        sku: sku.toUpperCase(),
        descripcion,
        tipoMaterialId: tipo?.id ?? tipoMaterialId,
        unidadMedida: unidadMedida.toUpperCase() as Material["unidadMedida"],
        pesoPromedioKg,
        volumenM3,
        codRefSap,
        activo: normalizedActivo,
      };
      const validUnit = ["ESTIBA", "CAJA", "TONELADA", "UNIDAD"].includes(row.unidadMedida);
      if (!row.sku || !row.descripcion || !tipo || !validUnit || Number(row.pesoPromedioKg) <= 0 || Number(row.volumenM3) <= 0) {
        row.error = "SKU, descripción, tipo, unidad, peso y volumen son obligatorios y válidos.";
      }
      return row;
    });
    setBulkRows(rows);
  };

  const importBulk = async () => {
    const validRows = bulkRows.filter((row) => !row.error);
    if (!validRows.length || validRows.length !== bulkRows.length) {
      toast.error("Corrige las filas marcadas antes de importar.");
      return;
    }
    try {
      await Promise.all(validRows.map((row) => guardar.mutateAsync({
        sku: row.sku,
        descripcion: row.descripcion,
        tipoMaterialId: row.tipoMaterialId,
        unidadMedida: row.unidadMedida,
        pesoPromedioKg: Number(row.pesoPromedioKg),
        volumenM3: Number(row.volumenM3),
        codRefSap: row.codRefSap || undefined,
        activo: row.activo,
      })));
      toast.success(`${validRows.length} materiales ingresados correctamente.`);
      setBulkOpen(false);
      setBulkText("");
      setBulkRows([]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo completar el ingreso masivo.");
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([`${CSV_HEADERS}\nSKU-NUEVO-001,Descripción del material,${tipos[0]?.codigo ?? "SECOS-ABARROTES"},ESTIBA,850,1.2,SAP-00001,true\n`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "plantilla-materiales.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const tipoNombre = (tipoId: string) => tipos.find((tipo) => tipo.id === tipoId)?.nombre ?? "Sin tipo";
  const activos = materiales.filter((material) => material.activo).length;

  return (
    <PageContainer>
      <PageHeader
        title="Datos maestros"
        description="Administra los materiales habilitados para el ingreso y la programación de citas."
        actions={canManage ? <div className="flex flex-wrap gap-2"><Button variant="secondary" leftIcon={<Upload size={14} />} onClick={() => setBulkOpen(true)}>Ingreso masivo</Button><Button leftIcon={<Plus size={14} />} onClick={() => openEditor(null)}>Nuevo material</Button></div> : undefined}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Surface className="p-4"><p className="text-[12px]" style={{ color: "var(--list-text-sub)" }}>Materiales registrados</p><p className="mt-1 text-2xl font-semibold" style={{ color: "var(--sect-title)" }}>{materiales.length}</p></Surface>
        <Surface className="p-4"><p className="text-[12px]" style={{ color: "var(--list-text-sub)" }}>Habilitados para ingreso</p><p className="mt-1 text-2xl font-semibold" style={{ color: "var(--atom-green-500)" }}>{activos}</p></Surface>
        <Surface className="p-4"><p className="text-[12px]" style={{ color: "var(--list-text-sub)" }}>No habilitados</p><p className="mt-1 text-2xl font-semibold" style={{ color: "var(--atom-coral-500)" }}>{materiales.length - activos}</p></Surface>
      </div>

      <Surface className="mt-5 overflow-hidden">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center" style={{ borderColor: "var(--card-divider)" }}>
          <div className="relative min-w-0 flex-1"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--list-text-sub)" }} /><Input aria-label="Buscar materiales" className="pl-9" placeholder="Buscar por SKU, descripción o código SAP" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
          <Select aria-label="Filtrar materiales por estado" value={status} onChange={(event) => setStatus(event.target.value)} className="sm:w-44"><option value="ALL">Todos los estados</option><option value="ACTIVO">Habilitados</option><option value="INACTIVO">No habilitados</option></Select>
        </div>
        {isLoading ? <div className="p-8 text-center" style={{ color: "var(--list-text-sub)" }}>Cargando materiales...</div> : filtered.length === 0 ? <EmptyState title="No hay materiales" description="Ajusta los filtros o crea un nuevo material." /> : (
          <div className="overflow-x-auto"><table className="w-full text-left text-[12.5px]"><thead style={{ background: "var(--inset-bg)", color: "var(--list-text-sub)" }}><tr><th className="px-4 py-3 font-medium">Material</th><th className="px-4 py-3 font-medium">Tipo</th><th className="px-4 py-3 font-medium">Logística</th><th className="px-4 py-3 font-medium">Ingreso</th><th className="px-4 py-3 text-right font-medium">Acciones</th></tr></thead><tbody>{filtered.map((material) => <tr key={material.id} className="border-t" style={{ borderColor: "var(--card-divider)" }}><td className="px-4 py-3"><div className="font-semibold" style={{ color: "var(--list-text)", fontFamily: "var(--font-mono)" }}>{material.sku}</div><div style={{ color: "var(--list-text-sub)" }}>{material.descripcion}</div></td><td className="px-4 py-3"><div style={{ color: "var(--list-text)" }}>{tipoNombre(material.tipoMaterialId)}</div><div style={{ color: "var(--list-text-sub)" }}>{material.unidadMedida}</div></td><td className="px-4 py-3" style={{ color: "var(--list-text-sub)" }}>{material.pesoPromedioKg} kg · {material.volumenM3} m³</td><td className="px-4 py-3"><Badge tone={material.activo ? "green" : "coral"}>{material.activo ? "Habilitado" : "Bloqueado"}</Badge></td><td className="px-4 py-3 text-right">{canManage && <Button variant="secondary" size="sm" leftIcon={<Edit3 size={13} />} onClick={() => openEditor(material)}>Editar</Button>}</td></tr>)}</tbody></table></div>
        )}
      </Surface>

      <Modal open={editor.open} onClose={() => setEditor({ open: false, material: null })} title={editor.material ? "Editar material" : "Nuevo material"} description="Los materiales habilitados pueden seleccionarse en el agendamiento de citas." footer={<><Button variant="secondary" onClick={() => setEditor({ open: false, material: null })}>Cancelar</Button><Button onClick={save} loading={guardar.isPending}>Guardar material</Button></>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="SKU" htmlFor="master-sku" required><Input id="master-sku" value={form.sku} onChange={(event) => setForm({ ...form, sku: event.target.value })} /></Field>
          <Field label="Código SAP" htmlFor="master-sap"><Input id="master-sap" value={form.codRefSap} onChange={(event) => setForm({ ...form, codRefSap: event.target.value })} /></Field>
          <Field label="Descripción" htmlFor="master-description" required className="sm:col-span-2"><Input id="master-description" value={form.descripcion} onChange={(event) => setForm({ ...form, descripcion: event.target.value })} /></Field>
          <Field label="Tipo de material" htmlFor="master-type" required><Select id="master-type" value={form.tipoMaterialId} onChange={(event) => setForm({ ...form, tipoMaterialId: event.target.value })}>{tipos.map((tipo: TipoMaterial) => <option key={tipo.id} value={tipo.id}>{tipo.nombre}</option>)}</Select></Field>
          <Field label="Unidad de medida" htmlFor="master-unit" required><Select id="master-unit" value={form.unidadMedida} onChange={(event) => setForm({ ...form, unidadMedida: event.target.value as Material["unidadMedida"] })}><option value="ESTIBA">Estiba</option><option value="CAJA">Caja</option><option value="TONELADA">Tonelada</option><option value="UNIDAD">Unidad</option></Select></Field>
          <Field label="Peso promedio (kg)" htmlFor="master-weight" required><Input id="master-weight" type="number" min="0.1" step="0.1" value={form.pesoPromedioKg} onChange={(event) => setForm({ ...form, pesoPromedioKg: event.target.value })} /></Field>
          <Field label="Volumen (m³)" htmlFor="master-volume" required><Input id="master-volume" type="number" min="0.01" step="0.01" value={form.volumenM3} onChange={(event) => setForm({ ...form, volumenM3: event.target.value })} /></Field>
          <label className="flex items-center gap-2 text-[13px] sm:col-span-2" style={{ color: "var(--list-text)" }}><input type="checkbox" checked={form.activo} onChange={(event) => setForm({ ...form, activo: event.target.checked })} /> <span className="inline-flex items-center gap-1">{form.activo ? <CheckCircle2 size={14} /> : <XCircle size={14} />} Habilitado para ingreso y agendamiento</span></label>
        </div>
      </Modal>

      <Modal open={bulkOpen} onClose={() => setBulkOpen(false)} size="xl" title="Ingreso masivo de materiales" description="Carga un CSV con los materiales que deseas registrar." footer={<><Button variant="secondary" onClick={() => setBulkOpen(false)}>Cancelar</Button><Button onClick={importBulk} loading={guardar.isPending} disabled={!bulkRows.length || bulkRows.some((row) => row.error)}>Importar materiales</Button></>}>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" leftIcon={<Download size={13} />} onClick={downloadTemplate}>Descargar plantilla</Button>
            <Button variant="secondary" size="sm" leftIcon={<FileUp size={13} />} onClick={() => fileInput.current?.click()}>Seleccionar CSV</Button>
            <input ref={fileInput} type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { const content = String(reader.result ?? ""); setBulkText(content); parseBulk(content); }; reader.readAsText(file); }} />
          </div>
          <p className="text-[12px]" style={{ color: "var(--sect-sub)" }}>Columnas: <span style={{ fontFamily: "var(--font-mono)" }}>{CSV_HEADERS}</span>. Puedes usar el código o el código SAP del tipo de material.</p>
          <textarea value={bulkText} onChange={(event) => { setBulkText(event.target.value); parseBulk(event.target.value); }} rows={7} placeholder={`${CSV_HEADERS}\nSKU-001,Producto de prueba,SECOS-ABARROTES,ESTIBA,850,1.2,SAP-001,true`} className="w-full rounded-lg border p-3 text-[12px]" style={{ background: "var(--inset-bg)", borderColor: "var(--inset-border)", color: "var(--list-text)", fontFamily: "var(--font-mono)" }} />
          {bulkRows.length > 0 && <div className="overflow-x-auto rounded-lg border" style={{ borderColor: "var(--card-border)" }}><table className="w-full text-left text-[12px]"><thead style={{ background: "var(--inset-bg)" }}><tr><th className="px-3 py-2">Fila</th><th className="px-3 py-2">SKU</th><th className="px-3 py-2">Descripción</th><th className="px-3 py-2">Estado</th></tr></thead><tbody>{bulkRows.map((row) => <tr key={row.row} className="border-t" style={{ borderColor: "var(--card-divider)" }}><td className="px-3 py-2">{row.row}</td><td className="px-3 py-2" style={{ fontFamily: "var(--font-mono)" }}>{row.sku || "—"}</td><td className="px-3 py-2">{row.descripcion || "—"}</td><td className="px-3 py-2">{row.error ? <span style={{ color: "var(--atom-coral-500)" }}>{row.error}</span> : <Badge tone="green">Lista para importar</Badge>}</td></tr>)}</tbody></table></div>}
        </div>
      </Modal>
    </PageContainer>
  );
}
