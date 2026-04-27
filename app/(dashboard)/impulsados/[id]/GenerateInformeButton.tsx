"use client";
import { useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  impulsadoId: string;
}

export function GenerateInformeButton({ impulsadoId }: Props) {
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/informes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ impulsado_id: impulsadoId }),
      });
      if (!res.ok) throw new Error("Error al generar");
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <span className="text-sm px-3 py-2 rounded-lg" style={{ color: "#6cb67a", background: "rgba(108,182,122,0.1)", border: "1px solid rgba(108,182,122,0.3)" }}>
        Informe enviado a procesar
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="default" size="sm" onClick={handleClick} disabled={loading}>
        {loading ? <Loader2 size={13} className="animate-spin" /> : <FileText size={13} />}
        Generar informe
      </Button>
      {error && <span className="text-xs" style={{ color: "#d67575" }}>{error}</span>}
    </div>
  );
}
