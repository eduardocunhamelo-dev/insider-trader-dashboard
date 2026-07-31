import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { BarChart3, Search, Clock, TrendingUp, Zap } from "lucide-react";
import { formatUSD } from "@/lib/format";
import { Input } from "@/components/ui/input";

type Category = "FAST" | "PRO";

// Asset type categories for color coding
function getAssetType(asset: string): "forex" | "index" | "commodity" | "br" {
  const a = asset.toUpperCase();
  if (a.includes("BRA") || a.includes("MINDOL") || a.includes("WIN") || a.includes("WDO")) return "br";
  if (a.includes("GOLD") || a.includes("CRUDE") || a.includes("OIL") || a.includes("SILVER")) return "commodity";
  if (a.includes("IND") || a.includes("GER") || a.includes("USA") || a.includes("UK") || a.includes("HK") || a.includes("SP") || a.includes("NAS") || a.includes("DOW") || a.includes("TEC")) return "index";
  return "forex";
}

const ASSET_TYPE_STYLES = {
  forex:     { dot: "bg-blue-400",    badge: "text-blue-300/80 bg-blue-400/10 border-blue-400/20",    label: "Forex" },
  index:     { dot: "bg-purple-400",  badge: "text-purple-300/80 bg-purple-400/10 border-purple-400/20", label: "Índice" },
  commodity: { dot: "bg-yellow-400",  badge: "text-yellow-300/80 bg-yellow-400/10 border-yellow-400/20", label: "Commodity" },
  br:        { dot: "bg-[#00ff85]",   badge: "text-[#00ff85]/80 bg-[#00ff85]/10 border-[#00ff85]/20",  label: "Brasil" },
};

