

## Remover Selo PREMIUM e Texto QUALIDADE

### Alteração Solicitada
Manter apenas o selo dourado no canto direito do certificado PDF, removendo:
1. O selo esquerdo (PREMIUM - fundo azul com estrela dourada)
2. O texto "QUALIDADE" abaixo do selo direito

### Alterações Técnicas

**Arquivo: `src/pages/CourseCertificate.tsx`**

1. **Remover o bloco do Left Badge** (linhas 464-474):
   - Deletar completamente o elemento `<View style={styles.badgeLeft}>...</View>`

2. **Remover o texto do Right Badge** (linha 485):
   - Deletar a linha `<Text style={[styles.badgeText, { color: primaryColor }]}>{rightBadgeText}</Text>`

### Resultado Visual

```text
+------------------------------------------+
|                               [★]        |
|                                          |
|            CERTIFICADO                   |
|          DE CONCLUSÃO                    |
|                                          |
|        João da Silva                     |
|        ──────●──────                     |
|                                          |
+------------------------------------------+
```

### Código Final do Badge
```typescript
{/* Right Badge/Seal */}
<View style={styles.badgeRight}>
  {config?.right_badge_url ? (
    <Image src={config.right_badge_url} style={styles.badgeImage} />
  ) : (
    <View style={[styles.badgeCircle, { backgroundColor: secondaryColor, borderColor: secondaryColor }]}>
      <BadgeStar color="#FFFFFF" />
    </View>
  )}
</View>
```

