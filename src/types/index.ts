export type PrestadorTipo = 'pessoa_fisica' | 'pessoa_juridica'
export type PrestadorStatus = 'ativo' | 'inativo' | 'suspenso'

export type ContaFixaCategoria =
  | 'aluguel'
  | 'internet'
  | 'telefonia'
  | 'energia'
  | 'agua'
  | 'software'
  | 'contabilidade'
  | 'outros'

export type FormaPagamento =
  | 'pix'
  | 'transferencia'
  | 'boleto'
  | 'cartao_credito'
  | 'cartao_debito'
  | 'dinheiro'

export type LancamentoTipo = 'receita' | 'despesa'

export type LancamentoCategoria =
  | 'honorarios'
  | 'prestador'
  | 'conta_fixa'
  | 'imposto'
  | 'escritorio'
  | 'marketing'
  | 'outros'

export type LancamentoStatus = 'pendente' | 'pago' | 'cancelado'

export type ContratoStatus = 'ativo' | 'encerrado' | 'suspenso' | 'em_negociacao'

export type ClienteStatus = 'ativo' | 'inativo'

export interface Prestador {
  id: string
  nome: string
  cpf_cnpj: string
  tipo: PrestadorTipo
  email: string | null
  telefone: string | null
  pix: string | null
  banco: string | null
  agencia: string | null
  conta: string | null
  funcao: string
  valor_combinado: number | null
  status: PrestadorStatus
  observacoes: string | null
  created_at: string
}

export interface ContaFixa {
  id: string
  nome: string
  categoria: ContaFixaCategoria
  valor_estimado: number
  dia_vencimento: number
  fornecedor: string | null
  forma_pagamento: FormaPagamento
  recorrente: boolean
  ativa: boolean
  observacoes: string | null
}

export interface Lancamento {
  id: string
  tipo: LancamentoTipo
  categoria: LancamentoCategoria
  descricao: string
  valor: number
  data_competencia: string
  data_pagamento: string | null
  status: LancamentoStatus
  conta_fixa_id: string | null
  prestador_id: string | null
  comprovante_url: string | null
  forma_pagamento: FormaPagamento | null
  observacoes: string | null
  valor_fixo: number | null
  valor_adicional: number | null
  motivo_adicional: string | null
  tipo_pagamento: string | null
  recibo_url: string | null
}

export interface Cliente {
  id: string
  nome: string
  cpf: string
  rg?: string | null
  data_nascimento?: string | null
  telefone: string | null
  email: string | null
  endereco?: string | null
  status: ClienteStatus
  observacoes?: string | null
}

export interface Contrato {
  id: string
  cliente_id: string | null
  cliente_nome: string | null
  descricao: string
  tipo_acao: string
  valor: number
  honorarios: number
  data_assinatura: string
  status: ContratoStatus
  prestador_responsavel_id: string | null
  created_at: string
}

export interface Configuracao {
  id: number
  nome_escritorio: string
  cnpj: string
  endereco: string
  telefone?: string | null
  email?: string | null
}

export interface CategoriaDespesa {
  id: string
  nome: string
  created_at: string
}

// Tipos com joins
export interface LancamentoComRelacoes extends Lancamento {
  conta_fixa?: ContaFixa | null
  prestador?: Prestador | null
}

export interface ContratoComRelacoes extends Contrato {
  cliente?: Cliente | null
  prestador_responsavel?: Prestador | null
}

export type LancamentoHistorico = Pick<
  Lancamento,
  'tipo' | 'categoria' | 'valor' | 'status' | 'data_competencia'
>
