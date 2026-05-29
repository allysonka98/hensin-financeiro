'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type FormState = { error?: string; success?: string } | undefined

export async function salvarDadosEscritorio(
  _state: FormState,
  formData: FormData
): Promise<FormState> {
  const supabase = await createClient()

  const { error } = await supabase.from('configuracoes').upsert({
    id: 1,
    nome_escritorio: (formData.get('nome_escritorio') as string) || '',
    cnpj: (formData.get('cnpj') as string) || '',
    endereco: (formData.get('endereco') as string) || '',
    telefone: (formData.get('telefone') as string) || null,
    email: (formData.get('email') as string) || null,
  })

  if (error) return { error: error.message }

  revalidatePath('/configuracoes')
  return { success: 'Dados salvos com sucesso.' }
}

export async function adicionarCategoria(
  _state: FormState,
  formData: FormData
): Promise<FormState> {
  const supabase = await createClient()

  const nome = (formData.get('nome') as string)?.trim()
  if (!nome) return { error: 'Informe o nome da categoria.' }

  const { error } = await supabase
    .from('categorias_despesa')
    .insert({ nome })

  if (error) {
    if (error.code === '23505') return { error: 'Essa categoria já existe.' }
    return { error: error.message }
  }

  revalidatePath('/configuracoes')
  return { success: `Categoria "${nome}" adicionada.` }
}

export async function removerCategoria(id: string): Promise<FormState> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('categorias_despesa')
    .delete()
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/configuracoes')
  return undefined
}

export async function alterarSenha(
  _state: FormState,
  formData: FormData
): Promise<FormState> {
  const senhaAtual = (formData.get('senha_atual') as string) || ''
  const novaSenha = (formData.get('nova_senha') as string) || ''
  const confirmar = (formData.get('confirmar_senha') as string) || ''

  if (!senhaAtual) return { error: 'Informe a senha atual.' }
  if (!novaSenha) return { error: 'Informe a nova senha.' }
  if (novaSenha.length < 6) return { error: 'A nova senha deve ter pelo menos 6 caracteres.' }
  if (novaSenha !== confirmar) return { error: 'As senhas não coincidem.' }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return { error: 'Não foi possível identificar o usuário.' }

  const { error: authError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: senhaAtual,
  })
  if (authError) return { error: 'Senha atual incorreta.' }

  const { error } = await supabase.auth.updateUser({ password: novaSenha })
  if (error) return { error: error.message }

  return { success: 'Senha alterada com sucesso.' }
}
