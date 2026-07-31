import { useQuery } from "@tanstack/react-query";
import type { DashboardResponse } from "./types";

export function useDashboard(accountOperationId: number | null) {
  return useQuery({
    queryKey: ["dashboard", accountOperationId],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard/${accountOperationId}`, {
        credentials: "include",
      });
      if (!res.ok) {
        const err = new Error(`HTTP ${res.status}`);
        (err as any).status = res.status;
        throw err;
      }
      return res.json() as Promise<DashboardResponse>;
    },
    enabled: accountOperationId !== null && accountOperationId > 0,
    refetchInterval: 5 * 60 * 1000, // 5 min — alinhado com TTL do backend
    staleTime: 4 * 60 * 1000,       // considera fresh por 4 min
    retry: (failureCount, error: any) => {
      // Não retenta em 401/403/404
      if ([401, 403, 404].includes(error?.status)) return false;
      return failureCount < 2;
    },
  });
}

/** Variante que força refresh=true no backend (bypassa cache) */
export function useDashboardHardRefetch(accountOperationId: number | null) {
  return useQuery({
    queryKey: ["dashboard-hard", accountOperationId],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard/${accountOperationId}?refresh=true`, {
        credentials: "include",
      });
      if (!res.ok) {
        const err = new Error(`HTTP ${res.status}`);
        (err as any).status = res.status;
        throw err;
      }
      return res.json() as Promise<DashboardResponse>;
    },
    enabled: false, // só executa quando refetch() é chamado manualmente
    staleTime: 0,
  });
}
