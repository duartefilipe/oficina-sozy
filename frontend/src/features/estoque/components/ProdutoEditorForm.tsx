import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAtualizarProduto } from "@/features/estoque/hooks";
import type { ProdutoPayload } from "@/features/estoque/api";
import { Button } from "@/components/ui/button";
import { fieldClass, labelClass } from "@/lib/form-styles";
import { getApiErrorMessage } from "@/lib/utils";
import type { ProdutoDto, ProdutoTipo } from "@/types";

const schema = z.object({
  sku: z.string(),
  nome: z.string().trim().min(1, "Informe o nome do produto."),
  tipo: z.enum(["PECA", "MOTO"]),
  precoCusto: z.coerce.number().nonnegative(),
  precoVenda: z.coerce.number().nonnegative(),
  qtdEstoque: z.coerce.number().int().nonnegative()
});

type FormValues = z.infer<typeof schema>;

function dtoParaValores(p: ProdutoDto): FormValues {
  return {
    sku: p.sku ?? "",
    nome: p.nome,
    tipo: p.tipo as ProdutoTipo,
    precoCusto: p.precoCusto,
    precoVenda: p.precoVenda,
    qtdEstoque: p.qtdEstoque
  };
}

type Props = {
  produtoId: number;
  initial: ProdutoDto;
  onCancel: () => void;
  onSaved: () => void;
};

export function ProdutoEditorForm({ produtoId, initial, onCancel, onSaved }: Props) {
  const atualizar = useAtualizarProduto();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: dtoParaValores(initial)
  });

  const onSubmit = (v: FormValues) => {
    const payload: ProdutoPayload = {
      sku: v.sku.trim() || undefined,
      nome: v.nome.trim(),
      tipo: v.tipo,
      precoCusto: v.precoCusto,
      precoVenda: v.precoVenda,
      qtdEstoque: v.qtdEstoque,
      chassi: initial.chassi,
      renavam: initial.renavam,
      ano: initial.ano
    };
    atualizar.mutate(
      { produtoId, payload },
      {
        onSuccess: () => onSaved()
      }
    );
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {atualizar.isError && (
        <p className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-800" role="alert">
          {getApiErrorMessage(atualizar.error)}
        </p>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <div>
          <label className={labelClass} htmlFor="ed-p-sku">
            SKU
          </label>
          <input id="ed-p-sku" className={fieldClass} placeholder="SKU" {...form.register("sku")} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="ed-p-nome">
            Nome do produto
          </label>
          <input id="ed-p-nome" className={fieldClass} placeholder="Nome" {...form.register("nome")} />
          {form.formState.errors.nome && (
            <p className="mt-1 text-xs text-red-600">{form.formState.errors.nome.message}</p>
          )}
        </div>
        <div>
          <label className={labelClass} htmlFor="ed-p-tipo">
            Tipo
          </label>
          <select id="ed-p-tipo" className={fieldClass} {...form.register("tipo")}>
            <option value="PECA">PECA</option>
            <option value="MOTO">MOTO</option>
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="ed-p-custo">
            Preço de custo
          </label>
          <input
            id="ed-p-custo"
            type="number"
            step="0.01"
            className={fieldClass}
            placeholder="0"
            {...form.register("precoCusto")}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="ed-p-venda">
            Preço de venda
          </label>
          <input
            id="ed-p-venda"
            type="number"
            step="0.01"
            className={fieldClass}
            placeholder="0"
            {...form.register("precoVenda")}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="ed-p-qtd">
            Qtd. em estoque
          </label>
          <input id="ed-p-qtd" type="number" className={fieldClass} placeholder="0" {...form.register("qtdEstoque")} />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" size="md" disabled={atualizar.isPending}>
          {atualizar.isPending ? "Salvando…" : "Salvar alterações"}
        </Button>
        <Button type="button" variant="outline" size="md" onClick={onCancel}>
          Voltar
        </Button>
      </div>
    </form>
  );
}
