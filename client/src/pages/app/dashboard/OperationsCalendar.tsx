import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/lib/format";
import type { DashboardResponse } from "./types";

type Operation = DashboardResponse["operations"][number];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function parseLocalDate(dateStr: string): Date {
  // dateStr format: "YYYY-MM-DD" or "DD/MM/YYYY"
  if (dateStr.includes("/")) {
    const [d, m, y] = dateStr.split("/");
    return new Date(Number(y), Number(m) - 1, Number(d));
  }
  const [y, m, d] = dateStr.split("-");
  return new Date(Number(y), Number(m) - 1, Number(d));
}

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const DAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

// ─── Types ────────────────────────────────────────────────────────────────────
interface DayData {
  date: Date;
  pnl: number;
  tradeCount: number;
  isCurrentMonth: boolean;
  isToday: boolean;
}

interface DayDetailProps {
  day: DayData;
  onClose: () => void;
  operations: Operation[];
}

// ─── Day Detail Popover ───────────────────────────────────────────────────────
function DayDetail({ day, onClose, operations }: DayDetailProps) {
  const dateStr = `${String(day.date.getDate()).padStart(2, "0")}/${String(day.date.getMonth() + 1).padStart(2, "0")}/${day.date.getFullYear()}`;
  const dayOps = operations.filter((op) => {
    const d = parseLocalDate(op.date_closed ?? op.date);
    return (
      d.getFullYear() === day.date.getFullYear() &&
      d.getMonth() === day.date.getMonth() &&
      d.getDate() === day.date.getDate() &&
      op.type === 2 // fechadas
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative bg-card border border-white/[0.08] rounded-2xl p-5 w-full max-w-sm shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-bold text-base text-foreground">{dateStr}</p>
            <p className="text-xs text-muted-foreground">{dayOps.length} operação(ões)</p>
          </div>
          <div className="text-right">
            <p className={cn(
              "font-bold text-lg",
              day.pnl > 0 ? "text-emerald-400" : day.pnl < 0 ? "text-red-400" : "text-muted-foreground"
            )}>
              {day.pnl > 0 ? "+" : ""}{formatBRL(day.pnl)}
            </p>
          </div>
        </div>
        {dayOps.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhuma operação fechada neste dia.</p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {dayOps.map((op) => (
              <div
                key={op.id}
                className={cn(
                  "flex items-center justify-between rounded-lg px-3 py-2 border border-white/[0.06]",
                  op.value > 0 ? "bg-emerald-500/5" : op.value < 0 ? "bg-red-500/5" : "bg-muted/10"
                )}
              >
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-[10px] font-bold px-1.5 py-0.5 rounded",
                    op.operation_type === 1 ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                  )}>
                    {op.operation_type === 1 ? "C" : "V"}
                  </span>
                  <span className="text-sm font-semibold text-foreground">{op.asset}</span>
                  <span className="text-xs text-muted-foreground">{op.contracts}x</span>
                </div>
                <span className={cn(
                  "text-sm font-bold",
                  op.value > 0 ? "text-emerald-400" : op.value < 0 ? "text-red-400" : "text-muted-foreground"
                )}>
                  {op.value > 0 ? "+" : ""}{formatBRL(op.value)}
                </span>
              </div>
            ))}
          </div>
        )}
        <Button variant="outline" size="sm" className="w-full mt-4" onClick={onClose}>
          Fechar
        </Button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
interface OperationsCalendarProps {
  operations: Operation[];
}

export default function OperationsCalendar({ operations }: OperationsCalendarProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);

  // Build a map: "YYYY-MM-DD" → { pnl, tradeCount }
  const dayMap = useMemo(() => {
    const map = new Map<string, { pnl: number; tradeCount: number }>();
    for (const op of operations) {
      if (op.type !== 2) continue; // only closed operations
      const d = parseLocalDate(op.date_closed ?? op.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const existing = map.get(key) ?? { pnl: 0, tradeCount: 0 };
      map.set(key, { pnl: existing.pnl + op.value, tradeCount: existing.tradeCount + 1 });
    }
    return map;
  }, [operations]);

  // Build calendar grid
  const calendarDays = useMemo((): DayData[] => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);
    const startPad = firstDay.getDay(); // 0=Sun
    const days: DayData[] = [];

    // Padding days from previous month
    for (let i = startPad - 1; i >= 0; i--) {
      const d = new Date(viewYear, viewMonth, -i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const data = dayMap.get(key);
      days.push({
        date: d,
        pnl: data?.pnl ?? 0,
        tradeCount: data?.tradeCount ?? 0,
        isCurrentMonth: false,
        isToday: false,
      });
    }

    // Current month days
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(viewYear, viewMonth, d);
      const key = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const data = dayMap.get(key);
      const isToday =
        today.getFullYear() === viewYear &&
        today.getMonth() === viewMonth &&
        today.getDate() === d;
      days.push({
        date,
        pnl: data?.pnl ?? 0,
        tradeCount: data?.tradeCount ?? 0,
        isCurrentMonth: true,
        isToday,
      });
    }

    // Padding days from next month
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const date = new Date(viewYear, viewMonth + 1, d);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      const data = dayMap.get(key);
      days.push({
        date,
        pnl: data?.pnl ?? 0,
        tradeCount: data?.tradeCount ?? 0,
        isCurrentMonth: false,
        isToday: false,
      });
    }

    return days;
  }, [viewYear, viewMonth, dayMap, today]);

  // Monthly summary
  const monthlySummary = useMemo(() => {
    let totalPnl = 0;
    let tradingDays = 0;
    let winDays = 0;
    let lossDays = 0;

    for (const day of calendarDays) {
      if (!day.isCurrentMonth || day.tradeCount === 0) continue;
      totalPnl += day.pnl;
      tradingDays++;
      if (day.pnl > 0) winDays++;
      else if (day.pnl < 0) lossDays++;
    }

    return { totalPnl, tradingDays, winDays, lossDays };
  }, [calendarDays]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  return (
    <>
      <Card className="bg-card/20 border-white/[0.06]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Calendário de Operações</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={prevMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm font-semibold min-w-[140px] text-center">
                {MONTH_NAMES[viewMonth]} {viewYear}
              </span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={nextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Monthly summary */}
          <div className="grid grid-cols-4 gap-3 mt-3">
            <div className="bg-muted/10 rounded-xl p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Resultado</p>
              <p className={cn(
                "text-sm font-bold",
                monthlySummary.totalPnl > 0 ? "text-emerald-400" : monthlySummary.totalPnl < 0 ? "text-red-400" : "text-muted-foreground"
              )}>
                {monthlySummary.totalPnl > 0 ? "+" : ""}{formatBRL(monthlySummary.totalPnl)}
              </p>
            </div>
            <div className="bg-muted/10 rounded-xl p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Dias op.</p>
              <p className="text-sm font-bold text-foreground">{monthlySummary.tradingDays}</p>
            </div>
            <div className="bg-emerald-500/10 rounded-xl p-3 text-center">
              <p className="text-xs text-emerald-400/70 mb-1">Positivos</p>
              <p className="text-sm font-bold text-emerald-400">{monthlySummary.winDays}</p>
            </div>
            <div className="bg-red-500/10 rounded-xl p-3 text-center">
              <p className="text-xs text-red-400/70 mb-1">Negativos</p>
              <p className="text-sm font-bold text-red-400">{monthlySummary.lossDays}</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-3 pb-4">
          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAY_NAMES.map((d) => (
              <div key={d} className="text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {calendarDays.map((day, i) => {
              const hasData = day.isCurrentMonth && day.tradeCount > 0;
              const isWin = hasData && day.pnl > 0;
              const isLoss = hasData && day.pnl < 0;
              const isBreakeven = hasData && day.pnl === 0;

              return (
                <button
                  key={i}
                  onClick={() => hasData ? setSelectedDay(day) : undefined}
                  disabled={!hasData}
                  className={cn(
                    "relative flex flex-col items-center justify-start rounded-lg p-1 min-h-[56px] transition-all text-left",
                    !day.isCurrentMonth && "opacity-20",
                    day.isCurrentMonth && !hasData && "cursor-default",
                    hasData && "cursor-pointer hover:scale-[1.03] hover:z-10",
                    day.isToday && "ring-1 ring-primary/50",
                    isWin && "bg-emerald-500/10 hover:bg-emerald-500/20",
                    isLoss && "bg-red-500/10 hover:bg-red-500/20",
                    isBreakeven && "bg-muted/10 hover:bg-muted/20",
                    !hasData && day.isCurrentMonth && "bg-transparent"
                  )}
                >
                  {/* Day number */}
                  <span className={cn(
                    "text-xs font-semibold w-5 h-5 flex items-center justify-center rounded-full",
                    day.isToday ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                    hasData && !day.isToday && (isWin ? "text-emerald-300" : isLoss ? "text-red-300" : "text-foreground")
                  )}>
                    {day.date.getDate()}
                  </span>

                  {/* PnL */}
                  {hasData && (
                    <span className={cn(
                      "text-[9px] font-bold mt-0.5 leading-tight",
                      isWin ? "text-emerald-400" : isLoss ? "text-red-400" : "text-muted-foreground"
                    )}>
                      {isWin ? "+" : ""}{formatBRL(day.pnl)}
                    </span>
                  )}

                  {/* Trade count */}
                  {hasData && (
                    <span className="text-[8px] text-muted-foreground/50 mt-0.5">
                      {day.tradeCount}op
                    </span>
                  )}

                  {/* Icon */}
                  {hasData && (
                    <div className="absolute top-1 right-1">
                      {isWin && <TrendingUp className="w-2.5 h-2.5 text-emerald-400/60" />}
                      {isLoss && <TrendingDown className="w-2.5 h-2.5 text-red-400/60" />}
                      {isBreakeven && <Minus className="w-2.5 h-2.5 text-muted-foreground/40" />}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 justify-center">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-emerald-500/20" />
              <span className="text-[10px] text-muted-foreground">Dia positivo</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-red-500/20" />
              <span className="text-[10px] text-muted-foreground">Dia negativo</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-muted/20" />
              <span className="text-[10px] text-muted-foreground">Empate</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Day detail modal */}
      {selectedDay && (
        <DayDetail
          day={selectedDay}
          operations={operations}
          onClose={() => setSelectedDay(null)}
        />
      )}
    </>
  );
}
