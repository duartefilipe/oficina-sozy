import { useQuery } from "@tanstack/react-query";
import { listarProdutos } from "@/features/estoque/api";

export function useProdutos() {
  return useQuery({
    queryKey: ["produtos"],
    queryFn: listarProdutos
  });
}
