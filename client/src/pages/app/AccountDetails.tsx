import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Calendar,
  Target,
  Shield,
  Clock,
  Activity,
  DollarSign,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  KeyRound,
  BarChart2,
  ListOrdered,
  BookOpen,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  XCircle,
  Minus,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useTraderAuth } from "@/hooks/useTraderAuth";
import { useClientNav } from "@/contexts/ClientNavContext";
import { useMemo, useState } from "react";
import { formatUSD } from "@/lib/format";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
  Brush,
} from "recharts";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const statusColors: Record<string, string> = {
  active: "bg-primary/20 text-primary border-primary/30",
  approved: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  failed: "bg-destructive/20 text-destructive border-destructive/30",
  violated: "bg-destructive/20 text-destructive border-destructive/30",
  suspended: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  inactive: "bg-muted/30 text-muted-foreground border-muted/50",
  cancelled: "bg-muted/30 text-muted-foreground border-muted/50",
  unknown: "bg-muted/30 text-muted-foreground border-muted/50",
};
const statusLabels: Record<string, string> = {
  active: "Ativa",
  approved: "Aprovada",
  failed: "Reprovada",
  violated: "Violada",
  suspended: "Suspensa",
  inactive: "Inativa",
  cancelled: "Cancelada",
  unknown: "Desconhecido",
};
const getStatusKey = (status: number): string => {
  if (status === 1 || status === 2) return "active";
  if (status === 3) return "approved";
  if (status === 4) return "failed";
  if (status === 5) return "cancelled";
  if (status === 6) return "violated";
  return "unknown";
};

const fmt = (val: number) => formatUSD(val);
const fmtCompact = (val: number) => formatUSD(val, 0);

