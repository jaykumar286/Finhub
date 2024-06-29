"use client";
import type {InferResponseType } from "hono/client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/hono-client";
import { toast } from "sonner"

// InferResponseType
type ResType = InferResponseType<typeof client.api.categories[":id"]["$delete"]>;

export function useDeleteCategory(id?:string) {

  const queryClient = useQueryClient();

  const mutation = useMutation<ResType, Error>({
    mutationFn: async () => {
      const res = await client.api.categories[":id"]["$delete"]({param:{
        id
      }});
      return await res.json();
    },
    onSuccess:()=>{
        queryClient.invalidateQueries({queryKey:["categories"]})
        queryClient.invalidateQueries({queryKey:["categories",{id}]})
        queryClient.invalidateQueries({queryKey:["transactions"]})
        toast.success("Category Deleted");
    },
    onError:()=>{
        toast.error("Failed to delete category");
    }
  });

  return mutation;
}
