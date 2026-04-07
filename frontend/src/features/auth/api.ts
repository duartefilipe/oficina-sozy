import { api } from "@/lib/api";
import type { LoginRequestDto, LoginResponseDto, MeResponseDto } from "@/types";

export async function login(payload: LoginRequestDto) {
  const { data } = await api.post<LoginResponseDto>("/auth/login", payload);
  return data;
}

export async function me() {
  const { data } = await api.get<MeResponseDto>("/auth/me");
  return data;
}
