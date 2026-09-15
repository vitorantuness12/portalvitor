# Checkout moderno com compra conjunta de cursos

## Objetivo
Modernizar o checkout no estilo claro da Formak e permitir que o aluno adicione cursos da mesma categoria à compra atual, pagando todos juntos pelo Mercado Pago.

## Experiência de compra
- Ampliar o checkout para uma apresentação responsiva e mais visual, com resumo da compra, dados do pagador, cupom e forma de pagamento organizados sem cartões aninhados.
- Exibir o curso principal sempre selecionado e até 5 sugestões ativas da mesma categoria, priorizando os menores preços.
- Não sugerir o curso atual, cursos gratuitos nem cursos que o aluno já possui.
- Permitir adicionar ou remover sugestões com um controle claro, atualizando subtotal, desconto e total imediatamente.
- Somar os preços atuais dos cursos selecionados, sem desconto automático de conjunto, conforme definido.
- Manter Pix, estados de processamento, QR Code, confirmação automática, erros e tentativa novamente.
- Ajustar os textos de sucesso para informar quantos cursos foram liberados.

## Pagamento e liberação segura
- Criar `payment_items` para registrar cada curso incluído na cobrança, seu preço no momento da compra e sua relação com o pagamento.
- Proteger os itens com RLS: o aluno consulta apenas os próprios itens; criação e atualização financeira ficam no fluxo seguro do servidor; `service_role` mantém acesso operacional.
- Enviar ao servidor somente os IDs escolhidos; recalcular preços e disponibilidade diretamente no banco, sem confiar no total enviado pelo navegador.
- Registrar uma única cobrança em `payments` e seus cursos em `payment_items` antes de chamar o Mercado Pago.
- Ao aprovar, liberar todos os cursos da compra de forma idempotente, tanto pelo webhook quanto pela verificação manual/automática do Pix.
- Preservar pagamentos antigos: cobranças sem itens continuam liberando o único `reference_id` já registrado.
- Manter cupons: cupom geral considera o total; cupom específico de curso desconta somente o curso elegível, sem ampliar indevidamente o desconto.
- Preservar compras de trilhas e carteirinha sem alterar seus fluxos.

## Componentes e integrações
- Extrair componentes pequenos para o resumo e as sugestões do checkout, reutilizando imagem, tipografia, botões e tokens visuais existentes.
- Reaproveitar a consulta de cursos relacionados como base, adaptada ao contexto do usuário e da compra.
- Atualizar `CourseDetail` para abrir o checkout maior e invalidar as matrículas de todos os cursos comprados após a confirmação.
- Atualizar `create-payment`, `mercadopago-webhook` e `check-payment-status` para entender compras com vários cursos.
- Manter a seção atual “Outros cursos desta categoria” na página; a nova seleção ocorrerá também dentro do checkout.

## Validação
- Testar cálculo do carrinho, seleção e remoção de sugestões, aplicação e remoção de cupom e visual em celular e computador.
- Testar no servidor: curso inativo, preço adulterado, curso repetido, curso já adquirido e seleção vazia/inválida.
- Testar aprovação repetida do webhook e da consulta de status para confirmar que não cria matrículas duplicadas.
- Validar compatibilidade com pagamento antigo de um curso, Pix pendente/aprovado/rejeitado, trilha e carteirinha.
- Executar testes automatizados, verificação de tipos e build; publicar as funções atualizadas e verificar o checkout na prévia.

## Detalhes técnicos
- Nova tabela: `public.payment_items` com `payment_id`, `course_id`, `unit_price` e timestamps; chaves estrangeiras, índices, unicidade por pagamento/curso, grants e RLS na mesma migração.
- `PaymentCheckout` receberá opcionalmente os dados do curso principal e da categoria. Os demais usos continuarão compatíveis.
- Limite no servidor: curso principal mais até 5 adicionais.
- O valor e a descrição enviados ao Mercado Pago serão montados pelo backend a partir dos itens validados.
