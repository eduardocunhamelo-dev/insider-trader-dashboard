import { CheckCircle2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatBRL, formatPct } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DashboardResponse } from "./types";

interface MetricCardsProps {
  data: DashboardResponse;
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function CardLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
      {children}
    </p>
  );
}

function CardValue({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("text-2xl font-bold text-foreground tabular-nums", className)}>
      {children}
    </p>
  );
}

function CardSubtitle({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-muted-foreground mt-1">{children}</p>;
}

/** Colored progress bar: green <50%, yellow 50–80%, red >80% */
function ColoredProgress({ pct }: { pct: number }) {
  const color =
    pct > 80 ? "bg-red-500" : pct > 50 ? "bg-yellow-500" : "bg-emerald-500";
  return (
    <div className="mt-2 h-2 w-full rounded-full bg-muted overflow-hidden">
      <div
        className={cn("h-full rounded-full transition-all", color)}
        style={{ width: `${Math.min(100, pct)}%` }}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  );
}

/** Delta indicator: ▲/▼ with color */
function Delta({ value, pct }: { value: number; pct: number }) {
  if (value === 0) {
    return (
      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
        <Minus className="w-3.5 h-3.5" />
        <span>{formatBRL(0)} (0,00%)</span>
      </div>
    );
  }
  const positive = value > 0;
  return (
    <div
      className={cn(
        "flex items-center gap-1 text-sm mt-1",
        positive ? "text-emerald-500" : "text-red-500"
      )}
    >
      {positive ? (
        <TrendingUp className="w-3.5 h-3.5" />
      ) : (
        <TrendingDown className="w-3.5 h-3.5" />
      )}
      <span>
        {positive ? "+" : ""}
        {formatBRL(value)} ({formatPct(pct)})
      </span>
    </div>
  );
}

// ─── Individual Cards ─────────────────────────────────────────────────────────

function BalanceCard({ summary }: { summary: DashboardResponse["summary"] }) {
  return (
    <Card role="region" aria-label="Saldo atual">
      <CardContent className="pt-5">
        <CardLabel>Saldo atual</CardLabel>
        <CardValue>{formatBRL(summary.balance_current)}</CardValue>
        <Delta value={summary.profit_total} pct={summary.profit_pct} />
      </CardContent>
    </Card>
  );
}

function DrawdownCard({ summary }: { summary: DashboardResponse["summary"] }) {
  return (
    <Card role="region" aria-label="Drawdown">
      <CardContent className="pt-5">
        <CardLabel>Drawdown</CardLabel>
        <CardValue className="text-xl">
          {formatBRL(summary.drawdown_consumed)}{" "}
          <span className="text-base font-normal text-muted-foreground">
            / {formatBRL(summary.drawdown_max)}
          </span>
        </CardValue>
        <ColoredProgress pct={summary.drawdown_used_pct} />
        <div className="flex justify-between mt-1">
          <CardSubtitle>Piso: {formatBRL(summary.drawdown_floor)}</CardSubtitle>
          <CardSubtitle>{summary.drawdown_used_pct.toFixed(1)}%</CardSubtitle>
        </div>
      </CardContent>
    </Card>
  );
}

function ProfitTargetCard({ summary }: { summary: DashboardResponse["summary"] }) {
  const pct =
    summary.profit_target > 0
      ? Math.min(100, (summary.profit_total / summary.profit_target) * 100)
      : 0;
  const positive = summary.profit_total >= 0;

  return (
    <Card role="region" aria-label="Meta de lucro">
      <CardContent className="pt-5">
        <CardLabel>Meta de lucro</CardLabel>
        <CardValue className="text-xl">
          <span className={positive ? "text-emerald-500" : "text-red-500"}>
            {positive ? "+" : ""}
            {formatBRL(summary.profit_total)}
          </span>{" "}
          <span className="text-base font-normal text-muted-foreground">
            / {formatBRL(summary.profit_target)}
          </span>
        </CardValue>
        <div className="mt-2 h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${Math.max(0, pct)}%` }}
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
        <CardSubtitle>{pct.toFixed(1)}% da meta atingida</CardSubtitle>
      </CardContent>
    </Card>
  );
}

function DaysCard({ summary }: { summary: DashboardResponse["summary"] }) {
  const minimumReached =
    summary.days_minimum !== null && summary.days_traded >= summary.days_minimum;

  return (
    <Card role="region" aria-label="Dias operados">
      <CardContent className="pt-5">
        <CardLabel>Dias operados</CardLabel>
        <CardValue>
          {summary.days_traded}
          {summary.days_minimum !== null && (
            <span className="text-base font-normal text-muted-foreground">
              {" "}/ {summary.days_minimum}
            </span>
          )}
        </CardValue>
        {minimumReached ? (
          <div className="flex items-center gap-1 text-sm text-emerald-500 mt-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Mínimo atingido</span>
          </div>
        ) : summary.days_remaining !== null ? (
          <CardSubtitle>Faltam {summary.days_remaining} {summary.days_remaining === 1 ? "dia" : "dias"}</CardSubtitle>
        ) : null}
      </CardContent>
    </Card>
  );
}

function OperationsCountCard({ count }: { count: number }) {
  return (
    <Card role="region" aria-label="Total de operações">
      <CardContent className="pt-5">
        <CardLabel>Operações</CardLabel>
        <CardValue>{count}</CardValue>
        <CardSubtitle>operações registradas</CardSubtitle>
      </CardContent>
    </Card>
  );
}

function DailyLossCard({ summary, operations }: { summary: DashboardResponse["summary"]; operations: DashboardResponse["operations"] }) {
  // Calculate today's realized loss from closed operations
  const today = new Date().toISOString().slice(0, 10);
  const dailyLossUsed = operations
    .filter((op) => op.date_closed === today && op.value < 0)
    .reduce((acc, op) => acc + Math.abs(op.value), 0);

  const pct =
    summary.daily_loss_limit > 0
      ? Math.min(100, (dailyLossUsed / summary.daily_loss_limit) * 100)
      : 0;

  return (
    <Card role="region" aria-label="Perda diária">
      <CardContent className="pt-5">
        <CardLabel>Perda diária</CardLabel>
        <CardValue className="text-xl">
          {formatBRL(dailyLossUsed)}{" "}
          <span className="text-base font-normal text-muted-foreground">
            / {formatBRL(summary.daily_loss_limit)}
          </span>
        </CardValue>
        <ColoredProgress pct={pct} />
        <CardSubtitle>Limite: {formatBRL(summary.daily_loss_limit)}</CardSubtitle>
      </CardContent>
    </Card>
  );
}

function RepasCard({ summary }: { summary: DashboardResponse["summary"] }) {
  return (
    <Card role="region" aria-label="Repasse ao trader">
      <CardContent className="pt-5">
        <CardLabel>Repasse</CardLabel>
        <CardValue className="text-emerald-500">
          {summary.profit_share_pct}%
        </CardValue>
        <CardSubtitle>do lucro vai para você</CardSubtitle>
      </CardContent>
    </Card>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function MetricCards({ data }: MetricCardsProps) {
  const { summary, operations } = data;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <BalanceCard summary={summary} />
      <DrawdownCard summary={summary} />
      <ProfitTargetCard summary={summary} />
      <DaysCard summary={summary} />
      <OperationsCountCard count={operations.length} />
      <DailyLossCard summary={summary} operations={operations} />
      <RepasCard summary={summary} />
    </div>
  );
}
