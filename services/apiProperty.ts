import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

interface PropertyFormData {
  nameAr: string;
  nameEn: string;
  operation: string;
  type: string;
  bedrooms: string;
  bathrooms: string;
  area: string;
  price: string;
  addressAr: string;
  addressEn: string;
  detailsAr: string;
  detailsEn: string;
  mapUrl: string;
  images: string[];
  isSpecial: boolean;
}

interface Property {
  id: string;
  name_ar: string;
  name_en: string;
  operation: string;
  type: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  price: number;
  address_ar: string;
  address_en: string;
  details_ar: string;
  details_en: string;
  map_url: string;
  images: string[];
  isSpecial: boolean;
  created_at: string;
}

export const uploadPropertyImages = async (
  files: FileList
): Promise<string[]> => {
  const supabase = createClientComponentClient();
  const imageUrls: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;

      // Log file details for debugging
      console.log("Uploading file:", {
        name: file.name,
        type: file.type,
        size: file.size,
        fileName: fileName,
      });

      const { data, error } = await supabase.storage
        .from("property-images")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        console.error("Supabase upload error:", error);
        throw new Error(`Failed to upload image: ${error.message}`);
      }

      if (!data) {
        throw new Error("No data returned from upload");
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("property-images").getPublicUrl(fileName);

      if (!publicUrl) {
        throw new Error("Failed to get public URL for uploaded image");
      }

      imageUrls.push(publicUrl);
    } catch (error) {
      console.error("Error uploading image:", error);
      // Rethrow with more context
      throw new Error(
        `Failed to upload image ${file.name}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  return imageUrls;
};

export const checkSpecialPropertyExists = async (): Promise<boolean> => {
  const supabase = createClientComponentClient();

  try {
    const { data, error } = await supabase
      .from("properties")
      .select("id")
      .eq("isSpecial", true)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "no rows returned"
      throw error;
    }

    return !!data; // Returns true if a special property exists, false otherwise
  } catch (error) {
    console.error("Error checking special property:", error);
    throw error;
  }
};

export const createProperty = async (
  formData: PropertyFormData,
  imageUrls: string[]
) => {
  const supabase = createClientComponentClient();

  try {
    const { error: insertError } = await supabase.from("properties").insert([
      {
        name_ar: formData.nameAr,
        name_en: formData.nameEn,
        operation: formData.operation,
        type: formData.type,
        bedrooms: parseInt(formData.bedrooms),
        bathrooms: parseInt(formData.bathrooms),
        area: parseFloat(formData.area),
        price: parseFloat(formData.price),
        address_ar: formData.addressAr,
        address_en: formData.addressEn,
        details_ar: formData.detailsAr,
        details_en: formData.detailsEn,
        map_url: formData.mapUrl,
        images: imageUrls,
        isSpecial: formData.isSpecial,
        created_at: new Date().toISOString(),
      },
    ]);

    if (insertError) throw insertError;
    return { success: true };
  } catch (error) {
    console.error("Error creating property:", error);
    throw error;
  }
};

export const getPropertyById = async (id: string): Promise<Property> => {
  const supabase = createClientComponentClient();

  try {
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    if (!data) throw new Error("العقار غير موجود");

    return data;
  } catch (error) {
    console.error("Error fetching property:", error);
    throw error;
  }
};

export const updateProperty = async (
  id: string,
  formData: PropertyFormData
) => {
  const supabase = createClientComponentClient();

  try {
    const { error: updateError } = await supabase
      .from("properties")
      .update({
        name_ar: formData.nameAr,
        name_en: formData.nameEn,
        operation: formData.operation,
        type: formData.type,
        bedrooms: parseInt(formData.bedrooms),
        bathrooms: parseInt(formData.bathrooms),
        area: parseFloat(formData.area),
        price: parseFloat(formData.price),
        address_ar: formData.addressAr,
        address_en: formData.addressEn,
        details_ar: formData.detailsAr,
        details_en: formData.detailsEn,
        map_url: formData.mapUrl,
        images: formData.images,
        isSpecial: formData.isSpecial,
      })
      .eq("id", id);

    if (updateError) throw updateError;
    return { success: true };
  } catch (error) {
    console.error("Error updating property:", error);
    throw error;
  }
};
