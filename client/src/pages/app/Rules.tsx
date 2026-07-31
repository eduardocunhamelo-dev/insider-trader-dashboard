import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { formatUSD } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BookOpen,
  Target,
  TrendingDown,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Info,
} from "lucide-react";

// ─── Static Rules ─────────────────────────────────────────────────────────────

const RULES = [
  {
    icon: Target,
    title: "Meta de Lucro",
    description: "Atinja a meta de lucro dentro do prazo para ser aprovado. O percentual varia por plano.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: TrendingDown,
    title: "Drawdown Máximo",
    description: "Não ultrapasse o drawdown máximo de 5% do capital inicial. Isso reprova automaticamente.",
    color: "text-destructive",
    bg: "bg-destructive/10",
  },
  {
    icon: AlertTriangle,
    title: "Drawdown Diário",
    description: "O drawdown diário não pode exceder 3% do saldo do dia anterior.",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
  },
  {
    icon: Calendar,
    title: "Dias Mínimos de Operação",
    description: "Você precisa operar no mínimo 5 dias (FAST) ou 10 dias (PRO) para ser elegível.",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    icon: DollarSign,
    title: "Repasse de Lucro",
    description: "Após aprovação, o lucro é repassado de 80% a 95% dependendo do seu nível no Inner Circle.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    icon: CheckCircle2,
    title: "Ativos Permitidos",
    description: "Opere apenas os pares e ativos autorizados para o seu plano. Consulte a lista completa.",
    color: "text-[#D4AF37]",
    bg: "bg-[#D4AF37]/10",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtUSD = (v: number) => formatUSD(v, 0);

const fmtBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);

const fmtPct = (part: number, total: number) =>
  total > 0 ? `${((part / total) * 100).toFixed(0)}%` : "—";

// ─── Component ───────────────────────────────────────────────────────────────

export default function Rules() {
  const { data: plans, isLoading: plansLoading } = trpc.trader.publicPlanList.useQuery(undefined, {
    staleTime: 10 * 60 * 1000,
  });

  return (
    <div className="app-section max-w-[1800px]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground/40 mb-1">Avaliação</p>
          <h1 className="text-2xl font-bold">Regras e Objetivos</h1>
          <p className="text-sm text-muted-foreground mt-1">Tudo que você precisa saber para ser aprovado</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <BookOpen className="w-5 h-5 text-primary" />
        </div>
      </div>

      {/* Rules Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 app-grid">
        {RULES.map((rule, i) => {
          const Icon = rule.icon;
          return (
            <Card key={i} className="bg-card/30 border-white/[0.06]">
              <CardContent className="app-card">
                <div className={`w-10 h-10 rounded-lg ${rule.bg} flex items-center justify-center mb-3`}>
                  <Icon className={`w-5 h-5 ${rule.color}`} />
                </div>
                <p className="font-semibold text-sm mb-1">{rule.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{rule.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Plans Comparison Table */}
      <Card className="bg-card/30 border-white/[0.06] overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="w-4 h-4 text-primary" />
            Comparativo de Planos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] bg-muted/5">
                  <th className="text-left p-3 font-medium text-muted-foreground text-xs">Plano</th>
                  <th className="text-center p-3 font-medium text-muted-foreground text-xs">Capital</th>
                  <th className="text-center p-3 font-medium text-muted-foreground text-xs">Meta</th>
                  <th className="text-center p-3 font-medium text-muted-foreground text-xs">DD Máx.</th>
                  <th className="text-center p-3 font-medium text-muted-foreground text-xs">DD Diário</th>
                  <th className="text-center p-3 font-medium text-muted-foreground text-xs">Dias</th>
                  <th className="text-center p-3 font-medium text-muted-foreground text-xs">Repasse</th>
                  <th className="text-center p-3 font-medium text-muted-foreground text-xs">Preço</th>
                </tr>
              </thead>
              <tbody>
                {plansLoading ? (
                  // Loading skeleton rows
                  [...Array(6)].map((_, i) => (
                    <tr key={i} className="border-b border-white/[0.04]">
                      {[...Array(8)].map((_, j) => (
                        <td key={j} className="p-3">
                          <div className="h-4 bg-white/[0.06] rounded animate-pulse mx-auto" style={{ width: j === 0 ? "80px" : "48px" }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : plans && plans.length > 0 ? (
                  plans
                    // Show only FAST (cat=2) and PRO (cat=1) plans in the comparison table
                    .filter((p) => p.category === 1 || p.category === 2)
                    // Deduplicate by title (keep first occurrence after sort)
                    .filter((p, idx, arr) => arr.findIndex(x => x.title === p.title) === idx)
                    .map((plan) => {
                      const isFast = plan.category === 2;
                      const isPro = plan.category === 1;
                      const profitPct = fmtPct(plan.profitTarget, plan.valueAccount);
                      const drawdownPct = fmtPct(plan.trailingDrawdown, plan.valueAccount);
                      const dailyLossPct = fmtPct(plan.limitLossDay, plan.valueAccount);
                      const maxDays = plan.limitDaysOperation ?? (isFast ? 30 : 60);
                      return (
                        <tr key={plan.id} className="border-b border-white/[0.04] hover:bg-muted/5 transition-colors">
                          <td className="p-3">
                            <Badge className={`text-xs ${
                              isPro
                                ? "bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/30"
                                : "bg-primary/20 text-primary border-primary/30"
                            }`}>
                              {plan.title}
                            </Badge>
                          </td>
                          <td className="p-3 text-center font-mono font-medium">{fmtUSD(plan.valueAccount)}</td>
                          <td className="p-3 text-center font-mono text-primary">{profitPct}</td>
                          <td className="p-3 text-center font-mono text-destructive">{drawdownPct}</td>
                          <td className="p-3 text-center font-mono text-orange-400">{dailyLossPct}</td>
                          <td className="p-3 text-center font-mono">{plan.minimumDaysOperation}–{maxDays}</td>
                          <td className="p-3 text-center font-mono text-emerald-400 text-xs max-w-[140px]">
                            {plan.passOn ?? "—"}
                          </td>
                          <td className="p-3 text-center font-mono font-bold">{fmtBRL(plan.valuePlan)}</td>
                        </tr>
                      );
                    })
                ) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground text-sm">
                      Nenhum plano disponível no momento.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Important Notes */}
      <Card className="bg-blue-500/5 border-white/[0.06]">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="font-semibold text-sm">Observações importantes</p>
              <ul className="text-xs text-muted-foreground space-y-1.5">
                <li>• O drawdown é calculado sobre o saldo inicial da conta, não sobre o saldo atual.</li>
                <li>• Operações com lote acima do permitido resultam em reprovação automática.</li>
                <li>• O prazo começa a contar a partir do primeiro trade executado.</li>
                <li>• Após aprovação, o primeiro payout é 100% do lucro (até $15.000). Depois, aplica-se o percentual de repasse.</li>
                <li>• Membros do Inner Circle têm repasse progressivo: Prime 80%, Pro 90%, Institucional 95%.</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
