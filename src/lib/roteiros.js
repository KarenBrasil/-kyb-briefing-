export async function generateRoteiros(produto, tipo, tom, linhas, formato) {
  const edgeFunctionUrl = import.meta.env.VITE_EDGE_FUNCTION_URL;

  try {
    if (!edgeFunctionUrl) {
      throw new Error("Edge Function URL não configurada. Veja SETUP_EDGE_FUNCTION.md");
    }

    const response = await fetch(edgeFunctionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        produto,
        tipo,
        tom,
        linhas,
        formato,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    const data = await response.json();
    return data.roteiros || [];
  } catch (err) {
    console.error("Erro ao gerar roteiros:", err);
    throw err;
  }
}
