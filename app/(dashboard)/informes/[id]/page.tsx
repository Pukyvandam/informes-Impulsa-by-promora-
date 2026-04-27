import { notFound } from "next/navigation";
import Link from "next/link";
import { Download, ChevronLeft, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createServiceClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import type { Informe, ImpulsadoCache, EstadoInforme } from "@/lib/supabase/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function fetchInforme(id: string): Promise<{ informe: Informe; impulsado: ImpulsadoCache | null } | null> {
  try {
    const supabase = createServiceClient();
    const { data: informe } = await supabase
      .from("informes")
      .select("*")
      .eq("id", id)
      .single();

    if (!informe) return null;

    const { data: impulsado } = await supabase
      .from("impulsados_cache")
      .select("*")
      .eq("id", informe.impulsado_id)
      .single();

    return { informe, impulsado: impulsado ?? null };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const data = await fetchInforme(id);
  if (!data) return { title: "Informe · Impulsa" };
  const { informe, impulsado } = data;
  const name = impulsado?.nombre_completo ?? "Impulsado";
  return { title: `Informe ${formatMes(informe.mes)} – ${name} · Impulsa` };
}

function informeStatusVariant(estado: EstadoInforme) {
  if (estado === "completado") return "done"    as const;
  if (estado === "generando")  return "pending" as const;
  if (estado === "error")      return "blocked" as const;
  return "default" as const;
}

function formatMes(mes: string): string {
  try {
    const d = new Date(mes + "-01");
    return d.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
  } catch {
    return mes;
  }
}

function renderJsonSection(key: string, value: unknown): React.ReactNode {
  if (value === null || value === undefined) return null;

  if (typeof value === "string") {
    return (
      <p className="text-sm leading-relaxed" style={{ color: "#8993b8" }}>
        {value}
      </p>
    );
  }

  if (Array.isArray(value)) {
    return (
      <ul className="space-y-1.5 list-none">
        {value.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "#8993b8" }}>
            <span style={{ color: "#73ACCA", flexShrink: 0 }}>·</span>
            <span>{typeof item === "object" ? JSON.stringify(item) : String(item)}</span>
          </li>
        ))}
      </ul>
    );
  }

  if (typeof value === "object") {
    return (
      <div className="space-y-4">
        {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
          <div key={k}>
            <h4
              className="text-sm font-semibold mb-1 capitalize"
              style={{ color: "#e8ecf5" }}
            >
              {k.replace(/_/g, " ")}
            </h4>
            {renderJsonSection(k, v)}
          </div>
        ))}
      </div>
    );
  }

  return (
    <p className="text-sm" style={{ color: "#8993b8" }}>
      {String(value)}
    </p>
  );
}

const SECTION_ORDER = ["portada", "resumen_ejecutivo", "secciones"];
const SECTION_LABELS: Record<string, string> = {
  portada:           "Portada",
  resumen_ejecutivo: "Resumen ejecutivo",
  secciones:         "Secciones",
};

export default async function InformeDetailPage({ params }: PageProps) {
  const { id } = await params;
  const data = await fetchInforme(id);

  if (!data) notFound();

  const { informe, impulsado } = data;
  const contenido = informe.contenido_json ?? {};

  // Gather section keys in preferred order then remaining
  const knownKeys = SECTION_ORDER.filter((k) => k in contenido);
  const otherKeys = Object.keys(contenido).filter((k) => !SECTION_ORDER.includes(k));
  const allKeys   = [...knownKeys, ...otherKeys];

  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto">
      {/* Back */}
      <Button asChild variant="ghost" size="sm">
        <Link href="/informes">
          <ChevronLeft size={14} />
          Todos los informes
        </Link>
      </Button>

      {/* Hero */}
      <div
        className="rounded-2xl p-6"
        style={{ background: "#111736", border: "1px solid rgba(59,81,157,0.35)" }}
      >
        <div className="flex items-start gap-4 flex-wrap">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(11,88,168,0.2)", border: "1px solid rgba(11,88,168,0.3)" }}
          >
            <FileText size={20} style={{ color: "#73ACCA" }} />
          </div>

          <div className="flex-1 min-w-0">
            <h1
              className="text-2xl font-semibold"
              style={{ fontFamily: "Fraunces, serif", color: "#e8ecf5" }}
            >
              Informe {formatMes(informe.mes)}
            </h1>
            {impulsado && (
              <p className="mt-0.5 text-sm" style={{ color: "#8993b8" }}>
                {impulsado.nombre_completo}
                {impulsado.provincia ? ` · ${impulsado.provincia}` : ""}
              </p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Badge variant={informeStatusVariant(informe.estado)}>
                {informe.estado}
              </Badge>
              <span className="text-xs" style={{ color: "#8993b8" }}>
                Generado {formatDate(informe.created_at)}
              </span>
            </div>
          </div>

          {/* Download */}
          {informe.pdf_url && (
            <Button asChild variant="default" size="sm">
              <a href={informe.pdf_url} target="_blank" rel="noopener noreferrer" download>
                <Download size={13} />
                Descargar PDF
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      {allKeys.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-sm" style={{ color: "#8993b8" }}>
              {informe.estado === "generando"
                ? "El informe se está generando, vuelve en unos momentos."
                : "No hay contenido disponible para este informe."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {allKeys.map((key) => (
            <Card key={key}>
              <CardHeader>
                <CardTitle className="capitalize">
                  {SECTION_LABELS[key] ?? key.replace(/_/g, " ")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 pt-3">
                {renderJsonSection(key, contenido[key])}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
