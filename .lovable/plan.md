

# Corrigir o Assistente Virtual com IA

## Problemas identificados

1. **Erro de autenticacao**: A edge function `support-chat` usa `authSupabase.auth.getClaims(token)` que nao existe no SDK do Supabase. Isso causa erro 401 para todos os usuarios, impedindo o funcionamento do chat.

2. **Conhecimento limitado**: O prompt do sistema tem informacoes basicas. Precisa ser expandido com detalhes completos sobre todas as funcionalidades da plataforma.

## Mudancas planejadas

### 1. Corrigir autenticacao na edge function (`supabase/functions/support-chat/index.ts`)

- Substituir `getClaims(token)` por `authSupabase.auth.getUser()` que e o metodo correto do SDK
- Simplificar a validacao: se `getUser()` retornar um usuario valido, prosseguir

### 2. Expandir o prompt do sistema com conhecimento completo

O system prompt sera atualizado para incluir:

- **Paginas do sistema**: Cursos, Meus Cursos, Meu Progresso, Perfil, Meus Certificados, Carteirinha de Estudante, Suporte
- **Fluxo de matricula**: como se matricular (gratis e pago via Pix/cartao)
- **Fluxo de estudo**: modulos sequenciais, exercicios por modulo, prova final (nota minima 7.0, maximo 3 tentativas, 1h de duracao)
- **Certificados**: gerados apos aprovacao na prova, validaveis via QR code/codigo
- **Carteirinha de estudante**: digital e fisica, com validacao online
- **Perfil**: edicao de nome, WhatsApp, foto de avatar
- **Notas pessoais**: criacao de anotacoes durante o estudo
- **Download de PDF**: conteudo do curso pode ser baixado em PDF
- **PWA**: app instalavel no celular
- **Onboarding**: selecao de interesses ao criar conta
- **Pagamentos**: via Pix ou cartao de credito pelo Mercado Pago

### 3. Permitir chat sem autenticacao com limitacao

Manter a autenticacao para proteger creditos, mas melhorar a mensagem de erro para usuarios nao logados no frontend.

### Detalhes tecnicos

**Arquivo: `supabase/functions/support-chat/index.ts`**
- Remover bloco `getClaims` e substituir por `getUser()`
- Expandir `systemPrompt` com todas as informacoes da plataforma
- Manter tratamento de erros 429/402

**Arquivo: `src/components/support/SupportChat.tsx`**
- Adicionar tratamento quando o erro retornado e de autenticacao (401), sugerindo login
- Mostrar mensagem amigavel se o usuario nao estiver logado

