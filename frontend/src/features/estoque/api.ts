import { api } from "@/lib/api";
import type { ProdutoDto } from "@/types";

export async function listarProdutos() {
  const { data } = await api.get<ProdutoDto[]>("/produtos");
  return data;
}
