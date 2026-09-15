# Sugestões de cursos relacionados

## Objetivo
Adicionar, na página de cada curso, uma seção de descoberta abaixo das descrições e avisos, mostrando outros cursos da mesma categoria.

## Implementação
- Consultar os cursos ativos que tenham a mesma categoria do curso aberto.
- Excluir o próprio curso da lista de sugestões.
- Ordenar pelo menor preço e, em caso de empate, pelos mais recentes.
- Limitar o resultado a 4 cursos.
- Exibir a seção com o título **“Outros cursos desta categoria”** abaixo do conteúdo e dos avisos do curso.
- Reutilizar o cartão de curso já existente, preservando capa, título, carga horária, nível, preço e acesso à página do curso.
- Usar uma grade responsiva: duas colunas em telas pequenas e até quatro em telas maiores.
- Mostrar cartões de carregamento enquanto a consulta estiver em andamento e ocultar toda a seção quando não houver outro curso disponível.

## Detalhes técnicos
- Alteração concentrada na página de detalhes do curso, sem criar tabelas, funções de servidor ou novos fluxos.
- Nova consulta com cache próprio, habilitada somente quando a categoria estiver disponível, filtrando `status = active`, `category_id`, `id diferente do atual`, ordenando por `price` crescente e limitando a 4 resultados.
- Reutilização de `CourseCard` e dos tokens visuais atuais da Formak.

## Validação
- Confirmar que o curso aberto nunca aparece entre as sugestões.
- Confirmar a ordem do menor para o maior preço.
- Testar categorias com mais de quatro, menos de quatro e nenhum outro curso ativo.
- Verificar aparência e navegação em celular, PWA e computador.
- Executar a verificação de tipos e o build do projeto.
