import { supabase } from "./supabase";

export async function getClient(clientId) {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("client_id", clientId)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data || null;
}

export async function upsertClient(clientId, clientName, answers) {
  const { data, error } = await supabase
    .from("clients")
    .upsert(
      {
        client_id: clientId,
        client_name: clientName,
        answers,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "client_id" }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function listClients() {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function saveSnapshot(clientId, clientName, answers, savedAt) {
  const { data, error } = await supabase
    .from("briefing_snapshots")
    .insert({
      client_id: clientId,
      client_name: clientName,
      answers,
      saved_at: new Date(savedAt).toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function listSnapshots(clientId) {
  const { data, error } = await supabase
    .from("briefing_snapshots")
    .select("*")
    .eq("client_id", clientId)
    .order("saved_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function deleteSnapshot(clientId, savedAt) {
  const { error } = await supabase
    .from("briefing_snapshots")
    .delete()
    .eq("client_id", clientId)
    .eq("saved_at", new Date(savedAt).toISOString());

  if (error) throw error;
}

export async function getMeta(clientId) {
  const { data, error } = await supabase
    .from("client_meta")
    .select("*")
    .eq("client_id", clientId)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  
  // Return default empty values if meta doesn't exist
  if (!data) return { checklist: {}, links: [], playlist: "", ideias: [], referencias: [], formatos: [] };
  
  return {
    ...data,
    ideias: data.ideias || [],
    referencias: data.referencias || [],
    formatos: data.formatos || []
  };
}

export async function saveMeta(clientId, checklist, links, playlist, ideias, referencias, formatos) {
  const { data, error } = await supabase
    .from("client_meta")
    .upsert(
      {
        client_id: clientId,
        checklist,
        links,
        playlist,
        ideias: ideias || [],
        referencias: referencias || [],
        formatos: formatos || [],
        updated_at: new Date().toISOString(),
      },
      { onConflict: "client_id" }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Roteiros - Salvar roteiro gerado
export async function saveRoteiro(clientId, produto, tipo, tom, linhas, formato, roteiros) {
  const { data, error } = await supabase
    .from("roteiros")
    .insert({
      client_id: clientId,
      produto,
      tipo,
      tom,
      linhas,
      formato,
      roteiros_data: roteiros,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Roteiros - Listar roteiros do cliente
export async function listRoteiros(clientId) {
  const { data, error } = await supabase
    .from("roteiros")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

// Roteiros - Deletar roteiro
export async function deleteRoteiro(roteiroId) {
  const { error } = await supabase
    .from("roteiros")
    .delete()
    .eq("id", roteiroId);

  if (error) throw error;
}

// Organización - Salvar dados (ideias, referências, formatos)
export async function saveOrganizacao(clientId, ideias, referencias, formatos) {
  const { data, error } = await supabase
    .from("organizacao")
    .upsert(
      {
        client_id: clientId,
        ideias: ideias || [],
        referencias: referencias || [],
        formatos: formatos || [],
        updated_at: new Date().toISOString(),
      },
      { onConflict: "client_id" }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Organización - Obter dados
export async function getOrganizacao(clientId) {
  const { data, error } = await supabase
    .from("organizacao")
    .select("*")
    .eq("client_id", clientId)
    .single();

  if (error && error.code !== "PGRST116") throw error;

  if (!data) return { ideias: [], referencias: [], formatos: [] };

  return {
    ideias: data.ideias || [],
    referencias: data.referencias || [],
    formatos: data.formatos || [],
  };
}
