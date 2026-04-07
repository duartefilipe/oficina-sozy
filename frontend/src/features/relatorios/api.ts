import { api } from "@/lib/api";
import type { RelatorioResumoDto } from "@/types";

export interface RelatorioFiltroPeriodo {
  dataInicio?: string;
  dataFim?: string;
}

export async function buscarResumoRelatorio(filtro?: RelatorioFiltroPeriodo) {
  const { data } = await api.get<RelatorioResumoDto>("/relatorios/resumo", {
    params: {
      dataInicio: filtro?.dataInicio || undefined,
      dataFim: filtro?.dataFim || undefined
    }
  });
  return data;
}
