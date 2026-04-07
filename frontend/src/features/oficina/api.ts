import { api } from "@/lib/api";
import type {
  OrdemServicoRequestDto,
  OrdemServicoResponseDto,
  OrdemServicoStatusRequestDto
} from "@/types";

export async function criarOrdemServico(payload: OrdemServicoRequestDto) {
  const { data } = await api.post<OrdemServicoResponseDto>("/ordens-servico", payload);
  return data;
}

export async function listarOrdensServico() {
  const { data } = await api.get<OrdemServicoResponseDto[]>("/ordens-servico");
  return data;
}

export async function buscarOrdemServico(id: number) {
  const { data } = await api.get<OrdemServicoResponseDto>(`/ordens-servico/${id}`);
  return data;
}

export async function atualizarOrdemServico(id: number, payload: OrdemServicoRequestDto) {
  const { data } = await api.put<OrdemServicoResponseDto>(`/ordens-servico/${id}`, payload);
  return data;
}

export async function atualizarStatusOrdemServico(id: number, payload: OrdemServicoStatusRequestDto) {
  const { data } = await api.patch<OrdemServicoResponseDto>(`/ordens-servico/${id}/status`, payload);
  return data;
}

export async function removerOrdemServico(id: number) {
  await api.delete(`/ordens-servico/${id}`);
}
