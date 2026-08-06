import { memo } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { PencilIcon, Trash2Icon, ShieldIcon } from "lucide-react";
import type { User } from "@/services/UserService";

const ROLE_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  admin: "destructive",
  doctor: "default",
  receptionist: "secondary",
  viewer: "secondary",
};

interface UsersTableProps {
  users: User[];
  isLoading: boolean;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

export const UsersTable = memo(function UsersTable({ users, isLoading, onEdit, onDelete }: UsersTableProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldIcon className="size-5" />
          {t("users.userList")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("users.username")}</TableHead>
                <TableHead>{t("users.role")}</TableHead>
                <TableHead>{t("users.createdAt")}</TableHead>
                <TableHead className="text-end">{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>
                    <Badge variant={ROLE_VARIANT[user.role] || "secondary"}>
                      {t(`users.roles.${user.role}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-end">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" aria-label={t("common.edit")} onClick={() => onEdit(user)}>
                        <PencilIcon className="size-4" />
                      </Button>
                      <Button variant="ghost" size="sm" aria-label={t("common.delete")} onClick={() => onDelete(user)}>
                        <Trash2Icon className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
});

export { ROLE_VARIANT };
