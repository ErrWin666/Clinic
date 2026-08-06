import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { EyeIcon, EyeOffIcon, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Input } from "@/components/ui/input";
import Logo from "@/components/shadcn-studio/logo";
import AuthBackgroundShape from "@/assets/svg/auth-background-shape";
import { AuthService, type LoginData } from "@/services/AuthService";
import { useAuth } from "@/hooks/useAuth";
import { useApiError } from "@/hooks/useApiError";

const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { setUser } = useAuth();
  const { handleApiError } = useApiError();
  const [isVisible, setIsVisible] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = async (values: LoginFormValues) => {
    const payload: LoginData = { username: values.username, password: values.password };
    try {
      const res = await AuthService.login(payload);
      setUser(res.data.user);
      navigate("/dashboard");
    } catch (error) {
      handleApiError(error);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background to-muted/30">
      <div className="absolute inset-0 bg-grid-pattern opacity-50" />
      <div className="absolute">
        <AuthBackgroundShape />
      </div>

      <Card className="z-1 w-full gap-6 border-border/60 py-6 shadow-modal ring-1 ring-foreground/5 animate-scale-in sm:max-w-lg sm:mx-4">
        <CardHeader className="gap-6 px-6">
          <Logo className="gap-3" />
          <div>
            <CardTitle className="font-heading mb-2 text-2xl font-bold tracking-tight">{t("auth.welcome")}</CardTitle>
            <CardDescription className="text-base text-muted-foreground">{t("auth.loginSubtitle")}</CardDescription>
          </div>
        </CardHeader>

        <CardContent className="px-6">
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup className="gap-5">
              <Field className="gap-2">
                <FieldLabel htmlFor="username" className="leading-5">
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
                <FieldLabel htmlFor="password" className="leading-5">
                  {t("auth.password")}*
                </FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    id="password"
                    type={isVisible ? "text" : "password"}
                    placeholder="••••••••••••••••"
                    {...form.register("password")}
                  />
                  <InputGroupAddon align="inline-end" className="pe-1.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      onClick={() => setIsVisible((prev) => !prev)}
                      className="text-muted-foreground rounded-s-none hover:bg-transparent"
                    >
                      {isVisible ? <EyeOffIcon /> : <EyeIcon />}
                      <span className="sr-only">
                        {isVisible ? t("auth.hidePassword") : t("auth.showPassword")}
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

              <Field>
                <Button
                  className="w-full transition-all duration-300 hover:shadow-glow active:scale-[0.98]"
                  type="submit"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting && <Loader2Icon className="size-4 animate-spin" />}
                  {form.formState.isSubmitting ? t("common.loading") : t("auth.login")}
                </Button>
              </Field>

              <div className="text-center">
                <Button
                  variant="link"
                  type="button"
                  onClick={() => navigate("/recover")}
                  className="text-muted-foreground"
                >
                  {t("auth.forgotPassword")}
                </Button>
              </div>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
