import { useState } from "react";
import { Trophy, Crown, RefreshCw, AlertCircle, User, Star } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { formatUSD } from "@/lib/format";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (val: number) => formatUSD(val);

function fmtPlanSize(val: number) {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(0)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}k`;
  return `$${val}`;
}

function fmtProfit(val: number) {
  const sign = val >= 0 ? "+" : "";
  return `${sign}${fmt(val)}`;
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

type TraderEntry = {
  rank: number;
  name: string;
  account: string | null;
  accountType: "demo" | "real";
  profit: number;
  balance: number | null;
  percent: number;
  valueAccount?: number;
  consistence?: number;
};

// ─── Medal badge ─────────────────────────────────────────────────────────────

function MedalBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 flex items-center justify-center shrink-0">
        <Crown className="w-5 h-5 text-[#D4AF37] fill-[#D4AF37]" />
      </div>
    );
  if (rank === 2)
    return (
      <div className="w-10 h-10 rounded-full bg-slate-400/20 flex items-center justify-center shrink-0">
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-slate-300">
          <path d="M5 3h14l-3 7H8L5 3zm7 8l-5 10h10L12 11z" />
        </svg>
      </div>
    );
  if (rank === 3)
    return (
      <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0">
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-orange-400">
          <path d="M5 3h14l-3 7H8L5 3zm7 8l-5 10h10L12 11z" />
        </svg>
      </div>
    );
  return (
    <div className="w-10 h-10 rounded-full bg-muted/20 flex items-center justify-center shrink-0">
      <span className="text-sm font-bold font-mono text-muted-foreground">{rank}</span>
    </div>
  );
}

// ─── Avatar ──────────────────────────────────────────────────────────────────

function Avatar({ name, rank, highlight = false }: { name: string; rank: number; highlight?: boolean }) {
  const colors = [
    "bg-primary/20 text-primary",
    "bg-slate-400/20 text-slate-300",
    "bg-orange-500/20 text-orange-400",
    "bg-muted/20 text-muted-foreground",
  ];
  const colorClass = highlight
    ? "bg-primary/30 text-primary ring-2 ring-primary/50"
    : rank <= 3
    ? colors[rank - 1]
    : colors[3];
  return (
    <div
      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${colorClass}`}
    >
      {initials(name) || <User className="w-4 h-4" />}
    </div>
  );
}

// ─── Row ─────────────────────────────────────────────────────────────────────

