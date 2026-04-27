import { jsPDF } from "jspdf";
import type { OrdemServicoResponseDto } from "@/types";

const margem = 14;
const larguraPagina = 210;
const larguraConteudo = larguraPagina - margem * 2;

function moeda(valor: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(valor ?? 0));
}

function dataHora(valor: string) {
  return new Date(valor).toLocaleString("pt-BR");
}

function texto(valor?: string | null) {
  return valor?.trim() ? valor : "-";
}

function linha(doc: jsPDF, y: number) {
  doc.setDrawColor(210, 214, 220);
  doc.line(margem, y, larguraPagina - margem, y);
}

function escreverTextoQuebrado(doc: jsPDF, conteudo: string, x: number, y: number, largura: number, alturaLinha = 6) {
  const linhas = doc.splitTextToSize(conteudo, largura);
  doc.text(linhas, x, y);
  return y + linhas.length * alturaLinha;
}

function novaPaginaSePreciso(doc: jsPDF, y: number, espacoNecessario = 18) {
  if (y + espacoNecessario <= 282) {
    return y;
  }
  doc.addPage();
  return margem;
}

function tituloSecao(doc: jsPDF, titulo: string, y: number) {
  y = novaPaginaSePreciso(doc, y, 14);
  linha(doc, y);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(titulo, margem, y + 7);
  return y + 13;
}

function itemLinha(doc: jsPDF, descricao: string, valor: string, y: number) {
  y = novaPaginaSePreciso(doc, y, 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const yDepoisDescricao = escreverTextoQuebrado(doc, descricao, margem, y, 130, 5);
  doc.text(valor, larguraPagina - margem, y, { align: "right" });
  return Math.max(yDepoisDescricao, y + 6);
}

export function gerarPdfOrdemServico(os: OrdemServicoResponseDto) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = margem;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(`Ordem de Serviço #${os.id}`, margem, y);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Documento para conferência e aprovação do cliente", margem, y + 7);
  doc.text(`Gerado em ${dataHora(new Date().toISOString())}`, larguraPagina - margem, y, { align: "right" });
  y += 18;

  linha(doc, y);
  y += 8;

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Dados da OS", margem, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.text(`Oficina: ${texto(os.oficinaNome)}`, margem, y);
  doc.text(`Status: ${os.status}`, 118, y);
  y += 6;
  doc.text(`Cliente: ${texto(os.cliente)}`, margem, y);
  doc.text(`Placa: ${os.placaMoto}`, 118, y);
  y += 6;
  doc.text(`Abertura: ${dataHora(os.dataAbertura)}`, margem, y);
  y += 10;

  y = tituloSecao(doc, "Peças do estoque", y);
  if (os.pecasEstoque.length === 0) {
    y = itemLinha(doc, "Nenhuma peça lançada.", "-", y);
  } else {
    os.pecasEstoque.forEach((peca) => {
      const total = Number(peca.valorCobrado) * peca.quantidade;
      y = itemLinha(
        doc,
        `${peca.produtoNome} | Qtd. ${peca.quantidade} | Unit. ${moeda(Number(peca.valorCobrado))}`,
        moeda(total),
        y
      );
    });
  }

  y = tituloSecao(doc, "Serviços", y + 2);
  if (os.servicos.length === 0) {
    y = itemLinha(doc, "Nenhum serviço lançado.", "-", y);
  } else {
    os.servicos.forEach((servico) => {
      y = itemLinha(doc, servico.descricao, moeda(Number(servico.valor)), y);
    });
  }

  y = tituloSecao(doc, "Compras externas", y + 2);
  if (os.custosExternos.length === 0) {
    y = itemLinha(doc, "Nenhuma compra externa lançada.", "-", y);
  } else {
    os.custosExternos.forEach((custo) => {
      y = itemLinha(
        doc,
        `${custo.descricao} | Custo ${moeda(Number(custo.custoAquisicao))}`,
        moeda(Number(custo.valorCobrado)),
        y
      );
    });
  }

  y = novaPaginaSePreciso(doc, y + 8, 45);
  linha(doc, y);
  y += 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Total previsto", margem, y);
  doc.text(moeda(Number(os.valorTotal)), larguraPagina - margem, y, { align: "right" });
  y += 14;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  y = escreverTextoQuebrado(
    doc,
    "Declaro que conferi os itens e valores desta ordem de serviço e autorizo a execução dos trabalhos descritos.",
    margem,
    y,
    larguraConteudo,
    5
  );
  y += 18;
  doc.line(margem, y, 95, y);
  doc.line(115, y, larguraPagina - margem, y);
  doc.text("Assinatura do cliente", margem, y + 5);
  doc.text("Data", 115, y + 5);

  doc.save(`os-${os.id}.pdf`);
}
