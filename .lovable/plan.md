
## Objetivo (pedido do usuário)
1) Voltar o download da carteirinha de **JPG para PNG**.  
2) Ajustar o layout para que **todas as informações caibam** dentro da carteirinha **no preview e no PNG**.  
3) Corrigir o problema do **nome do aluno “cortado”** (normalmente por truncamento/ellipsis ou falta de espaço no bloco do nome).

---

## Diagnóstico rápido (o que está acontecendo hoje)
- O download está em **JPG** porque a função em `src/pages/StudentCard.tsx` foi renomeada para `downloadCardSideJpg` e usa:
  - `canvas.toDataURL('image/jpeg', 0.95)`
  - arquivo `.jpg`
  - `backgroundColor: '#ffffff'`
- No componente `src/components/studentCard/StudentCardPreview.tsx`, o nome usa `truncate`, o que **corta o nome** em uma linha quando é longo. Para o usuário isso aparece como “cortar ao meio”.
- Além disso, o card tem `overflow-hidden` e vários elementos com tamanhos fixos (foto, paddings, header/footer). Se somar tudo e “estourar” a altura útil, alguma parte pode parecer “cortada” visualmente.

---

## Mudanças propostas (alto nível)
### A) Reverter o download para PNG
**Arquivo:** `src/pages/StudentCard.tsx`
- Renomear `downloadCardSideJpg` → `downloadCardSidePng` (ou manter nome neutro tipo `downloadCardSideImage`, mas a pedido do usuário vamos voltar ao padrão PNG).
- Trocar:
  - `link.download` de `.jpg` → `.png`
  - `canvas.toDataURL('image/jpeg', 0.95)` → `canvas.toDataURL('image/png')`
  - `console.error('Error generating JPG'...)` → `...PNG...`
- Ajustar os botões “Baixar Frente/Verso” para chamarem novamente a função PNG.
- No `html2canvas`, voltar `backgroundColor` para `null` (ou remover a propriedade), já que PNG suporta transparência e o card já tem fundo próprio (gradiente/white).

### B) Fazer o conteúdo caber e parar de “cortar” o nome (preview e export)
**Arquivo:** `src/components/studentCard/StudentCardPreview.tsx`

1) **Aumentar margem interna (padding)**
- Trocar `p-4` por `p-5` (ou `p-[18px]` se precisar de ajuste fino).
- Compensar reduzindo um pouco os elementos (foto/textos) para manter o conteúdo dentro da altura.

2) **Reduzir levemente foto e tipografias**
No lado “front”:
- Foto: `w-[72px] h-24` → algo como `w-16 h-20` (redução leve, mas perceptível).
- Gap: `gap-4` → `gap-3`
- Títulos/labels: `text-[9px]` → `text-[8px]` (ou manter 9px e reduzir apenas espaçamentos; decidiremos com base no melhor encaixe).
- Valores: nome `text-[14px]` → `text-[12px]` ou `text-[13px]` com `leading-tight`.
- QR: `size={26}` → `size={22}` ou `size={24}`.

3) **Corrigir o “nome cortado”**
- Remover `truncate` do nome (porque ele sempre vai cortar nomes longos).
- Permitir até **2 linhas**, com “clamp” simples via estilo inline (sem depender de plugin do Tailwind), por exemplo:
  - `overflow: hidden`
  - `display: -webkit-box`
  - `WebkitLineClamp: 2`
  - `WebkitBoxOrient: vertical`
- Reservar altura para o bloco do nome (ex.: `min-h`/`max-h`) para garantir que “Código” e “Válido até” não sejam empurrados para fora do card.

4) **Ajustar espaçamentos verticais para garantir que nada ultrapasse**
- Reduzir `mb-3` do header para `mb-2`
- Reduzir `mt-2` entre seções para `mt-1.5` (ou `mt-1`)
- Manter `mt-auto` no footer (isso está correto), mas garantir que o conteúdo total caiba antes do footer.

5) **Garantir consistência entre preview e export**
- Continuar usando `exportMode` (já existe) para evitar transforms/animações no export.
- Garantir que as mudanças de layout ocorram **no mesmo componente** (StudentCardPreview), assim preview e export ficam idênticos.

---

## Passo a passo de implementação
1) Editar `src/pages/StudentCard.tsx`:
   - Reverter função de download para PNG (nome, extensão, toDataURL, logs e handlers dos botões).
2) Editar `src/components/studentCard/StudentCardPreview.tsx` (lado front principalmente; revisar back também para manter margens consistentes):
   - Aumentar padding interno.
   - Reduzir foto/textos/gaps.
   - Remover `truncate` do nome e aplicar “2 linhas no máximo” com clamp.
   - Ajustar espaçamentos (header/footer) para não estourar altura.
3) Validação manual:
   - Testar com um nome curto e um nome bem longo (ex.: “Maria Eduarda de Souza Pereira Rodrigues”).
   - Conferir no preview: nada deve ficar cortado.
   - Baixar Frente e Verso em PNG: o arquivo deve abrir corretamente e bater com o preview.

---

## Critérios de aceite (o que vai estar “pronto”)
- Botões “Baixar Frente” e “Baixar Verso” geram **.png**.
- No preview e no PNG:
  - Nome não fica “cortado”; no máximo quebra em 2 linhas e o restante fica truncado de forma limpa (sem cortar letras).
  - Código e validade continuam visíveis.
  - Nada ultrapassa a borda do card.

---

## Observação (para eu ajustar exatamente ao seu gosto)
Se você preferir que o nome **nunca quebre linha** e em vez disso ele “encolha” automaticamente para caber em 1 linha (sem cortar), isso é outra estratégia (auto-fit). Posso implementar também, mas a solução de 2 linhas costuma ser mais simples e fica melhor visualmente para nomes grandes.
