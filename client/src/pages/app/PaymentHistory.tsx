import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import {
  Receipt, ArrowDownCircle, ArrowUpCircle, RefreshCw,
  CreditCard, Landmark, QrCode, ExternalLink, Filter,
  TrendingDown, CheckCircle2, Clock, XCircle,
} from "lucide-react";
import { useState, useMemo } from "react";

// ─── helpers ────────────────────────────────────────────────────────────────

function fmtBRL(cents: number) {
  return `R$ ${(cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

function fmtDate(dateStr: string | null | undefined) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

// ─── billing type icon + label ───────────────────────────────────────────────

function BillingIcon({ type }: { type: string | null }) {
  if (type === "PIX") return <QrCode className="w-4 h-4 text-emerald-400" />;
  if (type === "CREDIT_CARD") return <CreditCard className="w-4 h-4 text-blue-400" />;
  if (type === "BOLETO") return <Landmark className="w-4 h-4 text-orange-400" />;
  return <Receipt className="w-4 h-4 text-muted-foreground" />;
}

// ─── status badge ────────────────────────────────────────────────────────────

const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode; color: string }> = {
  completed: { variant: "default", icon: <CheckCircle2 className="w-3 h-3" />, color: "text-emerald-400" },
  pending:   { variant: "secondary", icon: <Clock className="w-3 h-3" />, color: "text-yellow-400" },
  failed:    { variant: "destructive", icon: <XCircle className="w-3 h-3" />, color: "text-red-400" },
  cancelled: { variant: "outline", icon: <XCircle className="w-3 h-3" />, color: "text-muted-foreground" },
};

// ─── component ───────────────────────────────────────────────────────────────

type StatusFilter = "all" | "completed" | "pending" | "failed" | "cancelled";

export default function PaymentHistory() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  const queryInput = useMemo(() => ({
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  }), [page]);

  const { data, isLoading } = trpc.paymentHistory.list.useQuery(queryInput);
  const { data: summary } = trpc.paymentHistory.summary.useQuery();

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const filtered = useMemo(() => {
    if (statusFilter === "all") return items;
    return items.filter((p) => p.status === statusFilter);
  }, [items, statusFilter]);

  const filters: { key: StatusFilter; label: string }[] = [
    { key: "all", label: "Todos" },
    { key: "completed", label: "Confirmados" },
    { key: "pending", label: "Pendentes" },
    { key: "failed", label: "Vencidos" },
    { key: "cancelled", label: "Cancelados" },
  ];

  return (
    <div className="app-section max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground/40 mb-1">Financeiro</p>
          <h2 className="text-2xl font-bold">Histórico de Pagamentos</h2>
          <p className="text-muted-foreground text-sm mt-1">Acompanhe todas as suas transações na Insider</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center">
          <Receipt className="w-5 h-5 text-[#D4AF37]" />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 app-grid">
        {/* Total de Compras */}
        <Card className="bg-card/60 border-white/[0.06] overflow-hidden relative col-span-2 sm:col-span-1">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500/50 to-blue-500/5" />
          <CardContent className="app-card-sm">
            <div className="flex items-center gap-2 mb-2">
              <ArrowDownCircle className="w-4 h-4 text-blue-400" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400/70">Total Compras</p>
            </div>
            {summary ? (
              <>
                <p className="text-xl font-bold font-mono">{fmtBRL((summary.valueSales ?? 0) * 100)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{summary.quantSales} transações</p>
              </>
            ) : (
              <div className="h-7 w-24 bg-muted/30 rounded animate-pulse" />
            )}
          </CardContent>
        </Card>

        {/* Recebido */}
        <Card className="bg-card/60 border-white/[0.06] overflow-hidden relative col-span-2 sm:col-span-1">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500/50 to-emerald-500/5" />
          <CardContent className="app-card-sm">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/70">Confirmado</p>
            </div>
            {summary ? (
              <>
                <p className="text-xl font-bold font-mono text-emerald-400">{fmtBRL((summary.valueReceived ?? 0) * 100)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{summary.quantReceived} pagamentos</p>
              </>
            ) : (
              <div className="h-7 w-24 bg-muted/30 rounded animate-pulse" />
            )}
          </CardContent>
        </Card>

        {/* Pendente */}
        <Card className="bg-card/60 border-white/[0.06] overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-yellow-500/50 to-yellow-500/5" />
          <CardContent className="app-card-sm">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-yellow-400" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-yellow-400/70">Pendente</p>
            </div>
            {summary ? (
              <>
                <p className="text-xl font-bold font-mono text-yellow-400">{fmtBRL((summary.valuePending ?? 0) * 100)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{summary.quantPending} pendentes</p>
              </>
            ) : (
              <div className="h-7 w-24 bg-muted/30 rounded animate-pulse" />
            )}
          </CardContent>
        </Card>

        {/* Reembolsado */}
        <Card className="bg-card/60 border-white/[0.06] overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-orange-500/50 to-orange-500/5" />
          <CardContent className="app-card-sm">
            <div className="flex items-center gap-2 mb-2">
              <RefreshCw className="w-4 h-4 text-orange-400" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-orange-400/70">Reembolsado</p>
            </div>
            {summary ? (
              <>
                <p className="text-xl font-bold font-mono text-orange-400">{fmtBRL((summary.valueRefunded ?? 0) * 100)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{summary.quantRefunded} reembolsos</p>
              </>
            ) : (
              <div className="h-7 w-24 bg-muted/30 rounded animate-pulse" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap p-3 rounded-xl border border-white/[0.06] bg-card/20">
        <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
        {filters.map((f) => (
          <Button
            key={f.key}
            variant={statusFilter === f.key ? "default" : "outline"}
            size="sm"
            className="h-8 text-xs"
            onClick={() => { setStatusFilter(f.key); setPage(0); }}
          >
            {f.label}
          </Button>
        ))}
        {total > 0 && (
          <span className="ml-auto text-xs text-muted-foreground">{total} transações no total</span>
        )}
      </div>

      {/* Payment List */}
      <Card className="bg-card/60 border-white/[0.06]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-muted-foreground" />
            Transações
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="divide-y divide-border/50">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4">
                  <div className="w-10 h-10 rounded-lg bg-muted/20 animate-pulse shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-4 w-40 bg-muted/30 rounded animate-pulse" />
                    <div className="h-3 w-28 bg-muted/20 rounded animate-pulse" />
                  </div>
                  <div className="text-right space-y-1.5">
                    <div className="h-4 w-24 bg-muted/30 rounded animate-pulse ml-auto" />
                    <div className="h-5 w-20 bg-muted/20 rounded-full animate-pulse ml-auto" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-14 text-center">
              <Receipt className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">Nenhuma transação encontrada</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                {statusFilter !== "all"
                  ? "Tente mudar o filtro de status"
                  : "Suas compras na Insider aparecerão aqui"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {filtered.map((p) => {
                const sc = statusConfig[p.status] ?? statusConfig.pending;
                return (
                  <div key={p.id} className="flex items-center gap-4 px-6 py-4 hover:bg-muted/10 transition-colors group">
                    {/* Billing icon */}
                    <div className="w-10 h-10 rounded-lg bg-muted/20 flex items-center justify-center shrink-0">
                      <BillingIcon type={p.billingType} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm truncate">{p.planTitle}</span>
                        <Badge variant={sc.variant} className="text-[10px] h-5 gap-1 shrink-0">
                          {sc.icon}
                          {p.statusLabel}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-muted-foreground">{p.billingTypeLabel}</span>
                        {p.installmentCount && p.installmentCount > 1 && (
                          <>
                            <span className="text-muted-foreground/30">·</span>
                            <span className="text-xs text-muted-foreground">{p.installmentCount}x de {fmtBRL(p.installmentValue ?? 0)}</span>
                          </>
                        )}
                        <span className="text-muted-foreground/30">·</span>
                        <span className="text-xs text-muted-foreground">{fmtDate(p.dateCreated)}</span>
                        {p.dueDate && p.status === "pending" && (
                          <>
                            <span className="text-muted-foreground/30">·</span>
                            <span className="text-xs text-yellow-400/80">Vence {fmtDate(p.dueDate)}</span>
                          </>
                        )}
                        {p.paymentDate && (
                          <>
                            <span className="text-muted-foreground/30">·</span>
                            <span className="text-xs text-emerald-400/80">Pago {fmtDate(p.paymentDate)}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Value + links */}
                    <div className="text-right shrink-0 flex flex-col items-end gap-1">
                      <span className="font-mono font-semibold text-sm">
                        {fmtBRL(p.value)}
                      </span>
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {p.invoiceUrl && (
                          <a
                            href={p.invoiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-0.5 transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Nota
                          </a>
                        )}
                        {p.bankSlipUrl && (
                          <a
                            href={p.bankSlipUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-0.5 transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Boleto
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Página {page + 1} de {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
