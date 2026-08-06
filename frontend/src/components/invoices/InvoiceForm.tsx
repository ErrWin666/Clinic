import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import dayjs from "dayjs";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Field,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { InvoicePreview } from "@/components/invoices/InvoicePreview";
import { FormSection } from "@/components/common/FormSection";
import { InvoiceLogoUpload } from "@/components/invoices/InvoiceLogoUpload";
import { InvoiceItemsFieldArray } from "@/components/invoices/InvoiceItemsFieldArray";
import { InvoiceFinancials } from "@/components/invoices/InvoiceFinancials";
import { InvoiceBillToSection } from "@/components/invoices/InvoiceBillToSection";
import {
  useCreateInvoice,
  useUpdateInvoice,
} from "@/hooks/useInvoices";
import { useSettings } from "@/hooks/useSettings";
import { invoiceSchema, type InvoiceFormValues } from "@/types/invoice";
import type { Invoice } from "@/types/models";
import {
  ReceiptIcon,
  CalendarIcon,
  StickyNoteIcon,
  EyeIcon,
} from "lucide-react";
import { translateZodError } from "@/lib/zodError";

interface InvoiceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice?: Invoice | null;
  patientId?: number;
  onCreated?: (invoice: Invoice) => void;
}

export function InvoiceForm({
  open,
  onOpenChange,
  invoice,
  patientId,
  onCreated,
}: InvoiceFormProps) {
  const { t } = useTranslation();
  const isEdit = !!invoice;
  const { createInvoice, isCreating } = useCreateInvoice();
  const { updateInvoice, isUpdating } = useUpdateInvoice();
  const isSubmitting = isCreating || isUpdating;
  const { data: settingsData } = useSettings();
  const clinic = settingsData?.data?.clinic ?? {};
  const [linkToPatient, setLinkToPatient] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<{ id: number; fullName: string; address?: string | null; phoneNumber?: string | null; email?: string | null } | null>(null);

  // Stable primitives for clinic values used in effect deps to avoid infinite
  // loops: `clinic` is `{}` (new object each render) while settings are loading.
  const clinicAddress = (clinic.address as string) ?? "";
  const clinicPhone = (clinic.phone as string) ?? "";
  const clinicEmail = (clinic.email as string) ?? "";

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    mode: "onBlur",
    defaultValues: {
      patientId: undefined,
      customerName: "",
      customerPhone: "",
      invoiceDate: dayjs().format("YYYY-MM-DD"),
      dueDate: "",
      taxAmount: 0,
      discountAmount: 0,
      logo: "",
      items: [{ description: "", quantity: 1, unitPrice: 0, unit: "piece" }],
      noteMessage: "",
      noteContactLine: "",
      notePhone: "",
      noteEmail: "",
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
    control,
  } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchItems = watch("items");
  const watchTax = watch("taxAmount") ?? 0;
  const watchDiscount = watch("discountAmount") ?? 0;
  const watchLogo = watch("logo");

  const subtotal = (watchItems ?? []).reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
    0
  );
  const calculatedTotal = subtotal + (Number(watchTax) || 0) - (Number(watchDiscount) || 0);

  useEffect(() => {
    if (open) {
      if (invoice) {
        setLinkToPatient(!!invoice.patientId);
        setSelectedPatient(
          invoice.patient
            ? { id: invoice.patient.id, fullName: invoice.patient.fullName }
            : null
        );
        reset({
          patientId: invoice.patientId ?? undefined,
          customerName: invoice.customerName ?? "",
          customerPhone: invoice.customerPhone ?? "",
          invoiceDate: dayjs(invoice.invoiceDate).format("YYYY-MM-DD"),
          dueDate: invoice.dueDate ? dayjs(invoice.dueDate).format("YYYY-MM-DD") : "",
          taxAmount: invoice.taxAmount ?? 0,
          discountAmount: invoice.discountAmount ?? 0,
          logo: invoice.logo ?? "",
          items:
            (invoice.items ?? []).length > 0
              ? (invoice.items ?? []).map((item) => ({
                  description: item.description,
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                  productVariantId: item.productVariantId ?? undefined,
                  unit: item.unit ?? "piece",
                }))
              : [{ description: "", quantity: 1, unitPrice: 0 }],
          noteMessage: invoice.noteMessage ?? "",
          noteContactLine: invoice.noteContactLine || clinicAddress || "",
          notePhone: invoice.notePhone || clinicPhone || "",
          noteEmail: invoice.noteEmail || clinicEmail || "",
        });
      } else {
        setLinkToPatient(!!patientId);
        setSelectedPatient(null);
        reset({
          patientId: patientId ?? undefined,
          customerName: "",
          customerPhone: "",
          invoiceDate: dayjs().format("YYYY-MM-DD"),
          dueDate: "",
          taxAmount: 0,
          discountAmount: 0,
          logo: "",
          items: [{ description: "", quantity: 1, unitPrice: 0, unit: "piece" }],
          noteMessage: "",
          noteContactLine: clinicAddress,
          notePhone: clinicPhone,
          noteEmail: clinicEmail,
        });
      }
    }
  }, [open, invoice, patientId, reset, clinicAddress, clinicPhone, clinicEmail]);

  const onSubmit = async (data: InvoiceFormValues) => {
    const payload = {
      ...data,
      patientId: linkToPatient ? data.patientId : undefined,
      customerName: linkToPatient ? undefined : data.customerName,
      customerPhone: linkToPatient ? undefined : data.customerPhone,
      dueDate: data.dueDate || undefined,
      logo: data.logo || undefined,
      noteMessage: data.noteMessage || undefined,
      noteContactLine: data.noteContactLine || undefined,
      notePhone: data.notePhone || undefined,
      noteEmail: data.noteEmail || undefined,
    };

    if (isEdit && invoice) {
      await updateInvoice({ id: invoice.id, data: payload });
    } else {
      const created = await createInvoice(payload);
      if (onCreated && created?.data) {
        onCreated(created.data);
      }
    }
    onOpenChange(false);
  };

  const previewValues: InvoiceFormValues = {
    ...watch(),
    items: watchItems ?? [],
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] w-full max-w-7xl flex-col gap-0 overflow-hidden p-0 sm:max-w-7xl">
        {/* Header bar */}
        <div className="relative z-20 flex items-center justify-between border-b border-border/50 px-6 py-4 pr-16">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15 shadow-soft">
              <ReceiptIcon className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">
                {isEdit ? t("invoices.actions.edit") : t("invoices.add")}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {isEdit ? invoice?.displayId : t("invoices.actions.create")}
              </DialogDescription>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <EyeIcon className="size-4" />
            <span>{t("invoices.preview")}</span>
          </div>
        </div>

        {/* Body: two columns */}
        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[1fr_1fr]">
          {/* Left: Form */}
          <ScrollArea className="h-full overflow-hidden border-e">
            <form
              id="invoice-form"
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col gap-5 p-6"
            >
              <InvoiceLogoUpload
                logo={watchLogo ?? ""}
                onLogoChange={(logo, shouldDirty) => setValue("logo", logo, { shouldDirty })}
              />

              {/* Clinic Info section */}
              <FormSection
                icon={StickyNoteIcon}
                title={t("invoices.clinicInfo")}
                accentClass="bg-muted text-muted-foreground"
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field className="sm:col-span-2">
                    <FieldLabel>{t("invoices.clinicAddress")}</FieldLabel>
                    <Input {...register("noteContactLine")} />
                  </Field>
                  <Field>
                    <FieldLabel>{t("invoices.fields.notePhone")}</FieldLabel>
                    <Input {...register("notePhone")} />
                  </Field>
                  <Field>
                    <FieldLabel>{t("invoices.fields.noteEmail")}</FieldLabel>
                    <Input type="email" {...register("noteEmail")} />
                  </Field>
                </div>
              </FormSection>

              <InvoiceBillToSection
                register={register}
                watch={watch}
                setValue={setValue}
                errors={errors}
                linkToPatient={linkToPatient}
                setLinkToPatient={setLinkToPatient}
                onSelectPatient={setSelectedPatient}
              />

              {/* Date section */}
              <FormSection
                icon={CalendarIcon}
                title={t("invoices.fields.invoiceDate")}
                accentClass="bg-muted text-muted-foreground"
                contentClassName="grid grid-cols-2 gap-3 p-4"
              >
                  <Field>
                    <FieldLabel>{t("invoices.fields.invoiceDate")}</FieldLabel>
                    <Input
                      type="date"
                      data-invalid={!!errors.invoiceDate}
                      {...register("invoiceDate")}
                    />
                    {errors.invoiceDate && (
                      <FieldError>{translateZodError(errors.invoiceDate.message)}</FieldError>
                    )}
                  </Field>
                  <Field>
                    <FieldLabel>{t("invoices.fields.dueDate")}</FieldLabel>
                    <Input type="date" {...register("dueDate")} />
                  </Field>
              </FormSection>

              <InvoiceItemsFieldArray
                fields={fields}
                register={register}
                append={append}
                remove={remove}
                errors={errors}
                setValue={setValue}
                watch={watch}
              />

              <InvoiceFinancials
                register={register}
                subtotal={subtotal}
                calculatedTotal={calculatedTotal}
              />

              {/* Notes section */}
              <FormSection
                icon={StickyNoteIcon}
                title={t("invoices.fields.notes")}
                accentClass="bg-muted text-muted-foreground"
              >
                <Field>
                  <FieldLabel>{t("invoices.fields.noteMessage")}</FieldLabel>
                  <Textarea rows={3} {...register("noteMessage")} />
                </Field>
              </FormSection>
            </form>
          </ScrollArea>

          {/* Right: Live preview */}
          <div className="hidden h-full flex-col overflow-hidden bg-muted/40 lg:flex">
            <ScrollArea className="h-full">
              <div className="flex items-center justify-center p-6">
                <InvoicePreview
                  values={previewValues}
                  displayId={invoice?.displayId}
                  patientName={selectedPatient?.fullName}
                  patientAddress={selectedPatient?.address}
                  patientPhone={selectedPatient?.phoneNumber}
                  linkToPatient={linkToPatient}
                />
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-20 flex items-center justify-end gap-3 border-t border-border/50 bg-muted/40 px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="submit"
            form="invoice-form"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? t("common.saving")
              : isEdit
                ? t("common.save")
                : t("invoices.actions.create")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
