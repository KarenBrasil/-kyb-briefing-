# Setup Simples (sem Terminal!)

## Passo 1: Preparar a Chave da Claude API

1. Acesse [console.anthropic.com](https://console.anthropic.com)
2. Faça login (ou crie conta)
3. Vá em **API Keys**
4. Clique **Create Key**
5. Copie a chave (começa com `sk-ant-`)

## Passo 2: Adicionar a Chave no Supabase

1. Acesse seu projeto em [supabase.com](https://supabase.com)
2. Vá em **Project Settings** (engrenagem)
3. Clique em **Secrets** (aba)
4. Clique **New Secret**
5. Name: `ANTHROPIC_API_KEY`
6. Value: Cole a chave que você copiou
7. Clique **Add**

## Passo 3: Fazer Upload da Edge Function

1. No Supabase, vá em **Edge Functions** (lado esquerdo)
2. Clique **Create New Function**
3. Name: `generate-roteiros`
4. Clique **Create Function**
5. Delete o código padrão e copie o código daqui:
   - Arquivo: `supabase/functions/generate-roteiros/index.ts`
6. Cole o código
7. Clique **Deploy**

## Passo 4: Copiar a URL da Function

1. Depois que deployou, em **Edge Functions**, clique em `generate-roteiros`
2. Copie a URL (tipo `https://xxx.functions.supabase.co/generate-roteiros`)
3. Adicione no `.env` do projeto:
```
VITE_EDGE_FUNCTION_URL=https://xxx.functions.supabase.co/generate-roteiros
```

## Pronto! 🎉

A aba Organização agora funciona!

---

**Ficou com dúvida?**
- Chave Claude: [console.anthropic.com](https://console.anthropic.com)
- Supabase: [supabase.com](https://supabase.com)
