import { api } from "@/lib/api";
import type { VendaRequestDto, VendaResponseDto, VendaStatusRequestDto } from "@/types";

export async function criarVendaRapida(payload: VendaRequestDto) {
  const { data } = await api.post<VendaResponseDto>("/vendas", payload);
  return data;
}

export async function listarVendas() {
  const { data } = await api.get<VendaResponseDto[]>("/vendas");
  return data;
}

export async function atualizarStatusVenda(vendaId: number, payload: VendaStatusRequestDto) {
  const { data } = await api.patch<VendaResponseDto>(`/vendas/${vendaId}/status`, payload);
  return data;
}
