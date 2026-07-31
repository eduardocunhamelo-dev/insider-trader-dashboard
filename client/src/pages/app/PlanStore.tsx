import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ShoppingBag,
  Zap,
  Crown,
  CheckCircle2,
  ArrowRight,
  Star,
} from "lucide-react";
import { openCheckout, CHECKOUT_URLS } from "@/lib/checkout";
import { trpc } from "@/lib/trpc";
import { useTraderAuth } from "@/hooks/useTraderAuth";

// Plan data matching the landing page
const PLANS = [
  {
    type: "fast" as const,
    label: "FAST",
    icon: Zap,
    sizes: [
      { capital: "$10K", price: "R$ 497", checkoutUrl: CHECKOUT_URLS.fast["10k"] },
      { capital: "$25K", price: "R$ 997", checkoutUrl: CHECKOUT_URLS.fast["25k"] },
      { capital: "$50K", price: "R$ 1.497", checkoutUrl: CHECKOUT_URLS.fast["50k"] },
      { capital: "$100K", price: "R$ 2.497", checkoutUrl: CHECKOUT_URLS.fast["100k"] },
    ],
    features: [
      "Meta de lucro: 10%",
      "Perda máxima: 10%",
      "Perda diária: 5%",
      "Mínimo 10 dias operados",
      "Prazo de 30 dias",
      "1º Repasse 100% seu",
      "Repasse padrão: 80%",
    ],
    color: "primary",
    popular: true,
  },
  {
    type: "pro" as const,
    label: "PRO",
    icon: Crown,
    sizes: [
      { capital: "$25K", price: "R$ 1.497", checkoutUrl: CHECKOUT_URLS.pro["25k"] },
      { capital: "$50K", price: "R$ 2.497", checkoutUrl: CHECKOUT_URLS.pro["50k"] },
      { capital: "$100K", price: "R$ 4.997", checkoutUrl: CHECKOUT_URLS.pro["100k"] },
    ],
    features: [
      "Meta de lucro: 8%",
      "Perda máxima: 10%",
      "Perda diária: 5%",
      "Mínimo 10 dias operados",
      "Prazo de 60 dias",
      "1º Repasse 100% seu",
      "Repasse padrão: 90%",
      "Acesso ao Inner Circle",
    ],
    color: "[#D4AF37]",
    popular: false,
  },
];

export default function PlanStore() {
  const { trader: user } = useTraderAuth();
  const { data: profile } = trpc.trader.profile.useQuery(undefined, {
    enabled: !!user,
    retry: false,
  });

  const currentPlan = profile?.activePlan;

  return (
    <div className="app-section max-w-[1800px]">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShoppingBag className="w-6 h-6 text-primary" />
          Loja de Planos
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Escolha o plano ideal para o seu perfil de trader
        </p>
        {currentPlan && (
          <Badge className="mt-2 bg-primary/20 text-primary border-primary/30">
            Plano atual: {currentPlan.toUpperCase()}
          </Badge>
        )}
      </div>

      {/* Trial Banner */}
      <Card className="bg-gradient-to-r from-primary/10 to-emerald-500/10 border-primary/20">
        <CardContent className="app-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Star className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">Insider Trial — R$ 97</p>
                <p className="text-xs text-muted-foreground">14 dias para provar sua consistência. Sem risco.</p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              onClick={() => openCheckout(CHECKOUT_URLS.trial)}
            >
              Começar Trial <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Plans Grid */}
      <div className="grid lg:grid-cols-2 app-grid">
        {PLANS.map((plan) => (
          <Card
            key={plan.type}
            className={`bg-card/50 border-white/[0.06] relative ${
              plan.popular ? "ring-1 ring-primary/30" : ""
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground text-xs px-3">
                  Mais Popular
                </Badge>
              </div>
            )}
            <CardContent className="app-card space-y-5">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl bg-${plan.color}/10 flex items-center justify-center`}>
                  <plan.icon className={`w-6 h-6 text-${plan.color}`} />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{plan.label}</h3>
                  <p className="text-xs text-muted-foreground">
                    {plan.type === "fast" ? "Avaliação rápida em 30 dias" : "Avaliação premium em 60 dias"}
                  </p>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-2">
                {plan.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle2 className={`w-3.5 h-3.5 text-${plan.color} shrink-0`} />
                    <span className="text-sm text-muted-foreground">{f}</span>
                  </div>
                ))}
              </div>

              {/* Size Options */}
              <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                <p className="text-xs text-muted-foreground font-medium mb-3">Escolha o tamanho da conta:</p>
                {plan.sizes.map((size) => (
                  <div
                    key={size.checkoutUrl}
                    className="flex items-center justify-between p-3 bg-background/30 rounded-lg border border-white/[0.06] hover:border-primary/30 transition-colors"
                  >
                    <div>
                      <span className="font-bold text-sm">{size.capital}</span>
                      <span className="text-muted-foreground text-sm ml-2">—</span>
                      <span className="font-mono font-semibold text-sm ml-2 text-primary">{size.price}</span>
                    </div>
                    <Button
                      size="sm"
                      className="h-8 px-4 text-xs"
                      onClick={() => openCheckout(size.checkoutUrl)}
                    >
                      Comprar <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* FAQ */}
      <Card className="bg-card/30 border-white/[0.06]">
        <CardContent className="app-card space-y-3">
          <h3 className="font-semibold text-sm">Dúvidas Frequentes</h3>
          <div className="space-y-3 text-sm">
            <div className="p-3 rounded-lg border border-white/[0.06] bg-muted/5">
              <p className="font-medium">Posso trocar de plano?</p>
              <p className="text-muted-foreground text-xs mt-0.5">
                Sim, ao adquirir um novo plano, ele será ativado automaticamente. O plano anterior é encerrado.
              </p>
            </div>
            <div className="p-3 rounded-lg border border-white/[0.06] bg-muted/5">
              <p className="font-medium">O que acontece se eu não atingir a meta?</p>
              <p className="text-muted-foreground text-xs mt-0.5">
                Você pode adquirir um novo ciclo a qualquer momento. Não há penalidade.
              </p>
            </div>
            <div className="p-3 rounded-lg border border-white/[0.06] bg-muted/5">
              <p className="font-medium">Quando recebo meu payout?</p>
              <p className="text-muted-foreground text-xs mt-0.5">
                Após aprovação, o saque é processado em até 48h via PIX.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
