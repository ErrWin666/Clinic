import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from "@/hooks/useUsers";
import { useApiError } from "@/hooks/useApiError";
import { PageHeader } from "@/components/common/PageHeader";
import { ErrorState } from "@/components/common/ErrorState";
import { Button } from "@/components/ui/button";
import { UsersIcon, PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { UsersTable } from "@/components/users/UsersTable";
import {
  UserCreateDialog,
  UserEditDialog,
  UserDeleteDialog,
} from "@/components/users/UserDialogs";
import {
  createUserSchema,
  editUserSchema,
  type CreateUserForm,
  type EditUserForm,
} from "@/schemas/userSchema";
import type { User } from "@/services/UserService";

export function UserManagementPage() {
  const { t } = useTranslation();
  const { data: response, isLoading, isError, refetch } = useUsers();
  const users = response?.data || [];
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const { handleApiError } = useApiError();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const createForm = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { username: "", password: "", role: "doctor" },
  });

  const editForm = useForm<EditUserForm>({
    resolver: zodResolver(editUserSchema),
    defaultValues: { username: "", role: "doctor", password: "" },
  });

  const onCreateSubmit = async (values: CreateUserForm) => {
    try {
      await createUser.mutateAsync(values);
      toast.success(t("users.created"));
      setCreateOpen(false);
      createForm.reset();
    } catch (error: unknown) {
      handleApiError(error);
    }
  };

  const onEditSubmit = async (values: EditUserForm) => {
    if (!editTarget) return;
    try {
      const payload: Record<string, unknown> = { username: values.username, role: values.role };
      if (values.password) payload.password = values.password;
      await updateUser.mutateAsync({ id: editTarget.id, payload });
      toast.success(t("users.updated"));
      setEditTarget(null);
      editForm.reset();
    } catch (error: unknown) {
      handleApiError(error);
    }
  };

  const onDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteUser.mutateAsync(deleteTarget.id);
      toast.success(t("users.deleted"));
      setDeleteTarget(null);
    } catch (error: unknown) {
      handleApiError(error);
    }
  };

  const openEdit = (user: User) => {
    setEditTarget(user);
    editForm.reset({ username: user.username, role: user.role as EditUserForm["role"], password: "" });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("users.title")}
        description={t("users.description")}
        icon={UsersIcon}
        actions={
          <Button onClick={() => { createForm.reset(); setCreateOpen(true); }}>
            <PlusIcon className="size-4" />
            {t("users.addUser")}
          </Button>
        }
      />

      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <UsersTable
          users={users}
          isLoading={isLoading}
          onEdit={openEdit}
          onDelete={setDeleteTarget}
        />
      )}

      <UserCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        username={createForm.watch("username")}
        password={createForm.watch("password")}
        role={createForm.watch("role")}
        isPending={createUser.isPending}
        errors={createForm.formState.errors}
        onUsernameChange={(v) => createForm.setValue("username", v)}
        onPasswordChange={(v) => createForm.setValue("password", v)}
        onRoleChange={(v) => createForm.setValue("role", v as CreateUserForm["role"])}
        onSubmit={createForm.handleSubmit(onCreateSubmit)}
      />

      <UserEditDialog
        open={!!editTarget}
        onOpenChange={(v) => !v && setEditTarget(null)}
        username={editForm.watch("username")}
        password={editForm.watch("password")}
        role={editForm.watch("role")}
        isPending={updateUser.isPending}
        onUsernameChange={(v) => editForm.setValue("username", v)}
        onPasswordChange={(v) => editForm.setValue("password", v)}
        onRoleChange={(v) => editForm.setValue("role", v as EditUserForm["role"])}
        onSubmit={editForm.handleSubmit(onEditSubmit)}
      />

      <UserDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        username={deleteTarget?.username ?? ""}
        isPending={deleteUser.isPending}
        onConfirm={onDeleteConfirm}
      />
    </div>
  );
}
