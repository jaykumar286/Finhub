"use client"

import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";


import { useNewTransaction } from "@/features/transactions/hooks/use-new-transaction";
import { useBulkDeleteTransactions } from './../../../features/transactions/api/use-bulk-delete-transactions';


import { Loader2, Plus } from "lucide-react";
import { columns } from "./columns";

import { Skeleton } from "@/components/ui/skeleton";
import useGetTransactions from "@/features/transactions/api/use-get-transactions";


export default function TransactionPage() {
  const newTransaction = useNewTransaction();
  const getTransactionQuery = useGetTransactions();
  const deleteTransactionQuery = useBulkDeleteTransactions();

  const transactionData = getTransactionQuery.data || [];

  const isDisabled = getTransactionQuery.isLoading || deleteTransactionQuery.isPending;

  if (getTransactionQuery.isLoading){
    return (
      <div className="max-w-screen-2xl mx-auto w-full pb-10 -mt-24">
        <Card className="border-none drop-shadow-sm">
        <CardHeader>
          <Skeleton className="h-8 w-48"/>
        </CardHeader>
        <CardContent>
          <div className="h-[500px] w-full flex items-center justify-center">
            <Loader2 className="size-6 text-slate-300 animate-spin"/>
          </div>
        </CardContent>
        </Card>
      </div>
    )
  }
  return (
    <div className="max-w-screen-2xl mx-auto w-full pb-10 -mt-24">
        <Card className="border-none drop-shadow-sm p-5">
            <CardHeader className="gap-y-2 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle className="text-xl line-clamp-1">Transaction history</CardTitle>
            <Button size='sm' onClick={newTransaction.onOpen}>
                <Plus className="size-4 mr-2"/>
                Add New
            </Button>
            </CardHeader>
            <DataTable filterKey="payee" columns={columns} data={transactionData} disabled={isDisabled} onDelete={(row)=>{
              const ids = row.map(r=>r.original.id);
              deleteTransactionQuery.mutate({ids});
            }}/>
        </Card>
    </div>
  );    
}
