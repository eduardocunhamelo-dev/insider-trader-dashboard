import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatBRL, formatDate, formatTime, formatContracts } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DashboardResponse } from "./types";

type Operation = DashboardResponse["operations"][number];

const PAGE_SIZE = 20;

function operationTypeLabel(type: number) {
  return type === 1 ? "COMPRA" : "VENDA";
}

function operationTypeColor(type: number) {
  return type === 1 ? "text-emerald-500" : "text-red-500";
}

function resultColor(value: number) {
  if (value > 0) return "text-emerald-500";
  if (value < 0) return "text-red-500";
  return "text-muted-foreground";
}

function rowBg(value: number) {
  if (value > 0) return "bg-emerald-500/5";
  if (value < 0) return "bg-red-500/5";
  return "";
}

function formatResult(value: number) {
  if (value === 0) return "—";
  return (value > 0 ? "+" : "") + formatBRL(value);
}

// ─── Mobile card ──────────────────────────────────────────────────────────────

function OperationCard({ op }: { op: Operation }) {
  const isOpen = op.type === 1;
  return (
    <div
      className={cn(
        "rounded-lg border border-white/[0.06] p-3 space-y-1",
        rowBg(op.value)
      )}
    >
      <div className="flex items-center justify-between">
        <span className="font-semibold text-sm text-foreground">{op.asset}</span>
        <span className={cn("text-sm font-semibold", operationTypeColor(op.operation_type))}>
          {operationTypeLabel(op.operation_type)}
        </span>
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {formatDate(op.date)} · {formatTime(op.time)}
        </span>
        <span>{formatContracts(op.contracts)} contratos</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {isOpen ? (
            <span className="text-yellow-500 font-medium">Em aberto</span>
          ) : (
            `Fechado ${op.date_closed ? formatDate(op.date_closed) : ""}`
          )}
        </span>
        <span className={cn("text-sm font-bold", resultColor(op.value))}>
          {formatResult(op.value)}
        </span>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface OperationsTableProps {
  operations: Operation[];
}

export default function OperationsTable({ operations }: OperationsTableProps) {
  const [page, setPage] = useState(0);

  // Sort: date desc, time desc (closed first, then open)
  const sorted = useMemo(() => {
    return [...operations].sort((a, b) => {
      const dateA = a.date_closed ?? a.date;
      const dateB = b.date_closed ?? b.date;
      if (dateB !== dateA) return dateB.localeCompare(dateA);
      const timeA = a.time_closed ?? a.time;
      const timeB = b.time_closed ?? b.time;
      return timeB.localeCompare(timeA);
    });
  }, [operations]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const pageOps = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  if (operations.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Operações</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhuma operação registrada ainda.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">
            Operações{" "}
            <span className="text-muted-foreground font-normal text-sm">
              ({operations.length})
            </span>
          </CardTitle>
          {totalPages > 1 && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                aria-label="Página anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span>
                {page + 1}/{totalPages}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
                aria-label="Próxima página"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Mobile: card list */}
        <div className="flex flex-col gap-2 sm:hidden">
          {pageOps.map((op) => (
            <OperationCard key={op.id} op={op} />
          ))}
        </div>

        {/* Desktop: table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-left">
                <th scope="col" className="pb-2 pr-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Data
                </th>
                <th scope="col" className="pb-2 pr-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Hora
                </th>
                <th scope="col" className="pb-2 pr-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Ativo
                </th>
                <th scope="col" className="pb-2 pr-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Tipo
                </th>
                <th scope="col" className="pb-2 pr-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">
                  Qtd
                </th>
                <th scope="col" className="pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">
                  Resultado
                </th>
              </tr>
            </thead>
            <tbody>
              {pageOps.map((op, i) => {
                const isOpen = op.type === 1;
                return (
                  <tr
                    key={op.id}
                    className={cn(
                      "border-b border-white/[0.06] last:border-0",
                      i % 2 === 0 ? "bg-muted/20" : "",
                      rowBg(op.value)
                    )}
                  >
                    <td className="py-2 pr-4 text-foreground">
                      {formatDate(op.date_closed ?? op.date)}
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground">
                      {formatTime(op.time_closed ?? op.time)}
                    </td>
                    <td className="py-2 pr-4 font-medium text-foreground">
                      {op.asset}
                    </td>
                    <td className={cn("py-2 pr-4 font-semibold", operationTypeColor(op.operation_type))}>
                      {operationTypeLabel(op.operation_type)}
                    </td>
                    <td className="py-2 pr-4 text-right text-muted-foreground">
                      {formatContracts(op.contracts)}
                    </td>
                    <td className={cn("py-2 text-right font-semibold", isOpen ? "text-yellow-500" : resultColor(op.value))}>
                      {isOpen ? "Em aberto" : formatResult(op.value)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
