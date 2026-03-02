
# Redesign da pagina Cursos para modo PWA

A pagina de cursos no PWA atualmente tem um visual de site tradicional com hero banner grande, filtros espalhados e muito espaco desperdicado. Vou transformar em um layout compacto com cara de aplicativo nativo.

## Mudancas planejadas

### 1. Layout condicional para PWA no Courses.tsx

Quando `isPwa` for true, a pagina tera um layout diferente:

- **Sem hero banner grande** - remover a secao hero-gradient com titulo e subtitulo grandes
- **Barra de busca compacta** no topo, diretamente abaixo do header, com estilo mais limpo
- **Filtros em chips horizontais com scroll** - categorias, nivel e preco como chips em uma unica linha horizontal com scroll (ao inves de linhas separadas com labels)
- **Grid 2 colunas** para os cards de cursos no mobile (ao inves de 1 coluna)
- **Cards mais compactos** no PWA - imagem menor, menos padding, texto mais condensado

### 2. Estrutura do layout PWA

```text
+---------------------------+
|        Header             |
+---------------------------+
| [🔍 Buscar cursos...    ] |
+---------------------------+
| Categorias >  scroll h.   |
| [Todas][Cat1][Cat2][...]  |
+---------------------------+
| [Todos][Iniciante][...]   |
| [Todos][Gratis][Pagos]    |
+---------------------------+
| [Card1]  [Card2]          |
| [Card3]  [Card4]          |
| [Card5]  [Card6]          |
+---------------------------+
```

### Detalhes tecnicos

**Arquivo: `src/pages/Courses.tsx`**
- Envolver o hero em `{!isPwa && (...)}` para ocultar no PWA
- No PWA, renderizar uma barra de busca compacta com padding reduzido e fundo do background (sem gradiente)
- Filtros no PWA: usar `overflow-x-auto` com `flex-nowrap` e `scrollbar-hide` para scroll horizontal nos chips, agrupando categorias, nivel e preco em blocos mais compactos sem os labels "Categorias:", "Nivel:", "Preco:"
- Grid de cursos no PWA: `grid-cols-2` com `gap-3` ao inves de `grid-cols-1 gap-4`
- Reduzir padding geral da secao de `py-8` para `py-4` no PWA

**Arquivo: `src/components/courses/CourseCard.tsx`**
- Aceitar uma prop opcional `compact?: boolean`
- Quando compact: imagem com aspect ratio menor, padding `p-3`, titulo com `text-sm`, ocultar descricao, badge de preco menor, botao menor
- Remover animacao `whileHover` no modo compact (nao faz sentido em touch)

**Arquivo: `src/pages/Courses.tsx` (chamada do CourseCard)**
- Passar `compact={isPwa}` para o CourseCard quando no modo PWA
