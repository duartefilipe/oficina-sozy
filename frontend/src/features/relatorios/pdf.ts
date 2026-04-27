import { jsPDF } from "jspdf";
import type { RelatorioResumoDto } from "@/types";

const margem = 14;
const pageW = 210;
const pageH = 297;

function moeda(valor: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(valor ?? 0));
}

function textoPeriodo(dataInicio?: string, dataFim?: string) {
  if (!dataInicio && !dataFim) return "Todo o período";
  if (dataInicio && dataFim) return `${dataInicio} a ${dataFim}`;
  if (dataInicio) return `A partir de ${dataInicio}`;
  return `Até ${dataFim}`;
}

export interface GraficoPdfCaptura {
  titulo: string;
  dataUrl: string;
}

export async function exportarRelatorioResumoPdf(
  resumo: RelatorioResumoDto,
  opts: {
    dataInicio?: string;
    dataFim?: string;
    oficinaNome?: string;
    graficos?: GraficoPdfCaptura[];
  }
) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = margem;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Relatório gerencial", margem, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Período: ${textoPeriodo(opts.dataInicio, opts.dataFim)}`, margem, y);
  y += 5;
  if (opts.oficinaNome) {
    doc.text(`Oficina: ${opts.oficinaNome}`, margem, y);
    y += 5;
  }
  doc.text(`Gerado em ${new Date().toLocaleString("pt-BR")}`, margem, y);
  y += 12;

  const linhas: [string, string][] = [
    ["Receita total", moeda(resumo.receitaTotal)],
    ["Despesa total", moeda(resumo.despesaTotal)],
    ["Resultado (lucro/prejuízo)", moeda(resumo.resultadoLucroPrejuizo)],
    ["Receita de vendas", moeda(resumo.receitaVendas)],
    ["Custo de vendas", moeda(resumo.custoVendas)],
    ["Lucro de vendas", moeda(resumo.lucroVendas)],
    ["Receita de OS", moeda(resumo.receitaOrdensServico)],
    ["Custo de OS", moeda(resumo.custoOrdensServico)],
    ["Quantidade de vendas", String(resumo.quantidadeVendas)],
    ["Consertos de moto (OS)", String(resumo.quantidadeConsertosMoto)],
    ["Peças vendidas", String(resumo.quantidadePecasVendidas)],
    ["Vendas pendentes", String(resumo.quantidadeVendasPendentes)],
    ["OS abertas", String(resumo.quantidadeOsAbertas)],
    ["Ticket médio vendas", moeda(resumo.ticketMedioVendas)],
    ["Ticket médio OS", moeda(resumo.ticketMedioOs)]
  ];

  doc.setFontSize(10);
  for (const [rotulo, valor] of linhas) {
    if (y > pageH - 18) {
      doc.addPage();
      y = margem;
    }
    doc.setFont("helvetica", "normal");
    doc.text(rotulo, margem, y);
    doc.setFont("helvetica", "bold");
    doc.text(valor, pageW - margem, y, { align: "right" });
    y += 6;
  }

  const graficos = opts.graficos?.filter((g) => g.dataUrl?.length > 32) ?? [];
  if (graficos.length > 0) {
    y += 6;
    if (y > pageH - 40) {
      doc.addPage();
      y = margem;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Gráficos do período", margem, y);
    y += 8;

    const maxImgW = pageW - 2 * margem;

    for (const { titulo, dataUrl } of graficos) {
      if (y > pageH - 30) {
        doc.addPage();
        y = margem;
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(titulo, margem, y);
      y += 5;

      let imgH = 0;
      let imgW = maxImgW;
      try {
        const dims = await loadImageDimensions(dataUrl);
        if (dims.w > 0 && dims.h > 0) {
          imgW = maxImgW;
          imgH = (dims.h * imgW) / dims.w;
        }
      } catch {
        imgH = 80;
      }
      if (imgH <= 0) imgH = 80;

      if (y + imgH > pageH - margem) {
        doc.addPage();
        y = margem;
      }
      doc.addImage(dataUrl, "PNG", margem, y, imgW, imgH, undefined, "FAST");
      y += imgH + 8;
    }
  }

  doc.save("relatorio-gerencial.pdf");
}

function loadImageDimensions(dataUrl: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => reject(new Error("imagem"));
    img.src = dataUrl;
  });
}
