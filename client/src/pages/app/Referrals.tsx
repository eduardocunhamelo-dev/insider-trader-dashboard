import { useTraderAuth } from "@/hooks/useTraderAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  Copy,
  Gift,
  UserPlus,
  CheckCircle2,
  Share2,
  TrendingUp,
  Loader2,
  Clock,
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

export default function Referrals() {
  const { trader: user } = useTraderAuth();
  const [copied, setCopied] = useState(false);

  const { data, isLoading } = trpc.trader.referrals.useQuery(undefined, {
    enabled: !!user,
    retry: false,
  });

  const { data: profile } = trpc.trader.profile.useQuery(undefined, {
    enabled: !!user,
    retry: false,
  });

  const referralCode = useMemo(() => {
    if (!profile) return "";
    return `REF-${profile.id}`;
  }, [profile]);

  const referralLink = useMemo(() => {
    if (!referralCode) return "";
    return `${window.location.origin}?ref=${referralCode}`;
  }, [referralCode]);

  function copyLink() {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Link copiado!");
    setTimeout(() => setCopied(false), 2000);
  }

  function shareWhatsApp() {
    const text = `Estou operando com capital da Insider Invest e ganhando dinheiro de verdade. Use meu link e ganhe desconto: ${referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  const stats = data?.stats ?? { total: 0, converted: 0 };
  const items = data?.items ?? [];

  const statusMap: Record<string, { label: string; color: string }> = {
    pending: { label: "Pendente", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
    converted: { label: "Convertido", color: "bg-primary/20 text-primary border-primary/30" },
    rewarded: { label: "Recompensado", color: "bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/30" },
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <div>
          <div className="h-7 w-36 bg-muted/30 rounded animate-pulse" />
          <div className="h-4 w-64 bg-muted/20 rounded animate-pulse mt-2" />
        </div>
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-5 space-y-4">
            <div className="h-4 w-32 bg-muted/20 rounded animate-pulse" />
            <div className="h-10 bg-muted/10 rounded-lg animate-pulse" />
            <div className="flex gap-2">
              <div className="h-9 flex-1 bg-muted/10 rounded-lg animate-pulse" />
              <div className="h-9 flex-1 bg-muted/10 rounded-lg animate-pulse" />
            </div>
          </CardContent>
        </Card>
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-card/50 border-white/[0.06]">
              <CardContent className="p-4 text-center">
                <div className="w-4 h-4 bg-muted/30 rounded animate-pulse mx-auto mb-2" />
                <div className="h-6 w-8 bg-muted/30 rounded animate-pulse mx-auto" />
                <div className="h-3 w-16 bg-muted/20 rounded animate-pulse mx-auto mt-1" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="w-6 h-6 text-primary" />
          Indicar Amigos
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Indique traders e ganhe recompensas por cada conversão</p>
      </div>

      {/* Referral Link */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Share2 className="w-4 h-4 text-primary" />
            <p className="text-sm font-medium">Seu link de indicação</p>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 bg-background/50 border border-white/[0.06] rounded-lg px-4 py-2.5 font-mono text-sm text-muted-foreground truncate">
              {referralLink || "Carregando..."}
            </div>
            <Button size="sm" className="h-10 px-4 shrink-0" onClick={copyLink} disabled={!referralLink}>
              {copied ? <CheckCircle2 className="w-4 h-4 mr-1.5 text-primary" /> : <Copy className="w-4 h-4 mr-1.5" />}
              {copied ? "Copiado" : "Copiar"}
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1 h-9" onClick={shareWhatsApp} disabled={!referralLink}>
              <Share2 className="w-3.5 h-3.5 mr-1.5" /> WhatsApp
            </Button>
            <Button variant="outline" size="sm" className="flex-1 h-9" onClick={copyLink} disabled={!referralLink}>
              <Copy className="w-3.5 h-3.5 mr-1.5" /> Copiar Link
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-card/50 border-white/[0.06]">
          <CardContent className="p-4 text-center">
            <UserPlus className="w-4 h-4 text-primary mx-auto mb-2" />
            <p className="text-xl font-bold font-mono text-primary">{stats.total}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Indicações</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-white/[0.06]">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-4 h-4 text-[#D4AF37] mx-auto mb-2" />
            <p className="text-xl font-bold font-mono text-[#D4AF37]">{stats.converted}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Convertidos</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-white/[0.06]">
          <CardContent className="p-4 text-center">
            <Gift className="w-4 h-4 text-emerald-400 mx-auto mb-2" />
            <p className="text-xl font-bold font-mono text-emerald-400">
              {stats.total > 0 ? Math.round((stats.converted / stats.total) * 100) : 0}%
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Conversão</p>
          </CardContent>
        </Card>
      </div>

      {/* How it works */}
      <Card className="bg-card/30 border-white/[0.06]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Gift className="w-4 h-4 text-primary" />
            Como funciona
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { step: "1", title: "Compartilhe seu link", desc: "Envie para amigos traders que querem operar com capital." },
              { step: "2", title: "Amigo compra um plano", desc: "Quando ele adquire qualquer plano, a indicação é registrada." },
              { step: "3", title: "Receba sua recompensa", desc: "10% de desconto no seu próximo ciclo por cada conversão." },
            ].map((s) => (
              <div key={s.step} className="text-center p-4 bg-background/30 rounded-lg border border-white/[0.06]">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center mx-auto mb-3">
                  {s.step}
                </div>
                <p className="font-semibold text-sm">{s.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Referral History */}
      <div className="rounded-2xl border border-white/[0.06] bg-card/10 p-5">
        <h2 className="font-semibold text-lg mb-4">Suas Indicações</h2>
        {items.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Nenhuma indicação ainda.</p>
            <p className="text-sm mt-1">Compartilhe seu link para começar a indicar.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((r) => {
              const st = statusMap[r.status] ?? statusMap.pending;
              return (
                <Card key={r.id} className="bg-card/30 border-white/[0.06]">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-bold text-primary">
                            {(r.referredName ?? "?")[0]?.toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">{r.referredName ?? "Trader"}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {r.createdAt ? new Date(r.createdAt).toLocaleDateString("pt-BR") : "—"}
                            </span>
                            {r.referredPlan && (
                              <Badge className="text-[10px] px-1.5 py-0 h-4 bg-primary/10 text-primary border-primary/20">
                                {r.referredPlan.toUpperCase()}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <Badge className={`text-[10px] ${st.color}`}>{st.label}</Badge>
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
