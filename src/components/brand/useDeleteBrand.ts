import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import supabase from "../../../services/supabase";

export function useDeleteBrand() {
  const queryClient = useQueryClient();

  const { mutate: deleteBrand, isPending } = useMutation({
    mutationFn: async (id: string) => {
      // First, get the brand to check if it has an image
      const { data: brand, error: fetchError } = await supabase
        .from("brand")
        .select("image_url")
        .eq("id", id)
        .single();

      if (fetchError) throw new Error(fetchError.message);

      // If the brand has an image, delete it from storage
      if (brand?.image_url) {
        // Extract the file name from the URL
        const imageUrl = new URL(brand.image_url);
        const fileName = imageUrl.pathname.split("/").pop();

        if (fileName) {
          const { error: deleteImageError } = await supabase.storage
            .from("brand")
            .remove([fileName]);

          if (deleteImageError) {
            console.error("Error deleting image:", deleteImageError);
            // Continue with brand deletion even if image deletion fails
          }
        }
      }

      // Delete the brand
      const { error } = await supabase.from("brand").delete().eq("id", id);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("تم حذف البراند بنجاح");
      queryClient.invalidateQueries({ queryKey: ["brands"] });
    },
    onError: (error) => {
      toast.error("فشل في حذف البراند: " + error.message);
    },
  });

  return { deleteBrand, isPending };
}
