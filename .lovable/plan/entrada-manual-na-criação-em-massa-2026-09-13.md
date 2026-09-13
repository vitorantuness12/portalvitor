# Entrada manual na criação em massa

## Objetivo
Adicionar, dentro de **Criar Cursos em Massa**, uma opção para o administrador informar vários cursos já com título, nível e valor, selecionar uma categoria comum e iniciar a geração do conteúdo.

## O que será feito
- Criar um seletor no topo do formulário com dois modos:
  - **IA define os dados**: mantém o fluxo atual sem alterações.
  - **Informar título, nível e valor**: ativa o novo fluxo manual.
- No modo manual, aceitar um curso por linha no formato `Título | nível | valor`.
- Validar cada linha antes da geração, aceitando os níveis `iniciante`, `intermediário` e `avançado`, além de valores com vírgula ou ponto.
- Exigir uma categoria comum para todos os cursos inseridos nesse lote.
- Mostrar a quantidade de linhas válidas e os erros encontrados, sem iniciar enquanto houver dados inválidos.
- Enviar título, nível, valor e categoria definidos pelo administrador para cada trabalho de geração, preservando as demais opções atuais, como carga horária, profundidade e modelo.
- Ajustar a função de criação em massa para respeitar o nível informado e não substituir categoria ou valor manuais.
- Manter fila, progresso, pausa, retomada e cancelamento existentes nos dois modos.

## Detalhes técnicos
- Alterar a tela administrativa de criação em massa e a função `generate-course-bulk`.
- Reaproveitar o fluxo assíncrono existente; não criar novas tabelas.
- Validar também no servidor os valores recebidos e limitar os níveis aos valores aceitos pelo sistema.
- Verificar tipos e o fluxo visual do novo modo após a implementação.
