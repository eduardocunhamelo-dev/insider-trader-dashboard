import PlatformDashboard from "./dashboard/PlatformDashboard";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useClientNav } from "@/contexts/ClientNavContext";
import { formatUSD } from "@/lib/format";
import {
  TrendingUp,
  ArrowUpRight,
  DollarSign,
  Calendar,
  Target,
  CheckCircle2,
  Lock,
  Trophy,
  AlertTriangle,
  Zap,
  ArrowDownRight,
  RefreshCw,
  ShieldAlert,
  Users,
  ShoppingBag,
  ChevronRight,
} from "lucide-react";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatUsd = (value: number) => formatUSD(value);
const formatUsdCents = (cents: number) => formatUSD(cents / 100);

// ─── Skeleton Components ─────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <Card className="bg-card/60 border-white/[0.06]">
      <CardContent className="p-6">
        <div className="w-10 h-10 rounded-xl bg-muted/30 animate-pulse mb-4" />
        <div className="h-7 w-24 bg-muted/30 rounded animate-pulse mb-2" />
        <div className="h-3 w-16 bg-muted/20 rounded animate-pulse mb-1" />
        <div className="h-2 w-20 bg-muted/15 rounded animate-pulse" />
      </CardContent>
    </Card>
  );
}

function SkeletonEvaluation() {
  return (
    <Card className="bg-card/60 border-white/[0.06]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="h-5 w-44 bg-muted/30 rounded animate-pulse" />
          <div className="h-7 w-12 bg-muted/30 rounded animate-pulse" />
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="h-3 w-full bg-muted/20 rounded-full animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-3.5 rounded-xl bg-muted/15 border border-white/[0.06]">
              <div className="h-2 w-16 bg-muted/30 rounded animate-pulse mb-2" />
              <div className="h-4 w-20 bg-muted/20 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="app-section max-w-none animate-in">
      <div>
        <div className="h-7 w-48 bg-muted/30 rounded animate-pulse mb-2" />
        <div className="h-4 w-72 bg-muted/20 rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 app-grid">
        {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
      </div>
      <SkeletonEvaluation />
      <div className="grid lg:grid-cols-3 app-grid">
        <div className="lg:col-span-2">
          <div className="h-64 rounded-xl bg-muted/10 border border-white/[0.06] animate-pulse" />
        </div>
        <div className="app-section">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-5 lg:p-6 rounded-xl border border-white/[0.06] bg-card/40">
              <div className="h-10 w-10 rounded-xl bg-muted/30 animate-pulse mb-3" />
              <div className="h-4 w-28 bg-muted/30 rounded animate-pulse mb-1" />
              <div className="h-3 w-36 bg-muted/20 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { trader: user } = useTraderAuth();
  const { navigateTo } = useClientNav();

  const { data: traderData, isLoading: traderLoading, error: traderError } = trpc.trader.me.useQuery(undefined, {
    enabled: !!user,
    retry: false,
  });

  const { data: stats, isLoading: statsLoading, error: statsError, refetch: refetchStats, isFetching: statsFetching } = trpc.trader.dashboardStats.useQuery(undefined, {
    enabled: !!user,
    retry: 0,
    refetchInterval: 60_000,
  });

  const trader = traderData;
  const traderName = trader?.name ?? user?.name ?? "Trader";

  if (traderLoading || statsLoading) {
    return <DashboardSkeleton />;
  }

  if (traderError || statsError) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto py-12 text-center">
        <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6 text-destructive" />
        </div>
        <h2 className="text-xl font-bold">Servidor de trading inicializando</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          O servidor de trading está inicializando após um período de inatividade. Isso pode levar até 60 segundos. Tente novamente em instantes.
        </p>
        <button
          onClick={() => { refetchStats(); }}
          disabled={statsFetching}
          className="text-sm text-primary hover:underline disabled:opacity-50"
        >
          {statsFetching ? "Tentando reconectar..." : "Tentar novamente"}
        </button>
      </div>
    );
  }

  // Computed values
  const currentDrawdown = stats?.currentDrawdown ?? 0;
  const maxDrawdown = stats?.maxDrawdown ?? 5;
  const profitTarget = stats?.profitTarget ?? 8;
  const currentProfit = stats?.currentProfit ?? 0;
  const daysRemaining = stats?.daysRemaining ?? 30;
  const hasMetaAccount = stats?.hasMetaAccount ?? false;
  const metaAccounts = stats?.metaAccounts ?? [];
  const minTradingDays = stats?.minTradingDays ?? 10;
  const primaryTradingDays = stats?.primaryTradingDays ?? 0;
  const tradingDays = primaryTradingDays;

  const evaluationProgress = profitTarget > 0
    ? Math.min(100, Math.max(0, Math.round((currentProfit / profitTarget) * 100)))
    : (trader?.evaluationProgress ?? 0);

  const drawdownProgress = maxDrawdown > 0
    ? Math.min(100, Math.round((currentDrawdown / maxDrawdown) * 100))
    : 0;

  return (
    <div className="space-y-5">

      {/* ── Greeting ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Olá, {traderName.split(" ")[0]}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Resumo da sua performance em tempo real
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {hasMetaAccount && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-400 font-semibold">Ao vivo</span>
            </div>
          )}
          <button
            onClick={() => refetchStats()}
            disabled={statsFetching}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/[0.06] bg-muted/10 hover:bg-muted/30 transition-colors disabled:opacity-50"
            title="Atualizar dados"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${statsFetching ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* ── Status Alerts ── */}
      {hasMetaAccount && currentDrawdown > maxDrawdown * 0.7 && (
        <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-xl animate-in">
          <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-destructive text-sm">Atenção: Drawdown em {currentDrawdown.toFixed(2)}%</p>
            <p className="text-xs text-muted-foreground">Limite máximo: {maxDrawdown}%. Gerencie seu risco com cuidado.</p>
          </div>
          <Button size="sm" variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/10 shrink-0" onClick={() => navigateTo("rules")}>
            Ver Regras
          </Button>
        </div>
      )}

      {trader?.status === "approved" && (
        <div className="flex items-center gap-3 p-4 bg-primary/10 border border-primary/20 rounded-xl">
          <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
          <div>
            <p className="font-semibold text-primary text-sm">Trader Aprovado — Conta Real</p>
            <p className="text-xs text-muted-foreground">Você está operando com capital da Insider. O lucro é seu.</p>
          </div>
        </div>
      )}

      {!hasMetaAccount && trader?.status === "active" && (
        <div className="flex items-center gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
          <Zap className="w-5 h-5 text-blue-400 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-blue-400 text-sm">Nenhuma conta MT5 ativa</p>
            <p className="text-xs text-muted-foreground">Adquira um plano para receber sua conta MT5 e começar a operar.</p>
          </div>
          <Button size="sm" variant="outline" className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 shrink-0" onClick={() => navigateTo("plans")}>
            Ver Planos
          </Button>
        </div>
      )}

      {/* ── 4 Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 app-grid">
        {[
          {
            label: "Saldo",
            value: hasMetaAccount
              ? formatUsd(metaAccounts.reduce((sum, a) => sum + (a.currentBalance ?? 0), 0))
              : `$${((trader?.capitalUsd ?? 10000) / 1000).toFixed(0)}k`,
            sub: hasMetaAccount
              ? `${metaAccounts.length} conta${metaAccounts.length > 1 ? "s" : ""} ativa${metaAccounts.length > 1 ? "s" : ""}`
              : "Nenhuma conta ativa",
            icon: TrendingUp,
            iconColor: "text-primary",
            iconBg: "bg-primary/15",
            valueColor: "text-primary",
            trend: null as null | "up" | "down",
          },
          (() => {
            const profitUsd = hasMetaAccount
              ? metaAccounts.reduce((sum, a) => sum + ((a.currentBalance ?? 0) - (a.initialBalance ?? 0)), 0)
              : (trader?.totalProfitCents ?? 0) / 100;
            const isNegative = currentProfit < 0 || profitUsd < 0;
            return {
              label: "Lucro",
              value: hasMetaAccount
                ? formatUsd(profitUsd)
                : formatUsdCents(trader?.totalProfitCents ?? 0),
              sub: `${currentProfit.toFixed(2)}% de ${profitTarget}%`,
              icon: isNegative ? ArrowDownRight : ArrowUpRight,
              iconColor: isNegative ? "text-destructive" : "text-emerald-400",
              iconBg: isNegative ? "bg-destructive/15" : "bg-emerald-500/15",
              valueColor: isNegative ? "text-destructive" : "text-emerald-400",
              trend: isNegative ? "down" as const : "up" as const,
            };
          })(),
          {
            label: "Drawdown",
            value: `${currentDrawdown.toFixed(2)}%`,
            sub: `Max: ${maxDrawdown}%`,
            icon: ShieldAlert,
            iconColor: "text-orange-400",
            iconBg: "bg-orange-500/15",
            valueColor: "text-orange-400",
            trend: null as null | "up" | "down",
          },
          {
            label: "Dias",
            value: `${tradingDays}`,
            sub: `Min: ${minTradingDays} dias`,
            icon: Calendar,
            iconColor: "text-blue-400",
            iconBg: "bg-blue-500/15",
            valueColor: "text-foreground",
            trend: null as null | "up" | "down",
          },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i} className="bg-card/60 border-white/[0.06] card-premium relative overflow-hidden group">
              {/* Subtle top accent */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-white/[0.06] to-transparent" />
              <CardContent className="p-5 lg:p-6">
                {/* Icon top-left + optional trend badge top-right */}
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl ${stat.iconBg} flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
                    <Icon className={`w-5 h-5 ${stat.iconColor}`} />
                  </div>
                  {stat.trend && (
                    <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-2 py-1 rounded-full ${
                      stat.trend === "up"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-destructive/10 text-destructive border border-destructive/20"
                    }`}>
                      {stat.trend === "up" ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
                      {stat.trend === "up" ? "+" : ""}{currentProfit.toFixed(1)}%
                    </span>
                  )}
                </div>
                {/* Value */}
                <p className={`text-2xl font-bold font-mono leading-none ${stat.valueColor} mb-1.5`}>
                  {stat.value}
                </p>
                {/* Sub label */}
                <p className="text-[11px] text-muted-foreground/60">{stat.sub}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Evaluation Progress — full width ── */}
      <Card className="bg-card/60 border-white/[0.06] overflow-hidden relative card-premium">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary/60 via-primary/30 to-transparent" />
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/3 rounded-full blur-[80px] pointer-events-none" />
        <CardHeader className="pb-3 pt-5 relative z-10">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2 font-bold">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Target className="w-3.5 h-3.5 text-primary" />
              </div>
              Progresso da Avaliação
            </CardTitle>
            <div className="text-right">
              <span className="text-3xl font-bold font-mono text-primary">{evaluationProgress}%</span>
              <p className="text-[10px] text-muted-foreground/50 text-right">da meta</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 relative z-10">
          <div className="relative">
            <Progress value={evaluationProgress} className="h-3" />
            {evaluationProgress > 0 && evaluationProgress < 100 && (
              <div
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-primary border-2 border-background shadow-lg"
                style={{ left: `calc(${evaluationProgress}% - 8px)` }}
              />
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-muted/15 border border-white/[0.06] hover:border-primary/20 transition-colors">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Meta de Lucro</p>
              <p className="font-bold font-mono text-sm mt-1">
                <span className="text-primary">{currentProfit.toFixed(2)}%</span>
                <span className="text-muted-foreground"> / {profitTarget}%</span>
              </p>
            </div>
            <div className="p-3 rounded-xl bg-muted/15 border border-white/[0.06] hover:border-primary/20 transition-colors">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Drawdown</p>
              <p className="font-bold font-mono text-sm mt-1">
                <span className="text-orange-400">
                  {currentDrawdown.toFixed(2)}%
                </span>
                <span className="text-muted-foreground"> / {maxDrawdown}%</span>
              </p>
              <div className="mt-2 h-1 rounded-full bg-muted/30 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 bg-orange-400"
                  style={{ width: `${drawdownProgress}%` }}
                />
              </div>
            </div>
            <div className="p-3 rounded-xl bg-muted/15 border border-white/[0.06] hover:border-primary/20 transition-colors">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Dias Operados</p>
              <p className="font-bold font-mono text-sm mt-1">
                <span className={tradingDays >= minTradingDays ? "text-emerald-400" : "text-blue-400"}>{tradingDays}</span>
                <span className="text-muted-foreground"> / {minTradingDays} min</span>
              </p>
              {tradingDays >= minTradingDays && (
                <p className="text-[9px] text-emerald-400 mt-1 font-medium">Mínimo atingido</p>
              )}
            </div>
            <div className="p-3 rounded-xl bg-muted/15 border border-white/[0.06] hover:border-primary/20 transition-colors">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Prazo</p>
              <p className="font-bold font-mono text-sm mt-1">
                <span className={daysRemaining <= 7 ? "text-orange-400" : "text-foreground"}>{daysRemaining}</span>
                <span className="text-muted-foreground"> dias</span>
              </p>
              {daysRemaining <= 7 && (
                <p className="text-[9px] text-orange-400 mt-1 font-medium">Prazo curto!</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Two Column: Accounts List + Quick Actions ── */}
      <div className="grid lg:grid-cols-3 app-grid">

        {/* Left (2/3) — Platform Dashboard (accounts list) */}
        <div className="lg:col-span-2">
          <PlatformDashboard accounts={metaAccounts} />
        </div>

        {/* Right (1/3) — Quick Actions (consolidated) */}
        <div className="space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground/40 px-1">Ações Rápidas</p>

          {/* Minhas Contas */}
          <button
            onClick={() => navigateTo(hasMetaAccount ? "accounts" : "plans")}
            className="w-full flex items-center gap-4 p-4 rounded-xl border border-white/[0.06] bg-card/30 hover:bg-card/60 hover:border-primary/20 transition-all cursor-pointer group card-premium text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm leading-tight text-foreground">Minhas Contas</p>
              <p className="text-xs text-muted-foreground/70 mt-0.5">
                {hasMetaAccount ? `${metaAccounts.length} conta(s) ativa(s)` : "Nenhuma conta ativa"}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
          </button>

          {/* Solicitar Saque */}
          <button
            onClick={() => trader?.status === "approved" && navigateTo("payouts")}
            className={`w-full flex items-center gap-4 p-4 rounded-xl border border-white/[0.06] bg-card/30 transition-all group card-premium text-left ${
              trader?.status === "approved" ? "hover:bg-card/60 hover:border-[#D4AF37]/30 cursor-pointer" : "cursor-default opacity-70"
            }`}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 ${
              trader?.status === "approved" ? "bg-[#D4AF37]/15" : "bg-muted/20"
            }`}>
              {trader?.status === "approved"
                ? <DollarSign className="w-5 h-5 text-[#D4AF37]" />
                : <Lock className="w-5 h-5 text-muted-foreground/50" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm leading-tight text-foreground">Solicitar Saque</p>
              <p className="text-xs text-muted-foreground/70 mt-0.5">
                {trader?.status === "approved" ? "Saldo disponível" : "Após aprovação"}
              </p>
            </div>
            {trader?.status !== "approved" && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted/20 text-muted-foreground border border-white/[0.06] shrink-0">
                Bloqueado
              </span>
            )}
            {trader?.status === "approved" && (
              <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-[#D4AF37] group-hover:translate-x-0.5 transition-all shrink-0" />
            )}
          </button>

          {/* Leaderboard */}
          <button
            onClick={() => navigateTo("leaderboard")}
            className="w-full flex items-center gap-4 p-4 rounded-xl border border-white/[0.06] bg-card/30 hover:bg-card/60 hover:border-blue-500/30 transition-all cursor-pointer group card-premium text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110">
              <Trophy className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm leading-tight text-foreground">Leaderboard</p>
              <p className="text-xs text-muted-foreground/70 mt-0.5">
                {trader?.consecutiveCycles ?? 0} ciclos consecutivos
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all shrink-0" />
          </button>

          {/* Loja de Planos */}
          <button
            onClick={() => navigateTo("plan-store")}
            className="w-full flex items-center gap-4 p-4 rounded-xl border border-white/[0.06] bg-card/30 hover:bg-card/60 hover:border-emerald-500/30 transition-all cursor-pointer group card-premium text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110">
              <ShoppingBag className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm leading-tight text-foreground">Loja de Planos</p>
              <p className="text-xs text-muted-foreground/70 mt-0.5">
                Adquira uma nova conta
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all shrink-0" />
          </button>
        </div>
      </div>
    </div>
  );
}
