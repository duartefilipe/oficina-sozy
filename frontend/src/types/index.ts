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
  clienteId?: number;
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
  clienteId?: number;
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
  oficinaId?: number;
  oficinaNome?: string;
  tipo: ProdutoTipo;
  precoCusto: number;
  precoVenda: number;
  qtdEstoque: number;
  chassi?: string;
  renavam?: string;
  ano?: number;
}

export interface VendaItemRequestDto {
  produtoId: number;
  quantidade: number;
  valorUnitario: number;
}

export interface VendaRequestDto {
  clienteId?: number;
  cliente?: string;
  status: VendaStatus;
  itens: VendaItemRequestDto[];
}

export interface VendaItemResponseDto {
  id: number;
  produtoId: number;
  produtoNome: string;
  quantidade: number;
  valorUnitario: number;
}

export interface VendaResponseDto {
  id: number;
  clienteId?: number;
  cliente?: string;
  dataVenda: string;
  valorTotal: number;
  status: VendaStatus;
  itens: VendaItemResponseDto[];
}

export interface VendaStatusRequestDto {
  status: VendaStatus;
}

export type UserRole = "SUPERADMIN" | "ADMIN" | "USUARIO";

export interface LoginRequestDto {
  username: string;
  password: string;
}

export interface LoginResponseDto {
  token: string;
  userId: number;
  nome: string;
  username: string;
  role: UserRole;
  oficinaId?: number;
  oficinaNome?: string;
}

export interface MeResponseDto {
  userId: number;
  nome: string;
  username: string;
  role: UserRole;
  oficinaId?: number;
  oficinaNome?: string;
}

export interface UserRequestDto {
  nome: string;
  username: string;
  password: string;
  role: UserRole;
  createdByAdminId?: number;
  oficinaId?: number;
}

export interface UserResponseDto {
  id: number;
  nome: string;
  username: string;
  role: UserRole;
  createdByAdminId?: number;
  oficinaId?: number;
  oficinaNome?: string;
  ativo: boolean;
}

export interface UserUpdateRequestDto {
  nome: string;
  username: string;
  password?: string;
  role: UserRole;
  createdByAdminId?: number;
  oficinaId?: number;
  ativo: boolean;
}

export interface OficinaRequestDto {
  nome: string;
}

export interface OficinaUpdateRequestDto {
  nome: string;
  ativo: boolean;
}

export interface OficinaResponseDto {
  id: number;
  nome: string;
  ativo: boolean;
}

export interface ClienteRequestDto {
  oficinaId?: number;
  nome: string;
  sobrenome?: string;
  email?: string;
  telefone?: string;
  dataAniversario?: string;
  cidade?: string;
}

export interface ClienteUpdateRequestDto {
  nome: string;
  sobrenome?: string;
  email?: string;
  telefone?: string;
  dataAniversario?: string;
  cidade?: string;
  ativo: boolean;
}

export interface ClienteResponseDto {
  id: number;
  nome: string;
  sobrenome?: string;
  nomeCompleto: string;
  email?: string;
  telefone?: string;
  dataAniversario?: string;
  cidade?: string;
  oficinaId?: number;
  oficinaNome?: string;
  ativo: boolean;
}

export interface ClienteHistoricoItemResponseDto {
  id: number;
  tipo: "ORDEM_SERVICO" | "VENDA";
  descricao: string;
  status: string;
  data: string;
  valorTotal: number;
}

export interface ClienteHistoricoResponseDto {
  clienteId: number;
  clienteNome: string;
  itens: ClienteHistoricoItemResponseDto[];
}

export interface RelatorioResumoDto {
  receitaTotal: number;
  despesaTotal: number;
  resultadoLucroPrejuizo: number;
  receitaVendas: number;
  custoVendas: number;
  lucroVendas: number;
  receitaOrdensServico: number;
  custoOrdensServico: number;
  quantidadeVendas: number;
  quantidadeConsertosMoto: number;
  quantidadePecasVendidas: number;
  quantidadeVendasPendentes: number;
  quantidadeOsAbertas: number;
  ticketMedioVendas: number;
  ticketMedioOs: number;
}
