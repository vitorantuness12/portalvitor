
## Otimização Mobile da Página /admin/cursos

### Problemas Identificados
Analisando o código atual, identifiquei os seguintes pontos que precisam de otimização para dispositivos móveis:

1. **Cards Mobile com muitos botões na mesma linha** - Os botões de ação (Editar, Ver, Conteúdo, Regenerar, WhatsApp, Excluir) estão todos em uma única linha, causando overflow ou compressão em telas pequenas
2. **Header com botão "Criar com IA"** - O botão pode ficar apertado em telas muito pequenas
3. **Campo de busca** - Precisa ocupar toda a largura em mobile
4. **Modal de Conteúdo (CourseContentModal)** - Usa Dialog que não é ideal para mobile; deveria usar Drawer (slide de baixo para cima) para melhor UX
5. **Badges e informações do curso** - Podem ficar muito comprimidos em telas pequenas

### Solução Proposta

**1. Reorganizar botões de ação no card mobile**
- Dividir os botões em duas linhas:
  - Linha 1: Botões principais (Editar, Ver, Ver Conteúdo)
  - Linha 2: Botões secundários (Regenerar, WhatsApp, Excluir)
- Usar `flex-wrap` para adaptar automaticamente

**2. Usar Drawer no mobile para CourseContentModal**
- Implementar padrão responsivo: Dialog em desktop, Drawer em mobile
- Usar o hook `useIsMobile()` já existente para detectar o dispositivo
- O Drawer desliza de baixo para cima, oferecendo melhor experiência tátil

**3. Melhorias gerais de layout**
- Campo de busca com largura total em mobile (`max-w-sm` só em desktop)
- Ajustar espaçamentos e tamanhos de fonte para telas pequenas
- Garantir que badges e informações do curso usem layout flexível

### Alterações Técnicas

**1. `src/pages/admin/Courses.tsx`**
- Reorganizar grid dos botões de ação no card mobile
- Usar `grid grid-cols-3` para primeira linha de botões principais
- Usar `grid grid-cols-3` para segunda linha de botões secundários
- Ajustar campo de busca para `max-w-full sm:max-w-sm`

**2. `src/components/admin/CourseContentModal.tsx`**
- Importar `Drawer` components e `useIsMobile` hook
- Renderizar condicionalmente `Drawer` (mobile) ou `Dialog` (desktop)
- Ajustar altura do modal: `h-[90vh]` no Drawer para ocupar mais tela
- Adicionar padding inferior seguro para área do notch em dispositivos iOS

### Estrutura do Card Mobile Otimizado

```text
+--------------------------------------------+
| [Thumbnail]  Título do Curso               |
|              Categoria                     |
+--------------------------------------------+
| [Nível] [Duração] [Preço] [Status]         |
+--------------------------------------------+
| [Editar]    [Ver]       [Conteúdo]         |
| [Regenerar] [WhatsApp]  [Excluir]          |
+--------------------------------------------+
```

### Comportamento Responsivo do Modal

```text
Desktop (>768px):          Mobile (≤768px):
+-------------------+      +-------------------+
| Dialog centrado   |      | Drawer de baixo   |
| na tela           |      | para cima         |
+-------------------+      +-------------------+
```
