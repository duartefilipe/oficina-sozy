export type ProdutoTipo = "PECA" | "MOTO";
export type VendaStatus = "PENDENTE" | "PAGA" | "CANCELADA";
export type OrdemServicoStatus = "ABERTA" | "EM_EXECUCAO" | "FINALIZADA" | "PAGA";

export interface OrdemServicoPecaRequestDto {
  produtoId: number;
  quantidade: number;
  valorCobrado: number;
}

export interface OrdemServicoMaoObraRequestDto {
  descricao: string;
  valor: number;
}

export interface OrdemServicoCustoExternoRequestDto {
  descricao: string;
  custoAquisicao: number;
  valorCobrado: number;
}

export interface OrdemServicoRequestDto {
  placaMoto: string;
  cliente?: string;
  status: OrdemServicoStatus;
  pecasEstoque: OrdemServicoPecaRequestDto[];
  servicos: OrdemServicoMaoObraRequestDto[];
  custosExternos: OrdemServicoCustoExternoRequestDto[];
}

export interface OrdemServicoPecaResponseDto {
  id: number;
  produtoId: number;
  produtoNome: string;
  quantidade: number;
  valorCobrado: number;
}

export interface OrdemServicoMaoObraResponseDto {
  id: number;
  descricao: string;
  valor: number;
}

export interface OrdemServicoCustoExternoResponseDto {
  id: number;
  descricao: string;
  custoAquisicao: number;
  valorCobrado: number;
}

export interface OrdemServicoResponseDto {
  id: number;
  placaMoto: string;
  cliente?: string;
  status: OrdemServicoStatus;
  dataAbertura: string;
  valorTotal: number;
  pecasEstoque: OrdemServicoPecaResponseDto[];
  servicos: OrdemServicoMaoObraResponseDto[];
  custosExternos: OrdemServicoCustoExternoResponseDto[];
}

export interface OrdemServicoStatusRequestDto {
  status: OrdemServicoStatus;
}

export interface ProdutoDto {
  id: number;
  sku?: string;
  nome: string;
  tipo: ProdutoTipo;
  precoCusto: number;
  precoVenda: number;
  qtdEstoque: number;
  chassi?: string;
  renavam?: string;
  ano?: number;
}
