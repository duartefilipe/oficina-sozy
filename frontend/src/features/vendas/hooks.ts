import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { atualizarStatusVenda, atualizarVenda, criarVendaRapida, listarVendas } from "@/features/vendas/api";
import type { VendaRequestDto, VendaStatusRequestDto } from "@/types";

export function useCriarVendaRapida() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: VendaRequestDto) => criarVendaRapida(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendas"] });
      queryClient.invalidateQueries({ queryKey: ["produtos"] });
    }
  });
}

export function useVendas() {
  return useQuery({
    queryKey: ["vendas"],
    queryFn: listarVendas
  });
}

export function useAtualizarStatusVenda(vendaId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: VendaStatusRequestDto) => atualizarStatusVenda(vendaId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendas"] });
      queryClient.invalidateQueries({ queryKey: ["produtos"] });
    }
  });
}

export function useAtualizarVenda() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ vendaId, payload }: { vendaId: number; payload: VendaRequestDto }) => atualizarVenda(vendaId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendas"] });
      queryClient.invalidateQueries({ queryKey: ["produtos"] });
    }
  });
}
