import supabase from "./supabase";

export interface Realtor {
  id?: string;
  name: string;
  number: string;
  email: string;
  image: string;
  created_at?: string;
}

// رفع صورة الوكيل وإرجاع الرابط
export const uploadRealtorImage = async (file: File): Promise<string> => {
  const fileExt = file.name.split(".").pop();
  const fileName = `realtor-images/${Date.now()}-${Math.random()
    .toString(36)
    .substring(2)}.${fileExt}`;

  const { error } = await supabase.storage
    .from("realtor-images")
    .upload(fileName, file, {
      contentType: file.type,
    });

  if (error) throw error;

  const { data: publicUrlData } = supabase.storage
    .from("realtor-images")
    .getPublicUrl(fileName);

  return publicUrlData.publicUrl;
};

// إضافة وكيل جديد
export const createRealtor = async (
  realtorData: Omit<Realtor, "id" | "created_at">
): Promise<Realtor[]> => {
  const { data, error } = await supabase
    .from("Realtor")
    .insert([realtorData])
    .select();

  if (error) {
    console.error("Error creating realtor:", error);
    throw new Error("فشل في إنشاء الوكيل");
  }

  return data;
};

// جلب جميع الوكلاء
export const getRealtors = async (): Promise<Realtor[]> => {
  const { data, error } = await supabase
    .from("Realtor")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching realtors:", error);
    throw new Error("فشل في جلب بيانات الوكلاء");
  }

  return data || [];
};

// حذف وكيل
export const deleteRealtor = async (id: string): Promise<void> => {
  const { error } = await supabase.from("Realtor").delete().eq("id", id);

  if (error) {
    console.error("Error deleting realtor:", error);
    throw new Error("فشل في حذف الوكيل");
  }
};

// تحديث بيانات وكيل
export const updateRealtor = async (
  id: string,
  updates: Partial<Realtor>
): Promise<void> => {
  const { error } = await supabase.from("Realtor").update(updates).eq("id", id);

  if (error) {
    console.error("Error updating realtor:", error);
    throw new Error("فشل في تحديث بيانات الوكيل");
  }
};
