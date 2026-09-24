# Vídeo aula em todos os cursos

## Resultado esperado
- Incluir a aba **Vídeo aula** antes de **Conteúdo** na área de estudo, tanto no computador quanto no celular/PWA.
- Cada curso poderá ter **um vídeo**. Cursos existentes e novos começam sem vídeo; o administrador faz o upload somente depois que o curso estiver criado, independentemente de ter sido criado com IA ou manualmente.
- Alunos matriculados assistem ao vídeo na própria plataforma. Se ainda não houver vídeo, a aba mostra uma mensagem discreta e o conteúdo escrito continua disponível normalmente.

## Implementação
1. Adicionar ao curso um campo opcional para o caminho do vídeo e criar um espaço privado para armazenar os arquivos. Restringir envio, troca e remoção a administradores; permitir leitura somente ao administrador e a alunos matriculados no respectivo curso.
2. Na gestão de cursos, oferecer o envio, a substituição e a remoção do vídeo por curso, incluindo os cursos já existentes. Validar formatos de vídeo aceitos e limites do armazenamento, mostrar progresso/erros no upload e impedir arquivos incompletos ou associações incorretas. Usar envio retomável para arquivos grandes, conforme os limites da instalação.
3. Na área de estudo, apresentar um reprodutor adaptado a celular e computador na nova aba, com controles nativos, sem reprodução automática, e acesso temporário ao arquivo protegido. Atualizar a navegação inferior do celular para comportar cinco abas sem sobreposição. Quando não houver vídeo ou o aluno estiver offline, mostrar um estado claro sem bloquear as aulas escritas.
4. Preservar as regras atuais de matrícula, progresso, exercícios e prova. O vídeo não será baixado junto com o conteúdo teórico offline nem contará como requisito adicional de conclusão.
5. Verificar o fluxo de upload, substituição e remoção; acesso permitido ao aluno matriculado e negado a outros; comportamento dos cursos sem vídeo, dos arquivos inválidos e das abas em celular e computador.

## Detalhes técnicos
- O campo será opcional em `courses`; assim não será necessário recriar cursos ou alterar os fluxos de geração.
- O armazenamento privado usará caminhos associados ao ID do curso, políticas de acesso e links temporários para o player. Não publicar URLs permanentes dos arquivos.
- Seguir os padrões existentes do Supabase, do painel administrativo, da navegação do estudo e dos componentes visuais da Formak.
