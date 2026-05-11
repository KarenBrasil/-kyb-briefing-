import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { produto, tipo, tom, linhas, formato } = await req.json()

    const tipoStr = [
      tipo.fisico && "Produto físico",
      tipo.digital && "Produto digital"
    ].filter(Boolean).join(" + ")

    const prompt = `Gere exatamente 10 roteiros para vídeos sobre o produto: "${produto}"

Especificações:
- Tipo: ${tipoStr}
- Tom: ${tom}
- Formato: ${formato}
- Comprimento: ${linhas} linhas aproximadamente cada um

Para cada roteiro, inclua:
1. Título do roteiro
2. Hook (primeiras linhas para prender atenção)
3. Corpo do roteiro (${linhas} linhas)
4. CTA (chamada para ação no final)

Formate como JSON array com 10 objetos, cada um com: {titulo, hook, corpo, cta}

Seja criativo, variado, e focado em conversão. Use linguagem natural e engajadora.`

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": Deno.env.get("ANTHROPIC_API_KEY") || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 4000,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.content[0].text

    // Parse JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      throw new Error("Failed to parse roteiros")
    }

    const roteiros = JSON.parse(jsonMatch[0])

    return new Response(JSON.stringify({ roteiros: roteiros.slice(0, 10) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
