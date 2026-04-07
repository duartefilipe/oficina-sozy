import { useQuery } from "@tanstack/react-query";
import { buscarResumoRelatorio, type RelatorioFiltroPeriodo } from "@/features/relatorios/api";

export function useResumoRelatorio(filtro?: RelatorioFiltroPeriodo) {
  return useQuery({
    queryKey: ["relatorio-resumo", filtro?.dataInicio ?? null, filtro?.dataFim ?? null],
    queryFn: () => buscarResumoRelatorio(filtro)
  });
}
