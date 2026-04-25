import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { isAxiosError } from "axios";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Texto vindo do backend (Spring) ou do Axios, para exibir no UI. */
export function getApiErrorMessage(err: unknown, fallback = "Falha na requisicao. Tente novamente.") {
  if (!err) return fallback;
  if (isAxiosError(err)) {
    const d = err.response?.data;
    if (d && typeof d === "object") {
      if ("message" in d && typeof d.message === "string") return d.message;
      if (Array.isArray((d as { message?: string[] }).message) && (d as { message: string[] }).message[0]) {
        return (d as { message: string[] }).message[0]!;
      }
    }
    if (err.message) return err.message;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}
