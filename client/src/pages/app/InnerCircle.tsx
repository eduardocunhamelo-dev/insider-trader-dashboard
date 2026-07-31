import { useTraderAuth } from "@/hooks/useTraderAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Star,
  CheckCircle2,
  Lock,
  Gift,
  Trophy,
  Crown,
  Zap,
  ArrowRight,
  Sparkles,
  Gem,
  Construction,
} from "lucide-react";

// ─── Tier Data ───────────────────────────────────────────────────────────────

const TIERS = [
  {
    id: "prime",
    name: "Prime",
    icon: Zap,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
    glowColor: "shadow-emerald-500/10",
    requirement: "1 payout realizado",
    payoutsNeeded: 1,
    benefits: [
      "Repasse de 80% do lucro",
      "Moletom Insider exclusivo",
      "Acesso à comunidade Prime",
      "Badge Prime no perfil",
    ],
    reward: "Moletom Insider",
    rewardIcon: Gift,
  },
  {
    id: "pro",
    name: "Pro",
    icon: Trophy,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    glowColor: "shadow-blue-500/10",
    requirement: "5 payouts realizados",
    payoutsNeeded: 5,
    benefits: [
      "Repasse de 90% do lucro",
      "Setup Upgrade (monitor/periférico)",
      "Mentorias exclusivas ao vivo",
      "Prioridade no suporte",
      "Badge Pro no perfil",
    ],
    reward: "Setup Upgrade",
    rewardIcon: Gift,
  },
  {
    id: "institutional",
    name: "Institucional",
    icon: Crown,
    color: "text-[#D4AF37]",
    bgColor: "bg-[#D4AF37]/10",
    borderColor: "border-[#D4AF37]/30",
    glowColor: "shadow-[#D4AF37]/10",
    requirement: "12 payouts realizados",
    payoutsNeeded: 12,
    benefits: [
      "Repasse de 95% do lucro",
      "Troféu Black exclusivo",
      "Acesso a capital de até $200k",
      "Convite para eventos presenciais",
      "Linha direta com o Eduardo",
      "Badge Institucional no perfil",
    ],
    reward: "Troféu Black",
    rewardIcon: Gem,
  },
];

// ─── Demo Data ───────────────────────────────────────────────────────────────

