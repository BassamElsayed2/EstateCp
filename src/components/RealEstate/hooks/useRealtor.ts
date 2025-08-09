import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createRealtor,
  uploadRealtorImage,
  getRealtors,
  deleteRealtor,
  updateRealtor,
  Realtor,
} from "../../../../services/apiRealtor";

// Hook for fetching all realtors
export const useRealtors = () => {
  return useQuery({
    queryKey: ["realtors"],
    queryFn: getRealtors,
  });
};

// Hook for creating a new realtor
export const useCreateRealtor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      number: string;
      email: string;
      image: string;
    }) => {
      return await createRealtor(data);
    },
    onSuccess: () => {
      // Invalidate and refetch realtors list
      queryClient.invalidateQueries({ queryKey: ["realtors"] });
    },
  });
};

// Hook for uploading realtor image
export const useUploadRealtorImage = () => {
  return useMutation({
    mutationFn: (file: File) => uploadRealtorImage(file),
  });
};

// Hook for deleting a realtor
export const useDeleteRealtor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteRealtor(id),
    onSuccess: () => {
      // Invalidate and refetch realtors list
      queryClient.invalidateQueries({ queryKey: ["realtors"] });
    },
  });
};

// Hook for updating a realtor
export const useUpdateRealtor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Realtor> }) =>
      updateRealtor(id, updates),
    onSuccess: () => {
      // Invalidate and refetch realtors list
      queryClient.invalidateQueries({ queryKey: ["realtors"] });
    },
  });
};
