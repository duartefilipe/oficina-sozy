import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, type ChangeEvent } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { useClientes } from "@/features/clientes/hooks";
import { useProdutos } from "@/features/estoque/hooks";
import { useAtualizarOrdemServico } from "@/features/oficina/hooks";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  clienteSelecionado: z.string().min(1, "Selecione um cliente."),
  novoClienteNome: z.string().optional(),
  status: z.enum(["ABERTA", "EM_EXECUCAO", "FINALIZADA", "PAGA"]),
  pecasEstoque: z.array(itemPecaSchema),
  servicos: z.array(itemMaoObraSchema),
  custosExternos: z.array(itemCustoExternoSchema)
}).superRefine((values, ctx) => {
  if (values.clienteSelecionado === "NOVO" && !values.novoClienteNome?.trim()) {
    ctx.addIssue({
      path: ["novoClienteNome"],
      code: "custom",
      message: "Informe o nome do cliente para cadastro rápido."
    });
  }
});

type FormValues = z.infer<typeof formSchema>;

function osParaValores(os: OrdemServicoResponseDto): FormValues {
  return {
    placaMoto: os.placaMoto,
    clienteSelecionado: os.clienteId ? String(os.clienteId) : "NOVO",
    novoClienteNome: os.clienteId ? "" : (os.cliente ?? ""),
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
  };
}

type Props = {
  osId: number;
  initialOs: OrdemServicoResponseDto;
  onCancel: () => void;
  onSaved: () => void;
};

export function OrdemServicoEditorForm({ osId, initialOs, onCancel, onSaved }: Props) {
  const atualizarMutacao = useAtualizarOrdemServico();
  const clientesQuery = useClientes();
  const produtosQuery = useProdutos();
  const clientes = useMemo(
    () =>
      (clientesQuery.data ?? []).filter(
        (cliente) => cliente.ativo && (!initialOs.oficinaId || cliente.oficinaId === initialOs.oficinaId)
      ),
    [clientesQuery.data, initialOs.oficinaId]
  );
  const pecas = useMemo(
    () => (produtosQuery.data ?? []).filter((p) => p.tipo === "PECA" && (!initialOs.oficinaId || p.oficinaId === initialOs.oficinaId)),
    [initialOs.oficinaId, produtosQuery.data]
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: osParaValores(initialOs),
    shouldUnregister: false
  });

  const pecasArray = useFieldArray({ control: form.control, name: "pecasEstoque" });
  const servicosArray = useFieldArray({ control: form.control, name: "servicos" });
  const custosExternosArray = useFieldArray({ control: form.control, name: "custosExternos" });

  const onSubmit = (raw: FormValues) => {
    const clienteId = raw.clienteSelecionado === "NOVO" ? undefined : Number(raw.clienteSelecionado);
    const clienteNome = raw.clienteSelecionado === "NOVO" ? raw.novoClienteNome?.trim() : undefined;
    const values: FormValues = {
      ...raw,
      pecasEstoque: raw.pecasEstoque.map((linha) => {
        const p = pecas.find((x) => x.id === linha.produtoId);
        return p ? { ...linha, valorCobrado: p.precoVenda } : linha;
      })
    };

    atualizarMutacao.mutate(
      {
        id: osId,
        payload: {
          ...(values as OrdemServicoRequestDto),
          clienteId: Number.isFinite(clienteId as number) ? (clienteId as number) : undefined,
          cliente: clienteNome
        }
      },
      {
        onSuccess: () => onSaved()
      }
    );
  };

  const fErr = form.formState.errors;

  return (
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
      {atualizarMutacao.isError && (
        <p className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-800" role="alert">
          {getApiErrorMessage(atualizarMutacao.error)}
        </p>
      )}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div>
          <label className={labelClass} htmlFor="os-edit-placa">
            Placa da moto
          </label>
          <input id="os-edit-placa" className={fieldClass} placeholder="Placa da moto" {...form.register("placaMoto")} />
        </div>
        <div>
          <label className={labelClass} htmlFor="os-edit-cliente">
            Cliente
          </label>
          <select id="os-edit-cliente" className={fieldClass} {...form.register("clienteSelecionado")}>
            <option value="NOVO">Cadastrar cliente</option>
            {clientes.map((cliente) => (
              <option key={cliente.id} value={String(cliente.id)}>
                {cliente.nomeCompleto ?? cliente.nome}
              </option>
            ))}
          </select>
          {form.watch("clienteSelecionado") === "NOVO" ? (
            <input
              className={`${fieldClass} mt-2`}
              placeholder="Nome do cliente"
              {...form.register("novoClienteNome")}
            />
          ) : null}
        </div>
        <div>
          <label className={labelClass} htmlFor="os-edit-status">
            Status da OS
          </label>
          <select id="os-edit-status" className={fieldClass} {...form.register("status")}>
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
            size="sm"
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
                <div
                  key={field.id}
                  className="grid grid-cols-1 items-end gap-2 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.6fr)_minmax(0,1fr)_auto]"
                >
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
                  <Button type="button" variant="danger" size="sm" className="shrink-0" onClick={() => pecasArray.remove(index)}>
                    Remover
                  </Button>
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="servicos">
          <Button
            type="button"
            variant="dark"
            size="sm"
            className="mb-3"
            onClick={() => servicosArray.append({ descricao: "", valor: 0 })}
          >
            Adicionar serviço
          </Button>
          <div className="space-y-2">
            {servicosArray.fields.map((field, index) => (
              <div
                key={field.id}
                className="grid grid-cols-1 items-end gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,0.45fr)_auto]"
              >
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
                <Button type="button" variant="danger" size="sm" className="shrink-0" onClick={() => servicosArray.remove(index)}>
                  Remover
                </Button>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="externos" className="rounded-md border border-amber-300 bg-amber-50 p-3">
          <Button
            type="button"
            variant="dark"
            size="sm"
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
              <div
                key={field.id}
                className="grid grid-cols-1 items-end gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,0.4fr)_minmax(0,0.4fr)_auto]"
              >
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
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  className="shrink-0"
                  onClick={() => custosExternosArray.remove(index)}
                >
                  Remover
                </Button>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" size="md" disabled={atualizarMutacao.isPending}>
          {atualizarMutacao.isPending ? "Salvando…" : "Salvar alterações"}
        </Button>
        <Button type="button" variant="outline" size="md" onClick={onCancel}>
          Voltar
        </Button>
      </div>
    </form>
  );
}
