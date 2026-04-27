import type { KcdMensual } from "@/lib/supabase/types";

interface KCDTableProps {
  current:  KcdMensual | null;
  previous: KcdMensual | null;
}

const METRICS: { key: keyof KcdMensual; label: string }[] = [
  { key: "leads_trabajados",          label: "Leads trabajados"          },
  { key: "visitas_cliente",           label: "Visitas a cliente"         },
  { key: "propuestas_presentadas",    label: "Propuestas presentadas"    },
  { key: "operaciones_cerradas",      label: "Operaciones cerradas"      },
  { key: "formaciones_completadas",   label: "Formaciones completadas"   },
];

function Arrow({ cur, prev }: { cur: number; prev: number }) {
  if (cur > prev) return <span style={{ color: "#6cb67a" }}>▲</span>;
  if (cur < prev) return <span style={{ color: "#d67575" }}>▼</span>;
  return <span style={{ color: "#8993b8" }}>—</span>;
}

function formatMes(mes: string): string {
  try {
    const d = new Date(mes + "-01");
    return d.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
  } catch {
    return mes;
  }
}

export function KCDTable({ current, previous }: KCDTableProps) {
  if (!current && !previous) {
    return (
      <p className="text-sm" style={{ color: "#8993b8" }}>
        Sin métricas KCD registradas.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid rgba(59,81,157,0.3)" }}>
            <th
              className="text-left py-3 pr-4 font-medium text-xs uppercase tracking-wide"
              style={{ color: "#8993b8" }}
            >
              Métrica
            </th>
            {previous && (
              <th
                className="text-right py-3 px-4 font-medium text-xs uppercase tracking-wide"
                style={{ color: "#8993b8" }}
              >
                {formatMes(previous.mes)}
              </th>
            )}
            {current && (
              <th
                className="text-right py-3 px-4 font-medium text-xs uppercase tracking-wide"
                style={{ color: "#e8ecf5" }}
              >
                {formatMes(current.mes)}
              </th>
            )}
            {current && previous && (
              <th
                className="text-right py-3 pl-4 font-medium text-xs uppercase tracking-wide"
                style={{ color: "#8993b8" }}
              >
                Cambio
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {METRICS.map(({ key, label }) => {
            const cur  = current  ? (current[key]  as number) : null;
            const prev = previous ? (previous[key] as number) : null;

            return (
              <tr
                key={key}
                style={{ borderBottom: "1px solid rgba(59,81,157,0.15)" }}
              >
                <td
                  className="py-3 pr-4"
                  style={{ color: "#8993b8" }}
                >
                  {label}
                </td>
                {previous && (
                  <td className="text-right py-3 px-4" style={{ color: "#8993b8" }}>
                    {prev ?? "—"}
                  </td>
                )}
                {current && (
                  <td
                    className="text-right py-3 px-4 font-semibold"
                    style={{ color: "#e8ecf5" }}
                  >
                    {cur ?? "—"}
                  </td>
                )}
                {current && previous && cur !== null && prev !== null && (
                  <td className="text-right py-3 pl-4">
                    <Arrow cur={cur} prev={prev} />
                    <span className="ml-1 text-xs" style={{ color: "#8993b8" }}>
                      {Math.abs(cur - prev)}
                    </span>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
