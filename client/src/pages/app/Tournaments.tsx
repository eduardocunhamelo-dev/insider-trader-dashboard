import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Trophy,
  Users,
  Calendar,
  Clock,
  Medal,
  Star,
  Zap,
  Crown,
  Gift,
  Construction,
} from "lucide-react";
import { toast } from "sonner";

// PREVIEW MODE — sample data for product demo. Will be replaced with real
// tournaments fetched via tRPC when admin tournament management ships.
// See ProductRoadmap.md for launch criteria.
const TOURNAMENTS = [
  {
    id: 1,
    name: "Desafio Insider — Maio 2026",
    description: "Quem fizer o maior lucro percentual no mês ganha prêmios exclusivos.",
    status: "upcoming" as "active" | "upcoming" | "coming_soon" | "finished",
    startDate: "2026-05-01",
    endDate: "2026-05-31",
    participants: 0,
    maxParticipants: 100,
    prizes: [
      { position: "1º", prize: "Moletom Insider + $500 bônus", icon: Crown },
      { position: "2º", prize: "$300 bônus na conta", icon: Medal },
      { position: "3º", prize: "$100 bônus na conta", icon: Star },
    ],
    rules: [
      "Aberto para traders com conta ativa FAST ou PRO",
      "Ranking por lucro percentual (não absoluto)",
      "Mínimo de 10 operações no período",
      "Proibido uso de EAs/robôs",
    ],
    entryFee: "Gratuito",
  },
  {
    id: 2,
    name: "Copa Insider Q2 2026",
    description: "Torneio trimestral com os maiores prêmios. Apenas para traders aprovados.",
    status: "coming_soon" as "active" | "upcoming" | "coming_soon" | "finished",
    startDate: "2026-07-01",
    endDate: "2026-07-31",
    participants: 0,
    maxParticipants: 50,
    prizes: [
      { position: "1º", prize: "Setup Gamer Completo + $1.000", icon: Crown },
      { position: "2º", prize: "$500 bônus + Moletom", icon: Medal },
      { position: "3º", prize: "$250 bônus", icon: Star },
    ],
    rules: [
      "Exclusivo para traders aprovados (conta real)",
      "Ranking por Sharpe Ratio",
      "Mínimo de 20 operações",
    ],
    entryFee: "Gratuito (apenas aprovados)",
  },
];

const statusMap = {
  active: { label: "Em andamento", color: "bg-primary/20 text-primary border-primary/30" },
  upcoming: { label: "Inscrições abertas", color: "bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/30" },
  coming_soon: { label: "Em breve", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  finished: { label: "Encerrado", color: "bg-muted/20 text-muted-foreground border-white/[0.06]" },
};

export default function Tournaments() {
  function handleJoin(tournamentId: number) {
    toast.info("Inscrição em torneios será habilitada em breve. Fique ligado!");
  }

  return (
    <div className="app-section max-w-5xl">
      {/* Preview banner — make it clear that data is illustrative */}
      <div className="rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/5 p-4 flex items-start gap-3">
        <Construction className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-[#D4AF37]">
            Funcionalidade em desenvolvimento
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Esta tela é uma prévia da experiência de torneios. Os dados exibidos
            são exemplos do que você verá quando a feature for lançada.
          </p>
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Trophy className="w-6 h-6 text-[#D4AF37]" />
          Torneios
          <Badge variant="outline" className="text-[10px] border-[#D4AF37]/40 text-[#D4AF37] ml-2">
            Preview
          </Badge>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Compete com outros traders e ganhe prêmios exclusivos
        </p>
      </div>

      {/* Tournament Cards */}
      <div className="app-section">
        {TOURNAMENTS.map((t) => {
          const st = statusMap[t.status];
          return (
            <Card key={t.id} className="bg-card/50 border-white/[0.06] overflow-hidden">
              {/* Header */}
              <div className="p-5 lg:p-6 pb-0">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center">
                      <Trophy className="w-6 h-6 text-[#D4AF37]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{t.name}</h3>
                      <p className="text-sm text-muted-foreground">{t.description}</p>
                    </div>
                  </div>
                  <Badge className={`${st.color} text-xs shrink-0`}>{st.label}</Badge>
                </div>
              </div>

              <CardContent className="app-card space-y-5">
                {/* Info Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 app-grid">
                  <div className="p-3 bg-background/30 rounded-lg border border-white/[0.06] text-center">
                    <Calendar className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">Início</p>
                    <p className="text-sm font-medium">
                      {new Date(t.startDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                    </p>
                  </div>
                  <div className="p-3 bg-background/30 rounded-lg border border-white/[0.06] text-center">
                    <Clock className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">Término</p>
                    <p className="text-sm font-medium">
                      {new Date(t.endDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                    </p>
                  </div>
                  <div className="p-3 bg-background/30 rounded-lg border border-white/[0.06] text-center">
                    <Users className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">Participantes</p>
                    <p className="text-sm font-medium">{t.participants}/{t.maxParticipants}</p>
                  </div>
                  <div className="p-3 bg-background/30 rounded-lg border border-white/[0.06] text-center">
                    <Gift className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">Inscrição</p>
                    <p className="text-sm font-medium text-primary">{t.entryFee}</p>
                  </div>
                </div>

                {/* Prizes */}
                <div>
                  <p className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Medal className="w-4 h-4 text-[#D4AF37]" /> Premiação
                  </p>
                  <div className="grid sm:grid-cols-3 gap-2">
                    {t.prizes.map((p, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-lg border text-center ${
                          i === 0
                            ? "bg-[#D4AF37]/5 border-[#D4AF37]/20"
                            : "bg-background/30 border-white/[0.06]"
                        }`}
                      >
                        <p.icon
                          className={`w-5 h-5 mx-auto mb-1 ${
                            i === 0 ? "text-[#D4AF37]" : "text-muted-foreground"
                          }`}
                        />
                        <p className="font-bold text-sm">{p.position}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{p.prize}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rules */}
                <div>
                  <p className="text-sm font-medium mb-2">Regras</p>
                  <div className="space-y-1.5">
                    {t.rules.map((r, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Zap className="w-3 h-3 text-primary shrink-0" />
                        <span className="text-xs text-muted-foreground">{r}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA */}
                <Button
                  className="w-full"
                  disabled={t.status === "coming_soon" || t.status === "finished"}
                  onClick={() => handleJoin(t.id)}
                >
                  {t.status === "upcoming" ? (
                    <>
                      <Trophy className="w-4 h-4 mr-2" /> Inscrever-se
                    </>
                  ) : t.status === "coming_soon" ? (
                    "Em breve"
                  ) : (
                    "Encerrado"
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
