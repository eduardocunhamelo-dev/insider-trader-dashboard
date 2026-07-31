/**
 * PlatformDashboard
 *
 * Estrutura (de cima para baixo):
 *  1. Filtro de plataforma — abas MT5 · Forex e CFDs / Black Arrow · Futuros
 *  2. Card "Minhas contas" — abas Avaliação (n) / Aprovadas (n) + lista de contas
 *  3. Ao clicar numa conta → abre DashboardPage daquela conta (com botão voltar)
 *
 * Fonte de dados: `accounts` prop vinda de dashboardStats.metaAccounts
 * (mesma fonte da dashboard inicial — inclui MT5 e Black Arrow).
 * O filtro de plataforma é feito no front pelo campo `platformType`:
 *   1 = MT5 (Forex e CFDs)
 *   2 = Black Arrow (Futuros)
 *
 * Regras:
 *  - Nunca misturar MT5 e Black Arrow na mesma lista
 *  - Filtro de plataforma filtra a lista de contas
 *  - Contador das abas do topo bate com a quantidade da lista
 *  - Verificação IDOR: trader só vê suas próprias contas (garantida pelo servidor)
 */

import { useState, useEffect, useRef } from "react";
import { useClientNav } from "@/contexts/ClientNavContext";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TrendingUp, Activity, Info, ChevronRight, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { formatUSD } from "@/lib/format";
import { PlanBadge } from "@/lib/planBadge";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type PlatformType = "mt5" | "blackarrow";

/** Shape of each item in dashboardStats.metaAccounts */
interface RawAccount {
  accountId?: number;
  id?: number;
  mt5Login?: string | null;
  planName?: string;
  planCategory?: number;
  status?: string;
  currentBalance?: number;
  initialBalance?: number;
  platformType?: number;
  profitPercent?: number;
  lastTradedAt?: string | null;
}

interface AccountItem {
  id: number;           // accountOperationId (Mesa Prime PK) — used for /api/dashboard/:id
  mt5Login: string | null;
  planName: string;
  planCategory: number;
  status: string;
  currentBalance: number;
  initialBalance: number;
  platformType: number;
  profitPercent: number;
  lastTradedAt: string | null;
}

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  active: "Ativa",
  approved: "Aprovada",
  violated: "Violada",
  failed: "Reprovada",
  expired: "Expirada",
  disabled: "Desabilitada",
  refunded: "Estornada",
  analyzing: "Em análise",
  awaiting_signature: "Ag. assinatura",
  awaiting_payment: "Ag. pagamento",
  awaiting_re_sign: "Ag. reassinatura",
  tournament_ended: "Torneio encerrado",
  passed: "Aprovada",
};

const STATUS_COLOR: Record<string, string> = {
  active: "bg-primary/20 text-primary border-primary/30",
  approved: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  passed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  analyzing: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  awaiting_signature: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  awaiting_payment: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  awaiting_re_sign: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  violated: "bg-destructive/20 text-destructive border-destructive/30",
  failed: "bg-destructive/20 text-destructive border-destructive/30",
  expired: "bg-muted/30 text-muted-foreground border-muted/50",
  disabled: "bg-muted/30 text-muted-foreground border-muted/50",
  refunded: "bg-muted/30 text-muted-foreground border-muted/50",
  tournament_ended: "bg-muted/30 text-muted-foreground border-muted/50",
};

/** Contas em avaliação = status active (usando/operando) */
function isEvaluation(status: string): boolean {
  return ["active", "analyzing", "awaiting_signature", "awaiting_payment", "awaiting_re_sign"].includes(status);
}

/** Contas aprovadas/financiadas = status approved/passed */
function isApproved(status: string): boolean {
  return status === "approved" || status === "passed";
}

// ─── Normalize raw account to AccountItem ────────────────────────────────────

function normalizeAccount(a: RawAccount): AccountItem {
  return {
    id: a.accountId ?? a.id ?? 0,
    mt5Login: a.mt5Login ?? null,
    planName: a.planName ?? (a.platformType === 2 ? "Black Arrow" : "MT5"),
    planCategory: a.planCategory ?? (a.platformType === 2 ? 4 : 0),
    status: a.status ?? "unknown",
    currentBalance: a.currentBalance ?? 0,
    initialBalance: a.initialBalance ?? 0,
    platformType: a.platformType ?? 1,
    profitPercent: a.profitPercent ?? 0,
    lastTradedAt: a.lastTradedAt ?? null,
  };
}

// ─── Account row ──────────────────────────────────────────────────────────────

interface AccountRowProps {
  account: AccountItem;
  onClick: () => void;
}

