import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  atualizarStatusOrdemServico,
  buscarOrdemServico,
  criarOrdemServico
} from "@/features/oficina/api";
import type { OrdemServicoRequestDto, OrdemServicoStatusRequestDto } from "@/types";

export function useCriarOrdemServico() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: OrdemServicoRequestDto) => criarOrdemServico(payload),
    onSuccess: (os) => {
      queryClient.setQueryData(["ordem-servico", os.id], os);
    }
  });
}

export function useOrdemServico(id: number | null) {
  return useQuery({
    queryKey: ["ordem-servico", id],
    queryFn: () => buscarOrdemServico(id as number),
    enabled: !!id
  });
}

export function useAtualizarStatusOrdemServico(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: OrdemServicoStatusRequestDto) => atualizarStatusOrdemServico(id, payload),
    onSuccess: (os) => {
      queryClient.setQueryData(["ordem-servico", os.id], os);
    }
  });
}
