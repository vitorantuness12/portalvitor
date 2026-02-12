
# Baixar Curso em PDF e Comprar Impresso

## O que sera feito

1. **Botao "Baixar PDF"** - Gera um PDF completo do curso com todos os modulos formatados, usando a biblioteca @react-pdf/renderer que ja esta instalada no projeto.

2. **Botao "Comprar Impresso"** - Redireciona para o WhatsApp com uma mensagem pre-formatada contendo o nome do curso e interesse na versao impressa.

3. **Onde os botoes aparecem** - Na pagina de estudo do curso (CourseStudy.tsx), no cabecalho, acessiveis tanto no desktop quanto no mobile.

## Detalhes Tecnicos

### 1. Novo componente: `src/components/courses/CoursePdfDocument.tsx`
- Componente React PDF que renderiza todos os modulos do curso em paginas A4
- Capa com titulo do curso, duracao e nivel
- Cada modulo em uma nova secao com titulo e conteudo formatado
- Estilizacao profissional com cores da marca

### 2. Novo componente: `src/components/courses/CourseDownloadActions.tsx`
- Dois botoes: "Baixar PDF" e "Comprar Impresso"
- O botao PDF usa `@react-pdf/renderer` com `pdf().toBlob()` para gerar e baixar
- O botao Impresso abre `https://wa.me/NUMERO?text=mensagem` com mensagem automatica
- O numero do WhatsApp sera configuravel (vou pedir para voce digitar)

### 3. Alteracao: `src/pages/CourseStudy.tsx`
- Adicionar os botoes de acao no cabecalho da pagina, ao lado do progresso
- Botoes aparecem tanto em mobile quanto desktop

### Numero do WhatsApp
Preciso que voce me informe o numero do WhatsApp com DDD e codigo do pais (ex: 5511999999999) para configurar o botao "Comprar Impresso". Posso colocar um numero padrao e voce altera depois.
