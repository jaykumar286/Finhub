"use client"

import { Button } from "@/components/ui/button"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"

import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"


import { client } from "@/lib/hono-client"
import { format } from 'date-fns'
import type { InferResponseType } from "hono/client"
import { formatCurrency } from "../../../lib/utils"
import { Actions } from "./actions"
import { AccountColumn } from "./account-column"
import { CategoryColumn } from "./category-column"

// InferResponseType
export type ResType = InferResponseType<typeof client.api.transactions.$get,200>["data"][0];


export const columns: ColumnDef<ResType>[] = 
[
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "date",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Date
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue("date"));
      return <span>{format(date, "dd MMMM, yyyy")}</span>;
    },
  },
  {
    accessorKey: "categoryName",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Category
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      return (
        <CategoryColumn
        id={row.original.id}
        categoryId={row.original.categoryId}
        categoryName={row.original.categoryName}
        />
      )
    },
  },
  {
    accessorKey: "payee",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Payee
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      return <span>{row.getValue("payee")}</span>;
    },
  },
  {
    accessorKey: "amount",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Amount
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"));
      return (
         <Badge 
           variant={amount<0 ? "destructive" : "primary"}
           className="text-xs font-medium px-3.5 py-2.5"
          >
            {formatCurrency(amount)}
          </Badge>

      )
    },
  },
  {
    accessorKey: "accountName",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        AccountName
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      return (
        <AccountColumn
          accountId={row.original.accountId}
          accountName={row.original.accountName}
        />
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <Actions id={row.original.id} />,
  },
];
