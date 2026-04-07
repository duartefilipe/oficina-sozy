import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { criarUsuario, listarUsuarios, removerUsuario } from "@/features/users/api";
import type { UserRequestDto } from "@/types";

export function useUsuarios() {
  return useQuery({
    queryKey: ["usuarios"],
    queryFn: listarUsuarios
  });
}

export function useCriarUsuario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UserRequestDto) => criarUsuario(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["usuarios"] })
  });
}

export function useRemoverUsuario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) => removerUsuario(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["usuarios"] })
  });
}
