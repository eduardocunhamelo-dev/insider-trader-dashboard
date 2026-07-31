import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen,
  CheckCircle2,
  Lock,
  Play,
  Clock,
  GraduationCap,
  ChevronRight,
  Star,
  Flame,
  Sparkles,
  Crown,
  Construction,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// ─── PREVIEW MODE ────────────────────────────────────────────────────────────
// Sample data for product demo. Will be replaced with real course modules
// fetched via tRPC when the academy CMS ships.
// See ProductRoadmap.md for launch criteria.

const MODULES = [
  {
    id: 1,
    title: "Trilha de Aprovação",
    description: "Como passar na avaliação da mesa: regras, metas, drawdown e estratégia de aprovação.",
    lessons: 8,
    completed: 8,
    duration: "2h 45min",
    locked: false,
    tier: "trial",
    lessons_list: [
      { title: "Bem-vindo à Insider Invest", duration: "12min", completed: true },
      { title: "Regras da Avaliação", duration: "18min", completed: true },
      { title: "Entendendo o Drawdown", duration: "22min", completed: true },
      { title: "Meta de Lucro: Estratégia", duration: "25min", completed: true },
      { title: "Gestão de Risco Básica", duration: "20min", completed: true },
      { title: "Configurando o MT5", duration: "15min", completed: true },
      { title: "Primeiro Trade Seguro", duration: "18min", completed: true },
      { title: "Checklist de Aprovação", duration: "15min", completed: true },
    ],
  },
  {
    id: 2,
    title: "Psicologia do Trader",
    description: "Controle emocional, disciplina e mindset para operar com consistência.",
    lessons: 6,
    completed: 6,
    duration: "2h 10min",
    locked: false,
    tier: "trial",
    lessons_list: [
      { title: "O Jogo Mental do Trading", duration: "20min", completed: true },
      { title: "Lidando com Perdas", duration: "22min", completed: true },
      { title: "Disciplina Operacional", duration: "18min", completed: true },
      { title: "Viés de Confirmação", duration: "20min", completed: true },
      { title: "Rotina do Trader Consistente", duration: "25min", completed: true },
      { title: "Journaling de Operações", duration: "15min", completed: true },
    ],
  },
  {
    id: 3,
    title: "Estratégias do Eduardo",
    description: "Setups operacionais, entradas, saídas e gestão de trade do fundador.",
    lessons: 10,
    completed: 4,
    duration: "4h 30min",
    locked: false,
    tier: "fast",
    lessons_list: [
      { title: "Leitura de Contexto", duration: "28min", completed: true },
      { title: "Setup 1: Rompimento", duration: "32min", completed: true },
      { title: "Setup 2: Pullback", duration: "30min", completed: true },
      { title: "Setup 3: Reversão", duration: "25min", completed: true },
      { title: "Regiões de Valor", duration: "28min", completed: false },
      { title: "Fibonacci Aplicado", duration: "22min", completed: false },
      { title: "Gestão de Trade Ativo", duration: "20min", completed: false },
      { title: "Multi-Timeframe", duration: "25min", completed: false },
      { title: "Operando Notícias", duration: "18min", completed: false },
      { title: "Combinando Setups", duration: "22min", completed: false },
    ],
  },
  {
    id: 4,
    title: "Domínio do MetaTrader 5",
    description: "Configurações avançadas, indicadores e automações no MT5.",
    lessons: 5,
    completed: 2,
    duration: "1h 45min",
    locked: false,
    tier: "fast",
    lessons_list: [
      { title: "Interface e Personalização", duration: "20min", completed: true },
      { title: "Indicadores Essenciais", duration: "22min", completed: true },
      { title: "Templates e Perfis", duration: "18min", completed: false },
      { title: "Alertas e Automações", duration: "25min", completed: false },
      { title: "Backtesting no MT5", duration: "20min", completed: false },
    ],
  },
  {
    id: 5,
    title: "Pós-Aprovação: Escale seu Capital",
    description: "Como operar a conta real, gestão de risco avançada e escalar capital.",
    lessons: 7,
    completed: 0,
    duration: "3h 15min",
    locked: false,
    tier: "pro",
    lessons_list: [],
  },
  {
    id: 6,
    title: "Leitura de Mercado ao Vivo",
    description: "Sessões gravadas de análise ao vivo com Eduardo e equipe.",
    lessons: 8,
    completed: 0,
    duration: "6h",
    locked: true,
    tier: "inner_circle",
    lessons_list: [],
  },
  {
    id: 7,
    title: "Tributação para Traders",
    description: "Como declarar IR, aspectos fiscais e planejamento tributário.",
    lessons: 4,
    completed: 0,
    duration: "1h 30min",
    locked: true,
    tier: "inner_circle",
    lessons_list: [],
  },
];

