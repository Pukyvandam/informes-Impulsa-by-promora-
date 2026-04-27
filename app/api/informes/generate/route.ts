import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { generateMonthlyReport } from "@/lib/reports/generate";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const { impulsado_id, mes } = await req.json() as { impulsado_id: string; mes?: string };
  if (!impulsado_id) return NextResponse.json({ error: "impulsado_id required" }, { status: 400 });

  const mesDate = mes ? new Date(mes) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const supabase = createServiceClient();

  // Create informe record in "generando" state
  const { data: informe, error: createErr } = await supabase
    .from("informes")
    .upsert({
      impulsado_id,
      mes: mesDate.toISOString().slice(0, 10),
      estado: "generando",
      generado_por: "claude-sonnet-4-5",
    }, { onConflict: "impulsado_id,mes" })
    .select("id")
    .single();

  if (createErr || !informe) {
    return NextResponse.json({ error: createErr?.message }, { status: 500 });
  }

  try {
    const reportData = await generateMonthlyReport(impulsado_id, mesDate);

    await supabase.from("informes").update({
      contenido_json: reportData as unknown as Record<string, unknown>,
      estado: "completado",
      updated_at: new Date().toISOString(),
    }).eq("id", informe.id);

    return NextResponse.json({ ok: true, informe_id: informe.id, data: reportData });
  } catch (err) {
    await supabase.from("informes").update({ estado: "error" }).eq("id", informe.id);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
