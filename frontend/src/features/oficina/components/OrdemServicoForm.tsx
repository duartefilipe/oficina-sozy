import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { useProdutos } from "@/features/estoque/hooks";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAtualizarOrdemServico, useCriarOrdemServico, useOrdensServico, useRemoverOrdemServico } from "@/features/oficina/hooks";
import type { OrdemServicoRequestDto, OrdemServicoResponseDto } from "@/types";

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
  const atualizarMutacao = useAtualizarOrdemServico();
  const removerMutacao = useRemoverOrdemServico();
  const ordensQuery = useOrdensServico();
  const produtosQuery = useProdutos();
  const pecas = (produtosQuery.data ?? []).filter((p) => p.tipo === "PECA");
  const [osEditandoId, setOsEditandoId] = useState<number | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues
  });

  const pecasArray = useFieldArray({ control: form.control, name: "pecasEstoque" });
  const servicosArray = useFieldArray({ control: form.control, name: "servicos" });
  const custosExternosArray = useFieldArray({ control: form.control, name: "custosExternos" });

  const onSubmit = (values: FormValues) => {
    if (osEditandoId) {
      atualizarMutacao.mutate(
        { id: osEditandoId, payload: values as OrdemServicoRequestDto },
        {
          onSuccess: () => {
            setOsEditandoId(null);
            form.reset(defaultValues);
          }
        }
      );
      return;
    }
    criarMutacao.mutate(values as OrdemServicoRequestDto, {
      onSuccess: () => form.reset(defaultValues)
    });
  };

  const carregarParaEdicao = (os: OrdemServicoResponseDto) => {
    setOsEditandoId(os.id);
    form.reset({
      placaMoto: os.placaMoto,
      cliente: os.cliente ?? "",
      status: os.status,
      pecasEstoque: os.pecasEstoque.map((p) => ({
        produtoId: p.produtoId,
        quantidade: p.quantidade,
        valorCobrado: p.valorCobrado
      })),
      servicos: os.servicos.map((s) => ({
        descricao: s.descricao,
        valor: s.valor
      })),
      custosExternos: os.custosExternos.map((c) => ({
        descricao: c.descricao,
        custoAquisicao: c.custoAquisicao,
        valorCobrado: c.valorCobrado
      }))
    });
  };

  return (
    <section className="mx-auto max-w-5xl rounded-lg border border-slate-200 bg-white p-6">
      <h1 className="text-2xl font-semibold">Ordem de Servico</h1>
      <p className="mb-4 text-sm text-slate-600">
        Custos externos sao lancados separadamente e nao entram no estoque.
      </p>

      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs text-slate-600">Placa da moto</label>
            <input
              className="w-full rounded-md border border-slate-300 p-2"
              placeholder="Placa da moto"
              {...form.register("placaMoto")}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-600">Cliente</label>
            <input
              className="w-full rounded-md border border-slate-300 p-2"
              placeholder="Cliente"
              {...form.register("cliente")}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-600">Status da OS</label>
            <select className="w-full rounded-md border border-slate-300 p-2" {...form.register("status")}>
              <option value="ABERTA">ABERTA</option>
              <option value="EM_EXECUCAO">EM_EXECUCAO</option>
              <option value="FINALIZADA">FINALIZADA</option>
              <option value="PAGA">PAGA</option>
            </select>
          </div>
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
                  <div>
                    <label className="mb-1 block text-xs text-slate-600">Peca do estoque</label>
                    <select
                      className="w-full rounded-md border border-slate-300 p-2"
                      {...form.register(`pecasEstoque.${index}.produtoId`, { valueAsNumber: true })}
                      onChange={(event) => {
                        const produtoId = Number(event.target.value);
                        form.setValue(`pecasEstoque.${index}.produtoId`, produtoId);
                        const produto = pecas.find((p) => p.id === produtoId);
                        if (produto) {
                          form.setValue(`pecasEstoque.${index}.valorCobrado`, produto.precoVenda);
                        }
                      }}
                    >
                      <option value={0}>Selecione a peca</option>
                      {pecas.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nome} (ID {p.id}) - estoque {p.qtdEstoque}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-600">Quantidade</label>
                    <input
                      type="number"
                      className="w-full rounded-md border border-slate-300 p-2"
                      placeholder="Quantidade"
                      {...form.register(`pecasEstoque.${index}.quantidade`)}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-600">Valor cobrado</label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full rounded-md border border-slate-300 p-2"
                      placeholder="Valor cobrado"
                      {...form.register(`pecasEstoque.${index}.valorCobrado`)}
                    />
                  </div>
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
                  <div>
                    <label className="mb-1 block text-xs text-slate-600">Descricao do servico</label>
                    <input
                      className="w-full rounded-md border border-slate-300 p-2"
                      placeholder="Descricao"
                      {...form.register(`servicos.${index}.descricao`)}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-600">Valor do servico</label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full rounded-md border border-slate-300 p-2"
                      placeholder="Valor"
                      {...form.register(`servicos.${index}.valor`)}
                    />
                  </div>
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
                  <div>
                    <label className="mb-1 block text-xs text-slate-600">Descricao da compra externa</label>
                    <input
                      className="w-full rounded-md border border-slate-300 p-2"
                      placeholder="Descricao"
                      {...form.register(`custosExternos.${index}.descricao`)}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-600">Custo de aquisicao</label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full rounded-md border border-slate-300 p-2"
                      placeholder="Custo aquisicao"
                      {...form.register(`custosExternos.${index}.custoAquisicao`)}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-600">Valor cobrado do cliente</label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full rounded-md border border-slate-300 p-2"
                      placeholder="Valor cobrado"
                      {...form.register(`custosExternos.${index}.valorCobrado`)}
                    />
                  </div>
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
          disabled={criarMutacao.isPending || atualizarMutacao.isPending}
          className="rounded bg-blue-700 px-4 py-2 text-white disabled:opacity-60"
        >
          {criarMutacao.isPending || atualizarMutacao.isPending
            ? "Salvando..."
            : osEditandoId
              ? "Salvar edicao da OS"
              : "Salvar OS"}
        </button>
        {osEditandoId ? (
          <button
            type="button"
            className="ml-2 rounded bg-slate-500 px-4 py-2 text-white"
            onClick={() => {
              setOsEditandoId(null);
              form.reset(defaultValues);
            }}
          >
            Cancelar edicao
          </button>
        ) : null}

        {criarMutacao.isSuccess ? (
          <p className="text-sm text-emerald-700">
            OS criada com sucesso. Total calculado: R$ {criarMutacao.data.valorTotal}
          </p>
        ) : null}
      </form>

      <div className="mt-6">
        <h3 className="mb-2 text-lg font-semibold">Lista de Ordens de Servico</h3>
        <div className="space-y-2">
          {(ordensQuery.data ?? []).map((os) => (
            <div key={os.id} className="flex items-center justify-between rounded-md border border-slate-200 p-3">
              <div>
                <p className="text-sm font-medium">OS #{os.id} - {os.placaMoto} - {os.cliente || "Sem cliente"}</p>
                <p className="text-xs text-slate-600">
                  Status: {os.status} | Total: R$ {os.valorTotal} | Itens: {os.pecasEstoque.length} pecas, {os.servicos.length} servicos
                </p>
              </div>
              <div className="flex gap-2">
                <button type="button" className="rounded bg-amber-600 px-3 py-2 text-white" onClick={() => carregarParaEdicao(os)}>
                  Editar
                </button>
                <button type="button" className="rounded bg-red-600 px-3 py-2 text-white" onClick={() => removerMutacao.mutate(os.id)}>
                  Remover
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