function tierBadge(tier: string) {
  if (tier === "trial") return { label: "Trial", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" };
  if (tier === "fast") return { label: "FAST/PRO", color: "bg-primary/20 text-primary border-primary/30" };
  if (tier === "pro") return { label: "PRO", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" };
  return { label: "Inner Circle", color: "bg-[#D4AF37]/15 text-[#D4AF37] border-[#D4AF37]/30" };
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function Academy() {
  const [expandedModule, setExpandedModule] = useState<number | null>(null);

  const totalLessons = MODULES.filter(m => !m.locked).reduce((a, m) => a + m.lessons, 0);
  const completedLessons = MODULES.filter(m => !m.locked).reduce((a, m) => a + m.completed, 0);
  const overallProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  // Find next lesson
  const currentModule = MODULES.find(m => !m.locked && m.completed < m.lessons);
  const currentLesson = currentModule?.lessons_list.find(l => !l.completed);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Preview banner — make it clear that data is illustrative */}
      <div className="rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/5 p-4 flex items-start gap-3">
        <Construction className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-[#D4AF37]">
            Funcionalidade em desenvolvimento
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            A Insider Academy está sendo construída. Os módulos e aulas
            exibidos são exemplos do conteúdo que você terá acesso quando
            a plataforma for lançada.
          </p>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-primary" />
            Insider Academy
            <Badge variant="outline" className="text-[10px] border-[#D4AF37]/40 text-[#D4AF37] ml-2">
              Preview
            </Badge>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Sua trilha de aprendizado exclusiva</p>
        </div>
      </div>

      {/* Overall Progress */}
      <Card className="bg-card/50 border-white/[0.06]">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-primary" />
              <p className="text-sm font-medium">Progresso Geral</p>
            </div>
            <span className="text-primary font-bold font-mono">
              {completedLessons}/{totalLessons} aulas
            </span>
          </div>
          <Progress value={overallProgress} className="h-2.5 mb-3" />
          
          {currentModule && currentLesson && (
            <div className="flex items-center justify-between p-3 bg-primary/5 border border-white/[0.06] rounded-lg mt-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Play className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Continue de onde parou</p>
                  <p className="text-sm font-medium">{currentLesson.title}</p>
                </div>
              </div>
              <Button size="sm" className="shrink-0" onClick={() => toast.info("Conteúdo em produção. As aulas serão liberadas em breve.")}>
                <Play className="w-3 h-3 mr-1.5" /> Assistir
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modules */}
      <div className="space-y-3">
        {MODULES.map((mod) => {
          const pct = mod.lessons > 0 ? Math.round((mod.completed / mod.lessons) * 100) : 0;
          const isExpanded = expandedModule === mod.id;
          const badge = tierBadge(mod.tier);

          // ─── LOCKED MODULE — GOLD PREMIUM ─────────────────────
          if (mod.locked) {
            return (
              <Card
                key={mod.id}
                className="overflow-hidden transition-all gold-shimmer border-[#D4AF37]/20 bg-gradient-to-r from-[#D4AF37]/5 via-card/40 to-[#8B6914]/3"
              >
                <div className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br from-[#D4AF37]/15 to-[#B8860B]/10 border border-[#D4AF37]/20">
                      <Crown className="w-5 h-5 text-[#D4AF37]/70" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-sm text-[#D4AF37]/80 truncate">{mod.title}</p>
                        <Badge className={`text-[10px] px-1.5 py-0 h-4 ${badge.color}`}>
                          <Star className="w-2.5 h-2.5 mr-0.5 fill-current" />
                          {badge.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-[#D4AF37]/40 line-clamp-1">{mod.description}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1 text-xs text-[#D4AF37]/40">
                          <BookOpen className="w-3 h-3" /> {mod.lessons} aulas
                        </div>
                        <div className="flex items-center gap-1 text-xs text-[#D4AF37]/40">
                          <Clock className="w-3 h-3" /> {mod.duration}
                        </div>
                      </div>
                    </div>

                    <Badge variant="outline" className="text-xs shrink-0 border-[#D4AF37]/30 text-[#D4AF37] bg-[#D4AF37]/10">
                      <Sparkles className="w-3 h-3 mr-1" /> Exclusivo
                    </Badge>
                  </div>
                </div>
              </Card>
            );
          }

          // ─── UNLOCKED MODULE ─────────────────────────────────
          return (
            <Card
              key={mod.id}
              className={`overflow-hidden transition-all ${
                isExpanded
                  ? "border-primary/30 bg-card/60"
                  : "border-white/[0.06] bg-card/30 hover:border-white/[0.1]"
              }`}
            >
              <div
                className="p-4 cursor-pointer"
                onClick={() => setExpandedModule(isExpanded ? null : mod.id)}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    pct === 100 ? "bg-primary/20" : "bg-card border border-white/[0.06]"
                  }`}>
                    {pct === 100 ? (
                      <CheckCircle2 className="w-6 h-6 text-primary" />
                    ) : (
                      <BookOpen className="w-5 h-5 text-primary" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-sm truncate">{mod.title}</p>
                      <Badge className={`text-[10px] px-1.5 py-0 h-4 ${badge.color}`}>{badge.label}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">{mod.description}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <BookOpen className="w-3 h-3" /> {mod.completed}/{mod.lessons}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" /> {mod.duration}
                      </div>
                      <div className="flex-1 max-w-[120px]">
                        <Progress value={pct} className="h-1" />
                      </div>
                    </div>
                  </div>

                  <ChevronRight className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                </div>
              </div>

              {/* Expanded Lessons */}
              {isExpanded && mod.lessons_list.length > 0 && (
                <div className="border-t border-white/[0.06] px-4 pb-4">
                  <div className="space-y-1 pt-3">
                    {mod.lessons_list.map((lesson, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                          lesson.completed
                            ? "bg-primary/5"
                            : "hover:bg-muted/20 cursor-pointer"
                        }`}
                        onClick={() => !lesson.completed && toast.info("Conteúdo em produção. As aulas serão liberadas em breve.")}
                      >
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                          lesson.completed ? "bg-primary/20" : "bg-muted/20"
                        }`}>
                          {lesson.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-primary" />
                          ) : (
                            <Play className="w-3 h-3 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${lesson.completed ? "text-muted-foreground" : "font-medium"}`}>
                            {lesson.title}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">{lesson.duration}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
