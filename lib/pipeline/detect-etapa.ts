import { createServiceClient } from "@/lib/supabase/server";
import { ProgramaEtapa } from "@/lib/supabase/types";

const ETAPA_KEYWORDS: Record<string, string[]> = {
  MENTORIA_1: ["mentoría 1", "mentoria 1", "primera mentoría", "primera mentoria"],
  MENTORIA_2: ["mentoría 2", "mentoria 2", "segunda mentoría"],
  MENTORIA_3: ["mentoría 3", "mentoria 3", "tercera mentoría"],
  CC1: ["check control 1", "cc1", "check 1", "primer check"],
  CC2: ["check control 2", "cc2", "check 2"],
  CC3: ["check control 3", "cc3", "check 3"],
  CC4: ["check control final", "cc4", "check final"],
  HITO_0: ["onboarding", "contrato", "bienvenida", "inicio del programa"],
  SESION_1: ["sesión práctica 1", "sesion practica 1", "role play"],
  SESION_2: ["sesión práctica 2", "sesion practica 2"],
  SESION_3: ["sesión práctica 3", "sesion practica 3"],
  SESION_4: ["sesión práctica 4", "sesion practica 4"],
};

let _etapas: ProgramaEtapa[] | null = null;

async function getEtapas(): Promise<ProgramaEtapa[]> {
  if (_etapas) return _etapas;
  const supabase = createServiceClient();
  const { data } = await supabase.from("programa_etapas").select("*").order("orden");
  _etapas = (data as ProgramaEtapa[]) ?? [];
  return _etapas as ProgramaEtapa[];
}

export async function detectEtapa(titulo: string, fecha: string): Promise<string | null> {
  const etapas = await getEtapas();
  const titleLower = titulo.toLowerCase();

  for (const [codigo, keywords] of Object.entries(ETAPA_KEYWORDS)) {
    if (keywords.some(kw => titleLower.includes(kw))) {
      const etapa = etapas.find(e => e.codigo === codigo);
      if (etapa) return etapa.id;
    }
  }
  return null;
}
