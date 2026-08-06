import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { typedResolver } from "@/lib/zodResolver";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field, FieldGroup, FieldLabel, FieldError } from "@/components/ui/field";
import { FormFooter } from "@/components/common/FormFooter";
import { useSupplierPayments } from "@/hooks/useSuppliers";
import { ENUMS } from "@/types/enums";
import type { Supplier } from "@/types/models";

const schema = z.object({
  amount: z.coerce.number().min(0.01, "Must be > 0"),
  paymentDate: z.string().min(1, "Required"),
  paymentMethod: z.enum(ENUMS.SUPPLIER_PAYMENT_METHOD),
  reference: z.string().optional(),
  note: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: Supplier | null;
}

export { type PaymentFormValues };

export function SupplierPaymentDialog({ open, onOpenChange, supplier }: Props) {
  const { t } = useTranslation();
  const { createPayment, isCreatingPayment } = useSupplierPayments(supplier?.id ?? 0);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<PaymentFormValues>({
    resolver: typedResolver(schema),
    defaultValues: {
      amount: 0,
      paymentDate: new Date().toISOString().slice(0, 10),
      paymentMethod: "cash",
      reference: "",
      note: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        amount: 0,
        paymentDate: new Date().toISOString().slice(0, 10),
        paymentMethod: "cash",
        reference: "",
        note: "",
      });
    }
  }, [open, reset]);

  const watchMethod = watch("paymentMethod");

  const onSubmit = handleSubmit(async (data) => {
    await createPayment({
      amount: data.amount,
      paymentDate: data.paymentDate,
      paymentMethod: data.paymentMethod,
      reference: data.reference || undefined,
      note: data.note || undefined,
    });
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{t("suppliers.actions.addPayment")} — {supplier?.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="amount">{t("inventory.fields.unitCost")}</FieldLabel>
              <Input id="amount" type="number" step="0.01" {...register("amount")} />
              {errors.amount && <FieldError>{errors.amount.message}</FieldError>}
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="paymentDate">{t("inventory.fields.receivedDate")}</FieldLabel>
                <Input id="paymentDate" type="date" {...register("paymentDate")} />
                {errors.paymentDate && <FieldError>{errors.paymentDate.message}</FieldError>}
              </Field>
              <Field>
                <FieldLabel>{t("inventory.fields.reason")}</FieldLabel>
                <Select value={watchMethod} onValueChange={(v) => setValue("paymentMethod", v as typeof watchMethod)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ENUMS.SUPPLIER_PAYMENT_METHOD.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="reference">{t("suppliers.fields.name")}</FieldLabel>
              <Input id="reference" {...register("reference")} />
            </Field>

            <Field>
              <FieldLabel htmlFor="note">{t("inventory.fields.note")}</FieldLabel>
              <Input id="note" {...register("note")} />
            </Field>
          </FieldGroup>

          <FormFooter onCancel={() => onOpenChange(false)} isSubmitting={isCreatingPayment} />
        </form>
      </DialogContent>
    </Dialog>
  );
}
