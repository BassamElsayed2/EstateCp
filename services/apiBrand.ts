import supabase from "./supabase";

export async function getBrands() {
  const { data, error } = await supabase
    .from("brand")
    .select("id, name_ar, name_en, image_url");

  if (error) throw error;
  return data;
}

export async function getBrandById(id: number) {
  const { data, error } = await supabase
    .from("brand")
    .select("id, name_ar, name_en, image_url")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}
