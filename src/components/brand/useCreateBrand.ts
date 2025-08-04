import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import supabase from "../../../services/supabase";

export function useAddBrand() {
  const queryClient = useQueryClient();

  const { mutate: addBrand, isPending } = useMutation({
    mutationFn: async ({
      name_ar,
      name_en,
      image,
    }: {
      name_ar: string;
      name_en: string;
      image?: File;
    }) => {
      let image_url = undefined;

      if (image) {
        const fileExt = image.name.split(".").pop();
        const fileName = `${Date.now()}.${fileExt}`;
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
        .insert([{ name_ar, name_en, image_url }]);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("تمت إضافة البراند بنجاح");
      queryClient.invalidateQueries({ queryKey: ["brands"] });
    },
    onError: (error) => {
      toast.error("فشل في إضافة البراند: " + error.message);
    },
  });

  return { addBrand, isPending };
}
