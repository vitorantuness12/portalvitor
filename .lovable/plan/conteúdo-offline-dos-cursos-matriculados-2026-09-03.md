# Conteúdo offline dos cursos matriculados

Permitir que o aluno baixe, no app, o conteúdo dos cursos em que está matriculado e leia sem internet. Exercícios e prova continuam exigindo conexão.

## Como vai funcionar para o aluno

1. Na página de estudo do curso (e no card em "Meus Cursos"), aparece um botão **"Baixar para offline"**.
2. Ao tocar, o app salva no dispositivo: título, descrição, carga horária e todos os módulos (texto completo) — sem imagens pesadas.
3. Após baixar, o botão vira **"Disponível offline"** com opção de **Remover download** e a data da última atualização.
4. Sem internet:
   - A aba **Conteúdo** abre normalmente a partir do que foi baixado, com um aviso discreto "Modo offline".
   - As abas **Exercícios** e **Prova** ficam bloqueadas com a mensagem "Conecte-se à internet para fazer os exercícios e a prova".
   - O progresso concluído offline fica pendente e é enviado automaticamente quando a conexão voltar.
5. Cursos ainda não baixados, acessados sem internet, mostram estado "Sem conexão — baixe este curso quando estiver online".

## Detalhes técnicos

- **Armazenamento**: IndexedDB via `idb-keyval` (leve), store `formak-offline-courses`, chave = `courseId`, valor = `{ courseId, title, description, durationHours, level, modules, savedAt, version }`. IndexedDB evita o limite de ~5 MB do localStorage, já que os módulos podem ter dezenas de milhares de palavras.
- **Novo hook** `src/hooks/useOfflineCourse.ts`: expõe `isSaved`, `savedAt`, `save()`, `remove()`, `offlineData`.
- **Novo hook** `src/hooks/useOnlineStatus.ts`: escuta `online`/`offline` do navegador.
- **Novo componente** `src/components/courses/OfflineDownloadButton.tsx`: estados baixar / baixando / disponível offline / remover, com toasts.
- **`src/pages/CourseStudy.tsx`**:
  - Módulos passam a vir de `course.content_pdf_url` quando online e do IndexedDB quando offline (ou quando a query falha).
  - Botão de download ao lado das ações existentes do curso.
  - `TabsTrigger` de exercícios e prova desabilitados quando `!online`, com aviso.
  - Atualização de progresso: se offline, guarda em fila local e sincroniza no evento `online`.
- **`src/pages/MyCourses.tsx`**: ícone/botão de download offline por curso matriculado.
- **Service worker (vite-plugin-pwa)**: adicionar `navigateFallback` para que a rota `/curso/:id/estudar` abra offline a partir do app shell já cacheado. Nenhuma mudança em dados do Supabase é necessária.
- Sem alterações de banco de dados, RLS ou edge functions.
