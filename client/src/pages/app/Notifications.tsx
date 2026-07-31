import { useTraderAuth } from "@/hooks/useTraderAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Gift,
  Info,
  Megaphone,
  Check,
  Loader2,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";

function notifIcon(type: string) {
  switch (type) {
    case "success": return { icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10" };
    case "payout": return { icon: DollarSign, color: "text-[#D4AF37]", bg: "bg-[#D4AF37]/10" };
    case "warning": return { icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10" };
    case "info": return { icon: Info, color: "text-blue-400", bg: "bg-blue-500/10" };
    default: return { icon: Bell, color: "text-muted-foreground", bg: "bg-muted/10" };
  }
}

function timeAgo(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins}min atrás`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} dia${days > 1 ? "s" : ""} atrás`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} semana${weeks > 1 ? "s" : ""} atrás`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function Notifications() {
  const { trader: user } = useTraderAuth();
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.notifications.list.useQuery(
    { limit: 50 },
    { enabled: !!user, refetchInterval: 30000 }
  );

  const markRead = trpc.notifications.markRead.useMutation({
    onSuccess: () => {
      utils.notifications.list.invalidate();
      utils.notifications.unreadCount.invalidate();
    },
  });

  const markAllRead = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => {
      toast.success("Todas as notificações marcadas como lidas.");
      utils.notifications.list.invalidate();
      utils.notifications.unreadCount.invalidate();
    },
  });

  const notifications = data?.items ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <div>
          <div className="h-7 w-36 bg-muted/30 rounded animate-pulse" />
          <div className="h-4 w-32 bg-muted/20 rounded animate-pulse mt-2" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="border-white/[0.06] bg-card/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-muted/20 animate-pulse shrink-0" />
                  <div className="flex-1">
                    <div className="h-4 w-40 bg-muted/30 rounded animate-pulse" />
                    <div className="h-3 w-64 bg-muted/20 rounded animate-pulse mt-1.5" />
                    <div className="h-2.5 w-16 bg-muted/10 rounded animate-pulse mt-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="w-6 h-6 text-primary" />
            Notificações
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? "s" : ""}` : "Tudo em dia"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
          >
            {markAllRead.isPending ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5 mr-1.5" />
            )}
            Marcar todas como lidas
          </Button>
        )}
      </div>

      <div className="rounded-2xl border border-white/[0.06] bg-card/10 p-5">
      {notifications.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Nenhuma notificação ainda.</p>
          <p className="text-sm mt-1">Suas notificações aparecerão aqui.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif: any) => {
            const { icon: Icon, color, bg } = notifIcon(notif.type);
            const isRead = !!notif.isRead;
            return (
              <Card
                key={notif.id}
                className={`transition-all cursor-pointer ${
                  !isRead
                    ? "border-primary/20 bg-primary/5"
                    : "border-white/[0.06] bg-card/20 hover:bg-card/40"
                }`}
                onClick={() => {
                  if (!isRead) {
                    markRead.mutate({ notificationId: notif.id });
                  }
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${bg}`}>
                      <Icon className={`w-4 h-4 ${color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-semibold ${isRead ? "text-muted-foreground" : ""}`}>
                          {notif.title}
                        </p>
                        {!isRead && (
                          <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1.5">
                        {notif.createdAt ? timeAgo(notif.createdAt) : ""}
                      </p>
                    </div>
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
