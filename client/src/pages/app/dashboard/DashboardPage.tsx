import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useDashboard } from "./useDashboard";
import DashboardHeader from "./DashboardHeader";
import FreshAccountBanner from "./FreshAccountBanner";
import MetricCards from "./MetricCards";
import EquityChart from "./EquityChart";
import OperationsTable from "./OperationsTable";
import OperationsCalendar from "./OperationsCalendar";
import DashboardSkeleton from "./DashboardSkeleton";
import ErrorState from "./ErrorState";
import { cn } from "@/lib/utils";
import { LayoutDashboard, List, CalendarDays } from "lucide-react";

interface DashboardPageProps {
  accountOperationId: number;
  onBack?: () => void;
}

type TabId = "overview" | "operations" | "calendar";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Visão Geral", icon: LayoutDashboard },
  { id: "operations", label: "Operações", icon: List },
  { id: "calendar", label: "Calendário", icon: CalendarDays },
];

export default function DashboardPage({ accountOperationId, onBack }: DashboardPageProps) {
  const queryClient = useQueryClient();
  const { data, isLoading, error, refetch, isFetching } = useDashboard(accountOperationId);
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  // Hard refresh: invalidates cache and forces a fresh fetch from Mesa Prime
  const handleHardRefresh = async () => {
    // Invalidate the cached data first
    await queryClient.invalidateQueries({ queryKey: ["dashboard", accountOperationId] });
    // Then fetch with refresh=true param by temporarily overriding the queryFn
    const res = await fetch(`/api/dashboard/${accountOperationId}?refresh=true`, {
      credentials: "include",
    });
    if (res.ok) {
      const freshData = await res.json();
      queryClient.setQueryData(["dashboard", accountOperationId], freshData);
    }
  };

  if (isLoading) return <DashboardSkeleton />;
  if (error) return <ErrorState error={error as any} onRetry={refetch} />;
  if (!data) return null;

  const { equity_curve, summary } = data;
  const isFresh = data.meta.is_fresh_account;

  return (
    <div className="space-y-6">
      <DashboardHeader
        data={data}
        onRefresh={refetch}
        onHardRefresh={handleHardRefresh}
        isRefreshing={isFetching}
        onBack={onBack}
      />

      {isFresh && <FreshAccountBanner />}

      <MetricCards data={data} />

      {/* ── Tab bar ── */}
      {!isFresh && (
        <div className="flex items-center gap-1 p-1 rounded-xl bg-card/30 border border-white/[0.06] w-fit">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                  isActive
                    ? "bg-primary/15 text-primary border border-primary/30 shadow-[0_0_10px_rgba(0,255,133,0.08)]"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/20"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Tab content ── */}
      {!isFresh && (
        <>
          {activeTab === "overview" && (
            <div className="space-y-6">
              {equity_curve.length > 0 && (
                <EquityChart
                  curve={equity_curve}
                  initial={summary.balance_initial}
                  floor={summary.drawdown_floor}
                  target={summary.balance_initial + summary.profit_target}
                />
              )}
              <OperationsTable operations={data.operations} />
            </div>
          )}

          {activeTab === "operations" && (
            <OperationsTable operations={data.operations} />
          )}

          {activeTab === "calendar" && (
            <OperationsCalendar operations={data.operations} />
          )}
        </>
      )}
    </div>
  );
}
