import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export interface ProductFormData {
  name_ar: string;
  name_en: string;
  type: "digital" | "physical";
  brand_id: string;
  description_ar: string;
  description_en: string;
  price: number;
  quantity: number;
  discount: number;
  images: File[];
}

export interface Product {
  id: string;
  name_ar: string;
  name_en: string;
  type: "digital" | "physical";
  brand_id: string;
  description_ar: string;
  description_en: string;
  price: number;
  quantity: number;
  discount: number;
  images: string[];
  created_at: string;
}

export const createProduct = async (data: ProductFormData) => {
  try {
    // First upload images to Supabase Storage
    const imageUrls = await Promise.all(
      data.images.map(async (image) => {
        const fileName = `${Date.now()}-${image.name}`;
        const { error: uploadError } = await supabase.storage
          .from("productsimgs")
          .upload(fileName, image);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("productsimgs").getPublicUrl(fileName);

        return publicUrl;
      })
    );

    // Then create product record in the database
    const { data: product, error } = await supabase
      .from("products")
      .insert([
        {
          name_ar: data.name_ar,
          name_en: data.name_en,
          type: data.type,
          brand_id: data.brand_id,
          description_ar: data.description_ar,
          description_en: data.description_en,
          price: data.price,
          quantity: data.quantity,
          discount: data.discount,
          images: imageUrls,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return product;
  } catch (error) {
    throw error;
  }
};

export const getProducts = async () => {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return data as Product[];
  } catch (error) {
    throw error;
  }
};

export const deleteProduct = async (id: string) => {
  try {
    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) throw error;

    return true;
  } catch (error) {
    throw error;
  }
};

export const updateProduct = async (
  data: Partial<Product> & { id: string }
) => {
  try {
    const { id, ...updateData } = data;
    const { error } = await supabase
      .from("products")
      .update(updateData)
      .eq("id", id);

    if (error) throw error;

    return true;
  } catch (error) {
    throw error;
  }
};
