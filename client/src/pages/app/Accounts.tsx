import { trpc } from "@/lib/trpc";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useTraderAuth } from "@/hooks/useTraderAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Calendar as CalendarIcon,
  DollarSign,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Server,
  ShieldAlert,
  Activity,
  RefreshCw,
  Key,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Loader2,
  Zap,
  ArrowRightLeft,
  CalendarDays,
  Rocket,
} from "lucide-react";
import { toast } from "sonner";
import { openCheckout, CHECKOUT_URLS } from "@/lib/checkout";
import { PlanBadge } from "@/lib/planBadge";
import { useClientNav } from "@/contexts/ClientNavContext";
import { useState, useCallback } from "react";
import { formatUSD } from "@/lib/format";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from "recharts";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatUsd = (value: number) => formatUSD(value);

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  active: { label: "Ativa", color: "bg-primary/20 text-primary border-primary/30", icon: Clock },
  daily_limit: { label: "Limite Diário", color: "bg-orange-500/20 text-orange-400 border-orange-500/30", icon: ShieldAlert },
  approved: { label: "Aprovada", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: CheckCircle2 },
  passed: { label: "Aprovada", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: CheckCircle2 },
  failed: { label: "Reprovada", color: "bg-destructive/20 text-destructive border-destructive/30", icon: XCircle },
  violated: { label: "Violada", color: "bg-destructive/20 text-destructive border-destructive/30", icon: XCircle },
  suspended: { label: "Suspensa", color: "bg-muted/30 text-muted-foreground border-muted/50", icon: AlertTriangle },
  inactive: { label: "Inativa", color: "bg-muted/30 text-muted-foreground border-muted/50", icon: AlertTriangle },
  pending: { label: "Pendente", color: "bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/30", icon: AlertTriangle },
  unknown: { label: "Desconhecido", color: "bg-muted/30 text-muted-foreground border-muted/50", icon: AlertTriangle },
};

// ─── LiveBalanceButton ───────────────────────────────────────────────────────

function LiveBalanceButton({ mt5Login, currentBalance, currentEquity }: { mt5Login: string; currentBalance: number; currentEquity: number }) {
  const [liveData, setLiveData] = useState<{ balance: number; equity: number; updatedAt: string } | null>(null);

  const { isFetching, refetch, data: liveQueryData } = trpc.trader.liveBalance.useQuery(
    { mt5Login },
    {
      enabled: false,
      retry: 0,
    }
  );

  // Update liveData when query returns
  const prevDataRef = useState<any>(null);
  if (liveQueryData && liveQueryData !== prevDataRef[0]) {
    prevDataRef[1](liveQueryData);
    setLiveData({ balance: (liveQueryData as any).currentBalance, equity: (liveQueryData as any).currentEquity, updatedAt: (liveQueryData as any).lastUpdated });
  }

  const balance = liveData?.balance ?? currentBalance;
  const equity = liveData?.equity ?? currentEquity;
  const isLive = !!liveData;

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 text-xs">
        {isLive && (
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Ao vivo
          </span>
        )}
      </div>
      <button
        onClick={() => refetch()}
        disabled={isFetching}
        className="flex items-center gap-1 text-[10px] text-muted-foreground/60 hover:text-primary transition-colors disabled:opacity-50"
        title="Atualizar saldo ao vivo da Mesa Prime"
      >
        <RefreshCw className={`w-3 h-3 ${isFetching ? "animate-spin" : ""}`} />
        {isFetching ? "Atualizando..." : "Atualizar saldo"}
      </button>
    </div>
  );
}

// ─── CredenciaisModal ─────────────────────────────────────────────────────────

