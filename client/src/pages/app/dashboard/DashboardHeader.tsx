import { RefreshCw, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/format";
import type { DashboardResponse } from "./types";
import { ACCOUNT_STATUS_LABELS } from "./types";
import { cn } from "@/lib/utils";

interface DashboardHeaderProps {
  data: DashboardResponse;
  onRefresh: () => void;
  onHardRefresh: () => void;
  isRefreshing: boolean;
  onBack?: () => void;
}

const STATUS_COLORS: Record<number, string> = {
  1: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  2: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  3: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  4: "bg-red-500/20 text-red-400 border-red-500/30",
  5: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

export default function DashboardHeader({
  data,
  onRefresh,
  onHardRefresh,
  isRefreshing,
  onBack,
}: DashboardHeaderProps) {
  const { account, plan, meta } = data;
  const statusLabel = ACCOUNT_STATUS_LABELS[account.status] ?? `Status ${account.status}`;
  const statusColor = STATUS_COLORS[account.status] ?? STATUS_COLORS[5];
  const planName = plan?.name ?? null;

  return (
    <div
      role="region"
      aria-label="Informações da conta"
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-white/[0.06]"
    >
      {/* Left: back + account info */}
      <div className="flex items-start gap-3">
        {onBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground"
            aria-label="Voltar"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
        )}
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-foreground">
              Conta #{account.mt5_login}
            </h1>
            {planName && (
              <span className="text-sm text-muted-foreground font-medium">
                — {planName}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge
              variant="outline"
              className={cn("text-xs font-medium border", statusColor)}
            >
              {statusLabel}
            </Badge>
            {account.days_running !== null && (
              <span className="text-sm text-muted-foreground">
                Operando há {account.days_running} {account.days_running === 1 ? "dia" : "dias"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right: last sync + refresh buttons */}
      <div className="flex items-center gap-2 sm:ml-auto">
        <span className="text-xs text-muted-foreground">
          Atualizado {formatRelativeTime(meta.last_sync_at)}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={onRefresh}
          disabled={isRefreshing}
          aria-label="Atualizar dados"
          title="Atualizar (cache)"
          className="text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onHardRefresh}
          disabled={isRefreshing}
          title="Forçar sincronização com Mesa Prime"
          className="text-xs"
        >
          Sincronizar
        </Button>
      </div>
    </div>
  );
}
