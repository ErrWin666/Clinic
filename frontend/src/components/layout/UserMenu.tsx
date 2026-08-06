import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { UserIcon, SettingsIcon, LogOutIcon } from "lucide-react";
import type { User } from "@/types/models";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AuthService } from "@/services/AuthService";
import { useAuth } from "@/hooks/useAuth";
import { config } from "@/lib/config";
import { getUploadsUrl } from "@/lib/urls";

interface UserMenuProps {
  user: User | null;
}

export function UserMenu({ user }: UserMenuProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { setUser } = useAuth();

  const handleLogout = async () => {
    try {
      await AuthService.logout();
    } catch {
      // ignore errors on logout
    }
    setUser(null);
    navigate("/login");
    toast.success(t("auth.logout"));
  };

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : "AD";

  const avatarUrl = user?.profileImage
    ? getUploadsUrl(user.profileImage)
    : undefined;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button className="flex w-full items-center gap-2 rounded-md p-2 text-sm transition-colors hover:bg-accent">
            <Avatar size="sm">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={user?.username} />}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex flex-1 flex-col items-start overflow-hidden">
              <span className="truncate text-sm font-medium">
                {user?.username || "Admin"}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {user?.role || "admin"}
              </span>
            </div>
          </button>
        }
      />
      <DropdownMenuContent className="w-72" align="end" side="top">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center gap-3 px-4 py-2.5 font-normal">
            <div className="relative">
              <Avatar size="lg">
                {avatarUrl && <AvatarImage src={avatarUrl} alt={user?.username} />}
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <span className="ring-card absolute bottom-0 end-0 block size-2 rounded-full bg-green-600 ring-2" />
            </div>
            <div className="flex flex-1 flex-col items-start">
              <span className="text-foreground text-base font-semibold">
                {user?.username || "Admin"}
              </span>
              <span className="text-muted-foreground text-sm">
                {config.appName}
              </span>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem
            className="gap-2 px-4 py-2.5 text-base"
            onClick={() => navigate("/settings")}
          >
            <UserIcon className="text-foreground size-5" />
            <span>{t("userMenu.profile")}</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="gap-2 px-4 py-2.5 text-base"
            onClick={() => navigate("/settings")}
          >
            <SettingsIcon className="text-foreground size-5" />
            <span>{t("userMenu.settings")}</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem
            variant="destructive"
            className="gap-2 px-4 py-2.5 text-base"
            onClick={handleLogout}
          >
            <LogOutIcon className="size-5" />
            <span>{t("auth.logout")}</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
