import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { KeyRoundIcon, FileIcon, ArrowLeftIcon, CopyIcon, CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Logo from "@/components/shadcn-studio/logo";
import AuthBackgroundShape from "@/assets/svg/auth-background-shape";
import { AuthService } from "@/services/AuthService";
import { useApiError } from "@/hooks/useApiError";
import { toast } from "sonner";

const recoverSchema = z.object({
  username: z.string().min(3),
  recoveryCode: z.string().min(20),
  newPassword: z.string().min(6),
  confirmPassword: z.string().min(6),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RecoverFormValues = z.infer<typeof recoverSchema>;

const fileSchema = z.object({
  username: z.string().min(3),
  newPassword: z.string().min(6),
  confirmPassword: z.string().min(6),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type FileFormValues = z.infer<typeof fileSchema>;

export default function RecoverPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { handleApiError } = useApiError();
  const [mode, setMode] = useState<"code" | "file">("code");
  const [newRecoveryCode, setNewRecoveryCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const codeForm = useForm<RecoverFormValues>({
    resolver: zodResolver(recoverSchema),
    defaultValues: { username: "", recoveryCode: "", newPassword: "", confirmPassword: "" },
  });

  const fileForm = useForm<FileFormValues>({
    resolver: zodResolver(fileSchema),
    defaultValues: { username: "", newPassword: "", confirmPassword: "" },
  });

  const onCodeSubmit = async (values: RecoverFormValues) => {
    setNewRecoveryCode(null);
    try {
      const res = await AuthService.recover({
        username: values.username,
        recoveryCode: values.recoveryCode,
        newPassword: values.newPassword,
      });
      setNewRecoveryCode(res.data.recoveryCode);
      toast.success(t("auth.recover.success"));
    } catch (error) {
      handleApiError(error);
    }
  };

  const onFileSubmit = async (values: FileFormValues) => {
    setNewRecoveryCode(null);
    try {
      const res = await AuthService.recoverViaFile({
        username: values.username,
        newPassword: values.newPassword,
      });
      setNewRecoveryCode(res.data.recoveryCode);
      toast.success(t("auth.recover.success"));
    } catch (error) {
      handleApiError(error);
    }
  };

  const copyCode = () => {
    if (newRecoveryCode) {
      navigator.clipboard.writeText(newRecoveryCode);
      setCopied(true);
      toast.success(t("auth.recover.newCodeCopied"));
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative flex h-auto min-h-screen items-center justify-center overflow-x-hidden bg-gradient-to-br from-background via-background to-muted/30 px-4 py-10 sm:px-6 lg:px-8">
      <div className="absolute">
        <AuthBackgroundShape />
      </div>

      <Card className="z-1 w-full gap-6 border-border/60 py-6 shadow-modal ring-1 ring-foreground/5 animate-scale-in sm:max-w-lg sm:mx-4">
        <CardHeader className="gap-6 px-6">
          <Logo className="gap-3" />
          <div>
            <CardTitle className="font-heading mb-2 text-2xl font-bold tracking-tight">
              {t("auth.recover.title")}
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              {t("auth.recover.subtitle")}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="px-6">
          {newRecoveryCode ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
                <p className="text-sm font-medium text-warning">
                  {t("auth.recover.newCodeWarning")}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <code className="flex-1 rounded-md bg-muted px-3 py-2 font-mono text-sm break-all">
                    {newRecoveryCode}
                  </code>
                  <Button variant="outline" size="icon" onClick={copyCode}>
                    {copied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
                  </Button>
                </div>
              </div>
              <Button className="w-full" onClick={() => navigate("/login")}>
                <ArrowLeftIcon className="size-4" />
                {t("auth.recover.backToLogin")}
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-6 flex gap-2">
                <Button
                  variant={mode === "code" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setMode("code")}
                  type="button"
                >
                  <KeyRoundIcon className="size-4" />
                  {t("auth.recover.recoverViaCode")}
                </Button>
                <Button
                  variant={mode === "file" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setMode("file")}
                  type="button"
                >
                  <FileIcon className="size-4" />
                  {t("auth.recover.recoverViaFile")}
                </Button>
              </div>

              {mode === "code" ? (
                <form onSubmit={codeForm.handleSubmit(onCodeSubmit)}>
                  <FieldGroup className="gap-5">
                    <Field className="gap-2">
                      <FieldLabel htmlFor="rc-username">
                        {t("auth.recover.username")}*
                      </FieldLabel>
                      <Input
                        id="rc-username"
                        placeholder={t("auth.recover.username")}
                        {...codeForm.register("username")}
                      />
                      {codeForm.formState.errors.username && (
                        <p className="text-sm font-medium text-destructive">
                          {codeForm.formState.errors.username.message}
                        </p>
                      )}
                    </Field>

                    <Field className="gap-2">
                      <FieldLabel htmlFor="rc-code">
                        {t("auth.recover.recoveryCode")}*
                      </FieldLabel>
                      <Textarea
                        id="rc-code"
                        rows={2}
                        placeholder="XXXX-XXXX-XXXX-XXXX-XXXX"
                        {...codeForm.register("recoveryCode")}
                      />
                      <p className="text-xs text-muted-foreground">
                        {t("auth.recover.codeHint")}
                      </p>
                      {codeForm.formState.errors.recoveryCode && (
                        <p className="text-sm font-medium text-destructive">
                          {codeForm.formState.errors.recoveryCode.message}
                        </p>
                      )}
                    </Field>

                    <Field className="gap-2">
                      <FieldLabel htmlFor="rc-newpass">
                        {t("auth.recover.newPassword")}*
                      </FieldLabel>
                      <Input
                        id="rc-newpass"
                        type="password"
                        placeholder="••••••••"
                        {...codeForm.register("newPassword")}
                      />
                      {codeForm.formState.errors.newPassword && (
                        <p className="text-sm font-medium text-destructive">
                          {codeForm.formState.errors.newPassword.message}
                        </p>
                      )}
                    </Field>

                    <Field className="gap-2">
                      <FieldLabel htmlFor="rc-confirm">
                        {t("auth.recover.confirmPassword")}*
                      </FieldLabel>
                      <Input
                        id="rc-confirm"
                        type="password"
                        placeholder="••••••••"
                        {...codeForm.register("confirmPassword")}
                      />
                      {codeForm.formState.errors.confirmPassword && (
                        <p className="text-sm font-medium text-destructive">
                          {t("auth.recover.passwordsDoNotMatch")}
                        </p>
                      )}
                    </Field>

                    <Field>
                      <Button
                        className="w-full"
                        type="submit"
                        disabled={codeForm.formState.isSubmitting}
                      >
                        {codeForm.formState.isSubmitting
                          ? t("common.loading")
                          : t("auth.recover.recoverViaCode")}
                      </Button>
                    </Field>
                  </FieldGroup>
                </form>
              ) : (
                <form onSubmit={fileForm.handleSubmit(onFileSubmit)}>
                  <div className="mb-4 rounded-lg border border-info/30 bg-info/5 p-3">
                    <p className="text-sm text-muted-foreground">
                      {t("auth.recover.recoverViaFileDescription")}
                    </p>
                  </div>
                  <FieldGroup className="gap-5">
                    <Field className="gap-2">
                      <FieldLabel htmlFor="rf-username">
                        {t("auth.recover.username")}*
                      </FieldLabel>
                      <Input
                        id="rf-username"
                        placeholder={t("auth.recover.username")}
                        {...fileForm.register("username")}
                      />
                      {fileForm.formState.errors.username && (
                        <p className="text-sm font-medium text-destructive">
                          {fileForm.formState.errors.username.message}
                        </p>
                      )}
                    </Field>

                    <Field className="gap-2">
                      <FieldLabel htmlFor="rf-newpass">
                        {t("auth.recover.newPassword")}*
                      </FieldLabel>
                      <Input
                        id="rf-newpass"
                        type="password"
                        placeholder="••••••••"
                        {...fileForm.register("newPassword")}
                      />
                      {fileForm.formState.errors.newPassword && (
                        <p className="text-sm font-medium text-destructive">
                          {fileForm.formState.errors.newPassword.message}
                        </p>
                      )}
                    </Field>

                    <Field className="gap-2">
                      <FieldLabel htmlFor="rf-confirm">
                        {t("auth.recover.confirmPassword")}*
                      </FieldLabel>
                      <Input
                        id="rf-confirm"
                        type="password"
                        placeholder="••••••••"
                        {...fileForm.register("confirmPassword")}
                      />
                      {fileForm.formState.errors.confirmPassword && (
                        <p className="text-sm font-medium text-destructive">
                          {t("auth.recover.passwordsDoNotMatch")}
                        </p>
                      )}
                    </Field>

                    <Field>
                      <Button
                        className="w-full"
                        type="submit"
                        disabled={fileForm.formState.isSubmitting}
                      >
                        {fileForm.formState.isSubmitting
                          ? t("common.loading")
                          : t("auth.recover.recoverViaFile")}
                      </Button>
                    </Field>
                  </FieldGroup>
                </form>
              )}

              <div className="mt-6 text-center">
                <Button
                  variant="link"
                  onClick={() => navigate("/login")}
                  className="text-muted-foreground"
                >
                  <ArrowLeftIcon className="size-4" />
                  {t("auth.recover.backToLogin")}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
