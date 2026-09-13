# Painel de vendas em tempo real

## Objetivo
Criar uma página administrativa exclusiva para vendas de cursos, mostrando totais de compras, pagamentos pendentes e acessos liberados com atualização automática.

## Implementação
- Criar a rota `/admin/vendas` e adicionar “Vendas” ao menu administrativo.
- Consultar somente pagamentos cujo item é um curso, associando aluno e título do curso.
- Exibir indicadores de total comprado, pendente, liberado e receita confirmada.
- Exibir uma lista pesquisável e filtrável das vendas, com comprador, curso, método, valor, status e data.
- Assinar alterações da tabela de pagamentos pelo Supabase Realtime e atualizar indicadores e lista sem recarregar a página.
- Manter a página atual de pagamentos para a visão financeira geral, incluindo carteirinhas.

## Detalhes técnicos
- Reutilizar React Query, Supabase, componentes e tokens visuais existentes.
- Invalidar somente as consultas do painel quando houver INSERT ou UPDATE em pagamentos.
- Habilitar `payments` na publicação Realtime, preservando as regras de acesso administrativas existentes.
- Tratar carregamento, erro e estado vazio; manter navegação e tabela adaptadas ao celular.

## Validação
- Executar verificação de tipos/build.
- Confirmar que a nova rota abre no painel, os totais consideram apenas cursos e a assinatura Realtime é removida ao sair da página.
