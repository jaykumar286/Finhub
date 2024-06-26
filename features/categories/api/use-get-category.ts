"use client";

import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/hono-client";

export default function useGetCategory(id?:string) {
  const categories = useQuery({
    enabled:!!id,
    queryKey: ["categories",{id}],
    queryFn: async () => {
      const response = await client.api.categories[":id"].$get({
        param:{id}
      });

      if (!response.ok) {
        throw new Error("Failed to fetch category");
      }

      const { data } = await response.json();
      return data;
    },
  });

  return categories;
}
