import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCriarOrdemServico } from "@/features/oficina/hooks";
import type { OrdemServicoRequestDto } from "@/types";

const itemPecaSchema = z.object({
  produtoId: z.coerce.number().int().positive(),
  quantidade: z.coerce.number().int().positive(),
  valorCobrado: z.coerce.number().nonnegative()
});

const itemMaoObraSchema = z.object({
  descricao: z.string().min(1),
  valor: z.coerce.number().nonnegative()
});

const itemCustoExternoSchema = z.object({
  descricao: z.string().min(1),
  custoAquisicao: z.coerce.number().nonnegative(),
  valorCobrado: z.coerce.number().nonnegative()
});

const formSchema = z.object({
  placaMoto: z.string().min(1),
  cliente: z.string().optional(),
  status: z.enum(["ABERTA", "EM_EXECUCAO", "FINALIZADA", "PAGA"]),
  pecasEstoque: z.array(itemPecaSchema),
  servicos: z.array(itemMaoObraSchema),
  custosExternos: z.array(itemCustoExternoSchema)
});

type FormValues = z.infer<typeof formSchema>;

const defaultValues: FormValues = {
  placaMoto: "",
  cliente: "",
  status: "ABERTA",
  pecasEstoque: [],
  servicos: [],
  custosExternos: []
};

export function OrdemServicoForm() {
  const criarMutacao = useCriarOrdemServico();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues
  });

  const pecasArray = useFieldArray({ control: form.control, name: "pecasEstoque" });
  const servicosArray = useFieldArray({ control: form.control, name: "servicos" });
  const custosExternosArray = useFieldArray({ control: form.control, name: "custosExternos" });

  const onSubmit = (values: FormValues) => {
    criarMutacao.mutate(values as OrdemServicoRequestDto);
  };

  return (
    <section className="mx-auto max-w-5xl rounded-lg border border-slate-200 bg-white p-6">
      <h1 className="text-2xl font-semibold">Ordem de Servico</h1>
      <p className="mb-4 text-sm text-slate-600">
        Custos externos sao lancados separadamente e nao entram no estoque.
      </p>

      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <input
            className="rounded-md border border-slate-300 p-2"
            placeholder="Placa da moto"
            {...form.register("placaMoto")}
          />
          <input
            className="rounded-md border border-slate-300 p-2"
            placeholder="Cliente"
            {...form.register("cliente")}
          />
          <select className="rounded-md border border-slate-300 p-2" {...form.register("status")}>
            <option value="ABERTA">ABERTA</option>
            <option value="EM_EXECUCAO">EM_EXECUCAO</option>
            <option value="FINALIZADA">FINALIZADA</option>
            <option value="PAGA">PAGA</option>
          </select>
        </div>

        <Tabs defaultValue="pecas">
          <TabsList>
            <TabsTrigger value="pecas">Pecas do Estoque</TabsTrigger>
            <TabsTrigger value="servicos">Servicos</TabsTrigger>
            <TabsTrigger value="externos">Compras Externas</TabsTrigger>
          </TabsList>

          <TabsContent value="pecas">
            <button
              type="button"
              className="mb-3 rounded bg-slate-900 px-3 py-2 text-sm text-white"
              onClick={() => pecasArray.append({ produtoId: 0, quantidade: 1, valorCobrado: 0 })}
            >
              Adicionar peca
            </button>
            <div className="space-y-2">
              {pecasArray.fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-1 gap-2 md:grid-cols-4">
                  <input
                    type="number"
                    className="rounded-md border border-slate-300 p-2"
                    placeholder="Produto ID"
                    {...form.register(`pecasEstoque.${index}.produtoId`)}
                  />
                  <input
                    type="number"
                    className="rounded-md border border-slate-300 p-2"
                    placeholder="Quantidade"
                    {...form.register(`pecasEstoque.${index}.quantidade`)}
                  />
                  <input
                    type="number"
                    step="0.01"
                    className="rounded-md border border-slate-300 p-2"
                    placeholder="Valor cobrado"
                    {...form.register(`pecasEstoque.${index}.valorCobrado`)}
                  />
                  <button
                    type="button"
                    className="rounded bg-red-600 px-3 py-2 text-white"
                    onClick={() => pecasArray.remove(index)}
                  >
                    Remover
                  </button>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="servicos">
            <button
              type="button"
              className="mb-3 rounded bg-slate-900 px-3 py-2 text-sm text-white"
              onClick={() => servicosArray.append({ descricao: "", valor: 0 })}
            >
              Adicionar servico
            </button>
            <div className="space-y-2">
              {servicosArray.fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-1 gap-2 md:grid-cols-3">
                  <input
                    className="rounded-md border border-slate-300 p-2"
                    placeholder="Descricao"
                    {...form.register(`servicos.${index}.descricao`)}
                  />
                  <input
                    type="number"
                    step="0.01"
                    className="rounded-md border border-slate-300 p-2"
                    placeholder="Valor"
                    {...form.register(`servicos.${index}.valor`)}
                  />
                  <button
                    type="button"
                    className="rounded bg-red-600 px-3 py-2 text-white"
                    onClick={() => servicosArray.remove(index)}
                  >
                    Remover
                  </button>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="externos" className="border-amber-300 bg-amber-50">
            <button
              type="button"
              className="mb-3 rounded bg-slate-900 px-3 py-2 text-sm text-white"
              onClick={() =>
                custosExternosArray.append({
                  descricao: "",
                  custoAquisicao: 0,
                  valorCobrado: 0
                })
              }
            >
              Adicionar compra externa
            </button>
            <div className="space-y-2">
              {custosExternosArray.fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-1 gap-2 md:grid-cols-4">
                  <input
                    className="rounded-md border border-slate-300 p-2"
                    placeholder="Descricao"
                    {...form.register(`custosExternos.${index}.descricao`)}
                  />
                  <input
                    type="number"
                    step="0.01"
                    className="rounded-md border border-slate-300 p-2"
                    placeholder="Custo aquisicao"
                    {...form.register(`custosExternos.${index}.custoAquisicao`)}
                  />
                  <input
                    type="number"
                    step="0.01"
                    className="rounded-md border border-slate-300 p-2"
                    placeholder="Valor cobrado"
                    {...form.register(`custosExternos.${index}.valorCobrado`)}
                  />
                  <button
                    type="button"
                    className="rounded bg-red-600 px-3 py-2 text-white"
                    onClick={() => custosExternosArray.remove(index)}
                  >
                    Remover
                  </button>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <button
          type="submit"
          disabled={criarMutacao.isPending}
          className="rounded bg-blue-700 px-4 py-2 text-white disabled:opacity-60"
        >
          {criarMutacao.isPending ? "Salvando..." : "Salvar OS"}
        </button>

        {criarMutacao.isSuccess ? (
          <p className="text-sm text-emerald-700">
            OS criada com sucesso. Total calculado: R$ {criarMutacao.data.valorTotal}
          </p>
        ) : null}
      </form>
    </section>
  );
}
