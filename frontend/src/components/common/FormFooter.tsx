import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { DialogFooter } from "@/components/ui/dialog";
import { CheckIcon, XIcon } from "lucide-react";

interface FormFooterProps {
  onCancel: () => void;
  cancelLabel?: string;
  submitLabel?: string;
  isSubmitting?: boolean;
  submitIcon?: React.ReactNode;
  submitVariant?: "default" | "destructive";
  formId?: string;
}

export function FormFooter({
  onCancel,
  cancelLabel,
  submitLabel,
  isSubmitting = false,
  submitIcon,
  submitVariant = "default",
  formId,
}: FormFooterProps) {
  const { t } = useTranslation();
  const cancel = cancelLabel ?? t("common.cancel");
  const submit = submitLabel ?? t("common.save");

  return (
    <DialogFooter className="gap-3">
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        disabled={isSubmitting}
      >
        <XIcon className="size-4" />
        {cancel}
      </Button>
      <Button
        type="submit"
        form={formId}
        disabled={isSubmitting}
        variant={submitVariant}
      >
        {isSubmitting ? (
          <Spinner className="size-4" />
        ) : (
          submitIcon ?? <CheckIcon className="size-4" />
        )}
        {submit}
      </Button>
    </DialogFooter>
  );
}
