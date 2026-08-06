import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { ImageIcon, XIcon, UploadIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { FormSection } from "@/components/common/FormSection";
import { Button } from "@/components/ui/button";
import { getUploadsUrl } from "@/lib/urls";
import { useUploadClinicLogo, useDeleteClinicLogo } from "@/hooks/useSettings";

interface ClinicLogoUploadProps {
  logoPath?: string;
}

export function ClinicLogoUpload({ logoPath }: ClinicLogoUploadProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadClinicLogo, isUploading } = useUploadClinicLogo();
  const { deleteClinicLogo, isDeleting } = useDeleteClinicLogo();

  const logoUrl = logoPath ? getUploadsUrl(logoPath) : "";

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t("settings.clinic.logoTooLarge"));
      return;
    }
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      toast.error(t("settings.clinic.invalidLogoType"));
      return;
    }
    try {
      await uploadClinicLogo(file);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemove = async () => {
    await deleteClinicLogo();
  };

  const isBusy = isUploading || isDeleting;

  return (
    <FormSection
      icon={ImageIcon}
      title={t("settings.clinic.logo")}
      accentClass="bg-primary/10 text-primary"
    >
      <div className="flex items-center gap-4">
        {logoUrl ? (
          <div className="relative">
            <img
              src={logoUrl}
              alt="clinic logo"
              className="h-20 w-20 rounded-lg border object-contain"
            />
            <button
              type="button"
              onClick={handleRemove}
              disabled={isBusy}
              className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm transition-transform hover:scale-110 disabled:opacity-50"
            >
              <XIcon className="size-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isBusy}
            className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
          >
            <ImageIcon className="size-6" />
            <span className="text-[10px]">{t("settings.clinic.logoUpload")}</span>
          </button>
        )}
        <div className="flex flex-col gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isBusy}
          >
            {isUploading ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <UploadIcon className="size-4" />
            )}
            {t("settings.clinic.logoUpload")}
          </Button>
          <span className="text-xs text-muted-foreground">
            {t("settings.clinic.logoHint")}
          </span>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={handleUpload}
        />
      </div>
    </FormSection>
  );
}
