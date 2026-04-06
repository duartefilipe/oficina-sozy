import { useMutation } from "@tanstack/react-query";
import { criarVendaRapida, type VendaRapidaPayload } from "@/features/vendas/api";

export function useCriarVendaRapida() {
  return useMutation({
    mutationFn: (payload: VendaRapidaPayload) => criarVendaRapida(payload)
  });
}
