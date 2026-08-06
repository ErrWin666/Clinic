import { useTranslation } from "react-i18next";
import { FormSection } from "@/components/common/FormSection";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Field, FieldLabel } from "@/components/ui/field";
import { DollarSignIcon } from "lucide-react";
import { config } from "@/lib/config";
import type { UseFormReturn } from "react-hook-form";
import type { InvoiceFormValues } from "@/types/invoice";

type FormType = UseFormReturn<InvoiceFormValues>;

interface InvoiceFinancialsProps {
  register: FormType["register"];
  subtotal: number;
  calculatedTotal: number;
}

export function InvoiceFinancials({
  register,
  subtotal,
  calculatedTotal,
}: InvoiceFinancialsProps) {
  const { t } = useTranslation();

  return (
    <FormSection
      icon={DollarSignIcon}
      title={t("invoices.fields.total")}
      accentClass="bg-muted text-muted-foreground"
    >
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <Field>
            <FieldLabel>{t("invoices.fields.taxAmount")}</FieldLabel>
            <Input
              type="number"
              step="0.01"
              min={0}
              {...register("taxAmount", { valueAsNumber: true })}
            />
          </Field>
          <Field>
            <FieldLabel>{t("invoices.fields.discountAmount")}</FieldLabel>
            <Input
              type="number"
              step="0.01"
              min={0}
              {...register("discountAmount", { valueAsNumber: true })}
            />
          </Field>
        </div>
        <Separator />
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t("invoices.subtotalCalc")}</span>
          <span className="font-mono font-medium">
            {subtotal.toFixed(2)} {config.defaultCurrency}
          </span>
        </div>
        <div className="flex items-center justify-between text-base font-semibold">
          <span>{t("invoices.totalCalc")}</span>
          <span className="font-mono">
            {calculatedTotal.toFixed(2)} {config.defaultCurrency}
          </span>
        </div>
      </div>
    </FormSection>
  );
}
