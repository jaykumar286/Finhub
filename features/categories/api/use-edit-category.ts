"use client";
import type { InferRequestType, InferResponseType } from "hono/client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/hono-client";
import { toast } from "sonner"

// InferRequestType
type ReqType = InferRequestType<typeof client.api.categories[":id"]["$patch"]>["json"];

// InferResponseType
type ResType = InferResponseType<typeof client.api.categories[":id"]["$patch"]>;

export function useEditCategory(id?:string) {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResType, Error, ReqType>({
    mutationFn: async (json) => {
      const res = await client.api.categories[":id"]["$patch"]({param:{
        id
      }, json });
      return await res.json();
    },
    onSuccess:()=>{
        queryClient.invalidateQueries({queryKey:["categories"]})
        queryClient.invalidateQueries({queryKey:["categories",{id}]})
        queryClient.invalidateQueries({queryKey:["transactions"]})
        toast.success("Category Updated");
    },
    onError:()=>{
        toast.error("Failed to edit category");
    }
  });

  return mutation;
}
