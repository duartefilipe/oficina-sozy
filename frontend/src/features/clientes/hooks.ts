import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  atualizarCliente,
  buscarHistoricoCliente,
  criarCliente,
  listarClientes,
  removerCliente
} from "@/features/clientes/api";
import type { ClienteRequestDto, ClienteUpdateRequestDto } from "@/types";

export function useClientes() {
  return useQuery({
    queryKey: ["clientes"],
    queryFn: listarClientes
  });
}

export function useCriarCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ClienteRequestDto) => criarCliente(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
    }
  });
}

export function useAtualizarCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ClienteUpdateRequestDto }) => atualizarCliente(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
    }
  });
}

export function useRemoverCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => removerCliente(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
    }
  });
}

export function useHistoricoCliente(clienteId: number | null) {
  return useQuery({
    queryKey: ["clientes", clienteId, "historico"],
    queryFn: () => buscarHistoricoCliente(clienteId as number),
    enabled: !!clienteId
  });
}
