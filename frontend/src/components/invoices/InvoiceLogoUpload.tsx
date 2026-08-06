import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { FormSection } from "@/components/common/FormSection";
import { Button } from "@/components/ui/button";
import { ImageIcon, XIcon } from "lucide-react";
import { toast } from "sonner";

interface InvoiceLogoUploadProps {
  logo: string;
  onLogoChange: (logo: string, shouldDirty?: boolean) => void;
}

export function InvoiceLogoUpload({ logo, onLogoChange }: InvoiceLogoUploadProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error(t("invoices.logoTooLarge"));
      return;
    }
    if (!["image/png", "image/jpeg"].includes(file.type)) {
      toast.error(t("invoices.invalidLogoType"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onLogoChange(reader.result, true);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    onLogoChange("", true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <FormSection
      icon={ImageIcon}
      title={t("invoices.logo")}
      accentClass="bg-muted text-muted-foreground"
    >
      <div className="flex items-center gap-4">
        {logo ? (
          <div className="relative">
            <img
              src={logo}
              alt="logo"
              className="h-20 w-20 rounded-lg border object-contain"
            />
            <button
              type="button"
              onClick={handleRemoveLogo}
              className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm transition-transform hover:scale-110"
            >
              <XIcon className="size-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <ImageIcon className="size-6" />
            <span className="text-[10px]">{t("invoices.logoUpload")}</span>
          </button>
        )}
        <div className="flex flex-col gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            {t("invoices.logoUpload")}
          </Button>
          <span className="text-xs text-muted-foreground">
            {t("invoices.logoHint")}
          </span>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg"
          className="hidden"
          onChange={handleLogoUpload}
        />
      </div>
    </FormSection>
  );
}
