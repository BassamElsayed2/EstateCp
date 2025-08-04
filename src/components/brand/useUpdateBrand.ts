import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import supabase from "../../../services/supabase";

interface UpdateBrandPayload {
  id: string;
  name_ar: string;
  name_en: string;
  image?: File;
}

export function useUpdateBrand() {
  const queryClient = useQueryClient();

  const { mutate: updateBrand, isPending } = useMutation({
    mutationFn: async ({ id, name_ar, name_en, image }: UpdateBrandPayload) => {
      let image_url = undefined;

      if (image) {
        const fileExt = image.name.split(".").pop();
        const fileName = `${id}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("brand")
          .upload(fileName, image);

        if (uploadError) throw new Error(uploadError.message);

        const {
          data: { publicUrl },
        } = supabase.storage.from("brand").getPublicUrl(fileName);

        image_url = publicUrl;
      }

      const { error } = await supabase
        .from("brand")
        .update({ name_ar, name_en, image_url })
        .eq("id", id);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("تم تحديث البراند بنجاح");
      queryClient.invalidateQueries({ queryKey: ["brands"] });
    },
    onError: (error) => {
      toast.error("فشل في تحديث البراند: " + error.message);
    },
  });

  return { updateBrand, isPending };
}
