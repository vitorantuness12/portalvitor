

## Plano de Alteracoes

### 1. Remover rodape em todas as paginas no modo PWA

Atualmente, algumas paginas ja ocultam o rodape no PWA (MyCourses, MyCertificates, Profile, StudentDashboard, StudentCard), mas outras ainda mostram. Vou adicionar a verificacao `useIsPwa` e condicionar `{!isPwa && <Footer />}` nas seguintes paginas:

- **CourseStudy.tsx** - tem Footer em 2 locais (loading state e desktop footer)
- **Courses.tsx** - sempre mostra Footer
- **CourseDetail.tsx** - tem Footer em 3 locais (loading, error, main)
- **CourseCertificate.tsx** - tem Footer em 2 locais
- **SupportTicket.tsx** - tem Footer em 3 locais
- **ValidateCertificate.tsx** - sempre mostra Footer
- **ValidateStudentCard.tsx** - sempre mostra Footer
- **Index.tsx** - sempre mostra Footer

### 2. Scroll para o topo ao mudar de modulo

Nas funcoes `handleModuleComplete`, `handlePrevModule` e `handleNextModule` em **CourseStudy.tsx**, adicionar `window.scrollTo({ top: 0, behavior: 'smooth' })` para que ao navegar entre modulos o usuario veja o inicio do conteudo.

### Detalhes Tecnicos

- Importar `useIsPwa` em cada pagina que ainda nao o utiliza
- Envolver cada `<Footer />` com `{!isPwa && <Footer />}`
- Adicionar `window.scrollTo({ top: 0, behavior: 'smooth' })` em `handleModuleComplete`, `handlePrevModule` e `handleNextModule`

