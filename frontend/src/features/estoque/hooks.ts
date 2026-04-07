import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { criarProduto, listarProdutos, removerProduto, type ProdutoPayload } from "@/features/estoque/api";

export function useProdutos() {
  return useQuery({
    queryKey: ["produtos"],
    queryFn: listarProdutos
  });
}

export function useCriarProduto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProdutoPayload) => criarProduto(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["produtos"] })
  });
}

export function useRemoverProduto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (produtoId: number) => removerProduto(produtoId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["produtos"] })
  });
}
