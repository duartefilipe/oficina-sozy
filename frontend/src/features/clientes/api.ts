import { api } from "@/lib/api";
import type {
  ClienteHistoricoResponseDto,
  ClienteRequestDto,
  ClienteResponseDto,
  ClienteUpdateRequestDto
} from "@/types";

export async function listarClientes() {
  const { data } = await api.get<ClienteResponseDto[]>("/clientes");
  return data;
}

export async function criarCliente(payload: ClienteRequestDto) {
  const { data } = await api.post<ClienteResponseDto>("/clientes", payload);
  return data;
}

export async function atualizarCliente(id: number, payload: ClienteUpdateRequestDto) {
  const { data } = await api.put<ClienteResponseDto>(`/clientes/${id}`, payload);
  return data;
}

export async function buscarHistoricoCliente(id: number) {
  const { data } = await api.get<ClienteHistoricoResponseDto>(`/clientes/${id}/historico`);
  return data;
}
