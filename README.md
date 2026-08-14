cat > README.md << 'ENDOFFILE'
# Hensin Financeiro

> Sistema interno de gestão financeira desenvolvido para o escritório **Hensin Advogados**, com foco no controle de pagamentos a prestadores de serviço PJ.

---

## Sobre o projeto

O **Hensin Financeiro** é uma aplicação web de gestão financeira construída especificamente para as necessidades operacionais de um escritório de advocacia. O sistema controla pagamentos a prestadores de serviço, emite recibos em PDF, gerencia contratos e contas fixas, e fornece relatórios financeiros consolidados — tudo com rastreabilidade completa via lançamentos.

Desenvolvido integralmente por um único desenvolvedor, do zero, e implantado em produção na Vercel.

---

## Funcionalidades

### Prestadores de Serviço
- Cadastro de prestadores PJ e pessoas físicas com dados bancários completos (banco, agência, conta, PIX)
- Campos: nome, CPF/CNPJ, função, tipo, valor combinado mensal, status (ativo/inativo)
- Histórico completo de pagamentos por prestador
- **Lançamento de pagamentos** com suporte a:
  - Valor fixo + valor adicional (com motivo)
  - Tipo de pagamento: adiantamento, parcial, final, bônus, outro
  - Forma de pagamento: PIX, transferência, boleto, cartão, dinheiro
  - Upload de comprovante de pagamento
- **Edição de lançamentos** — permite corrigir informações registradas incorretamente diretamente no histórico
- Controle de status: **Pendente / Pago / Cancelado**

### Recibos em PDF
- Geração automática de recibo de pagamento em PDF via **jsPDF**, direto no browser
- Layout profissional com:
  - Cabeçalho Hensin Advogados
  - Dados do prestador (nome, CPF/CNPJ, função)
  - Discriminação dos valores (fixo + adicional)
  - Forma de pagamento e chave PIX
  - Assinaturas (prestador + escritório)
- Download imediato + armazenamento automático no **Supabase Storage**
- Regeneração a qualquer momento com link de acesso permanente

### Lançamentos Financeiros
- Registro centralizado de todas as movimentações financeiras
- Categorias: prestador, conta fixa, outros
- Filtros por período, categoria, status e forma de pagamento
- Upload de comprovantes com armazenamento em nuvem
- Totalizadores por período

### Contas Fixas
- Cadastro de despesas recorrentes (aluguel, serviços, assinaturas)
- Geração automática de lançamentos mensais
- Controle de vencimento e status de pagamento

### Holerite
- Geração de holerite em PDF por prestador
- Seleção de intervalo de datas customizável
- Consolidação dos lançamentos do período

### Contratos
- Cadastro e gestão de contratos com clientes
- Vinculação a clientes cadastrados
- Controle de vigência

### Relatórios
- Visão consolidada das finanças por período
- Totais de despesas por categoria

### Dashboard
- Resumo financeiro do mês
- Gráficos de despesas por categoria
- Alertas de pendências

### Autenticação
- Login seguro com **Supabase Auth**
- Proteção de todas as rotas via middleware Next.js

---

## Stack tecnológica

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 14 (App Router) |
| Linguagem | TypeScript |
| Estilização | Tailwind CSS + Shadcn/UI |
| Banco de dados | Supabase (PostgreSQL) |
| Autenticação | Supabase Auth |
| Storage | Supabase Storage |
| Geração de PDF | jsPDF (browser-side) |
| Geração de .docx | docx |
| Deploy | Vercel |

---

## Como rodar localmente

\`\`\`bash
git clone https://github.com/allysonka98/hensin-financeiro.git
cd hensin-financeiro
npm install
cp .env.example .env.local
npm run dev
\`\`\`

---

## Variáveis de ambiente

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
\`\`\`

---

## Banco de dados (principais tabelas)

| Tabela | Descrição |
|---|---|
| `prestadores` | Cadastro de prestadores de serviço |
| `lancamentos` | Lançamentos financeiros (pagamentos, despesas) |
| `contas_fixas` | Despesas recorrentes mensais |
| `contratos` | Contratos com clientes |
| `clientes` | Clientes do escritório |
| `bonificacoes` | Bônus por prestador/mês |
| `configuracoes` | Configurações gerais do sistema |

Storage bucket: `comprovantes` (comprovantes de pagamento + recibos PDF)

---

## Contexto e motivação

O controle financeiro do escritório era feito em planilhas sem rastreabilidade. Pagamentos a prestadores eram registrados manualmente, sem histórico e sem documentação. O Hensin Financeiro foi criado para resolver isso: cada pagamento é registrado, documentado com comprovante, e pode gerar um recibo profissional em PDF em segundos — com registro permanente em nuvem.

---

## Desenvolvedor

**Allison Kayque da Silva**
Analista de Sistemas · Guarulhos, SP
[github.com/allysonka98](https://github.com/allysonka98)
ENDOFFILE