function TraderRow({ t, isMe = false }: { t: TraderEntry; isMe?: boolean }) {
  const rowBg = isMe
    ? "bg-primary/10 border-primary/40 ring-1 ring-primary/20"
    : t.rank === 1
    ? "bg-[#D4AF37]/5 border-[#D4AF37]/20"
    : t.rank === 2
    ? "bg-slate-400/5 border-slate-400/15"
    : t.rank === 3
    ? "bg-orange-500/5 border-orange-500/15"
    : "bg-card/30 border-white/[0.06]";

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${rowBg} transition-colors hover:bg-card/50`}>
      {/* Medal */}
      <MedalBadge rank={t.rank} />

      {/* Avatar */}
      <Avatar name={t.name} rank={t.rank} highlight={isMe} />

      {/* Name + saldo */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-sm truncate text-foreground">{t.name}</p>
          {isMe && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded-full shrink-0">
              Você
            </span>
          )}
        </div>
        {t.balance !== null && t.balance !== undefined && (
          <p className="text-xs text-muted-foreground mt-0.5">Saldo: {fmt(t.balance)}</p>
        )}
      </div>

      {/* Profit */}
      <div className="text-right shrink-0">
        <p
          className={`font-bold font-mono text-sm ${
            t.profit >= 0 ? "text-primary" : "text-destructive"
          }`}
        >
          {fmtProfit(t.profit)}
        </p>
        {t.percent !== 0 && (
          <p className="text-[10px] text-muted-foreground/60 mt-0.5">
            {t.percent >= 0 ? "+" : ""}{t.percent.toFixed(2)}%
          </p>
        )}
      </div>
    </div>
  );
}

// ─── My Position Card ─────────────────────────────────────────────────────────

function MyPositionCard({ entry, tab }: { entry: TraderEntry | null; tab: "demo" | "real" }) {
  if (!entry) {
    return (
      <div className="bg-card/30 border border-white/[0.06] rounded-2xl p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-muted/20 flex items-center justify-center shrink-0">
          <User className="w-6 h-6 text-muted-foreground/40" />
        </div>
        <div>
          <p className="font-semibold text-sm text-foreground">Sua posição no ranking</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {tab === "demo"
              ? "Você não está no ranking demo ainda. Comece a operar para aparecer aqui."
              : "Você não está no ranking real ainda. Traders aprovados com conta real aparecem aqui."}
          </p>
        </div>
      </div>
    );
  }

  const medalColor =
    entry.rank === 1
      ? "text-[#D4AF37] bg-[#D4AF37]/10 border-[#D4AF37]/30"
      : entry.rank === 2
      ? "text-slate-300 bg-slate-400/10 border-slate-400/20"
      : entry.rank === 3
      ? "text-orange-400 bg-orange-500/10 border-orange-500/20"
      : "text-primary bg-primary/10 border-primary/20";

  return (
    <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/30 rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Star className="w-4 h-4 text-primary fill-primary" />
        <p className="text-xs font-bold uppercase tracking-widest text-primary">Sua posição</p>
      </div>

      {/* Main content */}
      <div className="flex items-center gap-4">
        {/* Rank badge */}
        <div className={`w-14 h-14 rounded-2xl border flex flex-col items-center justify-center shrink-0 ${medalColor}`}>
          {entry.rank === 1 ? (
            <Crown className="w-6 h-6 fill-current" />
          ) : (
            <>
              <span className="text-xs font-bold opacity-60">#</span>
              <span className="text-xl font-black leading-none">{entry.rank}</span>
            </>
          )}
        </div>

        {/* Avatar + name */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-full bg-primary/20 ring-2 ring-primary/40 flex items-center justify-center shrink-0 text-sm font-bold text-primary">
            {initials(entry.name) || <User className="w-4 h-4" />}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm text-foreground truncate">{entry.name}</p>
            {entry.balance !== null && entry.balance !== undefined && (
              <p className="text-xs text-muted-foreground mt-0.5">Saldo: {fmt(entry.balance)}</p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="text-right shrink-0 space-y-1">
          <p className={`font-black font-mono text-lg ${entry.profit >= 0 ? "text-primary" : "text-destructive"}`}>
            {fmtProfit(entry.profit)}
          </p>
          {entry.percent !== 0 && (
            <p className="text-[10px] text-muted-foreground/60">
              {entry.percent >= 0 ? "+" : ""}{entry.percent.toFixed(2)}%
            </p>
          )}
        </div>
      </div>

      {/* Bottom hint */}
      <p className="text-[10px] text-muted-foreground/40 mt-4">
        {entry.rank === 1
          ? "🏆 Você está no topo! Continue assim."
          : `Você está em ${entry.rank}º lugar no ranking ${tab === "demo" ? "demo" : "real"}.`}
      </p>
    </div>
  );
}

// ─── Plan Size Selector ───────────────────────────────────────────────────────

function PlanSizeSelector({
  planSizes,
  selected,
  onSelect,
}: {
  planSizes: number[];
  selected: number | null;
  onSelect: (size: number) => void;
}) {
  if (planSizes.length <= 1) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {planSizes.map((size) => {
        const isActive = selected === size || (selected === null && size === planSizes[0]);
        return (
          <button
            key={size}
            onClick={() => onSelect(size)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all ${
              isActive
                ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20"
                : "bg-card/40 text-muted-foreground border-white/[0.06] hover:border-primary/40 hover:text-foreground"
            }`}
          >
            {fmtPlanSize(size)}
          </button>
        );
      })}
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function Leaderboard() {
  const [tab, setTab] = useState<"demo" | "real">("real");
  const [selectedPlanSize, setSelectedPlanSize] = useState<number | null>(null);

  const { data, isLoading, error, refetch, isFetching } =
    trpc.trader.leaderboard.useQuery(
      {
        limit: 20,
        accountType: tab,
        planSize: tab === "demo" ? selectedPlanSize : undefined,
      },
      { staleTime: 5 * 60 * 1000 }
    );

  // Get the logged-in trader's profile to find their name
  const { data: myProfile } = trpc.trader.me.useQuery(undefined, {
    retry: false,
    staleTime: 10 * 60 * 1000,
  });

  // Normalize response — new API returns { type, entries, planSizes }
  // but handle legacy array response for safety
  const entries: TraderEntry[] = Array.isArray(data)
    ? (data as any[]).slice(0, 20)
    : ((data as any)?.entries ?? []).slice(0, 20);

  const planSizes: number[] = Array.isArray(data)
    ? []
    : ((data as any)?.planSizes ?? []);

  // Find the logged-in trader's entry
  const myName = (myProfile as any)?.name?.trim().toLowerCase() ?? "";
  const myEntry: TraderEntry | null =
    myName && entries.length > 0
      ? entries.find((t: TraderEntry) => t.name.trim().toLowerCase() === myName) ?? null
      : null;

  const topProfit = entries[0]?.profit ?? 0;
  const totalCount = entries.length;

  // When tab changes, reset plan size selection
  const handleTabChange = (newTab: "demo" | "real") => {
    setTab(newTab);
    setSelectedPlanSize(null);
  };

  // Effective plan size label for display
  const effectivePlanSize = selectedPlanSize ?? planSizes[0] ?? null;

  return (
    <div className="app-section max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground/40 mb-1">
            Ranking
          </p>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="w-6 h-6 text-[#D4AF37]" />
            Leaderboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {tab === "demo" && effectivePlanSize
              ? `Ranking demo — plano ${fmtPlanSize(effectivePlanSize)}`
              : "Ranking geral — os melhores traders da Insider"}
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="w-9 h-9 rounded-xl bg-card/50 border border-white/[0.06] flex items-center justify-center hover:bg-card/80 transition-colors disabled:opacity-50"
          title="Atualizar ranking"
        >
          <RefreshCw className={`w-4 h-4 text-muted-foreground ${isFetching ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-card/40 border border-white/[0.06] rounded-xl w-fit">
        {(["demo", "real"] as const).map((t) => (
          <button
            key={t}
            onClick={() => handleTabChange(t)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === t
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "demo" ? "🏋️ Demo" : "🏆 Real"}
          </button>
        ))}
      </div>

      {/* Plan Size Selector — only on demo tab */}
      {tab === "demo" && !isLoading && planSizes.length > 1 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Tamanho do plano
          </p>
          <PlanSizeSelector
            planSizes={planSizes}
            selected={selectedPlanSize}
            onSelect={(size) => setSelectedPlanSize(size)}
          />
        </div>
      )}

      {/* My Position Card — always shown */}
      {!isLoading && (
        <MyPositionCard entry={myEntry} tab={tab} />
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 app-grid">
        <div className="bg-card/40 border border-white/[0.06] rounded-xl app-card-sm text-center">
          <p className="text-xl font-bold font-mono text-primary">
            {isLoading ? "—" : totalCount}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Traders no ranking</p>
        </div>
        <div className="bg-card/40 border border-white/[0.06] rounded-xl app-card-sm text-center">
          <p className="text-xl font-bold font-mono text-emerald-400">
            {isLoading ? "—" : fmtProfit(topProfit)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Maior lucro</p>
        </div>
      </div>

      {/* Demo motivational banner — shown only on demo tab for top 5 traders */}
      {tab === "demo" && !isLoading && entries.length > 0 && myEntry && myEntry.rank <= 5 && (
        <div className="relative overflow-hidden bg-gradient-to-r from-[#D4AF37]/15 via-primary/10 to-[#D4AF37]/5 border border-[#D4AF37]/40 rounded-2xl p-5">
          {/* Glow */}
          <div className="absolute -top-6 -right-6 w-32 h-32 bg-[#D4AF37]/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center shrink-0">
              <span className="text-2xl">🔥</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-[#D4AF37] uppercase tracking-wider mb-1">
                {myEntry.rank === 1 ? "Você está em 1º lugar!" : `Você está em ${myEntry.rank}º lugar!`}
              </p>
              <p className="text-sm text-foreground/90 leading-relaxed">
                {myEntry.rank === 1
                  ? "Você lidera o ranking demo. Traders no topo têm prioridade na aprovação. Continue assim e sua conta real pode ser liberada em breve."
                  : myEntry.rank <= 3
                  ? "Você está no pódio do ranking demo. Traders consistentes no top 3 são os primeiros a serem aprovados para conta real. Mantenha a performance!"
                  : "Você está entre os top 5 do ranking demo. Falta pouco para o pódio — e para a aprovação na conta real."}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/30 px-3 py-1.5 rounded-full">
                  <span>⚡</span> Lucro atual: {fmtProfit(myEntry.profit)}
                </span>
                <span className="text-xs text-muted-foreground/60">Conta real = capital da Insider, lucro seu</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Demo general motivational banner — for traders NOT in top 5 on demo tab */}
      {tab === "demo" && !isLoading && entries.length > 0 && !myEntry && (
        <div className="bg-card/30 border border-primary/20 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-xl">🎯</div>
          <div>
            <p className="text-sm font-semibold text-foreground">Suba no ranking e seja aprovado</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Os traders mais consistentes no ranking demo são aprovados para conta real. Opere com disciplina e apareça aqui.
            </p>
          </div>
        </div>
      )}

      {/* Subtitle */}
      {!isLoading && entries.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Exibindo o{" "}
          <span className="font-bold text-foreground">Top {entries.length}</span> traders com
          melhor desempenho
          {tab === "demo" && effectivePlanSize ? ` no plano ${fmtPlanSize(effectivePlanSize)}` : ""}
        </p>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-16 rounded-xl bg-card/30 border border-white/[0.06] animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Error */}
      {error && !isLoading && (
        <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-5 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
          <div>
            <p className="text-sm font-semibold text-destructive">Erro ao carregar ranking</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Não foi possível buscar os dados da Mesa Prime. Tente novamente.
            </p>
          </div>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !error && entries.length === 0 && (
        <div className="bg-card/30 border border-white/[0.06] rounded-xl p-8 text-center">
          <Trophy className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            Nenhum trader no ranking {tab === "demo" ? "demo" : "real"} ainda.
          </p>
        </div>
      )}

      {/* Ranking list */}
      {!isLoading && entries.length > 0 && (
        <div className="space-y-2 rounded-2xl border border-white/[0.06] bg-card/10 p-4">
          {entries.map((t: TraderEntry) => (
            <TraderRow
              key={`${t.account}-${t.rank}`}
              t={t}
              isMe={myEntry !== null && t.name.trim().toLowerCase() === myName}
            />
          ))}
        </div>
      )}

      {/* Footer */}
      {!isLoading && entries.length > 0 && (
        <p className="text-center text-xs text-muted-foreground/40 pb-4">
          Dados atualizados a cada 10 minutos · Fonte: Mesa Prime
        </p>
      )}
    </div>
  );
}
