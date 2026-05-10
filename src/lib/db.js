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
  return data || null;
}

export async function saveMeta(clientId, checklist, links, playlist) {
  const { data, error } = await supabase
    .from("client_meta")
    .upsert(
      {
        client_id: clientId,
        checklist,
        links,
        playlist,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "client_id" }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}