// ─── Circular Gauge ───────────────────────────────────────────────────────────
function CircularGauge({
  value,
  max,
  color,
  size = 64,
}: {
  value: number;
  max: number;
  color: string;
  size?: number;
}) {
  const pct = Math.min(Math.max(value / (max || 1), 0), 1);
  const r = (size / 2) * 0.7;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = Math.PI * r; // half circle
  const dash = pct * circumference;

  // Half-circle arc: from left to right, bottom half hidden
  const startX = cx - r;
  const startY = cy;
  const endX = cx + r;
  const endY = cy;
  const arcPath = `M ${startX} ${startY} A ${r} ${r} 0 0 1 ${endX} ${endY}`;

  // Needle angle: -180deg (left) to 0deg (right)
  const angle = -180 + pct * 180;
  const rad = (angle * Math.PI) / 180;
  const needleLen = r - 4;
  const nx = cx + needleLen * Math.cos(rad);
  const ny = cy + needleLen * Math.sin(rad);

  return (
    <svg
      width={size}
      height={size / 2 + 6}
      viewBox={`0 0 ${size} ${size / 2 + 6}`}
      className="overflow-visible"
    >
      {/* Background arc */}
      <path
        d={arcPath}
        fill="none"
        stroke="rgba(255,255,255,0.07)"
        strokeWidth="5"
        strokeLinecap="round"
      />
      {/* Value arc */}
      <path
        d={arcPath}
        fill="none"
        stroke={color}
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circumference}`}
        style={{ filter: `drop-shadow(0 0 4px ${color}80)` }}
      />
      {/* Needle */}
      <line
        x1={cx}
        y1={cy}
        x2={nx}
        y2={ny}
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity={0.9}
      />
      <circle cx={cx} cy={cy} r="2.5" fill={color} />
    </svg>
  );
}

// ─── Custom Chart Tooltip ─────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label, initialBalance }: any) {
  if (!active || !payload?.length) return null;
  const saldoEntry = payload.find((p: any) => p.dataKey === "Saldo");
  const drawdownEntry = payload.find((p: any) => p.dataKey === "Drawdown");
  const metaEntry = payload.find((p: any) => p.dataKey === "Meta");
  const saldo = saldoEntry?.value;
  const pnl = saldo != null && initialBalance != null ? saldo - initialBalance : null;
  const pct = pnl != null && initialBalance ? (pnl / initialBalance) * 100 : null;

  // Formata o label de data ("MM-DD" → "DD/MM" ou mantém "Início")
  const dateLabel = label === "Início" ? "Início" : (() => {
    const parts = String(label).split("-");
    return parts.length === 2 ? `${parts[1]}/${parts[0]}` : label;
  })();

  return (
    <div
      className="shadow-2xl backdrop-blur-sm"
      style={{
        background: "rgba(8, 12, 18, 0.96)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "12px",
        padding: "14px 16px",
        minWidth: "220px",
        fontSize: "12px",
      }}
    >
      {/* Header: data */}
      <p style={{ color: "rgba(255,255,255,0.45)", marginBottom: "10px", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {dateLabel}
      </p>

      {/* P&L summary */}
      {pnl != null && (
        <div style={{ marginBottom: "10px", paddingBottom: "10px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
            <span style={{ color: "rgba(255,255,255,0.5)" }}>P&amp;L vs Inicial</span>
            <span style={{ fontFamily: "monospace", fontWeight: 700, color: pnl >= 0 ? "#00ff85" : "#ef4444" }}>
              {pnl >= 0 ? "+" : ""}{fmt(pnl)}
            </span>
          </div>
          {pct != null && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", marginTop: "4px" }}>
              <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px" }}>Variação</span>
              <span style={{ fontFamily: "monospace", fontWeight: 600, fontSize: "11px", color: pct >= 0 ? "rgba(0,255,133,0.75)" : "rgba(239,68,68,0.75)" }}>
                {pct >= 0 ? "+" : ""}{pct.toFixed(2)}%
              </span>
            </div>
          )}
        </div>
      )}

      {/* Saldo */}
      {saldoEntry && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#00ff85", flexShrink: 0 }} />
          <span style={{ color: "rgba(255,255,255,0.55)", flex: 1 }}>Saldo</span>
          <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#00ff85" }}>{fmt(saldoEntry.value)}</span>
        </div>
      )}

      {/* Drawdown (floor) */}
      {drawdownEntry && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#ef4444", flexShrink: 0 }} />
          <span style={{ color: "rgba(255,255,255,0.55)", flex: 1 }}>Drawdown (piso)</span>
          <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#ef4444" }}>{fmt(drawdownEntry.value)}</span>
        </div>
      )}

      {/* Meta */}
      {metaEntry && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#3b82f6", flexShrink: 0 }} />
          <span style={{ color: "rgba(255,255,255,0.55)", flex: 1 }}>Meta</span>
          <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#3b82f6" }}>{fmt(metaEntry.value)}</span>
        </div>
      )}
    </div>
  );
}

// ─── Calendar Tab ─────────────────────────────────────────────────────────────
function OperationsCalendar({
  operations,
}: {
  operations: Array<{ date: string; value: number }>;
}) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthLabel = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(currentDate);
  const capitalizedMonth =
    monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

  const dayMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const op of operations) {
      if (!op.date) continue;
      const d = op.date.slice(0, 10);
      map[d] = (map[d] ?? 0) + op.value;
    }
    return map;
  }, [operations]);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <div className="bg-card/20 rounded-xl border border-white/[0.06] overflow-hidden">
      {/* Month navigation */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2 text-primary">
          <Calendar className="w-4 h-4" />
          <span className="font-semibold text-sm">Calendário de Operações</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={prevMonth}
            className="p-1 hover:text-primary transition-colors text-muted-foreground"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium min-w-[140px] text-center">
            {capitalizedMonth}
          </span>
          <button
            onClick={nextMonth}
            className="p-1 hover:text-primary transition-colors text-muted-foreground"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-white/[0.04]">
        {weekDays.map((d) => (
          <div
            key={d}
            className="py-2 text-center text-[10px] text-muted-foreground/50 font-medium uppercase tracking-wider"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7">
        {cells.map((day, idx) => {
          if (!day) {
            return (
              <div
                key={`empty-${idx}`}
                className="border-r border-b border-white/[0.04] min-h-[80px]"
              />
            );
          }
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const pnl = dayMap[dateStr];
          const isToday = dateStr === todayStr;
          const hasOps = pnl !== undefined;
          const isPositive = hasOps && pnl > 0;

          return (
            <div
              key={dateStr}
              className={`border-r border-b border-white/[0.04] min-h-[80px] p-2 ${
                isToday
                  ? "bg-primary/5"
                  : hasOps
                  ? isPositive
                    ? "bg-primary/[0.03]"
                    : "bg-destructive/[0.03]"
                  : ""
              }`}
            >
              <span
                className={`text-xs font-medium ${
                  isToday ? "text-primary" : "text-muted-foreground/40"
                }`}
              >
                {day}
              </span>
              {hasOps && (
                <div
                  className={`mt-1.5 text-[11px] font-mono font-semibold ${
                    isPositive ? "text-primary" : "text-destructive"
                  }`}
                >
                  {isPositive ? "+" : ""}
                  {fmt(pnl)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AccountDetails() {
  const { trader: user } = useTraderAuth();
  const { selectedAccountId, navigateTo } = useClientNav();
  const [activeTab, setActiveTab] = useState<
    "stats" | "rules" | "orders" | "calendar-tab"
  >("stats");
  const [showMinMax, setShowMinMax] = useState(true);
  const [chartPeriod, setChartPeriod] = useState<"7d" | "30d" | "all">("all");
  const [credModalOpen, setCredModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const accountId = selectedAccountId;
  const onBack = () => navigateTo("accounts");

  // ─── Data fetching ────────────────────────────────────────────────────────
  const {
    data,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = trpc.trader.dashboard.useQuery(
    { accountId: accountId ?? 0 },
    {
      enabled: !!user && accountId !== null,
      retry: false,
      staleTime: 60_000,
    }
  );

  const { data: perfData } = trpc.trader.performance.useQuery(
    { accountId: accountId ?? 0 },
    {
      enabled: !!user && accountId !== null,
      retry: false,
      staleTime: 120_000,
    }
  );

  const { data: credData } = trpc.trader.accountCredentials.useQuery(
    { accountId: accountId ?? 0 },
    {
      enabled: !!user && accountId !== null && credModalOpen,
      retry: false,
      staleTime: 300_000,
    }
  );

  // Platform download links (MT5 from Mesa Prime AppConfig, Black Arrow fixed)
  const { data: downloadLinks } = trpc.trader.platformDownloadLinks.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  });

  // ─── Derived values ───────────────────────────────────────────────────────
  const derived = useMemo(() => {
    if (!data) return null;
    const s = data.summary;
    const closedOps = (data.operations ?? []).filter((op) => op.type === 2);
    const openOps = (data.operations ?? []).filter((op) => op.type === 1);

    // From perfData (Mesa Prime performance endpoint)
    const p = perfData as any;
    const winRate = p?.win_rate ?? 0; // 0-1 or 0-100 depending on API
    const winRatePct =
      winRate > 1 ? winRate : winRate * 100; // normalize to 0-100
    const profitFactor = p?.profit_factor ?? 0;
    const avgWin = p?.average_trade
      ? parseFloat(String(p.average_trade))
      : 0;
    const totalProfit = p?.total_profit
      ? parseFloat(String(p.total_profit))
      : 0;
    const totalLoss = p?.total_loss
      ? parseFloat(String(p.total_loss))
      : 0;
    const bestTrade = p?.best_trade
      ? parseFloat(String(p.best_trade))
      : 0;
    const worstTrade = p?.worst_trade
      ? parseFloat(String(p.worst_trade))
      : 0;
    const consecutiveWins = p?.consecutive_wins ?? 0;
    const consecutiveLosses = p?.consecutive_losses ?? 0;

    const statusKey = getStatusKey(data.account.status);

    return {
      s,
      closedOps,
      openOps,
      winRatePct,
      profitFactor,
      avgWin,
      totalProfit,
      totalLoss,
      bestTrade,
      worstTrade,
      consecutiveWins,
      consecutiveLosses,
      statusKey,
    };
  }, [data, perfData]);

  // ─── Chart data ───────────────────────────────────────────────────────────
  const chartData = useMemo(() => {
    if (!data?.equity_curve?.length) return [];
    const all = data.equity_curve.map((pt) => ({
      date: pt.date
        ? String(pt.date).slice(5) // "MM-DD"
        : "Início",
      Saldo: pt.balance,
      Drawdown: pt.drawdown_floor,
      Meta: pt.target,
    }));
    if (chartPeriod === "all") return all;
    const days = chartPeriod === "7d" ? 7 : 30;
    return all.slice(-days);
  }, [data, chartPeriod]);

  // ─── Min/Max points for Saldo line ─────────────────────────────────────────
  const { maxIdx, minIdx } = useMemo(() => {
    if (!chartData.length) return { maxIdx: -1, minIdx: -1 };
    let maxVal = -Infinity, minVal = Infinity, mxIdx = 0, mnIdx = 0;
    chartData.forEach((d: any, i: number) => {
      const v = d.Saldo ?? 0;
      if (v > maxVal) { maxVal = v; mxIdx = i; }
      if (v < minVal) { minVal = v; mnIdx = i; }
    });
    return { maxIdx: mxIdx, minIdx: mnIdx };
  }, [chartData]);

  const renderSaldoDot = (props: any) => {
    const { cx, cy, index } = props;
    if (index === maxIdx && showMinMax) {
      return (
        <g key={`max-${index}`}>
          <circle cx={cx} cy={cy} r={5} fill="#00ff85" stroke="#0a0f14" strokeWidth={2} />
          <text x={cx} y={cy - 10} textAnchor="middle" fontSize={9} fill="#00ff85" fontWeight="bold">MAX</text>
        </g>
      );
    }
    if (index === minIdx && showMinMax) {
      return (
        <g key={`min-${index}`}>
          <circle cx={cx} cy={cy} r={5} fill="#ef4444" stroke="#0a0f14" strokeWidth={2} />
          <text x={cx} y={cy + 16} textAnchor="middle" fontSize={9} fill="#ef4444" fontWeight="bold">MIN</text>
        </g>
      );
    }
    return <circle key={index} cx={cx} cy={cy} r={2} fill="#00ff85" strokeWidth={0} />;
  };

  // ─── Guard: no account ────────────────────────────────────────────────────
  if (!accountId) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">Nenhuma conta selecionada.</p>
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Minhas Contas
        </Button>
      </div>
    );
  }

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-0">
        <div className="h-16 bg-card/30 border-b border-white/[0.04]" />
        <div className="grid grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="h-20 bg-card/20 border-r border-b border-white/[0.04]"
            />
          ))}
        </div>
        <div className="h-80 bg-card/10 m-6 rounded-xl" />
      </div>
    );
  }

  // ─── Error ────────────────────────────────────────────────────────────────
  if (isError || !data || !derived) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="w-10 h-10 text-destructive/40" />
        <p className="text-muted-foreground">Erro ao carregar dados da conta.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  const {
    s,
    closedOps,
    openOps,
    winRatePct,
    profitFactor,
    avgWin,
    totalProfit,
    totalLoss,
    bestTrade,
    worstTrade,
    consecutiveWins,
    consecutiveLosses,
    statusKey,
  } = derived;

  const planName = data.plan?.name ?? "Insider";
  const mt5Login = data.account.mt5_login;

  // ─── Plan date label ─────────────────────────────────────────────────────
  const planDateLabel = (() => {
    const raw = data.account.end_date_plan;
    if (!raw) return null;
    const d = new Date(raw);
    if (isNaN(d.getTime())) return null;
    const formatted = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
    const isSubscription = data.account.payment_type === "subscription";
    return `${isSubscription ? "Renovação" : "Vencimento"}: ${formatted}`;
  })();

  // ─── 8 Metric Cards ───────────────────────────────────────────────────────
  const metrics = [
    // Row 1
    {
      label: "Saldo",
      value: fmt(s.balance_current),
      color: "text-primary",
      subLabel: `Inicial: ${fmt(s.balance_initial)}`,
      icon: <DollarSign className="w-3.5 h-3.5" />,
      iconColor: "text-primary",
    },
    {
      label: "Limite mínimo permitido para a conta",
      value: fmt(s.drawdown_floor),
      color: "text-orange-400",
      subLabel: `Drawdown máx: ${fmt(s.drawdown_max)}`,
      icon: <AlertCircle className="w-3.5 h-3.5" />,
      iconColor: "text-orange-400",
    },
    {
      label: "Consistência",
      value: `${(s.consistence ?? 0).toFixed(1)}%`,
      color: "text-muted-foreground",
      subLabel: "Informativo — não elimina conta",
      icon: <Activity className="w-3.5 h-3.5" />,
      iconColor: "text-muted-foreground",
    },
    {
      label: "Dias operados",
      value: `${s.days_traded}`,
      color: "text-[#4fc3f7]",
      subLabel: `Mínimo: ${s.days_minimum ?? "—"} dias`,
      icon: <Calendar className="w-3.5 h-3.5" />,
      iconColor: "text-[#4fc3f7]",
    },
    // Row 2 — with gauges
    {
      label: "Taxa de acerto",
      value: `${winRatePct.toFixed(1)}%`,
      color: "text-primary",
      gauge: { value: winRatePct, max: 100, color: "#00ff85" },
      subLabel: `${closedOps.filter((o) => o.value > 0).length} de ${closedOps.length} trades`,
      icon: <Activity className="w-3.5 h-3.5" />,
      iconColor: "text-yellow-400",
    },
    {
      label: "Média de ganhos",
      value: fmt(avgWin),
      color: avgWin >= 0 ? "text-primary" : "text-destructive",
      gauge: {
        value: Math.abs(avgWin),
        max: Math.max(Math.abs(avgWin) * 2, 100),
        color: avgWin >= 0 ? "#00ff85" : "#ef4444",
      },
      subLabel: "Por operação fechada",
      icon: <DollarSign className="w-3.5 h-3.5" />,
      iconColor: avgWin >= 0 ? "text-primary" : "text-destructive",
    },
    {
      label: "Fator de risco",
      value: profitFactor > 0 ? `${profitFactor.toFixed(0)}:1` : "—",
      color:
        profitFactor >= 1.5
          ? "text-primary"
          : profitFactor >= 1
          ? "text-yellow-400"
          : "text-destructive",
      subLabel: "Profit factor",
      icon: <Shield className="w-3.5 h-3.5" />,
      iconColor:
        profitFactor >= 1.5
          ? "text-primary"
          : profitFactor >= 1
          ? "text-yellow-400"
          : "text-destructive",
    },
    {
      label: "Total de operações",
      value: closedOps.length.toString(),
      color: "text-[#4fc3f7]",
      subLabel: `${openOps.length} abertas`,
      icon: <Activity className="w-3.5 h-3.5" />,
      iconColor: "text-[#4fc3f7]",
    },
  ];

  // ─── Stats grid ───────────────────────────────────────────────────────────
  const p = perfData as any;
  // Campos adicionais do perfData
  const positiveTrades = p?.positive_trades ?? closedOps.filter((o: any) => o.value > 0).length;
  const negativeTrades = p?.negative_trades ?? closedOps.filter((o: any) => o.value < 0).length;
  const zeroTrades = p?.zero_trades ?? closedOps.filter((o: any) => o.value === 0).length;
  const winPct = p?.win_pct != null ? parseFloat(String(p.win_pct)) : (closedOps.length > 0 ? (positiveTrades / closedOps.length) * 100 : 0);
  const lossPct = p?.loss_pct != null ? parseFloat(String(p.loss_pct)) : (closedOps.length > 0 ? (negativeTrades / closedOps.length) * 100 : 0);
  const maxPositivePts = p?.max_positive_pts ?? p?.best_trade_pts ?? 0;
  const maxNegativePts = p?.max_negative_pts ?? p?.worst_trade_pts ?? 0;
  const maxPositiveVal = p?.best_trade != null ? parseFloat(String(p.best_trade)) : bestTrade;
  const maxNegativeVal = p?.worst_trade != null ? parseFloat(String(p.worst_trade)) : worstTrade;
  const avgWinVal = p?.average_win != null ? parseFloat(String(p.average_win)) : (p?.average_trade != null ? parseFloat(String(p.average_trade)) : avgWin);
  const avgLossVal = p?.average_loss != null ? parseFloat(String(p.average_loss)) : 0;
  const maxContracts = p?.max_contracts ?? p?.max_lots ?? 0;

  const statsGrid = [
    {
      label: "Saldo Líquido",
      value: fmt(s.profit_total),
      color: s.profit_total >= 0 ? "text-primary" : "text-destructive",
    },
    { label: "Lucro Bruto", value: fmt(totalProfit), color: "text-primary" },
    {
      label: "Prejuízo Bruto",
      value: fmt(Math.abs(totalLoss)),
      color: "text-destructive",
    },
    {
      label: "Retorno Compra",
      value: fmt(p?.return_buy ?? 0),
      color: "text-primary",
    },
    {
      label: "Retorno Venda",
      value: fmt(p?.return_sell ?? 0),
      color: p?.return_sell < 0 ? "text-destructive" : "text-primary",
    },
    {
      label: "Média Op. Vencedoras",
      value: fmt(avgWinVal),
      color: "text-primary",
    },
    {
      label: "Média Op. Perdedoras",
      value: fmt(avgLossVal < 0 ? avgLossVal : -Math.abs(avgLossVal)),
      color: "text-destructive",
    },
    {
      label: "Maior Op. Positiva ($)",
      value: fmt(maxPositiveVal),
      color: "text-primary",
    },
    {
      label: "Maior Op. Positiva (pts)",
      value: maxPositivePts > 0 ? maxPositivePts.toFixed(2) : "0",
      color: "text-primary",
    },
    {
      label: "Maior Seq. Positiva",
      value: String(consecutiveWins),
      color: "text-primary",
    },
    {
      label: "Maior Seq. Negativa",
      value: String(consecutiveLosses),
      color: "text-destructive",
    },
    {
      label: "Maior Op. Negativa ($)",
      value: fmt(maxNegativeVal < 0 ? maxNegativeVal : -Math.abs(maxNegativeVal)),
      color: "text-destructive",
    },
    {
      label: "Maior Op. Negativa (pts)",
      value: maxNegativePts < 0 ? Math.abs(maxNegativePts).toFixed(2) : maxNegativePts > 0 ? `-${maxNegativePts.toFixed(2)}` : "0",
      color: "text-destructive",
    },
    {
      label: "Total de Operações",
      value: String(closedOps.length),
      color: "text-foreground",
    },
    {
      label: "Operações Positivas",
      value: String(positiveTrades),
      color: "text-primary",
    },
    {
      label: "Operações Negativas",
      value: String(negativeTrades),
      color: "text-destructive",
    },
    {
      label: "Operações Zero a Zero",
      value: String(zeroTrades),
      color: "text-muted-foreground",
    },
    {
      label: "Taxa de Acerto",
      value: `${winRatePct.toFixed(1)}%`,
      color: "text-yellow-400",
    },
    {
      label: "% Op. Positivas",
      value: `${winPct.toFixed(1)}%`,
      color: "text-primary",
    },
    {
      label: "% Op. Negativas",
      value: `${lossPct.toFixed(1)}%`,
      color: "text-destructive",
    },
    {
      label: "Max. Contratos",
      value: maxContracts > 0 ? maxContracts.toFixed(2) : "0",
      color: "text-foreground",
    },
  ];

  // ─── Rules ────────────────────────────────────────────────────────────────
  const profitOk = s.profit_pct >= s.profit_target_pct;
  const drawdownOk = s.drawdown_used_pct < 100;
  const daysOk = s.days_traded >= (s.days_minimum ?? 5);
  // rule_status: 1=ok, 0=violated, null=unavailable (fallback to true = not violated)
  const dailyLossOk = s.rule_status_max_loss !== null ? s.rule_status_max_loss === 1 : true;
  const consistenceOk = s.rule_status_profit !== null ? s.rule_status_profit === 1 : true;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-[1400px] mx-auto">

      {/* ════════════════════════════════════════════════════════════════════
          HEADER
      ════════════════════════════════════════════════════════════════════ */}
      <div className="px-5 lg:px-6 pt-5 pb-4 border-b border-white/[0.06]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <button
              onClick={onBack}
              className="p-1.5 rounded-lg hover:bg-card/60 transition-colors text-muted-foreground hover:text-foreground shrink-0 mt-0.5"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-bold tracking-tight">
                  {fmt(s.balance_initial)} — {planName}{mt5Login ? ` — ${mt5Login}` : ""}
                </h1>
                <Badge
                  className={`text-[11px] font-semibold border shrink-0 ${
                    statusColors[statusKey] ?? statusColors.unknown
                  }`}
                >
                  {statusLabels[statusKey] ?? "—"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground/70 mt-1">
                {data.account.platform_type === 2 ? "Black Arrow · Futuros" : "MetaTrader 5 · FX/Indices"}
                {planDateLabel ? ` · ${planDateLabel}` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 text-muted-foreground hover:text-foreground"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </div>
        {/* Credentials button — standalone below title, matching reference design */}
        <div className="mt-4 ml-9">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs border-white/[0.10] bg-card/30 hover:bg-card/60"
            onClick={() => setCredModalOpen(true)}
          >
            <KeyRound className="w-3.5 h-3.5" />
            Credenciais
          </Button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          8 METRIC CARDS (4×2 grid — individual rounded cards)
      ════════════════════════════════════════════════════════════════════ */}
      <div className="px-5 lg:px-6 py-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 app-grid">
        {metrics.map((m, i) => (
          <div
            key={i}
            className="rounded-xl border border-white/[0.06] bg-card/20 px-5 py-5 flex items-center justify-between gap-2"
          >
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground leading-tight mb-2.5">
                {m.icon && <span className={m.iconColor}>{m.icon}</span>}
                {m.label}
              </p>
              <p className={`text-2xl font-bold tracking-tight ${m.color}`}>
                {m.value}
              </p>
              {m.subLabel && (
                <p className="text-xs text-muted-foreground/50 mt-1.5">
                  {m.subLabel}
                </p>
              )}
            </div>
            {m.gauge && (
              <div className="shrink-0">
                <CircularGauge
                  value={m.gauge.value}
                  max={m.gauge.max}
                  color={m.gauge.color}
                  size={88}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          PERFORMANCE CHART
      ════════════════════════════════════════════════════════════════════ */}
      <div className="px-5 lg:px-6 py-4 lg:py-6 border-b border-white/[0.04]">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-md bg-muted/20 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-primary" />
            </div>
            <h2 className="text-sm font-semibold text-foreground/80">
              Gráfico de Desempenho
            </h2>
            {/* Period filter buttons */}
            <div className="flex items-center gap-1 bg-card/30 border border-white/[0.04] rounded-lg p-0.5">
              {(["7d", "30d", "all"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setChartPeriod(p)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all duration-150 ${
                    chartPeriod === p
                      ? "bg-primary text-black shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {p === "all" ? "Tudo" : p}
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer select-none group">
            <div
              className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                showMinMax
                  ? "bg-primary border-primary"
                  : "border-white/[0.06] bg-transparent"
              }`}
              onClick={() => setShowMinMax(!showMinMax)}
            >
              {showMinMax && (
                <svg
                  className="w-2.5 h-2.5 text-black"
                  viewBox="0 0 10 10"
                  fill="none"
                >
                  <path
                    d="M2 5l2.5 2.5L8 3"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
            <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
              Exibir máx. e min.
            </span>
          </label>
        </div>


        {chartData.length <= 1 ? (
          <div className="h-[280px] sm:h-[350px] lg:h-[420px] flex flex-col items-center justify-center gap-3 bg-card/10 rounded-xl border border-white/[0.06]">
            <TrendingUp className="w-10 h-10 text-muted-foreground/20" />
            <p className="text-sm text-muted-foreground">
              Sem histórico de capital
            </p>
            <p className="text-xs text-muted-foreground/50">
              O gráfico aparecerá após a primeira operação.
            </p>
          </div>
        ) : (
          <div className="h-[280px] sm:h-[350px] lg:h-[420px]">
            {/* SVG gradient defs for area fill */}
            <svg width="0" height="0" style={{ position: "absolute" }}>
              <defs>
                <linearGradient id="saldoGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00ff85" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#00ff85" stopOpacity={0} />
                </linearGradient>
              </defs>
            </svg>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ top: 8, right: 20, left: 5, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="saldoFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00ff85" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#00ff85" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.04)"
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "rgba(255,255,255,0.25)" }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "rgba(255,255,255,0.25)" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => fmtCompact(v)}
                  width={68}
                  domain={[
                    (dataMin: number) => {
                      // Inclui todos os valores (Saldo, Drawdown, Meta) no cálculo do mínimo
                      const allVals = chartData.flatMap((d: any) => [
                        d.Saldo ?? Infinity,
                        d.Drawdown ?? Infinity,
                        d.Meta ?? Infinity,
                      ]).filter(isFinite);
                      const minVal = Math.min(dataMin, ...allVals);
                      const range = chartData.flatMap((d: any) => [
                        d.Saldo ?? 0, d.Drawdown ?? 0, d.Meta ?? 0,
                      ]).filter(isFinite);
                      const spread = Math.max(...range) - Math.min(...range);
                      const padding = Math.max(spread * 0.15, minVal * 0.005);
                      return Math.floor((minVal - padding) / 100) * 100;
                    },
                    (dataMax: number) => {
                      const allVals = chartData.flatMap((d: any) => [
                        d.Saldo ?? -Infinity,
                        d.Drawdown ?? -Infinity,
                        d.Meta ?? -Infinity,
                      ]).filter(isFinite);
                      const maxVal = Math.max(dataMax, ...allVals);
                      const range = chartData.flatMap((d: any) => [
                        d.Saldo ?? 0, d.Drawdown ?? 0, d.Meta ?? 0,
                      ]).filter(isFinite);
                      const spread = Math.max(...range) - Math.min(...range);
                      const padding = Math.max(spread * 0.15, maxVal * 0.005);
                      return Math.ceil((maxVal + padding) / 100) * 100;
                    },
                  ]}
                />
                <Tooltip
                  content={
                    <ChartTooltip
                      initialBalance={derived?.s?.balance_initial}
                    />
                  }
                  cursor={{
                    stroke: "rgba(255,255,255,0.15)",
                    strokeWidth: 1,
                    strokeDasharray: "4 4",
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  align="center"
                  wrapperStyle={{ fontSize: "11px", paddingTop: "12px", paddingBottom: "4px" }}
                  formatter={(value) => (
                    <span
                      style={{
                        color:
                          value === "Saldo"
                            ? "#00ff85"
                            : value === "Drawdown"
                            ? "#ef4444"
                            : "#60a5fa",
                      }}
                    >
                      {value}
                    </span>
                  )}
                />
                {/* Filled area under Saldo */}
                <Area
                  type="monotone"
                  dataKey="Saldo"
                  stroke="#00ff85"
                  strokeWidth={2}
                  fill="url(#saldoFill)"
                  dot={renderSaldoDot}
                  activeDot={{ r: 5, fill: "#00ff85", stroke: "#0a0f14", strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="Drawdown"
                  stroke="#ef4444"
                  strokeWidth={1.5}
                  dot={false}
                  activeDot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="Meta"
                  stroke="#60a5fa"
                  strokeWidth={1.5}
                  dot={false}
                  activeDot={{ r: 3 }}
                />
                {/* Initial balance reference line */}
                {derived?.s?.balance_initial != null && (
                  <ReferenceLine
                    y={derived.s.balance_initial}
                    stroke="rgba(255,255,255,0.25)"
                    strokeDasharray="6 4"
                    strokeWidth={1}
                    label={{
                      value: `Inicial ${fmtCompact(derived.s.balance_initial)}`,
                      position: "insideTopRight",
                      fontSize: 10,
                      fill: "rgba(255,255,255,0.35)",
                      dy: -4,
                    }}
                  />
                )}
                {/* Brush for zoom/pan */}
                <Brush
                  dataKey="date"
                  height={20}
                  stroke="rgba(255,255,255,0.1)"
                  fill="rgba(0,0,0,0.3)"
                  travellerWidth={6}
                  tickFormatter={() => ""}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          TABS — pill/rounded container style (matches reference design)
      ════════════════════════════════════════════════════════════════════ */}
      <div className="px-5 lg:px-6 pt-6 pb-0 overflow-x-auto">
        <div className="inline-flex items-center bg-card/40 border border-white/[0.08] rounded-full p-1 min-w-max shadow-sm">
          {(
            [
              {
                id: "stats",
                label: "Estatísticas do Trader",
                icon: <BarChart2 className="w-4 h-4" />,
              },
              {
                id: "rules",
                label: "Regras e Objetivos",
                icon: <BookOpen className="w-4 h-4" />,
              },
              {
                id: "orders",
                label: "Histórico de Ordens",
                icon: <ListOrdered className="w-4 h-4" />,
              },
              {
                id: "calendar-tab",
                label: "Calendário",
                icon: <Calendar className="w-4 h-4" />,
              },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all rounded-full whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-primary/20 text-primary font-semibold shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/[0.05]"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          TAB CONTENT
      ════════════════════════════════════════════════════════════════════ */}
      <div className="px-5 lg:px-6 py-6 pb-10">

        {/* ── Estatísticas do Trader ──────────────────────────────────────── */}
        {activeTab === "stats" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-0 border border-white/[0.06] rounded-xl overflow-hidden">
            {statsGrid.map((stat, i) => (
              <div
                key={i}
                className="bg-card/10 border-r border-b border-white/[0.06] p-3.5 sm:p-4 lg:p-5 hover:bg-card/20 transition-colors last:border-r-0"
              >
                <p className="text-xs text-muted-foreground/70 mb-2.5 leading-tight">
                  {stat.label}
                </p>
                <p className={`text-base font-mono font-bold ${stat.color}`}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* ── Regras e Objetivos — tabela 4 colunas (design do print) ────── */}
        {activeTab === "rules" && (
          <div>
            <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
                  <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left px-5 py-3 text-xs text-muted-foreground/70 font-medium">Descrição</th>
                    <th className="text-right px-5 py-3 text-xs text-muted-foreground/70 font-medium">Objetivo</th>
                    <th className="text-right px-5 py-3 text-xs text-muted-foreground/70 font-medium">Resultado</th>
                    <th className="text-right px-5 py-3 text-xs text-muted-foreground/70 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      desc: "Meta de lucro",
                      objetivo: fmt(s.profit_target),
                      resultado: fmt(s.profit_total),
                      ok: profitOk,
                      informative: false,
                    },
                    {
                      desc: "Perda máxima (Drawdown)",
                      objetivo: fmt(s.drawdown_max),
                      resultado: fmt(s.drawdown_max - (s.balance_current - s.drawdown_floor)),
                      ok: drawdownOk,
                      informative: false,
                    },
                    {
                      desc: "Perda máxima diária",
                      objetivo: fmt(s.daily_loss_limit),
                      resultado: fmt(0),
                      ok: dailyLossOk,
                      informative: false,
                    },
                    {
                      desc: "Mínimo de dias operados",
                      objetivo: String(s.days_minimum ?? 10),
                      resultado: String(s.days_traded),
                      ok: daysOk,
                      informative: false,
                    },
                    {
                      desc: "Não ultrapassar mais que 15 dias sem operar",
                      objetivo: "15",
                      resultado: "0",
                      ok: true,
                      informative: false,
                    },
                    {
                      desc: "Não realizar swing trade",
                      objetivo: "Não realizar",
                      resultado: "Não realizou",
                      ok: true,
                      informative: false,
                    },
                    {
                      desc: "Consistência",
                      objetivo: "80",
                      resultado: (s.consistence ?? 0).toFixed(1),
                      ok: consistenceOk,
                      informative: true,
                    },
                    {
                      desc: "Consistência aprovado",
                      objetivo: "—",
                      resultado: "—",
                      ok: null,
                      informative: true,
                    },
                    {
                      desc: "Ativos e quant. de contratos",
                      objetivo: "—",
                      resultado: "—",
                      ok: null,
                      informative: true,
                    },
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-white/[0.04] hover:bg-card/10 transition-colors">
                      <td className="px-5 py-3.5 text-sm text-foreground">{row.desc}</td>
                      <td className="px-5 py-3.5 text-sm text-right font-mono text-muted-foreground">{row.objetivo}</td>
                      <td className="px-5 py-3.5 text-sm text-right font-mono text-foreground">{row.resultado}</td>
                      <td className="px-5 py-3.5 text-right">
                        {row.ok === null ? (
                          <span className="inline-flex items-center gap-1 text-xs text-orange-400">
                            <Clock className="w-3 h-3" />
                            Em teste
                          </span>
                        ) : row.informative ? (
                          <span className="inline-flex items-center gap-1 text-xs text-orange-400">
                            <Clock className="w-3 h-3" />
                            Em teste
                          </span>
                        ) : row.ok ? (
                          <span className="inline-flex items-center gap-1 text-xs text-primary">
                            <CheckCircle2 className="w-3 h-3" />
                            OK
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-destructive">
                            <XCircle className="w-3 h-3" />
                            Violado
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Histórico de Ordens ─────────────────────────────────────────── */}
        {activeTab === "orders" && (
          <div>
            {closedOps.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Activity className="w-10 h-10 text-muted-foreground/20" />
                <p className="text-sm text-muted-foreground">
                  Nenhuma operação encerrada.
                </p>
                <p className="text-xs text-muted-foreground/50">
                  O histórico aparecerá aqui após a primeira operação
                  encerrada.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
                <table className="w-full text-[11px] sm:text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.06] bg-card/20">
                      {[
                        "Data",
                        "Ativo",
                        "Tipo",
                        "Volume",
                        "Resultado",
                      ].map((h) => (
                        <th
                          key={h}
                          className="text-left py-3 px-4 text-muted-foreground/50 font-medium uppercase tracking-wider text-[10px]"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {closedOps.map((op, i) => (
                      <tr
                        key={op.id ?? i}
                        className="border-b border-white/[0.04] hover:bg-card/20 transition-colors"
                      >
                        <td className="py-3 px-4 font-mono text-muted-foreground text-[11px]">
                          {op.date_closed ?? op.date ?? "—"}
                        </td>
                        <td className="py-3 px-4 font-medium">
                          {op.asset ?? "—"}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 font-semibold ${
                              op.operation_type === 1
                                ? "text-primary"
                                : op.operation_type === 2
                                ? "text-destructive"
                                : "text-muted-foreground"
                            }`}
                          >
                            {op.operation_type === 1 ? (
                              <TrendingUp className="w-3 h-3" />
                            ) : op.operation_type === 2 ? (
                              <TrendingDown className="w-3 h-3" />
                            ) : (
                              <Minus className="w-3 h-3" />
                            )}
                            {op.operation_type === 1
                              ? "COMPRA"
                              : op.operation_type === 2
                              ? "VENDA"
                              : "—"}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-muted-foreground">
                          {op.contracts ?? "—"}
                        </td>
                        <td
                          className={`py-3 px-4 font-mono font-bold ${
                            op.value > 0
                              ? "text-primary"
                              : op.value < 0
                              ? "text-destructive"
                              : "text-muted-foreground"
                          }`}
                        >
                          {op.value > 0 ? "+" : ""}
                          {fmt(op.value)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Calendário (aba calendar-tab) ───────────────────────────────── */}
        {activeTab === "calendar-tab" && (
          <OperationsCalendar
            operations={(data.operations ?? []).map((op) => ({
              date: op.date_closed ?? op.date ?? "",
              value: op.value ?? 0,
            }))}
          />
        )}

      </div>

      {/* ── Calendar moved to tab (calendar-tab) — no longer duplicated ── */}

      {/* ════════════════════════════════════════════════════════════════════
          CREDENTIALS MODAL
      ════════════════════════════════════════════════════════════════════ */}
      {credModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setCredModalOpen(false)}
        >
          <div
            className="bg-[#0d1117] border border-white/[0.06] rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">
                  {data?.account?.platform_type === 2 ? "Credenciais Black Arrow" : "Credenciais MT5"}
                </h3>
              </div>
              <button
                onClick={() => setCredModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-xl leading-none"
              >
                ×
              </button>
            </div>

            {!credData ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-3">
                {[
                  { label: "Plano", value: credData.planName },
                  { label: data?.account?.platform_type === 2 ? "Login" : "Login MT5", value: credData.mt5Login },
                  { label: "Servidor", value: credData.mt5Server },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="bg-card/30 rounded-lg p-3 border border-white/[0.04]"
                  >
                    <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">
                      {label}
                    </p>
                    <p className="text-sm font-mono font-medium break-all">
                      {value}
                    </p>
                  </div>
                ))}
                {/* Password with reveal */}
                <div className="bg-card/30 rounded-lg p-3 border border-white/[0.04]">
                  <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">
                    Senha
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-mono font-medium break-all">
                      {showPassword
                        ? credData.mt5Password ?? "—"
                        : "••••••••••"}
                    </p>
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[10px] text-primary hover:underline shrink-0"
                    >
                      {showPassword ? "Ocultar" : "Revelar"}
                    </button>
                  </div>
                </div>
                {/* Botão de download da plataforma */}
                {(() => {
                  const isBA = data?.account?.platform_type === 2;
                  const url = isBA ? downloadLinks?.blackArrowUrl : downloadLinks?.mt5Url;
                  if (!url) return null;
                  return (
                    <button
                      onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
                      className="w-full mt-1 flex items-center justify-center gap-2 rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary text-sm font-medium py-2.5 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
                      </svg>
                      {isBA ? "Baixar Black Arrow" : "Baixar MetaTrader 5"}
                    </button>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
