import { useTraderAuth } from "@/hooks/useTraderAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DollarSign,
  Lock,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Wallet,
  AlertCircle,
  TrendingUp,
  Loader2,
  XCircle,
  Key,
  Save,
  Printer,
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { formatUSD } from "@/lib/format";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatUsd = (cents: number) => formatUSD(cents / 100);

function statusBadge(status: string) {
  switch (status) {
    case "paid":
      return { label: "Pago", className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: CheckCircle2 };
    case "approved":
      return { label: "Aprovado", className: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: CheckCircle2 };
    case "pending":
      return { label: "Pendente", className: "bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/30", icon: Clock };
    case "rejected":
      return { label: "Rejeitado", className: "bg-destructive/20 text-destructive border-destructive/30", icon: XCircle };
    default:
      return { label: status, className: "bg-muted/20 text-muted-foreground border-white/[0.06]", icon: Clock };
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function Payouts() {
  const { trader: user } = useTraderAuth();
  const utils = trpc.useUtils();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [customAmount, setCustomAmount] = useState("");
  const [pixInput, setPixInput] = useState("");
  const [savingPix, setSavingPix] = useState(false);

  const { data: traderData, isLoading: traderLoading } = trpc.trader.me.useQuery(undefined, {
    enabled: !!user,
    retry: false,
  });
  const { data: payoutsData, isLoading: payoutsLoading } = trpc.trader.payouts.useQuery({}, {
    enabled: !!user,
    retry: false,
  });
  const { data: profileData } = trpc.trader.profile.useQuery(undefined, {
    enabled: !!user,
    retry: false,
  });

  const updateProfile = trpc.trader.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Chave PIX cadastrada com sucesso!");
      setSavingPix(false);
      setPixInput("");
      utils.trader.profile.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao salvar chave PIX.");
      setSavingPix(false);
    },
  });

  const requestPayout = trpc.trader.requestPayout.useMutation({
    onSuccess: () => {
      toast.success("Solicitação de payout enviada com sucesso! Processamento em até 24h úteis.");
      setConfirmOpen(false);
      setCustomAmount("");
      utils.trader.payouts.invalidate();
      utils.trader.me.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao solicitar payout. Tente novamente.");
    },
  });

  const trader = traderData;
  const payouts = payoutsData ?? [];
  const isLoading = traderLoading || payoutsLoading;

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <div>
          <div className="h-7 w-24 bg-muted/30 rounded animate-pulse" />
          <div className="h-4 w-52 bg-muted/20 rounded animate-pulse mt-2" />
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-card/50 border-white/[0.06]">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4 bg-muted/30 rounded animate-pulse" />
                  <div className="h-3 w-28 bg-muted/20 rounded animate-pulse" />
                </div>
                <div className="h-8 w-24 bg-muted/30 rounded animate-pulse" />
                <div className="h-3 w-16 bg-muted/20 rounded animate-pulse mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="bg-card/50 border-white/[0.06]">
          <CardContent className="p-6 space-y-4">
            <div className="h-5 w-32 bg-muted/30 rounded animate-pulse" />
            <div className="h-32 bg-muted/10 rounded-xl animate-pulse" />
            <div className="h-12 bg-muted/20 rounded-lg animate-pulse" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalProfitCents = trader?.totalProfitCents ?? 0;
  const totalPayoutCents = trader?.totalPayoutCents ?? 0;
  const availableCents = Math.max(0, totalProfitCents - totalPayoutCents);
  const splitPercent = trader?.activePlan === "pro" ? 95 : 80;
  const netAvailable = Math.round(availableCents * (splitPercent / 100));
  const consecutiveCycles = trader?.consecutiveCycles ?? 0;
  const hasPixKey = !!profileData?.pixKey;

  // Amount to request
  const requestAmountCents = customAmount
    ? Math.round(parseFloat(customAmount) * 100)
    : availableCents;
  const netRequestAmount = Math.round(requestAmountCents * (splitPercent / 100));
  const isValidAmount = requestAmountCents > 0 && requestAmountCents <= availableCents;

  const handleRequestPayout = () => {
    if (!hasPixKey) {
      toast.error("Configure sua chave PIX no perfil antes de solicitar um saque.");
      return;
    }
    if (!isValidAmount) {
      toast.error("Valor inválido para saque.");
      return;
    }
    setConfirmOpen(true);
  };

  const confirmPayout = () => {
    requestPayout.mutate({
      amountCents: requestAmountCents,
      splitPercent,
    });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground/40 mb-1">Financeiro</p>
        <h1 className="text-2xl font-bold">Saques</h1>
        <p className="text-sm text-muted-foreground mt-1">Solicite seus payouts de lucro e acompanhe o histórico</p>
      </div>

      {trader?.status !== "approved" ? (
        /* ── Locked State ── */
        <Card className="bg-card/50 border-white/[0.06]">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-muted/20 flex items-center justify-center mx-auto">
              <Lock className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-lg">Payout bloqueado</p>
              <p className="text-sm text-muted-foreground mt-1">
                Você precisa ser aprovado na avaliação para solicitar payouts.
              </p>
            </div>
            <div className="p-4 bg-muted/10 rounded-xl max-w-sm mx-auto">
              <p className="text-sm font-medium mb-2">Seu progresso atual:</p>
              <Progress value={trader?.evaluationProgress ?? 0} className="h-2 mb-2" />
              <p className="text-xs text-muted-foreground">
                {trader?.evaluationProgress ?? 0}% da meta de lucro atingida
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* ── Summary Cards ── */}
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              {
                icon: Wallet,
                label: "Disponível para saque",
                value: formatUsd(netAvailable),
                sub: `Repasse: ${splitPercent}%`,
                color: "text-primary",
                bgColor: "bg-primary/10",
                cardBg: "bg-primary/5 border-primary/20",
                accent: "from-primary/40 to-primary/5",
              },
              {
                icon: ArrowUpRight,
                label: "Lucro total",
                value: formatUsd(totalProfitCents),
                sub: "No ciclo atual",
                color: "text-emerald-400",
                bgColor: "bg-emerald-500/10",
                cardBg: "bg-card/50 border-white/[0.06]",
                accent: "from-emerald-500/30 to-emerald-500/5",
              },
              {
                icon: TrendingUp,
                label: "Total sacado",
                value: formatUsd(totalPayoutCents),
                sub: `${consecutiveCycles} ciclos consecutivos`,
                color: "text-[#D4AF37]",
                bgColor: "bg-[#D4AF37]/10",
                cardBg: "bg-card/50 border-white/[0.06]",
                accent: "from-[#D4AF37]/30 to-[#D4AF37]/5",
              },
            ].map((card, i) => {
              const Icon = card.icon;
              return (
                <Card key={i} className={`${card.cardBg} overflow-hidden relative`}>
                  <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${card.accent}`} />
                  <CardContent className="p-4 pt-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`w-8 h-8 rounded-lg ${card.bgColor} flex items-center justify-center`}>
                        <Icon className={`w-4 h-4 ${card.color}`} />
                      </div>
                      <p className={`text-[10px] font-bold uppercase tracking-wider ${card.color} opacity-60`}>{card.label}</p>
                    </div>
                    <p className={`text-2xl font-bold font-mono ${card.color}`}>{card.value}</p>
                    <p className="text-[11px] text-muted-foreground/50 mt-1.5">{card.sub}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* ── PIX Key Registration ── */}
          {!hasPixKey && (
            <Card className="bg-amber-500/5 border-amber-500/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-amber-400">
                  <Key className="w-4 h-4" />
                  Cadastre sua Chave PIX para sacar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Você precisa de uma chave PIX cadastrada para receber seus payouts. Cadastre agora sem sair desta página.
                </p>
                <div className="flex gap-2">
                  <Input
                    placeholder="CPF, e-mail, telefone ou chave aleatória"
                    value={pixInput}
                    onChange={(e) => setPixInput(e.target.value)}
                    className="h-10 flex-1"
                    disabled={savingPix}
                  />
                  <Button
                    size="sm"
                    className="h-10 px-4 bg-amber-500 hover:bg-amber-600 text-black font-semibold shrink-0"
                    disabled={!pixInput.trim() || savingPix}
                    onClick={() => {
                      if (!pixInput.trim()) return;
                      setSavingPix(true);
                      updateProfile.mutate({ pixKey: pixInput.trim() });
                    }}
                  >
                    {savingPix ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-1" />
                        Salvar
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground/60">
                  Aceito: CPF (000.000.000-00), e-mail, telefone (+5511999999999) ou chave aleatória (UUID)
                </p>
              </CardContent>
            </Card>
          )}

          {/* ── Request Payout ── */}
          <Card className="bg-card/50 border-white/[0.06]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" />
                Nova Solicitação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted/10 rounded-xl border border-white/[0.06] space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Lucro disponível</span>
                  <span className="font-mono">{formatUsd(availableCents)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Percentual de repasse</span>
                  <span className="font-mono text-primary">{splitPercent}%</span>
                </div>
                <div className="border-t border-white/[0.06] pt-3">
                  <div className="flex justify-between font-semibold">
                    <span>Você recebe (total)</span>
                    <span className="text-primary font-mono text-lg">{formatUsd(netAvailable)}</span>
                  </div>
                </div>
              </div>

              {/* Custom amount input */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">
                  Valor do saque (USD) — deixe vazio para sacar tudo
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max={availableCents / 100}
                    placeholder={`${(availableCents / 100).toFixed(2)} (tudo)`}
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="pl-7 font-mono"
                  />
                </div>
                {customAmount && isValidAmount && (
                  <p className="text-xs text-muted-foreground">
                    Você receberá: <span className="text-primary font-mono font-semibold">{formatUsd(netRequestAmount)}</span> ({splitPercent}% de {formatUsd(requestAmountCents)})
                  </p>
                )}
                {customAmount && !isValidAmount && (
                  <p className="text-xs text-destructive">
                    Valor inválido. Máximo disponível: ${(availableCents / 100).toFixed(2)}
                  </p>
                )}
              </div>

              <div className="flex items-start gap-2 p-3 bg-blue-500/5 border border-blue-500/10 rounded-lg">
                <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  Saques na <strong className="text-foreground">janela dos dias 1 a 5</strong> de cada mês, processados em até <strong className="text-foreground">3 dias úteis</strong> via PIX. 
                  O valor será transferido para a chave cadastrada no seu perfil.
                  Janela de saque: dias 01 a 05 de cada mês.
                </p>
              </div>

              <Button
                className="w-full h-12 text-base font-semibold"
                disabled={netAvailable <= 0 || !hasPixKey || requestPayout.isPending}
                onClick={handleRequestPayout}
              >
                {requestPayout.isPending ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <DollarSign className="w-5 h-5 mr-2" />
                )}
                Solicitar Payout — {formatUsd(customAmount ? netRequestAmount : netAvailable)}
              </Button>
            </CardContent>
          </Card>
        </>
      )}

      {/* ── Confirmation Dialog ── */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Solicitação de Payout</DialogTitle>
            <DialogDescription>
              Revise os detalhes antes de confirmar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Valor bruto</span>
              <span className="font-mono font-semibold">{formatUsd(requestAmountCents)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Repasse ({splitPercent}%)</span>
              <span className="font-mono font-semibold text-primary">{formatUsd(netRequestAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Chave PIX</span>
              <span className="font-mono text-xs">{profileData?.pixKey ?? "—"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Prazo</span>
              <span>Até 24h úteis</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={requestPayout.isPending}>
              Cancelar
            </Button>
            <Button onClick={confirmPayout} disabled={requestPayout.isPending}>
              {requestPayout.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              )}
              Confirmar Payout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── History ── */}
      <div className="rounded-2xl border border-white/[0.06] bg-card/10 p-5">
        <h2 className="font-semibold text-lg mb-4">Histórico de Saques</h2>
        {payouts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Wallet className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Nenhum saque realizado ainda.</p>
            <p className="text-sm mt-1">Seus payouts aparecerão aqui.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {payouts.map((p: any, i: number) => {
              const badge = statusBadge(p.status);
              const BadgeIcon = badge.icon;
              const handlePrint = () => {
                const dateStr = new Date(p.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
                const printWindow = window.open("", "_blank", "width=600,height=700");
                if (!printWindow) return;
                printWindow.document.write(`
                  <!DOCTYPE html>
                  <html>
                  <head>
                    <meta charset="utf-8" />
                    <title>Comprovante de Saque</title>
                    <style>
                      * { margin: 0; padding: 0; box-sizing: border-box; }
                      body { font-family: Arial, sans-serif; background: #fff; color: #111; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 40px 20px; }
                      .receipt { width: 100%; max-width: 480px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
                      .header { background: #000; color: #00ff85; padding: 24px; text-align: center; }
                      .header h1 { font-size: 20px; font-weight: bold; letter-spacing: 2px; }
                      .header p { font-size: 12px; color: #aaa; margin-top: 4px; }
                      .body { padding: 24px; }
                      .amount { text-align: center; padding: 20px 0; border-bottom: 1px dashed #e5e7eb; margin-bottom: 20px; }
                      .amount .label { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px; }
                      .amount .value { font-size: 36px; font-weight: bold; color: #00aa55; font-family: monospace; margin-top: 4px; }
                      .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6; font-size: 13px; }
                      .row .key { color: #666; }
                      .row .val { font-weight: 600; font-family: monospace; }
                      .status-paid { color: #16a34a; }
                      .footer { text-align: center; padding: 16px; font-size: 11px; color: #999; border-top: 1px solid #f3f4f6; }
                      @media print { body { padding: 0; } .receipt { border: none; } }
                    </style>
                  </head>
                  <body>
                    <div class="receipt">
                      <div class="header">
                        <h1>INSIDER INVEST</h1>
                        <p>Comprovante de Saque</p>
                      </div>
                      <div class="body">
                        <div class="amount">
                          <div class="label">Valor Recebido</div>
                          <div class="value">${(p.netAmountCents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        </div>
                        <div class="row"><span class="key">Data</span><span class="val">${dateStr}</span></div>
                        <div class="row"><span class="key">Valor Bruto</span><span class="val">$${(p.grossAmountCents / 100 || p.netAmountCents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></div>
                        <div class="row"><span class="key">Repasse</span><span class="val">${p.splitPercent ?? 80}%</span></div>
                        <div class="row"><span class="key">Status</span><span class="val status-paid">${p.status === "paid" ? "Pago" : p.status === "approved" ? "Aprovado" : "Pendente"}</span></div>
                        ${p.pixKey ? `<div class="row"><span class="key">Chave PIX</span><span class="val">${p.pixKey}</span></div>` : ""}
                        ${p.id ? `<div class="row"><span class="key">Ref. #</span><span class="val">${p.id}</span></div>` : ""}
                      </div>
                      <div class="footer">Insider Invest &bull; insider.com.br &bull; Documento gerado em ${new Date().toLocaleDateString("pt-BR")}</div>
                    </div>
                    <script>window.onload = function() { window.print(); }<\/script>
                  </body>
                  </html>
                `);
                printWindow.document.close();
              };
              return (
                <Card key={p.id ?? i} className="bg-card/30 border-white/[0.06]">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          p.status === "paid" ? "bg-emerald-500/10" : p.status === "pending" ? "bg-[#D4AF37]/10" : "bg-muted/20"
                        }`}>
                          <BadgeIcon className={`w-5 h-5 ${
                            p.status === "paid" ? "text-emerald-400" : p.status === "pending" ? "text-[#D4AF37]" : "text-muted-foreground"
                          }`} />
                        </div>
                        <div>
                          <p className="font-bold font-mono">{formatUsd(p.netAmountCents)}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(p.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                            {" · "}{p.splitPercent}% repasse
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={badge.className}>
                          {badge.label}
                        </Badge>
                        {(p.status === "paid" || p.status === "approved") && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 border-white/[0.08] hover:border-white/[0.2] hover:bg-white/[0.05]"
                            onClick={handlePrint}
                            title="Imprimir comprovante"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
