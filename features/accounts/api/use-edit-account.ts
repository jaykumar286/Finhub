"use client";
import type { InferRequestType, InferResponseType } from "hono/client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/hono-client";
import { toast } from "sonner"

// InferRequestType
type ReqType = InferRequestType<typeof client.api.accounts[":id"]["$patch"]>["json"];

// InferResponseType
type ResType = InferResponseType<typeof client.api.accounts[":id"]["$patch"]>;

export function useEditAccount(id?:string) {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResType, Error, ReqType>({
    mutationFn: async (json) => {
      const res = await client.api.accounts[":id"]["$patch"]({param:{
        id
      }, json });
      return await res.json();
    },
    onSuccess:()=>{
        queryClient.invalidateQueries({queryKey:["accoutns"]})
        queryClient.invalidateQueries({queryKey:["accoutns",{id}]})
        queryClient.invalidateQueries({queryKey:["transactions"]})
        toast.success("Account Updated");
    },
    onError:()=>{
        toast.error("Failed to edit account");
    }
  });

  return mutation;
}
