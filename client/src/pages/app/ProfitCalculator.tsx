import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Calculator,
  DollarSign,
  TrendingUp,
  ArrowRight,
  Percent,
  Info,
} from "lucide-react";
import { useState, useMemo } from "react";
import { formatUSD } from "@/lib/format";

const PLAN_OPTIONS = [
  { label: "$10.000,00 - FAST", capital: 10000, split: 80 },
  { label: "$25.000,00 - FAST", capital: 25000, split: 80 },
  { label: "$50.000,00 - FAST", capital: 50000, split: 80 },
  { label: "$100.000,00 - FAST", capital: 100000, split: 80 },
  { label: "$25.000,00 - PRO", capital: 25000, split: 90 },
  { label: "$50.000,00 - PRO", capital: 50000, split: 90 },
  { label: "$100.000,00 - PRO", capital: 100000, split: 90 },
];

const IR_RATE = 0.15; // 15% IR fixo sobre lucros de day trade
const FIRST_PAYOUT_CAP = 1500; // Primeiro payout 100% até $1.500

export default function ProfitCalculator() {
  const [selectedPlanIdx, setSelectedPlanIdx] = useState(0); // FAST $10K default
  const [profitPercent, setProfitPercent] = useState(10);

  const plan = PLAN_OPTIONS[selectedPlanIdx];

  const calc = useMemo(() => {
    const grossProfit = plan.capital * (profitPercent / 100);

    // Primeiro payout: 100% do lucro até $1.500
    const firstPayoutGross = Math.min(grossProfit, FIRST_PAYOUT_CAP);
    const remainingAfterFirst = Math.max(0, grossProfit - FIRST_PAYOUT_CAP);

    // Primeiro payout: 100% (sem split)
    const firstPayoutNet = firstPayoutGross;
    // Demais payouts: split do plano
    const remainingNet = remainingAfterFirst * (plan.split / 100);

    // Total antes do IR
    const totalBeforeIR = firstPayoutNet + remainingNet;

    // IR: 15% sobre o total
    const irAmount = totalBeforeIR * IR_RATE;
    const totalAfterIR = totalBeforeIR - irAmount;

    const effectiveSplit = grossProfit > 0 ? Math.round((totalBeforeIR / grossProfit) * 100) : 0;

    return {
      grossProfit,
      firstPayoutNet,
      remainingNet,
      totalBeforeIR,
      irAmount,
      totalAfterIR,
      effectiveSplit,
    };
  }, [plan, profitPercent]);

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground/40 mb-1">Ferramentas</p>
          <h1 className="text-2xl font-bold">Calculadora de Lucro</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Simule quanto você pode ganhar com cada plano
          </p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Calculator className="w-5 h-5 text-primary" />
        </div>
      </div>

      {/* Plan Selection */}
      <Card className="bg-card/50 border-white/[0.06]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Selecione o Plano</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {PLAN_OPTIONS.map((p, i) => (
              <button
                key={i}
                onClick={() => setSelectedPlanIdx(i)}
                className={`p-3 rounded-lg border text-center transition-all text-sm font-medium ${
                  selectedPlanIdx === i
                  ? "bg-primary/10 border-primary/50 text-primary"
                  : "bg-background/30 border-white/[0.06] text-muted-foreground hover:border-white/[0.1]"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Profit Slider */}
      <Card className="bg-card/50 border-white/[0.06]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Percent className="w-4 h-4 text-primary" />
            Lucro Estimado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-muted-foreground">Percentual de lucro</Label>
              <span className="text-lg font-bold font-mono text-primary">{profitPercent}%</span>
            </div>
            <input
              type="range"
              min={1}
              max={50}
              value={profitPercent}
              onChange={(e) => setProfitPercent(Number(e.target.value))}
              className="w-full h-2 bg-border/50 rounded-full appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1%</span>
              <span>25%</span>
              <span>50%</span>
            </div>
          </div>

          <div className="p-4 bg-background/30 rounded-lg border border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Capital</span>
              <span className="font-mono font-semibold">{formatUSD(plan.capital)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Lucro bruto ({profitPercent}%)</span>
              <span className="font-mono font-semibold text-primary">{formatUSD(calc.grossProfit)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Split</span>
              <span className="font-mono font-semibold">{plan.split}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card className="bg-card/50 border-white/[0.06]">
        <CardContent className="p-6 space-y-4">
          {/* Ganho estimado */}
          <div className="text-center pb-2">
            <p className="text-sm text-muted-foreground mb-1">Seu ganho estimado</p>
            <p className="text-4xl font-bold font-mono text-primary">
              {formatUSD(calc.totalBeforeIR)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Split efetivo: {calc.effectiveSplit}%
            </p>
          </div>

          {/* Primeiro payout */}
          <div className="flex items-center justify-between p-3 bg-background/30 rounded-lg border border-white/[0.06]">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium">Primeiro payout (100%)</span>
            </div>
            <span className="font-mono font-bold text-emerald-400">
              até {formatUSD(FIRST_PAYOUT_CAP)}
            </span>
          </div>

          {/* Payouts seguintes */}
          {calc.remainingNet > 0 && (
            <div className="flex items-center justify-between p-3 bg-background/30 rounded-lg border border-white/[0.06]">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Payouts seguintes ({plan.split}%)</span>
              </div>
              <span className="font-mono font-bold text-primary">
                {formatUSD(calc.remainingNet)}
              </span>
            </div>
          )}

          {/* IR */}
          <div className="flex items-center justify-between p-3 bg-background/30 rounded-lg border border-white/[0.06]">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">IR</span>
            </div>
            <span className="font-mono font-bold text-destructive">
              -{(IR_RATE * 100).toFixed(0)}%
            </span>
          </div>

          {/* Total após IR */}
          <div className="p-4 bg-gradient-to-r from-primary/10 to-emerald-500/10 border border-primary/20 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Total líquido (após IR)</p>
                <p className="text-2xl font-bold font-mono text-primary">
                  {formatUSD(calc.totalAfterIR)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground mb-1">IR descontado</p>
                <p className="text-lg font-bold font-mono text-destructive">
                  -{formatUSD(calc.irAmount)}
                </p>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-muted-foreground/60 text-center">
            Primeiro payout é de 100% para saques de até {formatUSD(FIRST_PAYOUT_CAP)}. Todo saque terá o desconto de {(IR_RATE * 100).toFixed(0)}% de IR.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
