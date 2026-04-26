import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { atualizarOficina, criarOficina, listarOficinas } from "@/features/oficinas/api";
import type { OficinaRequestDto, OficinaUpdateRequestDto } from "@/types";

export function useOficinas() {
  return useQuery({
    queryKey: ["oficinas"],
    queryFn: listarOficinas
  });
}

export function useCriarOficina() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: OficinaRequestDto) => criarOficina(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["oficinas"] })
  });
}

export function useAtualizarOficina() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ oficinaId, payload }: { oficinaId: number; payload: OficinaUpdateRequestDto }) =>
      atualizarOficina(oficinaId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["oficinas"] })
  });
}