function CredenciaisModal({ account, open, onClose }: { account: any; open: boolean; onClose: () => void }) {
  const [showPassword, setShowPassword] = useState(false);

  // platform_type: 1 = MT5, 2 = Black Arrow
  const platformType: number = account?.platformType ?? account?.platform_type ?? 1;
  const isBlackArrow = platformType === 2;

  const { data, isLoading, isError } = trpc.trader.accountCredentials.useQuery(
    { accountId: account?.id ?? 0 },
    { enabled: open && !!account, staleTime: 0, retry: false }
  );

  // Fetch platform download links from Mesa Prime AppConfiguration
  const { data: downloadLinks } = trpc.trader.platformDownloadLinks.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success(`${label} copiado!`));
  };

  const server = data?.mt5Server || account?.mt5Server || "ActivTradesCorp-Demo";
  const login = data?.mt5Login || account?.mt5Login || "";
  const password = data?.mt5Password ?? null;
  const planName = data?.planName || account?.planName || account?.plan?.name || "Insider";
  const platformLabel = isBlackArrow ? "Black Arrow" : "MetaTrader 5";

  // Download URL: use Mesa Prime config for MT5, fixed URL for Black Arrow
  const downloadUrl = isBlackArrow
    ? (downloadLinks?.blackArrowUrl || null)
    : (downloadLinks?.mt5Url || null);
  const downloadLabel = isBlackArrow ? "Baixar Black Arrow" : "Baixar MetaTrader 5";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md bg-card border-white/[0.06]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="w-4 h-4 text-primary" />
            {isBlackArrow ? "Credenciais Black Arrow" : "Credenciais MT5"}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8 gap-3">
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
            <span className="text-sm text-muted-foreground">Buscando credenciais...</span>
          </div>
        ) : isError ? (
          <div className="py-6 text-center">
            <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Não foi possível carregar as credenciais. Tente novamente.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Servidor */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Servidor</p>
              <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-muted/10 px-3 py-2.5">
                <Server className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="flex-1 font-mono text-sm">{server}</span>
                <button onClick={() => copyToClipboard(server, "Servidor")} className="text-muted-foreground hover:text-primary transition-colors">
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Conta (Login) */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Conta (Login)</p>
              <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-muted/10 px-3 py-2.5">
                <span className="flex-1 font-mono text-sm font-bold">{login}</span>
                <button onClick={() => copyToClipboard(String(login), "Login")} className="text-muted-foreground hover:text-primary transition-colors">
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Senha */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Senha</p>
              <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-muted/10 px-3 py-2.5">
                <span className="flex-1 font-mono text-sm">
                  {password
                    ? showPassword ? password : "••••••••••"
                    : <span className="text-muted-foreground italic text-xs">Não disponível</span>
                  }
                </span>
                {password && (
                  <>
                    <button onClick={() => setShowPassword(!showPassword)} className="text-muted-foreground hover:text-primary transition-colors">
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => copyToClipboard(password, "Senha")} className="text-muted-foreground hover:text-primary transition-colors">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Configuração */}
            <div className="rounded-lg border border-white/[0.06] bg-muted/5 p-3 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Configuração</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Plataforma:</span>
                  <span className="ml-1 font-medium">{platformLabel}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Plano:</span>
                  <span className="ml-1 font-medium">{planName}</span>
                </div>
              </div>
            </div>

            {/* Botão de download — só aparece se a URL estiver disponível */}
            {downloadUrl && (
              <Button
                variant="outline"
                className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/10"
                onClick={() => window.open(downloadUrl, "_blank", "noopener,noreferrer")}
              >
                <ExternalLink className="w-4 h-4" />
                {downloadLabel}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── DesempenhoPanel ──────────────────────────────────────────────────────────

function DesempenhoPanel({ accountId }: { accountId: number }) {
  const { trader: user } = useTraderAuth();

  const { data, isLoading, isError } = trpc.trader.dashboard.useQuery(
    { accountId },
    { enabled: !!user, staleTime: 60_000, retry: false }
  );

  if (isLoading) {
    return (
      <div className="border-t border-white/[0.06] bg-muted/5 p-4 flex items-center justify-center gap-3 py-6">
        <Loader2 className="w-4 h-4 text-primary animate-spin" />
        <span className="text-sm text-muted-foreground">Carregando desempenho...</span>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="border-t border-white/[0.06] bg-muted/5 p-4 text-center">
        <p className="text-sm text-muted-foreground py-3">Não foi possível carregar o gráfico de desempenho.</p>
      </div>
    );
  }

  const { equity_curve, summary } = data;

  const chartData = equity_curve.map((pt: any) => ({
    ...pt,
    date: pt.date ?? "Início",
  }));

  return (
    <div className="border-t border-white/[0.06] bg-muted/5 p-4">
      {/* Mini-stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-2 rounded-lg bg-muted/10 border border-white/[0.06]">
          <p className="text-[10px] text-muted-foreground">Dias Operados</p>
          <p className="text-sm font-bold text-blue-400">
            {summary.days_traded} / {summary.days_minimum}
          </p>
        </div>
        <div className="text-center p-2 rounded-lg bg-muted/10 border border-white/[0.06]">
          <p className="text-[10px] text-muted-foreground">Lucro Total</p>
          <p className={`text-sm font-bold font-mono ${summary.profit_total >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {summary.profit_total >= 0 ? "+" : ""}
            {formatUSD(summary.profit_total, 0)}
          </p>
        </div>
        <div className="text-center p-2 rounded-lg bg-muted/10 border border-white/[0.06]">
          <p className="text-[10px] text-muted-foreground">Drawdown</p>
          <p className={`text-sm font-bold font-mono ${summary.drawdown_used_pct > 70 ? "text-red-400" : "text-emerald-400"}`}>
            {summary.drawdown_consumed >= 0 ? "+" : ""}
            {formatUSD(summary.drawdown_consumed, 0)}
          </p>
        </div>
      </div>

      {/* Chart header */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-primary" />
          Curva de Capital
        </p>
        {summary.equity_curve_source && (
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-white/[0.06] text-muted-foreground/60">
            {summary.equity_curve_source === "info_graph" ? "mesa prime" : "operações"}
          </span>
        )}
      </div>

      {chartData.length <= 1 ? (
        <div className="h-28 flex items-center justify-center">
          <div className="text-center">
            <TrendingUp className="w-7 h-7 text-muted-foreground/20 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Sem histórico de capital</p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">O gráfico aparecerá após a primeira operação.</p>
          </div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={150}>
          <ComposedChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`balGrad-${accountId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00ff85" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#00ff85" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" hide />
            <YAxis domain={["auto", "auto"]} hide />
            <Tooltip
              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "11px" }}
              formatter={(val: any, name: string) => [
                formatUSD(val as number),
                name === "balance" ? "Saldo" : name === "drawdown_floor" ? "Floor" : "Meta",
              ]}
            />
            <Area type="monotone" dataKey="balance" stroke="#00ff85" strokeWidth={2} fill={`url(#balGrad-${accountId})`} dot={false} />
            {chartData[0]?.drawdown_floor !== undefined && (
              <Line type="monotone" dataKey="drawdown_floor" stroke="#ef4444" strokeWidth={1} strokeDasharray="3 3" dot={false} />
            )}
            {summary.profit_target && (
              <ReferenceLine y={summary.balance_initial + summary.profit_target} stroke="#00ff85" strokeDasharray="4 4" strokeOpacity={0.4} />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function AccountsSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 w-40 bg-muted/30 rounded animate-pulse" />
          <div className="h-4 w-64 bg-muted/20 rounded animate-pulse mt-2" />
        </div>
        <div className="h-10 w-28 bg-muted/30 rounded-lg animate-pulse" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-card/60 border-white/[0.06]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted/30 animate-pulse" />
                <div>
                  <div className="h-7 w-12 bg-muted/30 rounded animate-pulse" />
                  <div className="h-3 w-20 bg-muted/20 rounded animate-pulse mt-1" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {[1, 2].map((i) => (
        <Card key={i} className="bg-card/60 border-white/[0.06]">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center gap-6">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-6 w-24 bg-muted/30 rounded animate-pulse" />
                  <div className="h-5 w-16 bg-muted/20 rounded-full animate-pulse" />
                  <div className="h-5 w-14 bg-muted/20 rounded-full animate-pulse" />
                </div>
                <div className="flex gap-4">
                  <div className="h-4 w-32 bg-muted/20 rounded animate-pulse" />
                  <div className="h-4 w-24 bg-muted/20 rounded animate-pulse" />
                </div>
              </div>
              <div className="flex items-center gap-6">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="text-center min-w-[80px]">
                    <div className="h-3 w-12 bg-muted/20 rounded animate-pulse mx-auto mb-2" />
                    <div className="h-6 w-20 bg-muted/30 rounded animate-pulse mx-auto" />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── ScheduleTab ─────────────────────────────────────────────────────────────

function getScheduleStatusLabel(status: number): { label: string; color: string } {
  // 0=Aguardando pagamento, 1=Aguardando agendamento, 2=Agendado, 3=Conta liberada, 4=Expirado, 5=Reembolsado
  if (status === 0) return { label: "Aguardando pagamento", color: "text-orange-400" };
  if (status === 1) return { label: "Aguardando agendamento", color: "text-[#D4AF37]" };
  if (status === 2) return { label: "Agendado", color: "text-primary" };
  if (status === 3) return { label: "Conta liberada", color: "text-emerald-400" };
  if (status === 4) return { label: "Expirado", color: "text-red-400" };
  if (status === 5) return { label: "Reembolsado", color: "text-muted-foreground" };
  return { label: "Aguardando agendamento", color: "text-[#D4AF37]" };
}

function ScheduleTab() {
  const { data: scheduleList, isLoading, refetch, isFetching } = trpc.trader.scheduleList.useQuery(undefined, {
    retry: 0,
    refetchOnWindowFocus: false,
  });

  const scheduleMutation = trpc.trader.scheduleCreate.useMutation({
    onSuccess: (data) => {
      const isToday = data.scheduledAt === new Date().toISOString().split("T")[0];
      toast.success(isToday ? "Conta iniciada com sucesso! Acesse a aba Minhas Contas." : `Conta agendada para ${new Date(data.scheduledAt + "T12:00:00").toLocaleDateString("pt-BR")}`);
      refetch();
      setSelectedDates({});
      setSchedulingId(null);
      setCalendarOpen({});
      setConfirmStartNow(null);
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao agendar conta.");
      setSchedulingId(null);
      setConfirmStartNow(null);
    },
  });

  const [selectedDates, setSelectedDates] = useState<Record<number, Date | undefined>>({});
  const [calendarOpen, setCalendarOpen] = useState<Record<number, boolean>>({});
  const [schedulingId, setSchedulingId] = useState<number | null>(null);
  // Modal de confirmação para "Iniciar agora"
  const [confirmStartNow, setConfirmStartNow] = useState<number | null>(null);
  // Reagendamento: controla qual card de status=2 está com o calendário aberto
  const [rescheduleOpen, setRescheduleOpen] = useState<Record<number, boolean>>({});
  const [rescheduleDates, setRescheduleDates] = useState<Record<number, Date | undefined>>({});

  // Calcula urgência do prazo: retorna null, 'warning' (<=3 dias) ou 'critical' (<=1 dia)
  const getExpiryUrgency = (expiresAt: string | null): null | 'warning' | 'critical' => {
    if (!expiresAt) return null;
    const expiry = startOfDay(new Date(expiresAt + "T12:00:00"));
    const diffMs = expiry.getTime() - todayDate.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays <= 1) return 'critical';
    if (diffDays <= 3) return 'warning';
    return null;
  };

  const todayStr = new Date().toISOString().split("T")[0];
  const todayDate = startOfDay(new Date());

  const handleSchedule = (scheduleTestId: number, date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    if (isBefore(startOfDay(date), todayDate)) { toast.error("Não é possível agendar para uma data passada."); return; }
    setSchedulingId(scheduleTestId);
    setCalendarOpen((prev) => ({ ...prev, [scheduleTestId]: false }));
    scheduleMutation.mutate({ scheduleTestId, date: dateStr });
  };

  const handleStartNow = (scheduleTestId: number) => {
    setSchedulingId(scheduleTestId);
    setConfirmStartNow(null);
    scheduleMutation.mutate({ scheduleTestId, date: todayStr });
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <Card key={i} className="bg-card/60 border-white/[0.06]">
            <CardContent className="p-5">
              <div className="space-y-3 animate-pulse">
                <div className="h-5 w-48 bg-muted/20 rounded" />
                <div className="h-4 w-32 bg-muted/20 rounded" />
                <div className="h-4 w-40 bg-muted/20 rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const list = scheduleList ?? [];

  if (list.length === 0) {
    return (
      <Card className="bg-card/60 border-white/[0.06] overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
        <CardContent className="p-12 text-center space-y-4 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <CalendarDays className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-bold">Nenhuma conta para agendar</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Quando você adquirir uma conta, ela aparecerá aqui para você escolher quando iniciar.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Modal de confirmação — Iniciar agora */}
      <Dialog open={confirmStartNow !== null} onOpenChange={(open) => { if (!open) setConfirmStartNow(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Agendamento para início do teste</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Ao confirmar o início agora, a conta será disponibilizada imediatamente na aba de contas ativas da plataforma. Deseja continuar?
          </p>
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1 border-destructive/50 text-destructive hover:bg-destructive/10"
              onClick={() => setConfirmStartNow(null)}
              disabled={scheduleMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1"
              onClick={() => confirmStartNow !== null && handleStartNow(confirmStartNow)}
              disabled={scheduleMutation.isPending}
            >
              {scheduleMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {list.length} conta{list.length > 1 ? "s" : ""} aguardando agendamento
        </p>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/[0.06] bg-muted/10 hover:bg-muted/30 transition-colors disabled:opacity-50"
          title="Atualizar"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${isFetching ? "animate-spin" : ""}`} />
        </button>
      </div>

      {list.map((item) => {
        const statusInfo = getScheduleStatusLabel(item.scheduleStatus);
        const isProcessing = schedulingId === item.id && scheduleMutation.isPending;
        const selectedDate = selectedDates[item.id];
        const isOpen = calendarOpen[item.id] ?? false;
        // Botões de agendar/iniciar APENAS no status 1 (Aguardando agendamento)
        const canSchedule = item.scheduleStatus === 1;
        // Status 2 = já agendado, mostra a data + botão reagendar
        const isScheduled = item.scheduleStatus === 2;
        // Status 0 = aguardando pagamento, não mostra botões
        const awaitingPayment = item.scheduleStatus === 0;
        // Urgência do prazo
        const urgency = getExpiryUrgency(item.expiresAt);
        const isRescheduleOpen = rescheduleOpen[item.id] ?? false;
        const rescheduleDate = rescheduleDates[item.id];

        return (
          <Card key={item.id} className="bg-card/60 border-white/[0.06] hover:border-primary/30 transition-all card-premium overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/60 to-primary/10" />
            <CardContent className="p-5 space-y-4">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="space-y-1">
                  <h3 className="font-bold text-base">{item.planName}</h3>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-primary" />
                      <span className="font-mono font-semibold text-foreground">
                        {item.capitalUsd > 0 ? `$${item.capitalUsd.toLocaleString("en-US")}` : "—"}
                      </span>
                    </span>
                    {item.expiresAt && (
                      <span className={`flex items-center gap-1.5 ${
                        urgency === 'critical' ? 'text-red-400 font-semibold' :
                        urgency === 'warning' ? 'text-orange-400' : ''
                      }`}>
                        <CalendarIcon className="w-3.5 h-3.5" />
                        Expira em: {new Date(item.expiresAt + "T12:00:00").toLocaleDateString("pt-BR")}
                        {urgency === 'critical' && <span className="ml-1 text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide">Urgente</span>}
                        {urgency === 'warning' && <span className="ml-1 text-[10px] bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide">Expira em breve</span>}
                      </span>
                    )}
                    {item.platform && (
                      <span className="flex items-center gap-1.5 text-xs bg-muted/20 px-2 py-0.5 rounded-full">
                        Meta trader {item.platform === "MT5" ? "5" : item.platform}
                      </span>
                    )}
                  </div>
                </div>
                <Badge variant="outline" className={`${statusInfo.color} border-current/30 text-[11px] px-2 py-0.5 shrink-0`}>
                  <Clock className="w-3 h-3 mr-1" />
                  {statusInfo.label}
                </Badge>
              </div>

              {/* Status 2: Agendado — mostra a data + botão reagendar */}
              {isScheduled && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 rounded-lg bg-primary/5 border border-primary/20 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                      <p className="text-sm text-primary">
                        {item.scheduleDate
                          ? `Agendado para ${new Date(item.scheduleDate + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`
                          : "Agendado"}
                      </p>
                    </div>
                    {/* Botão Reagendar */}
                    <Popover open={isRescheduleOpen} onOpenChange={(open) => setRescheduleOpen((prev) => ({ ...prev, [item.id]: open }))}>
                      <PopoverTrigger asChild>
                        <button
                          disabled={isProcessing}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors shrink-0 disabled:opacity-50"
                        >
                          <CalendarDays className="w-3.5 h-3.5" />
                          Reagendar
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="end">
                        <div className="px-3 pt-3 pb-1">
                          <p className="text-xs text-muted-foreground">Escolha uma nova data de início</p>
                        </div>
                        <Calendar
                          mode="single"
                          selected={rescheduleDate}
                          onSelect={(date) => {
                            if (!date) return;
                            setRescheduleDates((prev) => ({ ...prev, [item.id]: date }));
                          }}
                          disabled={(date) => isBefore(startOfDay(date), todayDate)}
                          locale={ptBR}
                          initialFocus
                        />
                        <div className="flex gap-2 p-3 border-t border-border">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => {
                              setRescheduleOpen((prev) => ({ ...prev, [item.id]: false }));
                              setRescheduleDates((prev) => ({ ...prev, [item.id]: undefined }));
                            }}
                          >
                            Cancelar
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1"
                            disabled={!rescheduleDate || isProcessing}
                            onClick={() => {
                              if (rescheduleDate) {
                                setRescheduleOpen((prev) => ({ ...prev, [item.id]: false }));
                                handleSchedule(item.id, rescheduleDate);
                              }
                            }}
                          >
                            {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Confirmar"}
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}

              {/* Status 0: Aguardando pagamento — aviso sem botões */}
              {awaitingPayment && (
                <div className="flex items-center gap-2 rounded-lg bg-orange-500/5 border border-orange-500/20 px-4 py-3">
                  <Clock className="w-4 h-4 text-orange-400 shrink-0" />
                  <p className="text-sm text-orange-400">
                    Aguardando confirmação do pagamento. Assim que confirmado, você poderá agendar o início.
                  </p>
                </div>
              )}

              {/* Status 1: Aguardando agendamento — calendário popover + modal iniciar agora */}
              {canSchedule && (
                <div className="pt-3 border-t border-white/[0.06]">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    {/* Botão Agendar início — abre calendário popover */}
                    <Popover open={isOpen} onOpenChange={(open) => setCalendarOpen((prev) => ({ ...prev, [item.id]: open }))}>
                      <PopoverTrigger asChild>
                        <button
                          disabled={isProcessing}
                          className="flex-1 flex items-center justify-center gap-2.5 h-12 px-6 rounded-xl border border-white/20 bg-white/5 text-white/90 text-base font-semibold hover:bg-white/10 hover:border-white/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed backdrop-blur-sm"
                        >
                          {isProcessing && scheduleMutation.variables?.date !== todayStr ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CalendarDays className="w-4 h-4" />
                          )}
                          Agendar início
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 shadow-xl border-white/[0.08] bg-card" align="start">
                        <div className="px-4 pt-4 pb-2 border-b border-white/[0.06]">
                          <p className="text-sm font-semibold">Escolha a data de início</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Selecione quando deseja começar a operar</p>
                        </div>
                        <div className="p-2">
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={(date) => {
                              if (!date) return;
                              setSelectedDates((prev) => ({ ...prev, [item.id]: date }));
                            }}
                            disabled={(date) => isBefore(startOfDay(date), todayDate)}
                            locale={ptBR}
                            initialFocus
                          />
                        </div>
                        {selectedDate && (
                          <div className="px-4 py-2 bg-primary/5 border-t border-white/[0.06]">
                            <p className="text-xs text-primary font-medium">
                              Selecionado: {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                            </p>
                          </div>
                        )}
                        <div className="flex gap-2 p-3 border-t border-white/[0.06]">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 border-white/[0.08]"
                            onClick={() => {
                              setCalendarOpen((prev) => ({ ...prev, [item.id]: false }));
                              setSelectedDates((prev) => ({ ...prev, [item.id]: undefined }));
                            }}
                          >
                            Cancelar
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1 shadow-[0_0_12px_rgba(0,255,133,0.2)]"
                            disabled={!selectedDate}
                            onClick={() => selectedDate && handleSchedule(item.id, selectedDate)}
                          >
                            Confirmar
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>

                    <div className="flex items-center justify-center">
                      <span className="text-muted-foreground/40 text-xs font-medium uppercase tracking-widest">ou</span>
                    </div>

                    {/* Botão Iniciar agora — abre modal de confirmação */}
                    <button
                      disabled={isProcessing}
                      className="flex-1 flex items-center justify-center gap-2.5 h-12 px-6 rounded-xl bg-gradient-to-r from-[#1a2e1a] to-[#0f1f0f] border border-white/15 text-white/90 text-base font-semibold hover:from-[#1f361f] hover:to-[#142014] hover:border-white/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                      onClick={() => setConfirmStartNow(item.id)}
                    >
                      {isProcessing && scheduleMutation.variables?.date === todayStr ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Rocket className="w-4 h-4" />
                      )}
                      Iniciar agora
                    </button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

type FilterType = "all" | "active" | "approved" | "failed";
type SortType = "default" | "profit" | "drawdown";
type PlatformFilterType = "all" | "mt5" | "ba";

export default function Accounts() {
  const { trader: user } = useTraderAuth();
  const { navigateTo, navigateToAccountDetails } = useClientNav();

  const [credentialsAccount, setCredentialsAccount] = useState<any>(null);
  const [expandedAccountId, setExpandedAccountId] = useState<number | null>(null);
  const [accountFilter, setAccountFilter] = useState<FilterType>("all");
  const [accountSort, setAccountSort] = useState<SortType>("default");
  const [platformFilter, setPlatformFilter] = useState<PlatformFilterType>("all");
  const [viewMode, setViewMode] = useState<"accounts" | "schedule">("accounts");

  const toggleDesempenho = useCallback((id: number) => {
    setExpandedAccountId((prev) => (prev === id ? null : id));
  }, []);

  const { data: accounts, isLoading, isError, refetch, isFetching } = trpc.trader.metaAccounts.useQuery(undefined, {
    enabled: !!user,
    retry: 0,
    refetchInterval: 60_000,
  });

  const { data: futuresAccounts } = trpc.trader.metaAccountsFutures.useQuery(undefined, {
    enabled: !!user,
    retry: 0,
    refetchInterval: 120_000,
  });

  if (isLoading) {
    return (
      <div className="space-y-8">
        <AccountsSkeleton />
        <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground py-4">
          <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span>Conectando ao servidor de trading... Isso pode levar alguns segundos.</span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Minhas Contas</h1>
            <p className="text-muted-foreground mt-1">Gerencie suas contas de negociação MT5</p>
          </div>
        </div>
        <Card className="bg-card/60 border-white/[0.06]">
          <CardContent className="p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            <h3 className="text-xl font-bold">Servidor de trading temporariamente indisponível</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              O servidor de trading está inicializando. Isso acontece após períodos de inatividade e pode levar até 60 segundos.
            </p>
            <Button onClick={() => refetch()} className="mt-2" disabled={isFetching}>
              {isFetching ? (
                <><div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />Tentando reconectar...</>
              ) : (
                <><RefreshCw className="w-4 h-4 mr-2" />Tentar Novamente</>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  // ─── Unified account list (MT5 + Black Arrow) ─────────────────────────────
  const mt5List = (accounts ?? []).map((a: any) => ({ ...a, platformType: a.platformType ?? 1 }));
  const baList = (futuresAccounts ?? []).map((a: any) => ({ ...a, platformType: 2 }));
  const allAccounts = [...mt5List, ...baList];
  // Platform filter
  let accountList = allAccounts;
  if (platformFilter === "mt5") accountList = allAccounts.filter((a) => a.platformType === 1);
  else if (platformFilter === "ba") accountList = allAccounts.filter((a) => a.platformType === 2);
  const activeCount = accountList.filter((a) => ["active", "daily_limit"].includes(a.status)).length;
  const approvedCount = accountList.filter((a) => ["approved", "passed"].includes(a.status)).length;
  const failedCount = accountList.filter((a) => ["failed", "violated"].includes(a.status)).length;
  const totalCapital = accountList.reduce((sum, a) => sum + a.capitalUsd, 0);
  const mt5Count = allAccounts.filter((a) => a.platformType === 1).length;
  const baCount = allAccounts.filter((a) => a.platformType === 2).length;
  // Status filter
  let filtered = accountList as any[];
  if (accountFilter === "active") filtered = filtered.filter((a) => ["active", "daily_limit"].includes(a.status));
  else if (accountFilter === "approved") filtered = filtered.filter((a) => ["approved", "passed"].includes(a.status));
  else if (accountFilter === "failed") filtered = filtered.filter((a) => ["failed", "violated"].includes(a.status));
  // Sort
  if (accountSort === "profit") {
    filtered = [...filtered].sort((a, b) => (b.currentBalance - b.initialBalance) - (a.currentBalance - a.initialBalance));
  } else if (accountSort === "drawdown") {
    filtered = [...filtered].sort((a, b) => b.drawdownPercent - a.drawdownPercent);
  }
  const countMap: Record<FilterType, number> = {
    all: accountList.length,
    active: activeCount,
    approved: approvedCount,
    failed: failedCount,
  };
  const labelMap: Record<FilterType, string> = {
    all: "Todas",
    active: "Em Avaliação",
    approved: "Aprovadas",
    failed: "Reprovadas",
  };

  return (
    <div className="app-section max-w-[1800px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground/40 mb-1">Trading</p>
          <h1 className="text-2xl font-bold">Minhas Contas</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {allAccounts.length > 0
              ? `${allAccounts.length} conta${allAccounts.length > 1 ? "s" : ""} · MT5: ${mt5Count} · Black Arrow: ${baCount} · Capital: ${formatUsd(totalCapital)}`
              : "Gerencie suas contas MT5 e Black Arrow"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-white/[0.06] bg-muted/10 hover:bg-muted/30 transition-colors disabled:opacity-50"
            title="Atualizar dados"
          >
            <RefreshCw className={`w-4 h-4 text-muted-foreground ${isFetching ? "animate-spin" : ""}`} />
          </button>
          <Button className="gap-2" onClick={() => navigateTo("plan-store")}>
            <Plus className="w-4 h-4" />
            Nova Conta
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 app-grid">
        {[
          { label: "Total de Contas", value: allAccounts.length, icon: BarChart3, color: "text-primary", bg: "bg-primary/10", accent: "from-primary/30 to-primary/5" },
          { label: "Em Avaliação", value: activeCount, icon: Clock, color: "text-primary", bg: "bg-primary/10", accent: "from-primary/30 to-primary/5" },
          { label: "Aprovadas", value: approvedCount, icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10", accent: "from-emerald-500/30 to-emerald-500/5" },
          { label: "Capital Total", value: formatUsd(totalCapital), icon: DollarSign, color: "text-[#D4AF37]", bg: "bg-[#D4AF37]/10", accent: "from-[#D4AF37]/30 to-[#D4AF37]/5" },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i} className="bg-card/60 border-white/[0.06] hover:border-white/[0.12] transition-all card-premium group overflow-hidden relative">
              <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${stat.accent}`} />
              <CardContent className="app-card-sm pt-5">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className={`text-2xl font-bold font-mono ${stat.color}`}>{stat.value}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Live indicator */}
      {allAccounts.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>Dados atualizados em tempo real · Próxima atualização em 60s</span>
        </div>
      )}

      {/* View mode tabs: Contas | Agendar */}
      <div className="flex items-center gap-1 rounded-lg border border-white/[0.06] bg-muted/10 p-1 w-fit">
        <button
          onClick={() => setViewMode("accounts")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            viewMode === "accounts" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          Minhas Contas
        </button>
        <button
          onClick={() => setViewMode("schedule")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            viewMode === "schedule" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <CalendarDays className="w-3.5 h-3.5" />
          Agendar
        </button>
      </div>

      {/* Schedule view */}
      {viewMode === "schedule" && <ScheduleTab />}

      {/* Filter + Sort bar */}
      {viewMode === "accounts" && allAccounts.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {/* Platform filter */}
          <div className="flex items-center gap-1 rounded-lg border border-[#D4AF37]/20 bg-[#D4AF37]/5 p-1">
            {(["all", "mt5", "ba"] as PlatformFilterType[]).map((p) => (
              <button
                key={p}
                onClick={() => setPlatformFilter(p)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  platformFilter === p ? "bg-[#D4AF37]/20 text-[#D4AF37]" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {p === "all" ? "Todas" : p === "mt5" ? "MT5" : "Black Arrow"}
                <span className={`inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold ${
                  platformFilter === p ? "bg-[#D4AF37]/30 text-[#D4AF37]" : "bg-muted/30 text-muted-foreground"
                }`}>
                  {p === "all" ? allAccounts.length : p === "mt5" ? mt5Count : baCount}
                </span>
              </button>
            ))}
          </div>
          {/* Status filter */}
          <div className="flex items-center gap-1 rounded-lg border border-white/[0.06] bg-muted/10 p-1">
            {(["all", "active", "approved", "failed"] as FilterType[]).map((f) => (
              <button
                key={f}
                onClick={() => setAccountFilter(f)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  accountFilter === f ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {labelMap[f]}
                <span className={`inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold ${
                  accountFilter === f ? "bg-primary/30 text-primary" : "bg-muted/30 text-muted-foreground"
                }`}>
                  {countMap[f]}
                </span>
              </button>
            ))}
          </div>
          {/* Sort */}
          <div className="flex items-center gap-1 rounded-lg border border-white/[0.06] bg-muted/10 p-1">
            {(["default", "profit", "drawdown"] as SortType[]).map((s) => (
              <button
                key={s}
                onClick={() => setAccountSort(s)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  accountSort === s ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {s === "default" ? "Padrão" : s === "profit" ? "Lucro ↓" : "Drawdown ↓"}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Account Cards */}
      {viewMode === "accounts" && (allAccounts.length > 0 ? (
        filtered.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">Nenhuma conta corresponde ao filtro selecionado.</p>
            <button onClick={() => setAccountFilter("all")} className="text-xs text-primary hover:underline mt-2">
              Limpar filtro
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((account: any) => {
              const config = statusConfig[account.status] ?? statusConfig.unknown;
              const StatusIcon = config.icon;
              const profit = account.currentBalance - account.initialBalance;
              const isProfit = profit >= 0;
              const isExpanded = expandedAccountId === account.id;
              const isBA = account.platformType === 2;
              const floorUsd = account.trailingDrawdownUsd ?? 0;

              // Metrics: BA hides Equity (not meaningful), shows Floor instead of Drawdown%
              const metrics = isBA
                ? [
                    { label: "Saldo", value: formatUsd(account.currentBalance), color: "text-foreground", icon: undefined },
                    { label: "Lucro", value: `${isProfit ? "+" : ""}${formatUsd(profit)}`, color: isProfit ? "text-primary" : "text-destructive", icon: isProfit ? TrendingUp : TrendingDown },
                    { label: "Floor", value: floorUsd > 0 ? formatUsd(floorUsd) : "—", color: "text-orange-400", icon: undefined },
                  ]
                : [
                    { label: "Saldo", value: formatUsd(account.currentBalance), color: "text-foreground", icon: undefined },
                    { label: "Equity", value: formatUsd(account.currentEquity), color: "text-foreground", icon: undefined },
                    { label: "Lucro", value: `${isProfit ? "+" : ""}${formatUsd(profit)}`, color: isProfit ? "text-primary" : "text-destructive", icon: isProfit ? TrendingUp : TrendingDown },
                    { label: "Floor", value: floorUsd > 0 ? formatUsd(floorUsd) : "—", color: "text-orange-400", icon: undefined },
                  ];

              return (
                <Card
                  key={account.id}
                  className={`bg-card/60 transition-all card-premium overflow-hidden relative ${
                    isBA
                      ? "border-[#D4AF37]/20 hover:border-[#D4AF37]/40"
                      : "border-white/[0.06] hover:border-primary/30"
                  }`}
                >
                  {/* Status accent bar */}
                  <div className={`absolute top-0 left-0 right-0 h-0.5 ${
                    ["active", "daily_limit"].includes(account.status) ? (isBA ? "bg-[#D4AF37]" : "bg-primary") :
                    ["approved", "passed"].includes(account.status) ? "bg-emerald-400" :
                    ["failed", "violated"].includes(account.status) ? "bg-destructive" :
                    "bg-muted"
                  }`} />

                  <CardContent className="p-5 pt-6">
                    {/* Top row: identity + metrics */}
                    <div className="flex flex-col lg:flex-row lg:items-start gap-5">
                      {/* Left: info */}
                      <div className="flex-1 space-y-2.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-xl font-mono tracking-tight">{account.mt5Login}</h3>
                          <Badge variant="outline" className={`${config.color} text-[11px] px-2 py-0.5`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {config.label}
                          </Badge>
                          {isBA ? (
                            <Badge variant="outline" className="border-[#D4AF37]/40 text-[#D4AF37] text-[10px] px-2">
                              <ArrowRightLeft className="w-2.5 h-2.5 mr-1" />
                              Black Arrow
                            </Badge>
                          ) : (
                            <PlanBadge category={account.planCategory} />
                          )}
                          {account.metaapiDeployState === "deployed" && (
                            <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-[10px]">
                              <Server className="w-2.5 h-2.5 mr-1" />
                              Live
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground/60 flex-wrap">
                          {account.activatedAt && (
                            <span className="flex items-center gap-1">
                              <CalendarIcon className="w-3 h-3" />
                              {new Date(account.activatedAt).toLocaleDateString("pt-BR")}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            {formatUsd(account.capitalUsd)}
                          </span>
                          {account.mt5Server && (
                            <span className="flex items-center gap-1">
                              <Server className="w-3 h-3" />
                              {account.mt5Server}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: metric columns */}
                      <div className={`grid gap-px rounded-xl overflow-hidden shrink-0 bg-white/[0.04] ${isBA ? "grid-cols-3" : "grid-cols-4"}`}>
                        {metrics.map((m, mi) => {
                          const MIcon = m.icon;
                          return (
                            <div key={mi} className="bg-muted/5 px-3 py-2.5 text-center">
                              <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/50 mb-1">{m.label}</p>
                              <p className={`font-mono font-bold text-[13px] flex items-center justify-center gap-0.5 ${m.color}`}>
                                {MIcon && <MIcon className="w-3 h-3" />}
                                {m.value}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Progress bars for active accounts */}
                    {["active", "daily_limit"].includes(account.status) && (
                      <div className="mt-4 pt-3 border-t border-white/[0.06]">
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1.5">
                          <span>Lucro: {account.profitPercent.toFixed(2)}% / {account.profitTargetPercent}%</span>
                          <span>Drawdown: {account.drawdownPercent.toFixed(2)}% / {account.maxDrawdownPercent}%</span>
                        </div>
                        <div className="flex gap-2">
                          <div className="flex-1 h-1.5 bg-muted/20 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(Math.max(0, (account.profitPercent / account.profitTargetPercent) * 100), 100)}%` }}
                            />
                          </div>
                          <div className="flex-1 h-1.5 bg-muted/20 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                account.drawdownPercent > account.maxDrawdownPercent * 0.7 ? "bg-destructive" :
                                account.drawdownPercent > account.maxDrawdownPercent * 0.4 ? "bg-orange-400" :
                                "bg-emerald-400"
                              }`}
                              style={{ width: `${Math.min(Math.max(0, (account.drawdownPercent / account.maxDrawdownPercent) * 100), 100)}%` }}
                            />
                          </div>
                        </div>
                        <div className="flex justify-between text-[9px] text-muted-foreground/50 mt-1">
                          <span>Meta de Lucro</span>
                          <span>Drawdown Máximo</span>
                        </div>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="space-y-2 mt-4 pt-3 border-t border-white/[0.04]">
                      <div className="flex items-center gap-2">
                        {/* Desempenho */}
                        <Button
                          size="sm"
                          className={`flex-1 gap-1.5 text-xs h-9 font-semibold transition-all ${
                            isExpanded
                              ? "bg-primary/15 text-primary border border-primary/30 shadow-none hover:bg-primary/25"
                              : "bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25"
                          }`}
                          onClick={(e) => { e.stopPropagation(); toggleDesempenho(account.id); }}
                        >
                          <TrendingUp className="w-3.5 h-3.5" />
                          Desempenho
                          {isExpanded ? <ChevronUp className="w-3 h-3 ml-auto" /> : <ChevronDown className="w-3 h-3 ml-auto" />}
                        </Button>
                        {/* Detalhes */}
                        <Button
                          size="sm"
                          className="flex-1 gap-1.5 text-xs h-9 font-semibold bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25"
                          onClick={(e) => { e.stopPropagation(); navigateToAccountDetails(account.id); }}
                        >
                          <BarChart3 className="w-3.5 h-3.5" />
                          Detalhes
                        </Button>
                        {/* Credenciais — visível com texto */}
                        <Button
                          size="sm"
                          className="gap-1.5 text-xs h-9 font-semibold bg-muted/20 text-muted-foreground border border-white/[0.06] hover:bg-muted/40 hover:text-foreground px-3"
                          onClick={(e) => { e.stopPropagation(); setCredentialsAccount(account); }}
                        >
                          <Key className="w-3.5 h-3.5" />
                          Credenciais
                        </Button>
                      </div>
                      {/* Live balance row */}
                      {account.mt5Login && (
                        <div className="flex justify-end">
                          <LiveBalanceButton
                            mt5Login={String(account.mt5Login)}
                            currentBalance={account.currentBalance}
                            currentEquity={account.currentEquity}
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>

                  {/* Desempenho expandable panel */}
                  {isExpanded && <DesempenhoPanel accountId={account.id} />}
                </Card>
              );
            })}
          </div>
        )
      ) : (
        /* Empty state */
        <Card className="bg-card/60 border-white/[0.06] overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
          <CardContent className="p-12 text-center space-y-4 relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <TrendingUp className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold">Nenhuma conta encontrada</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Você ainda não possui contas MT5 ou Black Arrow. Adquira um plano de avaliação para receber sua conta com capital da Insider.
            </p>
            <Button onClick={() => navigateTo("plan-store")} className="mt-2 shadow-[0_0_16px_rgba(0,255,133,0.2)]">
              <Plus className="w-4 h-4 mr-2" />
              Adquirir Plano
            </Button>
          </CardContent>
        </Card>
      ))}

      {/* CTA for more accounts */}
      {viewMode === "accounts" && allAccounts.length > 0 && (
        <Card className="bg-card/30 border-dashed border-white/[0.06] hover:border-primary/30 transition-colors cursor-pointer" onClick={() => navigateTo("plan-store")}>
          <CardContent className="p-8 text-center">
            <Plus className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
            <h3 className="font-semibold text-muted-foreground">Quer operar mais capital?</h3>
            <p className="text-sm text-muted-foreground/70 mt-1 mb-4">
              Adquira um novo plano e comece a operar com mais capital da Insider.
            </p>
            <Button variant="outline" className="border-primary/50 text-primary hover:bg-primary/10">
              Ver Planos Disponíveis
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ─── Black Arrow section removed: BA accounts now appear in the unified list above ─── */}
      <div className="hidden">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center">
            <ArrowRightLeft className="w-4 h-4 text-[#D4AF37]" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground/40">Black Arrow · Futuros</p>
            <h2 className="text-lg font-bold">Black Arrow</h2>
          </div>
          <Badge variant="outline" className="ml-auto border-[#D4AF37]/30 text-[#D4AF37] text-[10px] px-2">
            <Zap className="w-2.5 h-2.5 mr-1" />
            Em breve
          </Badge>
        </div>

        {futuresAccounts && futuresAccounts.length > 0 ? (
          <div className="space-y-3">
            {futuresAccounts.map((acc: any) => (
              <Card key={acc.id} className="bg-card/40 border-[#D4AF37]/10 hover:border-[#D4AF37]/30 transition-all overflow-hidden relative opacity-80">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#D4AF37]/60 to-[#D4AF37]/10" />
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center shrink-0">
                      <ArrowRightLeft className="w-5 h-5 text-[#D4AF37]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold font-mono text-base">{acc.mt5Login || acc.mesaPrimeAccountId}</span>
                        <Badge variant="outline" className="border-[#D4AF37]/30 text-[#D4AF37] text-[10px]">Black Arrow · Futuros</Badge>
                        <Badge variant="outline" className="border-muted/30 text-muted-foreground text-[10px]">{acc.planName || "Black Arrow"}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground/60 mt-1">
                        Capital: {acc.capitalUsd ? `$${acc.capitalUsd.toLocaleString()}` : "—"}
                        {acc.activatedAt && ` · Ativada em ${new Date(acc.activatedAt).toLocaleDateString("pt-BR")}`}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground/50 mb-1">Saldo</p>
                      <p className="font-mono font-bold text-[#D4AF37]">
                        {acc.currentBalance ? `$${acc.currentBalance.toLocaleString()}` : "—"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/[0.04] flex items-center gap-2">
                    <div className="flex-1 rounded-lg bg-[#D4AF37]/5 border border-[#D4AF37]/10 px-3 py-2 text-center">
                      <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">Dashboard Black Arrow</p>
                      <p className="text-xs text-[#D4AF37]/70 mt-0.5">Em breve · Plataforma Black Arrow</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-card/30 border-[#D4AF37]/10 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/3 via-transparent to-transparent pointer-events-none" />
            <CardContent className="p-8 text-center space-y-3 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center mx-auto">
                <ArrowRightLeft className="w-7 h-7 text-[#D4AF37]" />
              </div>
              <h3 className="text-base font-bold">Black Arrow · Futuros</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Plataforma exclusiva para operações em contratos futuros (WIN, WDO, DOL). Em breve disponível para traders aprovados.
              </p>
              <Badge variant="outline" className="border-[#D4AF37]/30 text-[#D4AF37]">
                <Zap className="w-3 h-3 mr-1" />
                Em breve
              </Badge>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Credenciais Modal */}
      {credentialsAccount && (
        <CredenciaisModal
          account={credentialsAccount}
          open={!!credentialsAccount}
          onClose={() => setCredentialsAccount(null)}
        />
      )}
    </div>
  );
}
