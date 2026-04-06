import { api } from "@/lib/api";

export interface VendaRapidaPayload {
  cliente?: string;
  itens: Array<{
    produtoId: number;
    quantidade: number;
    valorUnitario: number;
  }>;
}

export async function criarVendaRapida(payload: VendaRapidaPayload) {
  const { data } = await api.post("/vendas", payload);
  return data;
}
