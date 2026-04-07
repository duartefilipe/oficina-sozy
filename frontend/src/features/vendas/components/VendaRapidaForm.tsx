import { useFieldArray, useForm } from "react-hook-form";
import { useCriarVendaRapida, useVendas, useAtualizarStatusVenda } from "@/features/vendas/hooks";

interface VendaFormValues {
  cliente: string;
  status: "PENDENTE" | "PAGA";
  itens: Array<{
    produtoId: number;
    quantidade: number;
    valorUnitario: number;
  }>;
}

const defaultValues: VendaFormValues = {
  cliente: "",
  status: "PENDENTE",
  itens: [{ produtoId: 0, quantidade: 1, valorUnitario: 0 }]
};

export function VendaRapidaForm() {
  const criarVenda = useCriarVendaRapida();
  const vendasQuery = useVendas();
  const form = useForm<VendaFormValues>({ defaultValues });
  const itensArray = useFieldArray({ control: form.control, name: "itens" });

  const onSubmit = (values: VendaFormValues) => {
    criarVenda.mutate(values);
  };

  return (
    <section className="mx-auto mt-6 max-w-5xl rounded-lg border border-slate-200 bg-white p-6">
      <h2 className="text-xl font-semibold">PDV - Venda Direta</h2>
      <p className="mb-4 text-sm text-slate-600">
        Estoque so baixa quando a venda estiver com status PAGA.
      </p>

      <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          <input
            className="rounded-md border border-slate-300 p-2"
            placeholder="Cliente"
            {...form.register("cliente")}
          />
          <select className="rounded-md border border-slate-300 p-2" {...form.register("status")}>
            <option value="PENDENTE">PENDENTE</option>
            <option value="PAGA">PAGA</option>
          </select>
        </div>

        <button
          type="button"
          className="rounded bg-slate-900 px-3 py-2 text-sm text-white"
          onClick={() => itensArray.append({ produtoId: 0, quantidade: 1, valorUnitario: 0 })}
        >
          Adicionar item
        </button>

        <div className="space-y-2">
          {itensArray.fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-1 gap-2 md:grid-cols-4">
              <input
                type="number"
                className="rounded-md border border-slate-300 p-2"
                placeholder="Produto ID"
                {...form.register(`itens.${index}.produtoId`, { valueAsNumber: true })}
              />
              <input
                type="number"
                className="rounded-md border border-slate-300 p-2"
                placeholder="Quantidade"
                {...form.register(`itens.${index}.quantidade`, { valueAsNumber: true })}
              />
              <input
                type="number"
                step="0.01"
                className="rounded-md border border-slate-300 p-2"
                placeholder="Valor unitario"
                {...form.register(`itens.${index}.valorUnitario`, { valueAsNumber: true })}
              />
              <button
                type="button"
                className="rounded bg-red-600 px-3 py-2 text-white"
                onClick={() => itensArray.remove(index)}
              >
                Remover
              </button>
            </div>
          ))}
        </div>

        <button
          type="submit"
          className="rounded bg-blue-700 px-4 py-2 text-white disabled:opacity-60"
          disabled={criarVenda.isPending}
        >
          {criarVenda.isPending ? "Salvando..." : "Registrar venda"}
        </button>
      </form>

      <div className="mt-6">
        <h3 className="mb-2 font-medium">Vendas registradas</h3>
        <div className="space-y-2">
          {(vendasQuery.data ?? []).map((venda) => (
            <VendaCard key={venda.id} id={venda.id} cliente={venda.cliente} status={venda.status} valorTotal={venda.valorTotal} />
          ))}
        </div>
      </div>
    </section>
  );
}

function VendaCard(props: { id: number; cliente?: string; status: "PENDENTE" | "PAGA" | "CANCELADA"; valorTotal: number }) {
  const atualizarStatus = useAtualizarStatusVenda(props.id);

  return (
    <div className="flex items-center justify-between rounded-md border border-slate-200 p-3">
      <div>
        <p className="text-sm font-medium">Venda #{props.id} - {props.cliente || "Sem cliente"}</p>
        <p className="text-xs text-slate-600">Status: {props.status} | Total: R$ {props.valorTotal}</p>
      </div>
      {props.status !== "PAGA" ? (
        <button
          className="rounded bg-emerald-700 px-3 py-2 text-white"
          onClick={() => atualizarStatus.mutate({ status: "PAGA" })}
        >
          Marcar como paga
        </button>
      ) : null}
    </div>
  );
}
