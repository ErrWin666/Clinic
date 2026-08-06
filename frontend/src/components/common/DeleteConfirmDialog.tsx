import { useTranslation } from "react-i18next";
import { Spinner } from "@/components/ui/spinner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogMedia,
} from "@/components/ui/alert-dialog";
import { Trash2Icon } from "lucide-react";

interface DeleteConfirmDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  itemName: string;
  itemType: string;
  isPending?: boolean;
}

export function DeleteConfirmDialog({
  open,
  onConfirm,
  onCancel,
  itemName,
  itemType,
  isPending = false,
}: DeleteConfirmDialogProps) {
  const { t } = useTranslation();

  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive ring-1 ring-destructive/20 animate-pulse-glow">
            <Trash2Icon className="size-6" />
          </AlertDialogMedia>
          <AlertDialogTitle>{t("dialogs.deleteTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("dialogs.deleteConfirm", { type: t(itemType), name: itemName })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel} disabled={isPending}>
            {t("common.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending && <Spinner className="size-4" />}
            {t("dialogs.delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
