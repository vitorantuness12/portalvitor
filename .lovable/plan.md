
# Restringir Download PDF para Admin

## O que muda
- O botao "Baixar PDF" so aparecera para administradores
- Usuarios comuns verao apenas o botao "Comprar Impresso"

## Detalhes tecnicos

### Arquivo: `src/components/courses/CourseDownloadActions.tsx`
1. Importar o hook `useAuth` de `@/hooks/useAuth`
2. Usar `const { isAdmin } = useAuth()` dentro do componente
3. Envolver o botao "Baixar PDF" em uma condicional `{isAdmin && (...)}`
4. Manter o botao "Comprar Impresso" visivel para todos

Nenhuma alteracao de banco de dados e necessaria -- o hook `useAuth` ja verifica a role admin via tabela `user_roles`.
