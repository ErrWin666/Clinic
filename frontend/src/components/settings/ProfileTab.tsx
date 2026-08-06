import { useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { CameraIcon, XIcon, EyeIcon, EyeOffIcon, UserIcon, ShieldIcon } from "lucide-react";
import { useState } from "react";
import {
  useUpdateAdmin,
  useUploadAdminImage,
  useDeleteAdminImage,
} from "@/hooks/useSettings";
import { useAuth } from "@/hooks/useAuth";
import { getUploadsUrl } from "@/lib/urls";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
  FieldDescription,
} from "@/components/ui/field";
import { FormSection } from "@/components/common/FormSection";
import { translateZodError } from "@/lib/zodError";

const profileSchema = z.object({
  username: z.string().min(3).max(50),
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6).max(100).optional().or(z.literal("")),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function ProfileTab() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const { updateAdmin, isUpdating } = useUpdateAdmin();
  const { uploadAdminImage, isUploading } = useUploadAdminImage();
  const { deleteAdminImage, isDeleting } = useDeleteAdminImage();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    mode: "onBlur",
    defaultValues: {
      username: user?.username ?? "",
      currentPassword: "",
      newPassword: "",
    },
  });

  const onSubmit = async (data: ProfileFormValues) => {
    const payload: {
      username?: string;
      currentPassword: string;
      newPassword?: string;
    } = {
      currentPassword: data.currentPassword,
    };
    if (data.username && data.username !== user?.username) {
      payload.username = data.username;
    }
    if (data.newPassword) {
      payload.newPassword = data.newPassword;
    }
    await updateAdmin(payload);
    reset({ username: payload.username ?? user?.username ?? "", currentPassword: "", newPassword: "" });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadAdminImage(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImageDelete = async () => {
    await deleteAdminImage();
  };

  const avatarSrc = user?.profileImage
    ? getUploadsUrl(user.profileImage)
    : undefined;

  return (
    <Card className="shadow-card border-border/60">
      <CardHeader>
        <CardTitle className="text-lg">{t("settings.tabs.profile")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Avatar className="size-20">
              {avatarSrc && <AvatarImage src={avatarSrc} alt={user?.username} />}
              <AvatarFallback className="text-lg">
                {user?.username?.charAt(0).toUpperCase() ?? "?"}
              </AvatarFallback>
            </Avatar>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={handleImageUpload}
            />
            <Button
              variant="outline"
              size="icon-sm"
              className="absolute bottom-0 right-0 rounded-full"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || isDeleting}
            >
              <CameraIcon className="size-3.5" />
            </Button>
            {user?.profileImage && (
              <Button
                variant="outline"
                size="icon-sm"
                className="absolute bottom-0 left-0 rounded-full"
                onClick={handleImageDelete}
                disabled={isUploading || isDeleting}
              >
                <XIcon className="size-3.5" />
              </Button>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">{t("settings.profile.avatar")}</p>
            <p className="text-xs text-muted-foreground">
              JPG, PNG, GIF, WEBP — max 5MB
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup className="gap-5">
            <FormSection
              icon={UserIcon}
              title={t("settings.profile.username")}
              accentClass="bg-primary/10 text-primary"
            >
              <Field data-invalid={!!errors.username}>
                <FieldLabel htmlFor="username">
                  {t("settings.profile.username")}
                </FieldLabel>
                <Input
                  id="username"
                  {...register("username")}
                  placeholder={user?.username}
                  aria-invalid={!!errors.username}
                />
                {errors.username && (
                  <FieldError>{translateZodError(errors.username.message)}</FieldError>
                )}
              </Field>
            </FormSection>

            <FormSection
              icon={ShieldIcon}
              title={t("settings.profile.currentPassword")}
              accentClass="bg-amber-500/10 text-amber-600 dark:text-amber-400"
            >
              <Field data-invalid={!!errors.currentPassword}>
                <FieldLabel htmlFor="currentPassword">
                  {t("settings.profile.currentPassword")}
                </FieldLabel>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrent ? "text" : "password"}
                    {...register("currentPassword")}
                    aria-invalid={!!errors.currentPassword}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="absolute end-0 top-1/2 -translate-y-1/2"
                    onClick={() => setShowCurrent((v) => !v)}
                  >
                    {showCurrent ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
                  </Button>
                </div>
                {errors.currentPassword && (
                  <FieldError>{translateZodError(errors.currentPassword.message)}</FieldError>
                )}
              </Field>

              <Field data-invalid={!!errors.newPassword}>
                <FieldLabel htmlFor="newPassword">
                  {t("settings.profile.newPassword")}
                </FieldLabel>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNew ? "text" : "password"}
                    {...register("newPassword")}
                    aria-invalid={!!errors.newPassword}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="absolute end-0 top-1/2 -translate-y-1/2"
                    onClick={() => setShowNew((v) => !v)}
                  >
                    {showNew ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
                  </Button>
                </div>
                <FieldDescription>
                  {t("settings.profile.newPasswordHint")}
                </FieldDescription>
                {errors.newPassword && (
                  <FieldError>{translateZodError(errors.newPassword.message)}</FieldError>
                )}
              </Field>
            </FormSection>

            <Button type="submit" disabled={isUpdating || !isDirty} className="w-fit">
              {isUpdating && <Spinner className="size-4" />}
              {t("settings.profile.save")}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
