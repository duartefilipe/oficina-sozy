import { api } from "@/lib/api";
import type { RelatorioResumoDto } from "@/types";

export interface RelatorioFiltroPeriodo {
  dataInicio?: string;
  dataFim?: string;
  /** Apenas SUPERADMIN: filtra vendas/OS desta oficina. */
  oficinaId?: number;
}

export async function buscarResumoRelatorio(filtro?: RelatorioFiltroPeriodo) {
  const { data } = await api.get<RelatorioResumoDto>("/relatorios/resumo", {
    params: {
      dataInicio: filtro?.dataInicio || undefined,
      dataFim: filtro?.dataFim || undefined,
      oficinaId: filtro?.oficinaId ?? undefined
    }
  });
  return data;
}
