import { useTraderAuth } from "@/hooks/useTraderAuth";
import GiftRequestModal from "@/components/GiftRequestModal";
import { trpc } from "@/lib/trpc";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BarChart3,
  Bell,
  BookOpen,
  Calculator,
  ChevronLeft,
  ChevronRight,
  Crown,
  FileText,
  Gift,
  Receipt,
  LayoutDashboard,
  LogOut,
  Medal,
  Menu,
  MessageCircle,
  Moon,
  Settings,
  Share2,
  ShoppingBag,
  Star,
  Sun,
  TrendingUp,
  Trophy,
  Wallet,
  X,
  Loader2,
  Lock,
  Camera,
} from "lucide-react";
import { toast } from "sonner";
import { ReactNode, useState, useMemo, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { ClientNavContext, useClientNav, type SectionId } from "@/contexts/ClientNavContext";
import { useTheme } from "@/contexts/ThemeContext";

// ─── Import all section components ──────────────────────────────────────────
import Dashboard from "./Dashboard";
import Accounts from "./Accounts";
import Payouts from "./Payouts";
import Academy from "./Academy";
import InnerCircle from "./InnerCircle";
import Certificates from "./Certificates";
import Leaderboard from "./Leaderboard";
import Referrals from "./Referrals";
import Rules from "./Rules";
import Profile from "./Profile";
import Notifications from "./Notifications";
import Support from "./Support";
import PaymentHistory from "./PaymentHistory";
import PlanStore from "./PlanStore";
import ProfitCalculator from "./ProfitCalculator";
import Tournaments from "./Tournaments";
import AccountDetails from "./AccountDetails";
import AllowedAssets from "./AllowedAssets";
import NotificationBell from "@/components/NotificationBell";

// ─── Logo URLs ──────────────────────────────────────────────────────────────
const LOGO_HORIZONTAL_DARK = "/manus-storage/logo-insider-final_fb5a7227.png";
const LOGO_HORIZONTAL_LIGHT = "/manus-storage/logo-insider-light_0776d249.png";
const LOGO_ICON = "https://files.manuscdn.com/user_upload_by_module/session_file/310419663029079603/ABfDuZngBaOPdDEL.webp";

// ─── Navigation Structure ───────────────────────────────────────────────────
const NAV_GROUPS = [
  {
    label: "Principal",
    items: [
      { id: "dashboard" as SectionId, label: "Dashboard", icon: LayoutDashboard },
      { id: "accounts" as SectionId, label: "Minhas Contas", icon: BarChart3 },
      { id: "payouts" as SectionId, label: "Saques", icon: Wallet },
      { id: "payment-history" as SectionId, label: "Pagamentos", icon: Receipt },
    ],
  },
  {
    label: "Aprendizado",
    items: [
      { id: "academy" as SectionId, label: "Insider Academy", icon: BookOpen },
      { id: "certificates" as SectionId, label: "Certificados", icon: Medal },
    ],
  },
  {
    label: "Comunidade",
    items: [
      { id: "inner-circle" as SectionId, label: "Inner Circle", icon: Crown, gold: true },
      { id: "leaderboard" as SectionId, label: "Leaderboard", icon: Trophy },
      { id: "referrals" as SectionId, label: "Indicar Amigos", icon: Share2 },
    ],
  },
  {
    label: "Ferramentas",
    items: [
      { id: "plan-store" as SectionId, label: "Loja de Planos", icon: ShoppingBag },
      { id: "calculator" as SectionId, label: "Calculadora", icon: Calculator },
      { id: "allowed-assets" as SectionId, label: "Ativos Permitidos", icon: BarChart3 },
      { id: "tournaments" as SectionId, label: "Torneios", icon: Trophy, gold: true },
    ],
  },
  {
    label: "Mais",
    items: [
      { id: "rules" as SectionId, label: "Regras e Objetivos", icon: FileText },
      { id: "support" as SectionId, label: "Suporte", icon: MessageCircle },
    ],
  },
];

// ─── Account Details Wrapper — uses AccountDetails (with calendar tab) ──────
// IMPORTANT: Do NOT change to DashboardPage — AccountDetails has the calendar
function AccountDetailsWrapper() {
  const { selectedAccountId } = useClientNav();
  if (!selectedAccountId) return null;
  return <AccountDetails />;
}

// ─── Section Renderer ───────────────────────────────────────────────────────
function SectionContent({ sectionId }: { sectionId: SectionId }) {
  switch (sectionId) {
    case "dashboard":
      return <Dashboard />;
    case "accounts":
      return <Accounts />;
    case "payouts":
      return <Payouts />;
    case "academy":
      return <Academy />;
    case "inner-circle":
      return <InnerCircle />;
    case "certificates":
      return <Certificates />;
    case "leaderboard":
      return <Leaderboard />;
    case "referrals":
      return <Referrals />;
    case "rules":
      return <Rules />;
    case "profile":
      return <Profile />;
    case "notifications":
      return <Notifications />;
    case "support":
      return <Support />;
    case "payment-history":
      return <PaymentHistory />;
    case "plans":
      // Redirect to plan store in client area
      return <PlanStore />;
    case "plan-store":
      return <PlanStore />;
    case "calculator":
      return <ProfitCalculator />;
    case "tournaments":
      return <Tournaments />;
    case "allowed-assets":
      return <AllowedAssets />;
    case "account-details":
      return <AccountDetailsWrapper />;
    default:
      return <Dashboard />;
  }
}

// ─── Main Component ─────────────────────────────────────────────────────────
interface ClientAppProps {
  /** Se fornecido, abre diretamente os detalhes da conta com esse ID (rota /dashboard/:id) */
  initialAccountId?: number;
}
export default function ClientApp({ initialAccountId }: ClientAppProps = {}) {
  const { trader: user, loading, logout } = useTraderAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const LOGO_HORIZONTAL = resolvedTheme === 'dark' ? LOGO_HORIZONTAL_DARK : LOGO_HORIZONTAL_LIGHT;

  // Badge "Novidade" no toggle de tema
  // Regra: aparece em toda sessão/login até o cliente clicar no toggle.
  // A flag só é gravada no clique — nunca no carregamento da página.
  // Após clicar uma vez, não volta mais (localStorage persiste entre reloads e logins).
  const [showThemeNovidade, setShowThemeNovidade] = useState<boolean>(
    () => localStorage.getItem('theme_toggle_clicked') !== 'true'
  );

  const handleToggleTheme = () => {
    // Grava a flag APENAS no clique — nunca antes
    if (showThemeNovidade) {
      setShowThemeNovidade(false);
      localStorage.setItem('theme_toggle_clicked', 'true');
    }
    toggleTheme();
  };

  // Lê o query param ?section= para ativar a seção correta ao voltar de /dashboard/:id
  const initialSection = (): SectionId => {
    // Se initialAccountId foi passado (rota /dashboard/:id), abre account-details
    if (initialAccountId && initialAccountId > 0) return "account-details";
    if (typeof window === "undefined") return "dashboard";
    const params = new URLSearchParams(window.location.search);
    const s = params.get("section") as SectionId | null;
    const valid: SectionId[] = [
      "dashboard", "accounts", "payouts", "payment-history", "academy",
      "inner-circle", "certificates", "leaderboard", "referrals", "rules",
      "profile", "notifications", "support", "plans", "plan-store",
      "calculator", "tournaments", "allowed-assets",
    ];
    return s && valid.includes(s) ? s : "dashboard";
  };

  const [activeSection, setActiveSection] = useState<SectionId>(initialSection);
  // Se initialAccountId foi passado, usa ele como selectedAccountId inicial
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(
    initialAccountId && initialAccountId > 0 ? initialAccountId : null
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Sidebar collapsed by default only on small laptops (< 1280px); expanded on large screens
  const [collapsed, setCollapsed] = useState(() => typeof window !== 'undefined' && window.innerWidth < 1280);

  const { data: unreadData } = trpc.notifications.unreadCount.useQuery(undefined, {
    enabled: !!user,
    retry: false,
  });
  const unreadCount = unreadData ?? 0;

  // ─── Avatar ──────────────────────────────────────────────────────────────
  const utils = trpc.useUtils();
  const { data: profileData } = trpc.trader.profile.useQuery(undefined, {
    enabled: !!user,
    retry: false,
  });
  const avatarUrl = profileData?.avatarUrl ?? null;
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const uploadAvatarMutation = trpc.trader.uploadAvatar.useMutation({
    onSuccess: () => {
      utils.trader.profile.invalidate();
      toast.success("Foto de perfil atualizada!");
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao enviar foto.");
    },
    onSettled: () => setUploadingAvatar(false),
  });

  const handleAvatarFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input so same file can be re-selected
    e.target.value = "";
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      toast.error("Formato inválido. Use JPG, PNG ou WebP.");
      return;
    }
    if (file.size > 3_500_000) {
      toast.error("Imagem muito grande. Máximo: 3.5 MB.");
      return;
    }
    setUploadingAvatar(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      // Strip "data:image/...;base64," prefix
      const base64 = dataUrl.split(",")[1];
      await uploadAvatarMutation.mutateAsync({
        base64,
        mimeType: file.type as "image/jpeg" | "image/png" | "image/webp",
      });
    };
    reader.onerror = () => {
      toast.error("Erro ao ler o arquivo.");
      setUploadingAvatar(false);
    };
    reader.readAsDataURL(file);
  }, [uploadAvatarMutation]);

  const traderName = user?.name ?? "Trader";
  const traderEmail = user?.email ?? "";

  const [, wNavigate] = useLocation();
  const navigateTo = (section: SectionId) => {
    setActiveSection(section);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
    // Se estamos em /dashboard/:id, atualiza a URL para /cliente?section=X
    if (typeof window !== "undefined" && window.location.pathname.startsWith("/dashboard/")) {
      wNavigate(`/cliente?section=${section}`);
    }
  };

  const navigateToAccountDetails = (accountId: number) => {
    setSelectedAccountId(accountId);
    setActiveSection("account-details");
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md mx-auto px-4">
          <img
            src={LOGO_HORIZONTAL}
            alt="Insider Invest"
            className="h-10 object-contain mx-auto"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <div>
            <h1 className="text-2xl font-bold mb-2">Área do Trader</h1>
            <p className="text-muted-foreground">Faça login para acessar seu painel.</p>
          </div>
          <Button size="lg" className="w-full" onClick={() => (window.location.href = "/login")}>
            <Lock className="w-4 h-4 mr-2" />
            Entrar
          </Button>
          <Button variant="outline" size="lg" className="w-full" asChild>
            <a href="/">← Voltar para o site</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ClientNavContext.Provider value={{ activeSection, navigateTo, selectedAccountId, navigateToAccountDetails }}>
      <div className="min-h-screen bg-background text-foreground flex">
        {/* ── Sidebar ── */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-50 bg-sidebar border-r border-sidebar-border flex flex-col
            transition-all duration-300 ease-in-out
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
            lg:relative lg:translate-x-0
            ${collapsed ? "w-[68px]" : "w-72"}
          `}
        >
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border shrink-0">
            {!collapsed ? (
              <a href="/" className="flex items-center">
                <img
                  src={LOGO_HORIZONTAL}
                  alt="Insider Invest"
                  className="h-8 object-contain"
                />
              </a>
            ) : (
              <a href="/" className="mx-auto">
                <img
                  src={LOGO_ICON}
                  alt="Insider Invest"
                  className="w-9 h-9 object-contain"
                />
              </a>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex w-6 h-6 items-center justify-center rounded hover:bg-sidebar-accent transition-colors"
            >
              {collapsed ? (
                <ChevronRight className="w-3.5 h-3.5 text-sidebar-foreground/60" />
              ) : (
                <ChevronLeft className="w-3.5 h-3.5 text-sidebar-foreground/60" />
              )}
            </button>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 rounded hover:bg-sidebar-accent">
              <X className="w-5 h-5 text-sidebar-foreground/60" />
            </button>
          </div>

          {/* Trader Info */}
          {!collapsed && (
            <div className="p-4 border-b border-sidebar-border">
              <div className="flex items-center gap-3">
                {/* Avatar clicável para upload de foto */}
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="relative h-10 w-10 rounded-full shrink-0 group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  title="Clique para alterar foto de perfil"
                >
                  <Avatar className="h-10 w-10 border border-sidebar-border">
                    {avatarUrl && <AvatarImage src={avatarUrl} alt={traderName} className="object-cover" />}
                    <AvatarFallback className="bg-primary/20 text-primary font-bold text-sm">
                      {uploadingAvatar ? <Loader2 className="w-4 h-4 animate-spin" /> : traderName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {/* Overlay com ícone de câmera no hover */}
                  {!uploadingAvatar && (
                    <span className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-3.5 h-3.5 text-white" />
                    </span>
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate text-sidebar-foreground">{traderName}</p>
                  <p className="text-[11px] text-sidebar-foreground/50 truncate">{traderEmail}</p>
                </div>
              </div>
            </div>
          )}
          {/* Input oculto para seleção de arquivo de avatar */}
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleAvatarFileChange}
          />

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-3 px-2">
            {NAV_GROUPS.map((group) => (
              <div key={group.label} className="mb-5">
                {!collapsed && (
                  <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-sidebar-foreground/30 px-3 mb-2">
                    {group.label}
                  </p>
                )}
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeSection === item.id;
                    const isGold = (item as any).gold;
                    return (
                      <button
                        key={item.id}
                        onClick={() => navigateTo(item.id)}
                        className={`
                          w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer relative
                          ${isActive && isGold
                            ? "bg-[#D4AF37]/10 text-[#D4AF37]"
                            : isActive
                            ? "bg-primary/10 text-primary"
                            : isGold
                            ? "text-[#D4AF37]/60 hover:text-[#D4AF37] hover:bg-[#D4AF37]/5"
                            : "text-sidebar-foreground/55 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                          }
                          ${collapsed ? "justify-center px-2" : ""}
                        `}
                        title={collapsed ? item.label : undefined}
                      >
                        {/* Active pill indicator */}
                        {isActive && !collapsed && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r-full" />
                        )}
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                          isActive && isGold ? "bg-[#D4AF37]/15" :
                          isActive ? "bg-primary/15" :
                          isGold ? "bg-[#D4AF37]/5" :
                          "bg-transparent group-hover:bg-sidebar-accent"
                        }`}>
                          <Icon className={`w-4 h-4 ${
                            isActive && isGold ? "text-[#D4AF37]" :
                            isActive ? "text-primary" :
                            isGold ? "text-[#D4AF37]/60" :
                            "text-sidebar-foreground/55"
                          }`} />
                        </div>
                        {!collapsed && <span className="text-[13px]">{item.label}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-3 border-t border-sidebar-border">
            {collapsed ? (
              <button
                onClick={() => logout()}
                className="w-full flex items-center justify-center p-2 rounded-lg text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                title="Sair"
              >
                <LogOut className="w-4 h-4" />
              </button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-3 w-full px-2 py-2 rounded-lg hover:bg-sidebar-accent transition-colors text-left">
                    <Avatar className="h-8 w-8 border border-sidebar-border shrink-0">
                      {avatarUrl && <AvatarImage src={avatarUrl} alt={traderName} className="object-cover" />}
                      <AvatarFallback className="text-xs font-medium bg-primary/20 text-primary">
                        {traderName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate text-sidebar-foreground">{traderName}</p>
                      <p className="text-[10px] text-sidebar-foreground/50 truncate">{traderEmail}</p>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" side="top" className="w-48">
                  <DropdownMenuItem onClick={() => navigateTo("profile")} className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Meu Perfil
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigateTo("support")} className="cursor-pointer">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Suporte
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" asChild>
                    <a href="/">
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Site Institucional
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </aside>

        {/* Mobile overlay */}
        {sidebarOpen && <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

        {/* ── Main Content ── */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Bar */}
          <header className="h-16 border-b border-border/40 flex items-center justify-between px-4 lg:px-6 bg-background/98 backdrop-blur-sm sticky top-0 z-30 shrink-0">
            <div className="flex items-center gap-3">
              <button className="lg:hidden p-2 rounded-lg hover:bg-muted/50 transition-colors" onClick={() => setSidebarOpen(true)}>
                <Menu className="w-5 h-5" />
              </button>
              {/* Logo in top bar for mobile */}
              <img
                src={LOGO_HORIZONTAL}
                alt="Insider Invest"
                className="h-7 object-contain lg:hidden"
              />
              {/* Section breadcrumb on desktop */}
              <div className="hidden lg:flex items-center gap-2">
                {(() => {
                  const allItems = NAV_GROUPS.flatMap(g => g.items);
                  const current = allItems.find(item => item.id === activeSection);
                  if (!current) return null;
                  const Icon = current.icon;
                  const isGold = (current as any).gold;
                  return (
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        isGold ? 'bg-[#D4AF37]/10' : 'bg-primary/10'
                      }`}>
                        <Icon className={`w-3.5 h-3.5 ${
                          isGold ? 'text-[#D4AF37]' : 'text-primary'
                        }`} />
                      </div>
                      <span className="font-semibold text-sm text-foreground">{current.label}</span>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Theme Toggle */}
              <div className="relative flex items-center">
                {/* Badge "Novidade" — dourado com shimmer elegante + tooltip */}
                {showThemeNovidade && (
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span
                          className="novidade-badge absolute -top-2.5 -right-1 z-10 px-1.5 py-0.5 rounded-full text-[9px] font-bold leading-none tracking-wide uppercase cursor-default"
                          style={{ whiteSpace: 'nowrap', pointerEvents: 'auto' }}
                        >
                          Novidade
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-[200px] text-center text-xs">
                        Agora você pode alternar entre os temas <strong>claro</strong> e <strong>escuro</strong> — clique no ícone ao lado!
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                <button
                  onClick={handleToggleTheme}
                  title={resolvedTheme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
                  className={[
                    "relative p-2 rounded-lg transition-all text-muted-foreground hover:text-foreground",
                    showThemeNovidade
                      ? "novidade-ring ring-2 ring-[#D4AF37]/50 hover:bg-muted/50"
                      : "hover:bg-muted/50"
                  ].join(' ')}
                >
                  {resolvedTheme === 'dark' ? (
                    <Sun className="w-4 h-4" />
                  ) : (
                    <Moon className="w-4 h-4" />
                  )}
                </button>
              </div>
              {/* Notifications */}
              <NotificationBell />
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-auto flex flex-col">
            <div className="flex-1 px-6 py-6 lg:px-10 lg:py-8 w-full max-w-[1400px] mx-auto">
              <SectionContent sectionId={activeSection} />
            </div>
            {/* Footer */}
            <footer className="shrink-0 border-t border-white/[0.06] px-4 lg:px-6 py-5">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground/40">
                  © {new Date().getFullYear()} Insider Invest. Todos os direitos reservados.
                </p>
                <div className="flex items-center gap-4">
                  <a href="#" className="text-xs text-muted-foreground/40 hover:text-muted-foreground transition-colors">Termos de Uso</a>
                  <a href="#" className="text-xs text-muted-foreground/40 hover:text-muted-foreground transition-colors">Política de Privacidade</a>
                  <a href="#" className="text-xs text-muted-foreground/40 hover:text-muted-foreground transition-colors">Suporte</a>
                </div>
              </div>
            </footer>
          </main>
        </div>
      </div>
      {/* Modal de brinde elegível */}
      <GiftRequestModal />
    </ClientNavContext.Provider>
  );
}
