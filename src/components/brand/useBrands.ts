import { useQuery } from "@tanstack/react-query";
import { getBrands } from "../../../services/apiBrand";

export function useBrands() {
  return useQuery({
    queryKey: ["brands"],
    queryFn: getBrands,
  });
}
