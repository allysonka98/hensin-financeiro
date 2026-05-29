import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import ConfiguracoesClient from './_components/ConfiguracoesClient'
import type { Configuracao, CategoriaDespesa } from '@/types'

export interface UsuarioSistema {
  id: string
  email: string
  created_at: string
}

export default async function ConfiguracoesPage() {
  const supabase = await createClient()

  const [{ data: config }, { data: categorias }] = await Promise.all([
    supabase.from('configuracoes').select('*').eq('id', 1).single(),
    supabase.from('categorias_despesa').select('*').order('nome'),
  ])

  const defaultConfig: Configuracao = {
    id: 1,
    nome_escritorio: '',
    cnpj: '',
    endereco: '',
    telefone: null,
    email: null,
  }

  let usuarios: UsuarioSistema[] = []
  try {
    const adminClient = createAdminClient()
    if (adminClient) {
      const { data } = await adminClient.auth.admin.listUsers({ perPage: 100 })
      usuarios = (data?.users ?? []).map(u => ({
        id: u.id,
        email: u.email ?? '—',
        created_at: u.created_at,
      }))
    }
  } catch {
    // Service role key not configured — skip users list
  }

  return (
    <ConfiguracoesClient
      config={(config as Configuracao | null) ?? defaultConfig}
      categorias={(categorias ?? []) as CategoriaDespesa[]}
      usuarios={usuarios}
    />
  )
}
