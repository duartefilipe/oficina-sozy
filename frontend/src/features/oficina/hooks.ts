import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  atualizarOrdemServico,
  atualizarStatusOrdemServico,
  buscarOrdemServico,
  criarOrdemServico,
  listarOrdensServico,
  removerOrdemServico
} from "@/features/oficina/api";
import type { OrdemServicoRequestDto, OrdemServicoStatusRequestDto } from "@/types";

export function useCriarOrdemServico() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: OrdemServicoRequestDto) => criarOrdemServico(payload),
    onSuccess: (os) => {
      queryClient.setQueryData(["ordem-servico", os.id], os);
      queryClient.invalidateQueries({ queryKey: ["ordens-servico"] });
    }
  });
}

export function useOrdensServico() {
  return useQuery({
    queryKey: ["ordens-servico"],
    queryFn: listarOrdensServico
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

export function useAtualizarOrdemServico() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: OrdemServicoRequestDto }) =>
      atualizarOrdemServico(id, payload),
    onSuccess: (os) => {
      queryClient.setQueryData(["ordem-servico", os.id], os);
      queryClient.invalidateQueries({ queryKey: ["ordens-servico"] });
    }
  });
}

export function useRemoverOrdemServico() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => removerOrdemServico(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ordens-servico"] })
  });
}
