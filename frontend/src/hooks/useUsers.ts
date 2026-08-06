import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserService, type UserCreateData, type UserUpdateData } from "@/services/UserService";

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: () => UserService.list(),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UserCreateData) => UserService.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UserUpdateData }) =>
      UserService.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => UserService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });
}
