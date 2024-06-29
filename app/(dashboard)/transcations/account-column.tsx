import { useOpenTransaction } from "@/features/transactions/hooks/use-open-transaction";

import { useOpenAccount } from "@/features/accounts/hooks/use-open-account";

import { cn } from "@/lib/utils";
import { handle } from 'hono/vercel';

type Props = {
  accountName : string;
  accountId: string
}

export function AccountColumn({accountName,accountId}:Props){

  const {onOpen: onOpenAccount} = useOpenAccount();

  function handleClick(){
    onOpenAccount(accountId)
  }

  return (
    <div
     onClick={handleClick}
     className="flex items-center cursor-pointer hover:underline"
    >
      {accountName}
    </div>
  )
}