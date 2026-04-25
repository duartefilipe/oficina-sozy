import type { ColumnDef } from "@tanstack/react-table";
import { useCallback, useMemo, useState, type ChangeEvent } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { useProdutos } from "@/features/estoque/hooks";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAtualizarOrdemServico, useCriarOrdemServico, useOrdensServico, useRemoverOrdemServico } from "@/features/oficina/hooks";
import { fieldClass, labelClass } from "@/lib/form-styles";
import { getApiErrorMessage } from "@/lib/utils";
import type { OrdemServicoRequestDto, OrdemServicoResponseDto } from "@/types";

const numNaoVazio = (msg: string) =>
  z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : v),
    z.coerce.number({ invalid_type_error: msg })
  );

const itemPecaSchema = z.object({
  produtoId: z.coerce.number().int().positive("Selecione a peca na lista (ID 0 nao e valido)."),
  quantidade: numNaoVazio("Informe a quantidade.").pipe(
    z.number().int().positive("Quantidade deve ser maior que zero.")
  ),
  /* Enviado pelo form e alinhado ao precoVenda do produto no submit. */
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
  placaMoto: z
    .string()
    .trim()
    .min(1, "Informe a placa da moto (obrigatorio para salvar a OS)."),
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
    defaultValues,
    shouldUnregister: false
  });

  const pecasArray = useFieldArray({ control: form.control, name: "pecasEstoque" });
  const servicosArray = useFieldArray({ control: form.control, name: "servicos" });
  const custosExternosArray = useFieldArray({ control: form.control, name: "custosExternos" });

  const onSubmit = (raw: FormValues) => {
    const values: FormValues = {
      ...raw,
      pecasEstoque: raw.pecasEstoque.map((linha) => {
        const p = pecas.find((x) => x.id === linha.produtoId);
        return p ? { ...linha, valorCobrado: p.precoVenda } : linha;
      })
    };

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

  const carregarParaEdicao = useCallback(
    (os: OrdemServicoResponseDto) => {
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
    },
    [form]
  );

  const colunasOrdens = useMemo<ColumnDef<OrdemServicoResponseDto>[]>(
    () => [
      { accessorKey: "id", header: "OS", cell: ({ getValue }) => `#${getValue()}` },
      { accessorKey: "placaMoto", header: "Placa" },
      {
        accessorKey: "cliente",
        header: "Cliente",
        cell: ({ getValue }) => (String(getValue() || "").trim() ? String(getValue()) : "—")
      },
      { accessorKey: "status", header: "Status" },
      {
        accessorKey: "valorTotal",
        header: "Total",
        cell: ({ getValue }) =>
          new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(getValue() ?? 0))
      },
      {
        id: "itens",
        header: "Resumo itens",
        enableSorting: false,
        cell: ({ row }) =>
          `${row.original.pecasEstoque.length} peças · ${row.original.servicos.length} serviços · ${row.original.custosExternos.length} ext.`
      },
      {
        id: "acoes",
        header: "Ações",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="warning" size="md" onClick={() => carregarParaEdicao(row.original)}>
              Editar
            </Button>
            <Button type="button" variant="danger" size="md" onClick={() => removerMutacao.mutate(row.original.id)}>
              Remover
            </Button>
          </div>
        )
      }
    ],
    [carregarParaEdicao, removerMutacao]
  );

  const fErr = form.formState.errors;

  return (
    <section className="mx-auto max-w-5xl rounded-lg border border-slate-200 bg-white p-6">
      <h1 className="text-2xl font-semibold">Ordem de Servico</h1>
      <p className="mb-4 text-sm text-slate-600">
        Custos externos sao lancados separadamente e nao entram no estoque.
      </p>

      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        {(fErr.placaMoto || fErr.pecasEstoque || fErr.servicos || fErr.custosExternos) && form.formState.isSubmitted ? (
          <div
            className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950"
            role="status"
          >
            <p className="mb-1 font-medium">Ajuste os campos para salvar:</p>
            <ul className="list-inside list-disc space-y-1">
              {fErr.placaMoto ? <li>{fErr.placaMoto.message as string}</li> : null}
              {fErr.pecasEstoque
                ? Array.isArray(fErr.pecasEstoque)
                  ? fErr.pecasEstoque.map(
                      (row, i) =>
                        row &&
                        (row.produtoId || row.quantidade || row.valorCobrado) && (
                          <li key={i}>
                            Pecas linha {i + 1}:{" "}
                            {[row.produtoId?.message, row.quantidade?.message, row.valorCobrado?.message]
                              .filter(Boolean)
                              .join(" · ")}
                          </li>
                        )
                    )
                  : (fErr.pecasEstoque as { message?: string })?.message && (
                      <li>{String((fErr.pecasEstoque as { message: string }).message)}</li>
                    )
                : null}
            </ul>
          </div>
        ) : null}
        {(criarMutacao.isError || atualizarMutacao.isError) && (
          <p className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-800" role="alert">
            {getApiErrorMessage(criarMutacao.isError ? criarMutacao.error : atualizarMutacao.error)}
          </p>
        )}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div>
            <label className={labelClass} htmlFor="os-placa">
              Placa da moto
            </label>
            <input id="os-placa" className={fieldClass} placeholder="Placa da moto" {...form.register("placaMoto")} />
          </div>
          <div>
            <label className={labelClass} htmlFor="os-cliente">
              Cliente
            </label>
            <input id="os-cliente" className={fieldClass} placeholder="Cliente" {...form.register("cliente")} />
          </div>
          <div>
            <label className={labelClass} htmlFor="os-status">
              Status da OS
            </label>
            <select id="os-status" className={fieldClass} {...form.register("status")}>
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
            <Button
              type="button"
              variant="dark"
              size="md"
              className="mb-3"
              onClick={() => pecasArray.append({ produtoId: 0, quantidade: 1, valorCobrado: 0 })}
            >
              Adicionar peça
            </Button>
            <p className="mb-2 text-xs text-slate-600">
              O preco de venda (e o total da linha) vem do cadastro do estoque. O estoque e baixado ao salvar a OS
              (respeitando a quantidade abaixo).
            </p>
            <div className="space-y-2">
              {pecasArray.fields.map((field, index) => {
                const pid = form.watch(`pecasEstoque.${index}.produtoId` as const);
                const sel = pecas.find((p) => p.id === pid);
                const rProd = form.register(`pecasEstoque.${index}.produtoId`, { valueAsNumber: true });
                return (
                  <div key={field.id} className="grid grid-cols-1 items-end gap-2 md:grid-cols-4">
                    <div>
                      <label className="mb-1 block text-xs text-slate-600">Peca do estoque</label>
                      <select
                        className="w-full rounded-md border border-slate-300 p-2"
                        name={rProd.name}
                        onBlur={rProd.onBlur}
                        ref={rProd.ref}
                        onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                          rProd.onChange(e);
                          const produtoId = Number(e.target.value);
                          const produto = pecas.find((p) => p.id === produtoId);
                          if (produto) {
                            form.setValue(`pecasEstoque.${index}.valorCobrado`, produto.precoVenda, { shouldValidate: true });
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
                      <label className="mb-1 block text-xs text-slate-600">Preco de venda / custo (estoque)</label>
                      {sel ? (
                        <p className="text-sm text-slate-800">
                          Venda: R$ {sel.precoVenda.toFixed(2)} &middot; Custo: R$ {sel.precoCusto.toFixed(2)}
                        </p>
                      ) : (
                        <p className="text-sm text-slate-500">Selecione a peca</p>
                      )}
                      <input
                        type="hidden"
                        {...form.register(`pecasEstoque.${index}.valorCobrado`, { valueAsNumber: true })}
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
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="servicos">
            <Button
              type="button"
              variant="dark"
              size="md"
              className="mb-3"
              onClick={() => servicosArray.append({ descricao: "", valor: 0 })}
            >
              Adicionar serviço
            </Button>
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
            <Button
              type="button"
              variant="dark"
              size="md"
              className="mb-3"
              onClick={() =>
                custosExternosArray.append({
                  descricao: "",
                  custoAquisicao: 0,
                  valorCobrado: 0
                })
              }
            >
              Adicionar compra externa
            </Button>
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

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="submit"
            size="md"
            disabled={criarMutacao.isPending || atualizarMutacao.isPending}
          >
            {criarMutacao.isPending || atualizarMutacao.isPending
              ? "Salvando…"
              : osEditandoId
                ? "Salvar edição da OS"
                : "Salvar OS"}
          </Button>
          {osEditandoId ? (
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => {
                setOsEditandoId(null);
                form.reset(defaultValues);
              }}
            >
              Cancelar edição
            </Button>
          ) : null}
        </div>

        {criarMutacao.isSuccess ? (
          <p className="text-sm text-emerald-700">
            OS criada com sucesso. Total calculado: R$ {criarMutacao.data.valorTotal}
          </p>
        ) : null}
      </form>

      <div className="mt-6">
        <h3 className="mb-3 text-lg font-semibold text-slate-800">Lista de ordens de serviço</h3>
        <DataTable
          columns={colunasOrdens}
          data={ordensQuery.data ?? []}
          searchPlaceholder="Buscar por placa, cliente, status, total…"
          pageSize={10}
        />
      </div>
    </section>
  );
}
