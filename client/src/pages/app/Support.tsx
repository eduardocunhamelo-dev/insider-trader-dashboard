import { useTraderAuth } from "@/hooks/useTraderAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageCircle,
  Send,
  Clock,
  CheckCircle2,
  HelpCircle,
  ExternalLink,
  Plus,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// ─── WhatsApp support link ───────────────────────────────────────────────────
const WHATSAPP_LINK = "https://api.whatsapp.com/send/?phone=5562994788905&text=Ol%C3%A1%2C+estou+precisando+de+ajuda+do+suporte.&type=phone_number&app_absent=0";

// ─── FAQ ─────────────────────────────────────────────────────────────────────
const FAQ = [
  {
    q: "Como funciona o drawdown?",
    a: "O drawdown máximo total é de 5% sobre o capital inicial (ex: $500 para conta de $10K). O drawdown diário é de 3% sobre o saldo do início do dia. Se qualquer limite for atingido, as posições são fechadas automaticamente.",
  },
  {
    q: "Quando posso solicitar saque?",
    a: "Após ser aprovado na avaliação (atingir a meta de lucro de 8% com mínimo de 10 dias operados), os saques seguem a janela dos dias 1 a 5 de cada mês e são processados em até 3 dias úteis via PIX. O valor mínimo de saque é $100.",
  },
  {
    q: "Qual o percentual de repasse?",
    a: "O repasse começa em 80% nos planos FAST e 90% nos planos PRO. Membros do Inner Circle podem atingir até 95% de repasse conforme sobem de nível.",
  },
  {
    q: "O que acontece se eu violar uma regra?",
    a: "Se o drawdown diário ou total for atingido, as posições são fechadas automaticamente e a conta é suspensa. Você pode adquirir um novo plano para tentar novamente.",
  },
  {
    q: "Posso operar qualquer ativo?",
    a: "Sim, você pode operar todos os ativos disponíveis no servidor MT5 da Insider. Consulte a seção 'Regras e Objetivos' para detalhes específicos do seu plano.",
  },
  {
    q: "Qual o horário de operação?",
    a: "O horário de operação é das 21:00 BRT até 17:59 BRT do dia seguinte (horário de mercado). Posições devem ser fechadas antes do fim do horário.",
  },
];

// ─── Category labels ─────────────────────────────────────────────────────────
const CATEGORY_LABELS: Record<string, string> = {
  account: "Conta",
  payout: "Saque",
  technical: "Técnico",
  billing: "Financeiro",
  other: "Outro",
};

