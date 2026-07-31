import { Bell, Check, CheckCheck, Info, AlertTriangle, DollarSign, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { cn } from "@/lib/utils";

const typeIcons: Record<string, React.ReactNode> = {
  info: <Info className="w-4 h-4 text-blue-400" />,
  success: <Award className="w-4 h-4 text-[#D4AF37]" />,
  warning: <AlertTriangle className="w-4 h-4 text-orange-400" />,
  payout: <DollarSign className="w-4 h-4 text-emerald-400" />,
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data, refetch } = trpc.notifications.list.useQuery(undefined, {
    refetchInterval: 30000,
  });
  const markRead = trpc.notifications.markRead.useMutation({
    onSuccess: () => refetch(),
  });
  const markAllRead = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => refetch(),
  });

  const items = data?.items ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-card border-border" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h4 className="font-semibold text-sm">Notificações</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 text-muted-foreground hover:text-primary"
              onClick={() => markAllRead.mutate()}
            >
              <CheckCheck className="w-3.5 h-3.5 mr-1" />
              Marcar todas
            </Button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {items.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              Nenhuma notificação
            </div>
          ) : (
            items.map((n: any) => (
              <div
                key={n.id}
                className={cn(
                  "flex gap-3 px-4 py-3 border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer",
                  !n.isRead && "bg-primary/5"
                )}
                onClick={() => {
                  if (!n.isRead) markRead.mutate({ notificationId: n.id });
                }}
              >
                <div className="mt-0.5 shrink-0">
                  {typeIcons[n.type] || typeIcons.info}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{n.title}</span>
                    {!n.isRead && (
                      <span className="w-2 h-2 bg-primary rounded-full shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">
                    {new Date(n.createdAt).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