const DEMO_PROGRESS = {
  totalPayouts: 3,
  currentTier: "prime" as const,
  totalPayoutCents: 450000,
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function InnerCircle() {
  const { trader: user } = useTraderAuth();

  const { data: traderData } = trpc.trader.me.useQuery(undefined, {
    enabled: !!user,
    retry: false,
  });

  const progress = DEMO_PROGRESS;
  const totalPayouts = progress.totalPayouts;

  return (
    <div className="app-section max-w-4xl">
      {/* Preview banner — make it clear that data is illustrative */}
      <div className="rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/5 p-4 flex items-start gap-3">
        <Construction className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-[#D4AF37]">
            Funcionalidade em desenvolvimento
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Esta tela é uma prévia do programa Inner Circle. Os tiers, recompensas
            e progresso exibidos são exemplos do que você verá quando o programa
            for lançado.
          </p>
        </div>
      </div>

      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-[#D4AF37]/25 bg-gradient-to-br from-[#D4AF37]/8 via-background to-primary/5 p-8">
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#D4AF37]/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/5 rounded-full blur-[80px] pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-xl gold-gradient flex items-center justify-center shadow-lg">
              <Star className="w-7 h-7 text-black fill-black" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">The Inner Circle</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Seu programa de recompensas por performance</p>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-5">
            <Badge className={`${TIERS.find(t => t.id === progress.currentTier)?.bgColor} ${TIERS.find(t => t.id === progress.currentTier)?.color} border ${TIERS.find(t => t.id === progress.currentTier)?.borderColor} px-3 py-1`}>
              <Star className="w-3.5 h-3.5 mr-1.5 fill-current" />
              Nível {TIERS.find(t => t.id === progress.currentTier)?.name}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {totalPayouts} payouts realizados
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <Card className="bg-card/60 border-white/[0.06]">
        <CardContent className="app-card">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold">Progresso Geral</p>
            <p className="text-sm font-mono font-bold text-primary">{totalPayouts} / 12 payouts</p>
          </div>
          <div className="relative">
            <Progress value={(totalPayouts / 12) * 100} className="h-3 mb-6" />
          </div>
          
          {/* Tier Milestones on Progress Bar */}
          <div className="flex justify-between relative">
            {TIERS.map((tier) => {
              const Icon = tier.icon;
              const isReached = totalPayouts >= tier.payoutsNeeded;
              return (
                <div key={tier.id} className="flex flex-col items-center gap-2">
                  <div className={`w-11 h-11 rounded-full border-2 flex items-center justify-center transition-all ${
                    isReached
                      ? `${tier.borderColor} ${tier.bgColor}`
                      : "border-[#D4AF37]/30 bg-[#D4AF37]/5"
                  }`}>
                    {isReached ? (
                      <Icon className={`w-5 h-5 ${tier.color}`} />
                    ) : (
                      <Lock className="w-4 h-4 text-[#D4AF37]/60" />
                    )}
                  </div>
                  <p className={`text-xs font-semibold ${isReached ? tier.color : "text-[#D4AF37]/70"}`}>
                    {tier.name}
                  </p>
                  <p className={`text-[10px] ${isReached ? "text-muted-foreground" : "text-[#D4AF37]/40"}`}>
                    {tier.payoutsNeeded} payouts
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Tier Cards */}
      <div className="app-section">
        {TIERS.map((tier) => {
          const Icon = tier.icon;
          const RewardIcon = tier.rewardIcon;
          const isReached = totalPayouts >= tier.payoutsNeeded;
          const isCurrent = tier.id === progress.currentTier;
          const isNext = !isReached && TIERS.findIndex(t => t.id === tier.id) === TIERS.findIndex(t => totalPayouts < t.payoutsNeeded);
          const payoutsRemaining = tier.payoutsNeeded - totalPayouts;

          // Unlocked/current tier
          if (isReached) {
            return (
              <Card
                key={tier.id}
                className={`overflow-hidden transition-all card-premium ${
                  isCurrent
                    ? `border-2 ${tier.borderColor} bg-card/80`
                    : `border-white/[0.06] bg-card/50`
                }`}
              >
                <CardContent className="app-card">
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${tier.bgColor}`}>
                      <Icon className={`w-7 h-7 ${tier.color}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <h3 className={`font-bold text-lg ${tier.color}`}>{tier.name}</h3>
                        {isCurrent && (
                          <Badge className={`${tier.bgColor} ${tier.color} border ${tier.borderColor} text-xs`}>
                            Nível Atual
                          </Badge>
                        )}
                        {!isCurrent && <CheckCircle2 className={`w-5 h-5 ${tier.color}`} />}
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">{tier.requirement}</p>

                      <div className="grid sm:grid-cols-2 gap-2.5">
                        {tier.benefits.map((benefit, i) => (
                          <div key={i} className="flex items-center gap-2.5">
                            <CheckCircle2 className="w-4 h-4 shrink-0 text-primary" />
                            <span className="text-sm text-foreground/90">{benefit}</span>
                          </div>
                        ))}
                      </div>

                      <div className={`mt-5 p-3.5 rounded-xl flex items-center gap-3 ${tier.bgColor} border ${tier.borderColor}`}>
                        <RewardIcon className={`w-5 h-5 ${tier.color}`} />
                        <div>
                          <p className={`text-sm font-semibold ${tier.color}`}>Recompensa: {tier.reward}</p>
                          <p className="text-xs text-muted-foreground">Desbloqueado!</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          }

          // ─── LOCKED / FUTURE TIER — GOLD PREMIUM ─────────────────────
          return (
            <Card
              key={tier.id}
              className={`overflow-hidden transition-all card-premium gold-shimmer ${
                isNext
                  ? "border-[#D4AF37]/30 bg-gradient-to-br from-[#D4AF37]/5 via-card/60 to-[#8B6914]/5 gold-glow"
                  : "border-[#D4AF37]/20 bg-gradient-to-br from-[#D4AF37]/3 via-card/40 to-[#8B6914]/3"
              }`}
            >
              <CardContent className="app-card">
                <div className="flex items-start gap-4">
                  {/* Gold icon container */}
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${
                    isNext
                      ? "gold-gradient shadow-lg"
                      : "bg-gradient-to-br from-[#D4AF37]/15 to-[#B8860B]/10 border border-[#D4AF37]/20"
                  }`}>
                    {isNext ? (
                      <Icon className="w-7 h-7 text-black" />
                    ) : (
                      <Icon className="w-7 h-7 text-[#D4AF37]/70" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <h3 className={`font-bold text-lg ${isNext ? "gold-gradient-text" : "text-[#D4AF37]/80"}`}>
                        {tier.name}
                      </h3>
                      {isNext ? (
                        <Badge className="bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 text-xs">
                          <Sparkles className="w-3 h-3 mr-1" />
                          Próximo Nível
                        </Badge>
                      ) : (
                        <Badge className="bg-[#D4AF37]/10 text-[#D4AF37]/60 border border-[#D4AF37]/15 text-xs">
                          <Lock className="w-3 h-3 mr-1" />
                          Bloqueado
                        </Badge>
                      )}
                    </div>
                    <p className={`text-sm mb-4 ${isNext ? "text-[#D4AF37]/60" : "text-[#D4AF37]/40"}`}>
                      {tier.requirement}
                    </p>

                    {/* Benefits with gold styling */}
                    <div className="grid sm:grid-cols-2 gap-2.5">
                      {tier.benefits.map((benefit, i) => (
                        <div key={i} className="flex items-center gap-2.5">
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                            isNext ? "bg-[#D4AF37]/20" : "bg-[#D4AF37]/10"
                          }`}>
                            <Star className={`w-2.5 h-2.5 ${isNext ? "text-[#D4AF37]" : "text-[#D4AF37]/50"}`} />
                          </div>
                          <span className={`text-sm ${isNext ? "text-foreground/80" : "text-foreground/60"}`}>
                            {benefit}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Reward with gold premium styling */}
                    <div className={`mt-5 p-3.5 rounded-xl flex items-center gap-3 border ${
                      isNext
                        ? "bg-[#D4AF37]/8 border-[#D4AF37]/25"
                        : "bg-[#D4AF37]/5 border-[#D4AF37]/15"
                    }`}>
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                        isNext ? "gold-gradient" : "bg-[#D4AF37]/15"
                      }`}>
                        <RewardIcon className={`w-4 h-4 ${isNext ? "text-black" : "text-[#D4AF37]/60"}`} />
                      </div>
                      <div>
                        <p className={`text-sm font-semibold ${isNext ? "text-[#D4AF37]" : "text-[#D4AF37]/60"}`}>
                          Recompensa: {tier.reward}
                        </p>
                        <p className={`text-xs ${isNext ? "text-[#D4AF37]/50" : "text-[#D4AF37]/30"}`}>
                          {isNext ? "Quase lá..." : "Continue operando para desbloquear"}
                        </p>
                      </div>
                    </div>

                    {/* Progress to next tier */}
                    {isNext && payoutsRemaining > 0 && (
                      <div className="mt-4 p-3 rounded-lg bg-[#D4AF37]/5 border border-[#D4AF37]/15">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-[#D4AF37]/70">Progresso para {tier.name}</span>
                          <span className="text-xs font-mono font-bold text-[#D4AF37]">
                            {totalPayouts}/{tier.payoutsNeeded}
                          </span>
                        </div>
                        <div className="h-2 bg-[#D4AF37]/10 rounded-full overflow-hidden">
                          <div
                            className="h-full gold-gradient rounded-full transition-all"
                            style={{ width: `${(totalPayouts / tier.payoutsNeeded) * 100}%` }}
                          />
                        </div>
                        <p className="text-xs text-[#D4AF37]/50 mt-2 flex items-center gap-1.5">
                          <ArrowRight className="w-3 h-3" />
                          Faltam <strong className="text-[#D4AF37]">{payoutsRemaining} payouts</strong> para desbloquear
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* How it works */}
      <Card className="bg-card/40 border-white/[0.06]">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Como funciona
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Opere e lucre", desc: "Faça trades consistentes e atinja as metas do seu plano." },
              { step: "2", title: "Solicite payouts", desc: "Cada payout aprovado conta como um marco no seu progresso." },
              { step: "3", title: "Suba de nível", desc: "Desbloqueie benefícios exclusivos e recompensas físicas." },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-bold text-lg flex items-center justify-center mx-auto mb-3 font-mono">
                  {s.step}
                </div>
                <p className="font-semibold text-sm mb-1">{s.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
