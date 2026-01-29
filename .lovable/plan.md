

## Visualizar Conteúdo do Curso no Admin

### Objetivo
Adicionar uma opção no painel administrativo de cursos para que o administrador possa visualizar o conteúdo completo de cada curso, incluindo módulos, exercícios e questões da prova.

### Estrutura do Conteúdo
O conteúdo do curso está armazenado em:
- **Módulos**: Campo `content_pdf_url` da tabela `courses` (armazena JSON com array de objetos `{title, content}`)
- **Exercícios**: Tabela `course_exercises`
- **Prova**: Tabela `course_exams`

### Solução Proposta
Criar um modal/dialog que exibe o conteúdo completo do curso em abas, similar à página de estudo do aluno, mas em modo somente leitura.

### Alterações Técnicas

**1. Novo Componente: `src/components/admin/CourseContentModal.tsx`**
- Modal com abas: Módulos, Exercícios e Prova
- Reutiliza o componente `FormattedContent` para renderizar o conteúdo Markdown
- Exibe exercícios e questões da prova com as opções (mostrando qual é a resposta correta)

**2. Atualizar: `src/pages/admin/Courses.tsx`**
- Adicionar estado para controlar qual curso está sendo visualizado
- Importar o ícone `BookOpenCheck` para o menu
- Adicionar opção "Ver Conteúdo" no dropdown menu de ações
- Adicionar botão de visualizar conteúdo na versão mobile
- Renderizar o modal quando um curso for selecionado

### Estrutura do Modal

```text
+------------------------------------------+
|  X  Conteúdo do Curso: [Título]          |
+------------------------------------------+
|  [Módulos]  [Exercícios]  [Prova]        |
+------------------------------------------+
|                                          |
|  Módulo 1: Introdução                    |
|  +---------------------------------+     |
|  |  Conteúdo formatado do módulo   |     |
|  +---------------------------------+     |
|                                          |
|  Módulo 2: Conceitos Básicos             |
|  +---------------------------------+     |
|  |  Conteúdo formatado do módulo   |     |
|  +---------------------------------+     |
|                                          |
+------------------------------------------+
```

### Funcionalidades
- Abas para navegar entre Módulos, Exercícios e Prova
- Módulos expansíveis/colapsáveis (accordion)
- Exercícios e Prova mostram as opções com destaque na resposta correta
- Contagem de itens em cada aba (ex: "Módulos (6)")
- Mensagem amigável se não houver conteúdo gerado ainda

### Fluxo do Usuário
1. Admin acessa a lista de cursos em `/admin/cursos`
2. Clica no menu de ações (3 pontos) de um curso
3. Seleciona "Ver Conteúdo"
4. Modal abre mostrando o conteúdo organizado em abas
5. Admin pode navegar entre módulos, exercícios e prova

