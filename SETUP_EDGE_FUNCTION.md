# Setup da Edge Function para Gerar Roteiros

## 1. Instalar Supabase CLI

```bash
npm install -g supabase
```

## 2. Login no Supabase

```bash
supabase login
```

Ele vai pedir seu email e criar um token de acesso.

## 3. Criar a Edge Function

Copie o arquivo `supabase-edge-function.ts` para:

```
supabase/functions/generate-roteiros/index.ts
```

Se a pasta não existir, crie manualmente.

## 4. Adicionar a Chave da API do Claude

No Supabase Dashboard:
1. Vá para **Project Settings → Secrets**
2. Clique **New Secret**
3. Name: `ANTHROPIC_API_KEY`
4. Value: Sua chave da Claude API (de console.anthropic.com)
5. Clique Add

## 5. Deploy da Edge Function

```bash
cd seu-projeto
supabase functions deploy generate-roteiros
```

## 6. Pegar a URL da Function

Depois do deploy, você vai ter uma URL tipo:
```
https://xxx.functions.supabase.co/generate-roteiros
```

Copie essa URL e adicione ao `.env`:
```
VITE_EDGE_FUNCTION_URL=https://xxx.functions.supabase.co/generate-roteiros
```

## 7. Pronto!

A aba de Organização agora vai chamar sua Edge Function de forma segura!

---

**Dúvidas?**
- Chave Claude: [console.anthropic.com](https://console.anthropic.com)
- Supabase Docs: [docs.supabase.com](https://docs.supabase.com)
