import { useQuery } from "@tanstack/react-query";
import { SystemService } from "@/services/SystemService";

const DISK_SPACE_KEY = "disk-space";

export function useDiskSpace() {
  const query = useQuery({
    queryKey: [DISK_SPACE_KEY],
    queryFn: () => SystemService.getDiskSpace(),
    refetchInterval: 60 * 1000,
  });

  return {
    diskSpace: query.data?.data,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
