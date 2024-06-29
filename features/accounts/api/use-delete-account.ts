"use client";
import type { InferRequestType, InferResponseType } from "hono/client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/hono-client";
import { toast } from "sonner"

// InferResponseType
type ResType = InferResponseType<typeof client.api.accounts[":id"]["$delete"]>;

export function useDeleteAccount(id?:string) {

  const queryClient = useQueryClient();

  const mutation = useMutation<ResType, Error>({
    mutationFn: async () => {
      const res = await client.api.accounts[":id"]["$delete"]({param:{
        id
      }});
      return await res.json();
    },
    onSuccess:()=>{
        queryClient.invalidateQueries({queryKey:["accoutns"]})
        queryClient.invalidateQueries({queryKey:["accoutns",{id}]})
        queryClient.invalidateQueries({queryKey:["transactions"]})

        toast.success("Account Deleted");
    },
    onError:()=>{
        toast.error("Failed to delete account");
    }
  });

  return mutation;
}
