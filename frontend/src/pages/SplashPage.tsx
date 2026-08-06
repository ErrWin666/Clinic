import { useEffect } from "react";
import { useNavigate } from "react-router";
import { SetupService } from "@/services/SetupService";
import { Spinner } from "@/components/ui/spinner";
import Logo from "@/components/shadcn-studio/logo";
import AuthBackgroundShape from "@/assets/svg/auth-background-shape";

export default function SplashPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const res = await SetupService.checkAdmin();
        navigate(res.data.adminExists ? "/login" : "/setup");
      } catch {
        navigate("/setup");
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-8 overflow-hidden bg-gradient-to-br from-background via-background to-muted/30">
      <div className="absolute">
        <AuthBackgroundShape />
      </div>
      <div className="z-1 flex flex-col items-center gap-6 animate-in fade-in zoom-in-95 duration-500">
        <div className="animate-pulse">
          <Logo className="gap-3 scale-125" />
        </div>
        <Spinner className="size-8 text-muted-foreground" />
      </div>
    </div>
  );
}
