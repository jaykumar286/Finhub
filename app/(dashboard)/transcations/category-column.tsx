import { useOpenCategory } from "@/features/categories/hooks/use-open-category";
import { TriangleAlert } from "lucide-react";

import { cn } from "@/lib/utils";

type Props = {
  id: string
  categoryName : string | null;
  categoryId: string | null
}

export function CategoryColumn({categoryName,categoryId}:Props){

  const {onOpen: onOpenCategory} = useOpenCategory();

  function handleClick(){
    if (categoryId){
      onOpenCategory(categoryId)
    }
  }

  return (
    <div
     onClick={handleClick}
     className={cn("flex items-center cursor-pointer hover:underline",
      !categoryName && "text-rose-500"
     )}
    >
      {!categoryName && <TriangleAlert className="mr-2 size-4 shrink-0"/>}
      {categoryName || "Uncategorized"}
    </div>
  )
}