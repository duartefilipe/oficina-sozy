import { api } from "@/lib/api";
import type { UserRequestDto, UserResponseDto } from "@/types";

export async function listarUsuarios() {
  const { data } = await api.get<UserResponseDto[]>("/users");
  return data;
}

export async function criarUsuario(payload: UserRequestDto) {
  const { data } = await api.post<UserResponseDto>("/users", payload);
  return data;
}

export async function removerUsuario(userId: number) {
  await api.delete(`/users/${userId}`);
}