function AccountRow({ account, onClick }: AccountRowProps) {
  const profitPct = account.profitPercent;
  const isPositive = profitPct >= 0;
  const statusLabel = STATUS_LABEL[account.status] ?? account.status;
  const statusClass = STATUS_COLOR[account.status] ?? STATUS_COLOR.expired;
  const isBlackArrow = account.platformType === 2;

  // Title: "$25.000,00 - FAST - 6225089"
  const formattedInitial = formatUSD(account.initialBalance, 2);
  const planShort = account.planName?.split(" ")[0] ?? "—"; // "FAST", "PRO", "Futuros", etc.
  const loginStr = account.mt5Login ?? `#${account.id}`;
  const title = `${formattedInitial} - ${planShort} - ${loginStr}`;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-white/[0.06] bg-card/30 hover:bg-card/60 hover:border-primary/20 transition-all group text-left"
      aria-label={`Conta ${title}`}
    >
      {/* Platform icon */}
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
        isBlackArrow ? "bg-purple-500/10" : "bg-primary/10"
      )}>
        {isBlackArrow
          ? <Activity className="w-5 h-5 text-purple-400" />
          : <TrendingUp className="w-5 h-5 text-primary" />
        }
      </div>

      {/* Account info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-foreground truncate">{title}</span>
          {isBlackArrow && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center cursor-help">
                  <Info className="w-3.5 h-3.5 text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors" />
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-xs">
                O limite de perda diária é monitorado em tempo real pela plataforma Black Arrow (Nelogica). Saldo e drawdown são sincronizados com a Mesa Prime.
              </TooltipContent>
            </Tooltip>
          )}
          <PlanBadge category={account.planCategory} />
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-xs text-muted-foreground font-mono">
            {formatUSD(account.currentBalance, 2)}
          </span>
          <span className={cn(
            "inline-flex items-center gap-0.5 text-[10px] font-semibold",
            isPositive ? "text-emerald-400" : "text-destructive"
          )}>
            {isPositive
              ? <ArrowUpRight className="w-3 h-3" />
              : <ArrowDownRight className="w-3 h-3" />
            }
            {isPositive ? "+" : ""}{profitPct.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Status badge */}
      <div className="flex items-center gap-2 shrink-0">
        <span className={cn(
          "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
          statusClass
        )}>
          {statusLabel}
        </span>
        <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
      </div>
    </button>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyAccounts({ platform }: { platform: PlatformType }) {
  const label = platform === "mt5" ? "MT5 · Forex e CFDs" : "Black Arrow · Futuros";
  const Icon = platform === "mt5" ? TrendingUp : Activity;
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
      <div className="w-12 h-12 rounded-2xl bg-muted/20 flex items-center justify-center">
        <Icon className="w-6 h-6 text-muted-foreground/30" />
      </div>
      <p className="text-sm font-semibold text-muted-foreground">
        Nenhuma conta {label}
      </p>
      <p className="text-xs text-muted-foreground/50 max-w-xs">
        {platform === "mt5"
          ? "Você não possui contas MT5 ativas. Adquira um plano para começar a operar."
          : "Você não possui contas Black Arrow ativas. Contas de futuros aparecerão aqui."}
      </p>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface PlatformDashboardProps {
  /** metaAccounts from dashboardStats — includes both MT5 (platformType=1) and Black Arrow (platformType=2) */
  accounts: RawAccount[];
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PlatformDashboard({ accounts }: PlatformDashboardProps) {
  // ─── Normalize all accounts ───────────────────────────────────────────────
  const allAccounts: AccountItem[] = accounts.map(normalizeAccount).filter((a) => a.id > 0);

  // ─── Status sort priority (lower = higher priority) ────────────────────────
  const STATUS_SORT: Record<string, number> = {
    active: 0,
    approved: 1,
    passed: 1,
    analyzing: 2,
    awaiting_signature: 3,
    awaiting_payment: 3,
    awaiting_re_sign: 3,
    violated: 4,
    failed: 5,
    expired: 6,
    disabled: 7,
    refunded: 8,
    tournament_ended: 9,
  };

  function sortAccounts(list: AccountItem[]): AccountItem[] {
    return [...list].sort((a, b) => {
      const sa = STATUS_SORT[a.status] ?? 99;
      const sb = STATUS_SORT[b.status] ?? 99;
      if (sa !== sb) return sa - sb;
      // Same status group → sort by most recently traded first
      const da = a.lastTradedAt ?? "";
      const db = b.lastTradedAt ?? "";
      if (da !== db) return db.localeCompare(da); // desc: mais recente no topo
      // Fallback: balance descending
      return b.currentBalance - a.currentBalance;
    });
  }

  // ─── Split by platform ────────────────────────────────────────────────────
  const mt5List = sortAccounts(allAccounts.filter((a) => a.platformType !== 2));
  const baList = sortAccounts(allAccounts.filter((a) => a.platformType === 2));

  // ─── Platform selection ───────────────────────────────────────────────────
  const [activePlatform, setActivePlatform] = useState<PlatformType>("mt5");
  const platformInitialized = useRef(false);

  useEffect(() => {
    if (platformInitialized.current) return;
    platformInitialized.current = true;
    // Auto-select the platform that has active accounts; prefer MT5
    const mt5HasActive = mt5List.some((a) => a.status === "active");
    if (mt5HasActive || mt5List.length > 0) {
      setActivePlatform("mt5");
    } else if (baList.length > 0) {
      setActivePlatform("blackarrow");
    }
  }, [mt5List.length, baList.length]);

  // ─── Account tab (Avaliação / Aprovadas) ──────────────────────────────────
  const [accountTab, setAccountTab] = useState<"evaluation" | "approved">("evaluation");

  // ─── Navigation ──────────────────────────────────────────────────────────
  const { navigateToAccountDetails } = useClientNav();

  // ─── Current list based on platform ──────────────────────────────────────
  const currentList = activePlatform === "blackarrow" ? baList : mt5List;

  // Split into evaluation and approved
  const evaluationAccounts = currentList.filter((a) => isEvaluation(a.status));
  const approvedAccounts = currentList.filter((a) => isApproved(a.status));

  // Accounts shown in the current tab
  const tabAccounts = accountTab === "evaluation" ? evaluationAccounts : approvedAccounts;

  // Auto-switch tab if the current tab is empty but the other isn't
  useEffect(() => {
    if (accountTab === "evaluation" && evaluationAccounts.length === 0 && approvedAccounts.length > 0) {
      setAccountTab("approved");
    } else if (accountTab === "approved" && approvedAccounts.length === 0 && evaluationAccounts.length > 0) {
      setAccountTab("evaluation");
    }
  }, [evaluationAccounts.length, approvedAccounts.length]);

  // ─── Platform tab button ──────────────────────────────────────────────────
  const PlatformTab = ({
    platform,
    label,
    count,
    icon: Icon,
  }: {
    platform: PlatformType;
    label: string;
    count: number;
    icon: React.ElementType;
  }) => {
    const isActive = activePlatform === platform;
    const isEmpty = count === 0;
    return (
      <button
        onClick={() => {
          setActivePlatform(platform);
        }}
        disabled={isEmpty}
        className={cn(
          "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all",
          isActive
            ? "bg-primary/15 text-primary border border-primary/30 shadow-[0_0_12px_rgba(0,255,133,0.1)]"
            : isEmpty
              ? "text-muted-foreground/30 cursor-not-allowed border border-transparent"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/20 border border-transparent"
        )}
        aria-pressed={isActive}
        aria-label={`${label} (${count} conta${count !== 1 ? "s" : ""})`}
      >
        <Icon className="w-4 h-4 shrink-0" />
        <span>{label}</span>
        {count > 0 ? (
          <span className={cn(
            "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
            isActive ? "bg-primary/20 text-primary" : "bg-muted/30 text-muted-foreground"
          )}>
            {count}
          </span>
        ) : (
          <span className="text-[10px] text-muted-foreground/40 italic">sem contas</span>
        )}
      </button>
    );
  };

  // ─── Account tab button ───────────────────────────────────────────────────
  const AccountTab = ({
    tab,
    label,
    count,
  }: {
    tab: "evaluation" | "approved";
    label: string;
    count: number;
  }) => {
    const isActive = accountTab === tab;
    return (
      <button
        onClick={() => setAccountTab(tab)}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all",
          isActive
            ? "bg-card/80 text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        {label}
        <span className={cn(
          "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
          isActive ? "bg-primary/20 text-primary" : "bg-muted/20 text-muted-foreground"
        )}>
          {count}
        </span>
      </button>
    );
  };

  return (
    <div className="app-section">
      {/* ── 1. Platform selector ── */}
      <div className="flex items-center gap-2 p-1 rounded-2xl bg-card/30 border border-white/[0.06] w-fit">
        <PlatformTab
          platform="mt5"
          label="MT5 · Forex e CFDs"
          count={mt5List.length}
          icon={TrendingUp}
        />
        <PlatformTab
          platform="blackarrow"
          label="Black Arrow · Futuros"
          count={baList.length}
          icon={Activity}
        />
      </div>

      {/* ── 2. Account list card ── */}
      <Card className="bg-card/20 border-white/[0.06]">
        <CardHeader className="pb-2 pt-4 px-5 lg:px-6">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground/60">
              Minhas contas
            </p>
            {/* Account tabs: Avaliação / Aprovadas */}
            <div className="flex items-center gap-1 bg-muted/10 rounded-lg p-0.5">
              <AccountTab
                tab="evaluation"
                label="Avaliação"
                count={evaluationAccounts.length}
              />
              <AccountTab
                tab="approved"
                label="Aprovadas"
                count={approvedAccounts.length}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-5 lg:px-6 pb-5 lg:pb-6">
          {currentList.length === 0 ? (
            <EmptyAccounts platform={activePlatform} />
          ) : tabAccounts.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground/60">
                {accountTab === "evaluation"
                  ? "Nenhuma conta em avaliação."
                  : "Nenhuma conta aprovada ainda."}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {tabAccounts.map((account) => (
                <AccountRow
                  key={account.id}
                  account={account}
                  onClick={() => navigateToAccountDetails(account.id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