const STATUS_LABELS: Record<string, string> = {
  open: "Aberto",
  in_progress: "Em Andamento",
  resolved: "Resolvido",
  closed: "Fechado",
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function Support() {
  const { trader: user } = useTraderAuth();
  const [newSubject, setNewSubject] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [newCategory, setNewCategory] = useState<string>("other");
  const [isCreating, setIsCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const { data: tickets, isLoading, refetch } = trpc.trader.myTickets.useQuery(undefined, {
    enabled: !!user,
    retry: false,
  });

  const createTicketMutation = trpc.trader.createTicket.useMutation({
    onSuccess: () => {
      toast.success("Chamado aberto com sucesso! Responderemos em até 24h.");
      setNewSubject("");
      setNewMessage("");
      setNewCategory("other");
      setShowForm(false);
      refetch();
    },
    onError: (err) => {
      toast.error("Erro ao abrir chamado: " + err.message);
    },
  });

  function handleNewTicket() {
    if (!newSubject.trim()) {
      toast.error("Informe o assunto do chamado.");
      return;
    }
    if (!newMessage.trim()) {
      toast.error("Descreva sua dúvida ou problema.");
      return;
    }
    createTicketMutation.mutate({
      subject: newSubject.trim(),
      message: newMessage.trim(),
      category: newCategory as any,
    });
  }

  const ticketList = tickets ?? [];

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground/40 mb-1">Atendimento</p>
          <h1 className="text-2xl font-bold">Suporte</h1>
          <p className="text-sm text-muted-foreground mt-1">Tire suas dúvidas, abra chamados ou fale via WhatsApp</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <MessageCircle className="w-5 h-5 text-primary" />
        </div>
      </div>

      {/* New Ticket */}
      {!showForm ? (
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Chamado
        </Button>
      ) : (
        <Card className="bg-card/50 border-white/[0.06]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Plus className="w-4 h-4 text-primary" />
              Novo Chamado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Assunto do chamado"
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              className="bg-background/50"
            />
            <Select value={newCategory} onValueChange={setNewCategory}>
              <SelectTrigger className="bg-background/50">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="account">Conta</SelectItem>
                <SelectItem value="payout">Saque</SelectItem>
                <SelectItem value="technical">Técnico</SelectItem>
                <SelectItem value="billing">Financeiro</SelectItem>
                <SelectItem value="other">Outro</SelectItem>
              </SelectContent>
            </Select>
            <Textarea
              placeholder="Descreva sua dúvida ou problema em detalhes..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="bg-background/50 min-h-[100px]"
            />
            <div className="flex gap-2">
              <Button onClick={handleNewTicket} disabled={createTicketMutation.isPending} className="gap-2">
                {createTicketMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Enviar
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Links */}
      <div className="grid sm:grid-cols-2 gap-3">
        <Card
          className="bg-card/30 border-white/[0.06] hover:border-primary/30 transition-colors cursor-pointer"
          onClick={() => window.open(WHATSAPP_LINK, "_blank")}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">WhatsApp</p>
              <p className="text-xs text-muted-foreground">Atendimento rápido</p>
            </div>
            <ExternalLink className="w-4 h-4 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card
          className="bg-card/30 border-white/[0.06] hover:border-primary/30 transition-colors cursor-pointer"
          onClick={() => window.open(WHATSAPP_LINK, "_blank")}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">Falar com Suporte</p>
              <p className="text-xs text-muted-foreground">Seg–Sex, 9h às 17h</p>
            </div>
            <ExternalLink className="w-4 h-4 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>

      {/* Tickets */}
      <div className="rounded-2xl border border-white/[0.06] bg-card/10 p-5">
        <h2 className="font-semibold text-lg mb-4">Meus Chamados</h2>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-card/30 border-white/[0.06]">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-muted/20 animate-pulse shrink-0" />
                    <div className="flex-1">
                      <div className="h-4 w-40 bg-muted/30 rounded animate-pulse" />
                      <div className="h-3 w-24 bg-muted/20 rounded animate-pulse mt-1" />
                    </div>
                    <div className="h-5 w-16 bg-muted/20 rounded-full animate-pulse" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : ticketList.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Nenhum chamado aberto.</p>
            <p className="text-sm mt-1">Seus chamados aparecerão aqui.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {ticketList.map((ticket: any) => (
              <Card key={ticket.id} className="bg-card/30 border-white/[0.06] hover:bg-card/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                        ticket.status === "open" || ticket.status === "in_progress"
                          ? "bg-[#D4AF37]/10"
                          : "bg-emerald-500/10"
                      }`}>
                        {ticket.status === "open" || ticket.status === "in_progress" ? (
                          <Clock className="w-4 h-4 text-[#D4AF37]" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{ticket.subject}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {CATEGORY_LABELS[ticket.category] ?? ticket.category}
                          {ticket.response && (
                            <span className="ml-2 text-primary">· Respondido</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <Badge className={`text-xs ${
                        ticket.status === "open" || ticket.status === "in_progress"
                          ? "bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/30"
                          : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                      }`}>
                        {STATUS_LABELS[ticket.status] ?? ticket.status}
                      </Badge>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {new Date(ticket.createdAt).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                  {/* Show response if available */}
                  {ticket.response && (
                    <div className="mt-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
                      <p className="text-xs font-medium text-primary mb-1">Resposta da equipe:</p>
                      <p className="text-sm text-muted-foreground">{ticket.response}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* FAQ */}
      <Card id="support-faq" className="bg-card/30 border-white/[0.06]">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-primary" />
            Perguntas Frequentes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {FAQ.map((item, i) => (
            <div key={i} className="p-3 bg-muted/5 rounded-lg border border-white/[0.06]">
              <p className="font-medium text-sm">{item.q}</p>
              <p className="text-xs text-muted-foreground mt-1">{item.a}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
