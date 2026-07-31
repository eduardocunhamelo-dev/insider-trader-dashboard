import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import GiftRequestModal from "@/components/GiftRequestModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import {
  BarChart3,
  Bell,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Download,
  GraduationCap,
  LayoutDashboard,
  Lock,
  LogOut,
  MessageCircle,
  Medal,
  Menu,
  Settings,
  Share2,
  Star,
  TrendingUp,
  Trophy,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";

// ─── Navigation Items ────────────────────────────────────────────────────────

const NAV_SECTIONS = [
  {
    label: "Principal",
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/app" },
      { id: "accounts", label: "Minhas Contas", icon: BarChart3, path: "/app/accounts" },
      { id: "payout", label: "Saques", icon: Wallet, path: "/app/payouts" },
    ],
  },
  {
    label: "Aprendizado",
    items: [
      { id: "academy", label: "Insider Academy", icon: GraduationCap, path: "/app/academy" },
      { id: "certificates", label: "Certificados", icon: Medal, path: "/app/certificates" },
    ],
  },
  {
    label: "Comunidade",
    items: [
      { id: "inner-circle", label: "Inner Circle", icon: Star, path: "/app/inner-circle" },
      { id: "leaderboard", label: "Leaderboard", icon: Trophy, path: "/app/leaderboard" },
      { id: "referral", label: "Indicar Amigos", icon: Share2, path: "/app/referrals" },
    ],
  },
  {
    label: "Mais",
    items: [
      { id: "rules", label: "Regras e Objetivos", icon: BookOpen, path: "/app/rules" },
      { id: "support", label: "Suporte", icon: MessageCircle, path: "/app/support" },
    ],
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function planLabel(plan: string) {
  if (plan === "trial") return "Trial";
  if (plan === "fast") return "FAST";
  if (plan === "pro") return "PRO";
  return plan.toUpperCase();
}

function planColor(plan: string) {
  if (plan === "trial") return "bg-blue-500/20 text-blue-400 border-blue-500/30";
  if (plan === "fast") return "bg-primary/20 text-primary border-primary/30";
  if (plan === "pro") return "bg-[#C5A028]/20 text-[#D4AF37] border-[#C5A028]/30";
  return "bg-muted text-muted-foreground";
}

function tierLabel(tier: string) {
  if (tier === "prime") return "Prime";
  if (tier === "pro") return "Pro";
  if (tier === "institutional") return "Institucional";
  return "";
}

function tierColor(tier: string) {
  if (tier === "prime") return "text-emerald-400";
  if (tier === "pro") return "text-blue-400";
  if (tier === "institutional") return "text-[#D4AF37]";
  return "text-muted-foreground";
}

// ─── Layout Component ────────────────────────────────────────────────────────

export default function TraderLayout({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Fetch trader data
  const { data: trader } = trpc.trader.me.useQuery(undefined, {
    enabled: !!user,
    retry: false,
  });
  const { data: notifications } = trpc.trader.notifications.useQuery(undefined, {
    enabled: !!user,
    retry: false,
  });

  const unreadCount = notifications?.filter((n: any) => !n.isRead).length ?? 0;

  // Close mobile sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

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
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold mb-2">Área do Trader</h1>
            <p className="text-muted-foreground">Faça login para acessar sua plataforma.</p>
          </div>
          <Button size="lg" className="w-full" onClick={() => (window.location.href = getLoginUrl())}>
            Entrar na Plataforma
          </Button>
          <Button variant="outline" size="lg" className="w-full" asChild>
            <Link href="/">← Voltar para o site</Link>
          </Button>
        </div>
      </div>
    );
  }

  const activePlan = trader?.activePlan ?? "trial";
  const traderName = trader?.name ?? user.name ?? "Trader";
  const traderEmail = trader?.email ?? user.email ?? "";

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* ── Sidebar ── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 bg-sidebar border-r border-sidebar-border flex flex-col
          transition-all duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:relative lg:translate-x-0
          ${collapsed ? "w-[68px]" : "w-64"}
        `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border shrink-0">
          {!collapsed && (
            <Link href="/" className="flex items-center gap-2">
              <img
                src="/manus-storage/logo-insider-final_fb5a7227.png"
                alt="Insider Invest"
                className="w-9 h-9 object-contain shrink-0"
              />
              <span className="font-display font-bold text-lg tracking-tight text-sidebar-foreground">INSIDER</span>
            </Link>
          )}
          {collapsed && (
            <img
              src="/manus-storage/logo-insider-final_fb5a7227.png"
              alt="Insider Invest"
              className="w-9 h-9 object-contain mx-auto"
            />
          )}
          {/* Collapse toggle — desktop only */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex w-6 h-6 items-center justify-center rounded hover:bg-sidebar-accent transition-colors"
          >
            {collapsed ? <ChevronRight className="w-3.5 h-3.5 text-sidebar-foreground/60" /> : <ChevronLeft className="w-3.5 h-3.5 text-sidebar-foreground/60" />}
          </button>
          {/* Close — mobile only */}
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 rounded hover:bg-sidebar-accent">
            <X className="w-5 h-5 text-sidebar-foreground/60" />
          </button>
        </div>

        {/* Trader Info */}
        {!collapsed && (
          <div className="p-4 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border border-sidebar-border shrink-0">
                <AvatarFallback className="bg-primary/20 text-primary font-bold text-sm">
                  {traderName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate text-sidebar-foreground">{traderName}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Badge className={`text-[10px] px-1.5 py-0 h-4 ${planColor(activePlan)}`}>
                    {planLabel(activePlan)}
                  </Badge>
                  {trader?.isInnerCircle ? (
                    <span className="text-[10px] text-[#D4AF37] flex items-center gap-0.5">
                      <Star className="w-2.5 h-2.5 fill-[#D4AF37]" /> IC
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label} className="mb-4">
              {!collapsed && (
                <p className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40 px-3 mb-1.5">
                  {section.label}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location === item.path || (item.path !== "/app" && location.startsWith(item.path));
                  return (
                    <Link key={item.id} href={item.path}>
                      <div
                        className={`
                          flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer
                          ${isActive ? "bg-primary/10 text-primary" : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"}
                          ${collapsed ? "justify-center px-2" : ""}
                        `}
                        title={collapsed ? item.label : undefined}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-primary" : ""}`} />
                        {!collapsed && <span>{item.label}</span>}
                        {!collapsed && item.id === "inner-circle" && (
                          <Star className="w-3 h-3 text-[#D4AF37] ml-auto" />
                        )}
                      </div>
                    </Link>
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
                <DropdownMenuItem asChild>
                  <Link href="/app/profile" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Meu Perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/app/support" className="cursor-pointer">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Suporte
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/" className="cursor-pointer">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Site Institucional
                  </Link>
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
        <header className="h-16 border-b border-border/50 flex items-center justify-between px-4 lg:px-6 bg-background/95 backdrop-blur sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-2 rounded-lg hover:bg-muted/50 transition-colors" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <Link href="/app/notifications">
              <button className="relative p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-primary rounded-full text-[10px] text-primary-foreground flex items-center justify-center font-bold">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
            </Link>

            {/* Plan badge */}
            <Badge className={`hidden sm:flex ${planColor(activePlan)}`}>{planLabel(activePlan)}</Badge>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">{children}</main>
      </div>

      {/* Modal de brinde elegível */}
      <GiftRequestModal />
    </div>
  );
}
