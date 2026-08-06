import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { typedResolver } from "@/lib/zodResolver";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { DialogHeaderWithIcon } from "@/components/common/DialogHeaderWithIcon";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldGroup, FieldLabel, FieldError } from "@/components/ui/field";
import { FormSection } from "@/components/common/FormSection";
import { FormFooter } from "@/components/common/FormFooter";
import {
  TruckIcon,
  PhoneIcon,
  MailIcon,
  MapPinIcon,
  DollarSignIcon,
  StickyNoteIcon,
  UserIcon,
  HashIcon,
} from "lucide-react";
import type { Supplier } from "@/types/models";

const schema = z.object({
  name: z.string().min(1, "Required"),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  contactPerson: z.string().optional(),
  taxNumber: z.string().optional(),
  openingBalance: z.coerce.number().optional(),
  notes: z.string().optional(),
});

type SupplierFormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier?: Supplier | null;
  onSubmit: (data: SupplierFormValues) => Promise<void>;
  isPending: boolean;
}

export { type SupplierFormValues };

export function SupplierForm({ open, onOpenChange, supplier, onSubmit, isPending }: Props) {
  const { t } = useTranslation();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<SupplierFormValues>({
    resolver: typedResolver(schema),
    defaultValues: { name: "", phone: "", email: "", address: "", contactPerson: "", taxNumber: "", openingBalance: 0, notes: "" },
  });

  useEffect(() => {
    if (open) {
      if (supplier) {
        reset({
          name: supplier.name,
          phone: supplier.phone || "",
          email: supplier.email || "",
          address: supplier.address || "",
          contactPerson: supplier.contactPerson || "",
          taxNumber: supplier.taxNumber || "",
          openingBalance: supplier.openingBalance,
          notes: supplier.notes || "",
        });
      } else {
        reset({ name: "", phone: "", email: "", address: "", contactPerson: "", taxNumber: "", openingBalance: 0, notes: "" });
      }
    }
  }, [open, supplier, reset]);

  const handleFormSubmit = handleSubmit(async (data) => {
    await onSubmit(data);
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[85vh] max-w-2xl overflow-hidden flex flex-col sm:max-w-2xl"
        data-slot="supplier-form"
      >
        <DialogHeaderWithIcon
          icon={TruckIcon}
          variant="primary"
          title={supplier ? t("common.edit") : t("suppliers.actions.add")}
          description={t("suppliers.form.description")}
        />

        <form onSubmit={handleFormSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-1 min-h-0">
            <FieldGroup className="gap-5">
              {/* Section: Basic Info */}
              <FormSection
                icon={TruckIcon}
                title={t("suppliers.form.sections.basic")}
                accentClass="bg-primary/10 text-primary"
              >
                <Field>
                  <FieldLabel htmlFor="name" className="flex items-center gap-1.5">
                    <TruckIcon className="size-3.5 text-muted-foreground" />
                    {t("suppliers.fields.name")}
                  </FieldLabel>
                  <Input
                    id="name"
                    placeholder={t("suppliers.fields.name")}
                    data-invalid={!!errors.name}
                    aria-invalid={!!errors.name}
                    {...register("name")}
                  />
                  {errors.name && <FieldError>{errors.name.message}</FieldError>}
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="contactPerson" className="flex items-center gap-1.5">
                      <UserIcon className="size-3.5 text-muted-foreground" />
                      {t("suppliers.fields.contactPerson")}
                    </FieldLabel>
                    <Input id="contactPerson" placeholder={t("suppliers.fields.contactPerson")} {...register("contactPerson")} />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="taxNumber" className="flex items-center gap-1.5">
                      <HashIcon className="size-3.5 text-muted-foreground" />
                      {t("suppliers.fields.taxNumber")}
                    </FieldLabel>
                    <Input id="taxNumber" placeholder={t("suppliers.fields.taxNumber")} {...register("taxNumber")} />
                  </Field>
                </div>
              </FormSection>

              {/* Section: Contact */}
              <FormSection
                icon={PhoneIcon}
                title={t("suppliers.form.sections.contact")}
                accentClass="bg-blue-500/10 text-blue-600"
              >
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="phone" className="flex items-center gap-1.5">
                      <PhoneIcon className="size-3.5 text-muted-foreground" />
                      {t("suppliers.fields.phone")}
                    </FieldLabel>
                    <Input id="phone" placeholder={t("suppliers.fields.phone")} {...register("phone")} />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="email" className="flex items-center gap-1.5">
                      <MailIcon className="size-3.5 text-muted-foreground" />
                      {t("suppliers.fields.email")}
                    </FieldLabel>
                    <Input id="email" type="email" placeholder={t("suppliers.fields.email")} {...register("email")} />
                  </Field>
                </div>

                <Field>
                  <FieldLabel htmlFor="address" className="flex items-center gap-1.5">
                    <MapPinIcon className="size-3.5 text-muted-foreground" />
                    {t("suppliers.fields.address")}
                  </FieldLabel>
                  <Textarea id="address" rows={2} placeholder={t("suppliers.fields.address")} {...register("address")} />
                </Field>
              </FormSection>

              {/* Section: Financial */}
              <FormSection
                icon={DollarSignIcon}
                title={t("suppliers.form.sections.financial")}
                accentClass="bg-emerald-500/10 text-emerald-600"
              >
                <Field>
                  <FieldLabel htmlFor="openingBalance" className="flex items-center gap-1.5">
                    <DollarSignIcon className="size-3.5 text-muted-foreground" />
                    {t("suppliers.fields.openingBalance")}
                  </FieldLabel>
                  <Input id="openingBalance" type="number" step="0.01" placeholder={t("suppliers.fields.openingBalance")} {...register("openingBalance")} />
                </Field>
              </FormSection>

              {/* Section: Notes */}
              <FormSection
                icon={StickyNoteIcon}
                title={t("suppliers.form.sections.notes")}
                accentClass="bg-amber-500/10 text-amber-600"
              >
                <Field>
                  <FieldLabel htmlFor="notes" className="flex items-center gap-1.5">
                    <StickyNoteIcon className="size-3.5 text-muted-foreground" />
                    {t("suppliers.fields.notes")}
                  </FieldLabel>
                  <Textarea id="notes" rows={2} placeholder={t("suppliers.fields.notes")} {...register("notes")} />
                </Field>
              </FormSection>
            </FieldGroup>
          </div>

          <FormFooter onCancel={() => onOpenChange(false)} isSubmitting={isPending} />
        </form>
      </DialogContent>
    </Dialog>
  );
}
