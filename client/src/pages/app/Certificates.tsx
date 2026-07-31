import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Award,
  Download,
  Share2,
  Instagram,
  Linkedin,
  CheckCircle2,
  Lock,
  Sparkles,
  Star,
} from "lucide-react";
import { toast } from "sonner";

// ─── Demo Data ───────────────────────────────────────────────────────────────

const CERTIFICATES = [
  {
    id: 1,
    title: "Aprovação na Avaliação",
    description: "Aprovado na avaliação de competência da Insider Invest",
    plan: "FAST $25K",
    date: "15/04/2026",
    unlocked: true,
    type: "approval",
  },
  {
    id: 2,
    title: "Primeiro Payout",
    description: "Primeiro saque de lucro realizado com sucesso",
    plan: "FAST $25K",
    date: "22/04/2026",
    unlocked: true,
    type: "payout",
  },
  {
    id: 3,
    title: "Inner Circle — Prime",
    description: "Membro do nível Prime do programa Inner Circle",
    plan: null,
    date: "22/04/2026",
    unlocked: true,
    type: "inner_circle",
  },
  {
    id: 4,
    title: "Trader Consistente",
    description: "5 ciclos consecutivos com payout aprovado",
    plan: null,
    date: null,
    unlocked: false,
    type: "consistency",
  },
  {
    id: 5,
    title: "Inner Circle — Pro",
    description: "Membro do nível Pro do programa Inner Circle",
    plan: null,
    date: null,
    unlocked: false,
    type: "inner_circle",
  },
  {
    id: 6,
    title: "Inner Circle — Institucional",
    description: "Membro do nível máximo do programa Inner Circle",
    plan: null,
    date: null,
    unlocked: false,
    type: "inner_circle",
  },
  {
    id: 7,
    title: "$100K Capital Operado",
    description: "Atingiu $100.000 em capital operado na Insider Invest",
    plan: null,
    date: null,
    unlocked: false,
    type: "milestone",
  },
  {
    id: 8,
    title: "Insider Academy — Completo",
    description: "Completou todos os módulos da Insider Academy",
    plan: null,
    date: null,
    unlocked: false,
    type: "academy",
  },
];

function certColor(type: string) {
  switch (type) {
    case "approval": return { bg: "bg-primary/10", border: "border-primary/20", text: "text-primary", icon: "text-primary" };
    case "payout": return { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400", icon: "text-emerald-400" };
    case "inner_circle": return { bg: "bg-[#D4AF37]/10", border: "border-[#D4AF37]/20", text: "text-[#D4AF37]", icon: "text-[#D4AF37]" };
    case "consistency": return { bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-400", icon: "text-blue-400" };
    case "milestone": return { bg: "bg-purple-500/10", border: "border-purple-500/20", text: "text-purple-400", icon: "text-purple-400" };
    case "academy": return { bg: "bg-orange-500/10", border: "border-orange-500/20", text: "text-orange-400", icon: "text-orange-400" };
    default: return { bg: "bg-muted/10", border: "border-white/[0.06]", text: "text-muted-foreground", icon: "text-muted-foreground" };
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function Certificates() {
  const unlockedCount = CERTIFICATES.filter(c => c.unlocked).length;

  function handleShare(cert: typeof CERTIFICATES[0], platform: string) {
    const text = `Conquistei o certificado "${cert.title}" na @InsiderInvest!`;
    if (platform === "instagram") {
      toast.success("Texto copiado! Cole no seu story do Instagram.", { description: text });
    } else if (platform === "linkedin") {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=https://insiderinveste.com.br&title=${encodeURIComponent(text)}`, "_blank");
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 tracking-tight">
            <Award className="w-6 h-6 text-primary" />
            Certificados
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {unlockedCount} de {CERTIFICATES.length} conquistados
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {CERTIFICATES.map((cert) => {
          const colors = certColor(cert.type);

          if (cert.unlocked) {
            return (
              <Card
                key={cert.id}
                className={`overflow-hidden transition-all card-premium ${colors.border} ${colors.bg} hover:scale-[1.01]`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${colors.bg}`}>
                      <Award className={`w-6 h-6 ${colors.icon}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{cert.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{cert.description}</p>
                      {cert.plan && (
                        <Badge className={`mt-2 text-[10px] ${colors.bg} ${colors.text} border ${colors.border}`}>
                          {cert.plan}
                        </Badge>
                      )}
                      {cert.date && (
                        <p className="text-[10px] text-muted-foreground mt-2">Conquistado em {cert.date}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/[0.06]">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs flex-1"
                      onClick={() => toast.success("Download iniciado!")}
                    >
                      <Download className="w-3 h-3 mr-1.5" /> Baixar PDF
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleShare(cert, "instagram")}
                    >
                      <Instagram className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleShare(cert, "linkedin")}
                    >
                      <Linkedin className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          }

          // ─── LOCKED CERTIFICATE — GOLD PREMIUM ─────────────────────
          return (
            <Card
              key={cert.id}
              className="overflow-hidden transition-all card-premium gold-shimmer border-[#D4AF37]/20 bg-gradient-to-br from-[#D4AF37]/5 via-card/40 to-[#8B6914]/3"
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br from-[#D4AF37]/15 to-[#B8860B]/10 border border-[#D4AF37]/20">
                    <Award className="w-6 h-6 text-[#D4AF37]/70" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-[#D4AF37]/80">{cert.title}</p>
                    <p className="text-xs text-[#D4AF37]/40 mt-0.5">{cert.description}</p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#D4AF37]/10">
                  <p className="text-xs text-[#D4AF37]/50 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" /> Continue operando para desbloquear
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
