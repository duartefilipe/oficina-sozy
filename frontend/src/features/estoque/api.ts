import { api } from "@/lib/api";
import type { ProdutoDto, ProdutoTipo } from "@/types";

export async function listarProdutos() {
  const { data } = await api.get<ProdutoDto[]>("/produtos");
  return data;
}

export interface ProdutoPayload {
  sku?: string;
  nome: string;
  tipo: ProdutoTipo;
  precoCusto: number;
  precoVenda: number;
  qtdEstoque: number;
  chassi?: string;
  renavam?: string;
  ano?: number;
}

export async function criarProduto(payload: ProdutoPayload) {
  const { data } = await api.post<ProdutoDto>("/produtos", payload);
  return data;
}

export async function atualizarProduto(produtoId: number, payload: ProdutoPayload) {
  const { data } = await api.put<ProdutoDto>(`/produtos/${produtoId}`, payload);
  return data;
}

export async function removerProduto(produtoId: number) {
  await api.delete(`/produtos/${produtoId}`);
}
