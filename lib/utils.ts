import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value:number){
  const amount = convertAmountFromMiliUnits(value);
  return Intl.NumberFormat("en-US",{
    style: "currency",
    currency: "USD",
    minimumFractionDigits:2
  }).format(amount);
}

export function convertAmountToMiliUnits(amount:number){
  return Math.round(amount*1000);
}

export function convertAmountFromMiliUnits(amount:number){
  return amount/1000;
}