export default function AllowedAssets() {
  const [category, setCategory] = useState<Category>("FAST");
  const [activePlanId, setActivePlanId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const { data: plans, isLoading: plansLoading } = trpc.trader.allowedAssetPlans.useQuery(undefined, {
    staleTime: 10 * 60 * 1000,
  });

  const categoryPlans = useMemo(() => {
    if (!plans) return [];
    return category === "FAST" ? plans.fast : plans.pro;
  }, [plans, category]);

  useEffect(() => {
    if (categoryPlans.length > 0) {
      setActivePlanId(categoryPlans[0].id);
    } else {
      setActivePlanId(null);
    }
  }, [categoryPlans]);

  const { data: assets, isLoading: assetsLoading } = trpc.trader.allowedAssets.useQuery(
    { planId: activePlanId! },
    { enabled: activePlanId !== null, staleTime: 10 * 60 * 1000 }
  );

  const filtered = useMemo(() => {
    if (!assets) return [];
    if (!search.trim()) return assets;
    const q = search.toLowerCase();
    return (assets as any[]).filter(
      (a) => a.asset.toLowerCase().includes(q) || (a.description ?? "").toLowerCase().includes(q)
    );
  }, [assets, search]);

  const isTableLoading = plansLoading || assetsLoading || activePlanId === null;

  // Stats
  const stats = useMemo(() => {
    if (!assets || (assets as any[]).length === 0) return null;
    const arr = assets as any[];
    const types = new Set(arr.map((a) => getAssetType(a.asset)));
    return { total: arr.length, types: types.size };
  }, [assets]);

  const activePlan = categoryPlans.find((p) => p.id === activePlanId);

  return (
    <div className="max-w-[1800px] mx-auto app-section pb-8">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#00ff85]/10 border border-[#00ff85]/20 flex items-center justify-center shrink-0">
            <BarChart3 className="w-5 h-5 text-[#00ff85]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white leading-tight">Ativos Permitidos</h1>
            <p className="text-xs text-white/40 mt-0.5">Instrumentos disponíveis por plano e categoria</p>
          </div>
        </div>

        {/* Live stats pill */}
        {stats && !isTableLoading && (
          <div className="hidden sm:flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.07]">
              <TrendingUp className="w-3.5 h-3.5 text-[#00ff85]" />
              <span className="text-xs text-white/60">{stats.total} ativos</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.07]">
              <Zap className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-xs text-white/60">{stats.types} categorias</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Category + Plan selector ── */}
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">

        {/* Category tabs */}
        <div className="flex border-b border-white/[0.07]">
          {(["FAST", "PRO"] as Category[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold transition-all relative ${
                category === cat
                  ? "text-[#00ff85]"
                  : "text-white/35 hover:text-white/60"
              }`}
            >
              {category === cat && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#00ff85] rounded-t-full" />
              )}
              <span className={`w-2 h-2 rounded-full ${cat === "FAST" ? "bg-[#00ff85]" : "bg-purple-400"} ${category === cat ? "opacity-100" : "opacity-30"}`} />
              {cat}
              {cat === "FAST" && <span className="text-[10px] text-white/30 font-normal">Avaliação</span>}
              {cat === "PRO" && <span className="text-[10px] text-white/30 font-normal">Financiado</span>}
            </button>
          ))}
        </div>

        {/* Plan size pills */}
        <div className="px-4 py-3 flex flex-wrap items-center gap-2">
          <span className="text-[10px] text-white/30 uppercase tracking-widest mr-1 shrink-0">Tamanho</span>
          {plansLoading ? (
            [1, 2, 3, 4].map((i) => (
              <div key={i} className="h-8 w-28 rounded-lg bg-white/[0.04] animate-pulse" />
            ))
          ) : categoryPlans.length > 0 ? (
            categoryPlans.map((plan) => (
              <button
                key={plan.id}
                onClick={() => setActivePlanId(plan.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                  activePlanId === plan.id
                    ? "bg-[#00ff85]/10 text-[#00ff85] border-[#00ff85]/40 shadow-[0_0_12px_rgba(0,255,133,0.08)]"
                    : "text-white/40 border-white/[0.08] hover:border-white/20 hover:text-white/70"
                }`}
              >
                {formatUSD(plan.valueAccount, 0)}
              </button>
            ))
          ) : (
            <span className="text-xs text-white/30">Nenhum plano disponível.</span>
          )}
        </div>

        {/* Search bar */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Buscar ativo em ${category} ${activePlan ? formatUSD(activePlan.valueAccount, 0) : ""}...`}
              className="pl-8 h-9 text-sm bg-white/[0.03] border-white/[0.07] text-white placeholder:text-white/25 focus:border-[#00ff85]/25 rounded-xl"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">

        {/* Table header */}
        <div className="grid grid-cols-[2fr_2.5fr_auto_auto_auto_2.5fr] gap-x-4 px-5 py-2.5 border-b border-white/[0.06] bg-white/[0.015]">
          <span className="text-[10px] text-white/35 uppercase tracking-widest">Ativo</span>
          <span className="text-[10px] text-white/35 uppercase tracking-widest">Descrição</span>
          <span className="text-[10px] text-white/35 uppercase tracking-widest text-right w-20">Contratos</span>
          <span className="text-[10px] text-white/35 uppercase tracking-widest text-center w-16">Abertura</span>
          <span className="text-[10px] text-white/35 uppercase tracking-widest text-center w-16">Fechamento</span>
          <span className="text-[10px] text-white/35 uppercase tracking-widest">Dias</span>
        </div>

        {/* Loading skeleton */}
        {isTableLoading && (
          <div className="divide-y divide-white/[0.04]">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="grid grid-cols-[2fr_2.5fr_auto_auto_auto_2.5fr] gap-x-4 px-5 py-3.5 items-center">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-white/[0.08] animate-pulse" />
                  <div className="h-3.5 w-20 bg-white/[0.07] rounded animate-pulse" />
                </div>
                <div className="h-3.5 w-36 bg-white/[0.04] rounded animate-pulse" />
                <div className="h-3.5 w-12 bg-white/[0.04] rounded animate-pulse w-20" />
                <div className="h-3.5 w-12 bg-white/[0.04] rounded animate-pulse w-16 mx-auto" />
                <div className="h-3.5 w-12 bg-white/[0.04] rounded animate-pulse w-16 mx-auto" />
                <div className="h-3.5 w-28 bg-white/[0.04] rounded animate-pulse" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isTableLoading && filtered.length === 0 && (
          <div className="py-16 text-center space-y-2">
            <BarChart3 className="w-8 h-8 text-white/15 mx-auto" />
            <p className="text-sm text-white/30">
              {search ? `Nenhum ativo encontrado para "${search}"` : "Nenhum ativo disponível para este plano."}
            </p>
            {search && (
              <button onClick={() => setSearch("")} className="text-xs text-[#00ff85]/60 hover:text-[#00ff85] transition-colors">
                Limpar busca
              </button>
            )}
          </div>
        )}

        {/* Rows */}
        {!isTableLoading && filtered.length > 0 && (
          <div className="divide-y divide-white/[0.04]">
            {(filtered as any[]).map((asset, idx) => {
              const type = getAssetType(asset.asset);
              const style = ASSET_TYPE_STYLES[type];
              const contracts = parseFloat(asset.contracts);
              return (
                <div
                  key={asset.id}
                  className="grid grid-cols-[2fr_2.5fr_auto_auto_auto_2.5fr] gap-x-4 px-5 py-3.5 items-center hover:bg-white/[0.025] transition-colors group"
                >
                  {/* Asset name + type dot */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />
                    <span className="text-sm font-bold text-white font-mono tracking-tight truncate">{asset.asset}</span>
                    <span className={`hidden lg:inline-flex text-[10px] px-1.5 py-0.5 rounded border font-medium shrink-0 ${style.badge}`}>
                      {style.label}
                    </span>
                  </div>

                  {/* Description */}
                  <span className="text-sm text-white/45 truncate pr-2">
                    {asset.description ?? <span className="text-white/20">—</span>}
                  </span>

                  {/* Contracts — highlighted */}
                  <div className="w-20 flex justify-end">
                    <span className={`text-sm font-bold font-mono tabular-nums ${
                      contracts >= 50 ? "text-[#00ff85]" : contracts >= 10 ? "text-emerald-400/80" : "text-white/70"
                    }`}>
                      {contracts % 1 === 0 ? contracts.toFixed(0) : contracts.toFixed(2)}
                    </span>
                  </div>

                  {/* Opening */}
                  <div className="w-16 flex items-center justify-center gap-1">
                    <Clock className="w-3 h-3 text-[#00ff85]/40 shrink-0" />
                    <span className="text-xs text-white/55 font-mono tabular-nums">
                      {asset.hourOpening ? asset.hourOpening.slice(0, 5) : "—"}
                    </span>
                  </div>

                  {/* Closing */}
                  <div className="w-16 flex items-center justify-center gap-1">
                    <Clock className="w-3 h-3 text-red-400/40 shrink-0" />
                    <span className="text-xs text-white/55 font-mono tabular-nums">
                      {asset.hourClosed ? asset.hourClosed.slice(0, 5) : "—"}
                    </span>
                  </div>

                  {/* Days */}
                  <span className="text-xs text-white/40 leading-relaxed">
                    {asset.note ?? <span className="text-white/20">—</span>}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      {!isTableLoading && (assets as any[])?.length > 0 && (
        <div className="flex items-center justify-between px-1">
          {/* Type legend */}
          <div className="flex items-center gap-3 flex-wrap">
            {Object.entries(ASSET_TYPE_STYLES).map(([key, s]) => (
              <div key={key} className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                <span className="text-[10px] text-white/30">{s.label}</span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-white/25">
            {search && filtered.length !== (assets as any[]).length
              ? `${filtered.length} de ${(assets as any[]).length} ativos`
              : `${(assets as any[]).length} ativos`}
          </p>
        </div>
      )}
    </div>
  );
}
