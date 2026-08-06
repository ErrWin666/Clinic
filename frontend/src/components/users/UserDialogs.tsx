import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { USER_ROLES } from "@/schemas/userSchema";

interface RoleSelectProps {
  value: string;
  onChange: (value: string) => void;
}

function RoleSelect({ value, onChange }: RoleSelectProps) {
  const { t } = useTranslation();
  return (
    <Select value={value} onValueChange={(v) => v && onChange(v)}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {USER_ROLES.map((role) => (
          <SelectItem key={role} value={role}>
            {t(`users.roles.${role}`)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

interface UserCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username: string;
  password: string;
  role: string;
  isPending: boolean;
  errors: { username?: { message?: string }; password?: { message?: string } };
  onUsernameChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onRoleChange: (v: string) => void;
  onSubmit: () => void;
}

export function UserCreateDialog({
  open,
  onOpenChange,
  username,
  password,
  role,
  isPending,
  errors,
  onUsernameChange,
  onPasswordChange,
  onRoleChange,
  onSubmit,
}: UserCreateDialogProps) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("users.addUser")}</DialogTitle>
          <DialogDescription>{t("users.addUserDescription")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="create-username">{t("users.username")}</Label>
            <Input id="create-username" value={username} onChange={(e) => onUsernameChange(e.target.value)} />
            {errors.username && (
              <p className="text-sm text-destructive">{t("users.usernameRequired")}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-password">{t("auth.password")}</Label>
            <Input id="create-password" type="password" value={password} onChange={(e) => onPasswordChange(e.target.value)} />
            {errors.password && (
              <p className="text-sm text-destructive">{t("auth.passwordTooShort")}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>{t("users.role")}</Label>
            <RoleSelect value={role} onChange={onRoleChange} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isPending}>
              {t("common.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface UserEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username: string;
  password: string | undefined;
  role: string;
  isPending: boolean;
  onUsernameChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onRoleChange: (v: string) => void;
  onSubmit: () => void;
}

export function UserEditDialog({
  open,
  onOpenChange,
  username,
  password,
  role,
  isPending,
  onUsernameChange,
  onPasswordChange,
  onRoleChange,
  onSubmit,
}: UserEditDialogProps) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("users.editUser")}</DialogTitle>
          <DialogDescription>{t("users.editUserDescription")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-username">{t("users.username")}</Label>
            <Input id="edit-username" value={username} onChange={(e) => onUsernameChange(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-password">{t("users.newPassword")}</Label>
            <Input id="edit-password" type="password" placeholder={t("users.newPasswordHint")} value={password ?? ""} onChange={(e) => onPasswordChange(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t("users.role")}</Label>
            <RoleSelect value={role} onChange={onRoleChange} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isPending}>
              {t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface UserDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username: string;
  isPending: boolean;
  onConfirm: () => void;
}

export function UserDeleteDialog({
  open,
  onOpenChange,
  username,
  isPending,
  onConfirm,
}: UserDeleteDialogProps) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("users.confirmDelete")}</DialogTitle>
          <DialogDescription>
            {t("users.confirmDeleteMessage", { username })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isPending}>
            {t("common.delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
