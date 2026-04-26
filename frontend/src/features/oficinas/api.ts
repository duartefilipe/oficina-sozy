import { api } from "@/lib/api";
import type { OficinaRequestDto, OficinaResponseDto, OficinaUpdateRequestDto } from "@/types";

export async function listarOficinas() {
  const { data } = await api.get<OficinaResponseDto[]>("/oficinas");
  return data;
}

export async function criarOficina(payload: OficinaRequestDto) {
  const { data } = await api.post<OficinaResponseDto>("/oficinas", payload);
  return data;
}

export async function atualizarOficina(oficinaId: number, payload: OficinaUpdateRequestDto) {
  const { data } = await api.put<OficinaResponseDto>(`/oficinas/${oficinaId}`, payload);
  return data;
}
