import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Logo from "@/components/shadcn-studio/logo";
import AuthBackgroundShape from "@/assets/svg/auth-background-shape";
import { type CreateAdminData } from "@/services/SetupService";
import { useCreateAdmin } from "@/hooks/useSetup";
import { getLanguageLabel } from "@/lib/i18n";

const CURRENCIES = ["USD", "SAR", "EGP", "AED", "EUR"] as const;
const LANGUAGES = ["ar", "en"] as const;

const setupSchema = z
  .object({
    username: z.string().min(3).max(50),
    password: z
      .string()
      .min(8, "auth.passwordTooShort")
      .max(100)
      .regex(/[A-Z]/, "auth.passwordNeedsUpper")
      .regex(/[a-z]/, "auth.passwordNeedsLower")
      .regex(/[0-9]/, "auth.passwordNeedsNumber"),
    confirmPassword: z.string(),
    clinicName: z.string().min(2).max(100),
    currency: z.string(),
    language: z.enum(["ar", "en"]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "errors.PASSWORDS_DO_NOT_MATCH",
    path: ["confirmPassword"],
  });

type SetupFormValues = z.infer<typeof setupSchema>;

export default function SetupPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { createAdmin } = useCreateAdmin();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

  const form = useForm<SetupFormValues>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      clinicName: "",
      currency: "USD",
      language: "en",
    },
  });

  const onSubmit = async (values: SetupFormValues) => {
    const payload: CreateAdminData = {
      username: values.username,
      password: values.password,
      confirmPassword: values.confirmPassword,
      clinicName: values.clinicName,
      currency: values.currency,
      language: values.language,
    };

    try {
      await createAdmin(payload);
      navigate("/login");
    } catch (error) {
      const code = (error as { response?: { data?: { error?: { code?: string } } } })
        ?.response?.data?.error?.code;
      if (code === "ADMIN_EXISTS") {
        navigate("/login");
      }
      // Other errors handled by hook's onError
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
            <CardTitle className="font-heading mb-2 text-2xl font-bold tracking-tight">{t("setup.title")}</CardTitle>
            <CardDescription className="text-base text-muted-foreground">{t("setup.subtitle")}</CardDescription>
          </div>
        </CardHeader>

        <CardContent className="px-6">
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup className="gap-5">
              <Field className="gap-2">
                <FieldLabel className="leading-5" htmlFor="username">
                  {t("auth.username")}*
                </FieldLabel>
                <Input
                  id="username"
                  placeholder={t("auth.username")}
                  {...form.register("username")}
                />
                {form.formState.errors.username && (
                  <p className="text-sm font-medium text-destructive">
                    {form.formState.errors.username.message}
                  </p>
                )}
              </Field>

              <Field className="w-full gap-2">
                <FieldLabel className="leading-5" htmlFor="password">
                  {t("auth.password")}*
                </FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    id="password"
                    type={isPasswordVisible ? "text" : "password"}
                    placeholder="••••••••••••••••"
                    {...form.register("password")}
                  />
                  <InputGroupAddon align="inline-end" className="pe-1.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      onClick={() => setIsPasswordVisible((prev) => !prev)}
                      className="text-muted-foreground rounded-s-none hover:bg-transparent"
                    >
                      {isPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
                      <span className="sr-only">
                        {isPasswordVisible ? t("auth.hidePassword") : t("auth.showPassword")}
                      </span>
                    </Button>
                  </InputGroupAddon>
                </InputGroup>
                {form.formState.errors.password && (
                  <p className="text-sm font-medium text-destructive">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </Field>

              <Field className="w-full gap-2">
                <FieldLabel className="leading-5" htmlFor="confirmPassword">
                  {t("auth.confirmPassword")}*
                </FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    id="confirmPassword"
                    type={isConfirmPasswordVisible ? "text" : "password"}
                    placeholder="••••••••••••••••"
                    {...form.register("confirmPassword")}
                  />
                  <InputGroupAddon align="inline-end" className="pe-1.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      onClick={() => setIsConfirmPasswordVisible((prev) => !prev)}
                      className="text-muted-foreground rounded-s-none hover:bg-transparent"
                    >
                      {isConfirmPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
                      <span className="sr-only">
                        {isConfirmPasswordVisible ? t("auth.hidePassword") : t("auth.showPassword")}
                      </span>
                    </Button>
                  </InputGroupAddon>
                </InputGroup>
                {form.formState.errors.confirmPassword && (
                  <p className="text-sm font-medium text-destructive">
                    {t(form.formState.errors.confirmPassword.message || "")}
                  </p>
                )}
              </Field>

              <Field className="gap-2">
                <FieldLabel className="leading-5" htmlFor="clinicName">
                  {t("setup.clinicName")}*
                </FieldLabel>
                <Input
                  id="clinicName"
                  placeholder={t("setup.clinicName")}
                  {...form.register("clinicName")}
                />
                {form.formState.errors.clinicName && (
                  <p className="text-sm font-medium text-destructive">
                    {form.formState.errors.clinicName.message}
                  </p>
                )}
              </Field>

              <Field className="gap-2">
                <FieldLabel className="leading-5">
                  {t("setup.currency")}*
                </FieldLabel>
                <Select
                  value={form.watch("currency")}
                  onValueChange={(val) => val && form.setValue("currency", val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field className="gap-2">
                <FieldLabel className="leading-5">
                  {t("setup.language")}*
                </FieldLabel>
                <Select
                  value={form.watch("language")}
                  onValueChange={(val) => val && form.setValue("language", val as "ar" | "en")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((l) => (
                      <SelectItem key={l} value={l}>
                        {getLanguageLabel(l)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <Button
                  className="w-full"
                  type="submit"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? t("common.loading") : t("setup.complete")}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
