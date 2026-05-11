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

    const apiKey = Deno.env.get("GEMINI_API_KEY") || "AIzaSyCTLYo7LrBImM-Og75ScoSVYrFCHNfkIqA"

    if (!apiKey) {
      throw new Error("GEMINI_API_KEY not configured")
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: 4000,
        },
      }),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      throw new Error(`API error: ${response.status} - ${errorBody}`)
    }

    const data = await response.json()
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error(`Invalid response structure: ${JSON.stringify(data)}`)
    }
    const content = data.candidates[0].content.parts[0].text

    // Parse JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      console.error("Content received:", content)
      throw new Error(`Failed to parse roteiros. Content: ${content.substring(0, 500)}`)
    }

    let roteiros
    try {
      roteiros = JSON.parse(jsonMatch[0])
    } catch (parseErr) {
      throw new Error(`JSON parse error: ${parseErr.message}. Content: ${jsonMatch[0].substring(0, 500)}`)
    }

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
