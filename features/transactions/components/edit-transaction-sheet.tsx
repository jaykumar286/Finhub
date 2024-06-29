import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

import { transactionSchema } from '@/db/schema';

import { useOpenTransaction } from '../hooks/use-open-transaction';

import { TransactionForm } from './transaction-form';

import { z } from 'zod';
import { Loader2 } from 'lucide-react';

import useGetTranscation from '../api/use-get-transaction';
import { useEditTransaction } from '../api/use-edit-transaction';
import { useDeleteTransaction } from '../api/use-delete-transaction';
import useConfirm from '@/hooks/useConfirm';

import useGetCategories from './../../categories/api/use-get-categories';
import { useCreateCategory } from './../../categories/hooks/use-create-category';
import { useCreateAccount } from './../../accounts/hooks/use-create-account';
import useGetAccounts from './../../accounts/api/use-get-accounts';

const formSchema = transactionSchema.omit({ id: true });

type FormValues = z.infer<typeof formSchema>;

export function EditTransactionSheet() {
  const { isOpen, onClose, id } = useOpenTransaction();

  const transactionQuery = useGetTranscation(id);
  const editMutation = useEditTransaction(id);
  const deleteMutation = useDeleteTransaction(id);

  const [ConfirmDialog, confirm] = useConfirm(
    'Are you sure?',
    'You are about to delete transaction.',
  );

  const defaultValues = transactionQuery.data
    ? {
        accountId: transactionQuery.data.accountId,
        categoryId: transactionQuery.data.categoryId,
        amount: transactionQuery.data.amount.toString(),
        date: transactionQuery.data.date
          ? new Date(transactionQuery.data.date)
          : new Date(),
        payee: transactionQuery.data.payee,
        notes: transactionQuery.data.notes,
      }
    : {
        accountId: '',
        categoryId: '',
        amount: '',
        date: new Date(),
        payee: '',
        notes: '',
      };

  const categoryMutation = useCreateCategory();
  const categoryQuery = useGetCategories();

  const onCreateCategory = (name: string) =>
    categoryMutation.mutate({
      name,
    });
  const categoryOptions = (categoryQuery.data ?? []).map((category) => ({
    label: category.name,
    value: category.id,
  }));

  const accountMutation = useCreateAccount();
  const accountQuery = useGetAccounts();

  const onCreateAccount = (name: string) =>
    accountMutation.mutate({
      name,
    });
  const accountOptions = (accountQuery.data ?? []).map((account) => ({
    label: account.name,
    value: account.id,
  }));

  const isPending =
    accountMutation.isPending ||
    categoryMutation.isPending ||
    editMutation.isPending ||
    deleteMutation.isPending;

  const isLoading =
    accountQuery.isLoading ||
    categoryQuery.isLoading ||
    transactionQuery.isLoading;

  function handleFormSubmit(values: FormValues) {
    editMutation.mutate(values, {
      onSuccess: () => {
        onClose();
      },
    });
  }

  async function handleDelete() {
    const ok = await confirm();

    if (ok) {
      deleteMutation.mutate(undefined, {
        onSuccess: () => {
          onClose();
        },
      });
    }
  }

  return (
    <>
      <ConfirmDialog />
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="space-y-4">
          <SheetHeader>
            <SheetTitle>Edit Transication</SheetTitle>
            <SheetDescription>Edit an existing Transication</SheetDescription>
          </SheetHeader>
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="size-4 text-muted-foreground animate-spin" />
            </div>
          ) : (
            <TransactionForm
              id={id}
              defaultValues={defaultValues}
              onSubmit={handleFormSubmit}
              disabled={isPending}
              onDelete={handleDelete}
              categoryOptions={categoryOptions}
              onCreateCategory={onCreateCategory} 
              accountOptions={accountOptions}
              onCreateAccount={onCreateAccount}     
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
