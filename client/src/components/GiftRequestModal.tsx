import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sparkles,
  PartyPopper,
  Crown,
  Award,
  Image as ImageIcon,
  Loader2,
  X,
} from "lucide-react";
import { toast } from "sonner";

const eligibilityCopy: Record<
  string,
  { title: string; subtitle: string; icon: React.ElementType; color: string }
> = {
  approval: {
    title: "Parabéns pela aprovação!",
    subtitle: "Você foi aprovado e tem direito a um brinde de boas-vindas.",
    icon: Award,
    color: "text-emerald-400",
  },
  inner_circle_prime: {
    title: "Bem-vindo ao Inner Circle Prime!",
    subtitle: "Você desbloqueou um brinde exclusivo do nosso programa de fidelidade.",
    icon: Crown,
    color: "text-emerald-400",
  },
  inner_circle_pro: {
    title: "Bem-vindo ao Inner Circle Pro!",
    subtitle: "Você ascendeu ao tier Pro e tem direito a um brinde especial.",
    icon: Crown,
    color: "text-blue-400",
  },
  inner_circle_institutional: {
    title: "Bem-vindo ao Inner Circle Institucional!",
    subtitle: "Você atingiu o tier máximo. Um brinde exclusivo te aguarda.",
    icon: Crown,
    color: "text-[#D4AF37]",
  },
};

const BRAZIL_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

export default function GiftRequestModal() {
  const utils = trpc.useUtils();
  const { data: pending, isLoading, error } = trpc.trader.pendingGiftRequest.useQuery(undefined, {
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });

  const [variationId, setVariationId] = useState<number | null>(null);
  const [form, setForm] = useState({
    recipientName: "",
    recipientPhone: "",
    zipCode: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    traderNotes: "",
  });

  const confirmMut = trpc.trader.confirmGiftAddress.useMutation({
    onSuccess: () => {
      utils.trader.pendingGiftRequest.invalidate();
      toast.success(
        "Endereço confirmado! Logo você receberá novidades sobre o envio.",
        { duration: 5000 }
      );
    },
    onError: (e) => toast.error(`Erro: ${e.message}`),
  });

  const cancelMut = trpc.trader.cancelGiftRequest.useMutation({
    onSuccess: () => {
      utils.trader.pendingGiftRequest.invalidate();
      toast("Solicitação cancelada.");
    },
    onError: (e) => toast.error(`Erro: ${e.message}`),
  });

  if (!pending) {
    return null;
  }

  const copy = eligibilityCopy[pending.eligibilityType] || eligibilityCopy.approval;
  const HeaderIcon = copy.icon;

  const handleZipCode = (v: string) => {
    const clean = v.replace(/\D/g, "").slice(0, 8);
    const formatted = clean.length > 5 ? `${clean.slice(0, 5)}-${clean.slice(5)}` : clean;
    setForm({ ...form, zipCode: formatted });
  };

  const handlePhone = (v: string) => {
    const clean = v.replace(/\D/g, "").slice(0, 11);
    let formatted = clean;
    if (clean.length > 10) {
      formatted = `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
    } else if (clean.length > 6) {
      formatted = `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
    } else if (clean.length > 2) {
      formatted = `(${clean.slice(0, 2)}) ${clean.slice(2)}`;
    }
    setForm({ ...form, recipientPhone: formatted });
  };

  const handleSubmit = () => {
    if (pending.catalog.hasVariations && !variationId) {
      toast.error("Selecione um tamanho.");
      return;
    }
    const required: [string, string][] = [
      ["recipientName", "Nome do destinatário"],
      ["recipientPhone", "Telefone"],
      ["zipCode", "CEP"],
      ["street", "Rua"],
      ["number", "Número"],
      ["neighborhood", "Bairro"],
      ["city", "Cidade"],
      ["state", "Estado"],
    ];
    for (const [key, label] of required) {
      if (!form[key as keyof typeof form]?.trim()) {
        toast.error(`${label} é obrigatório.`);
        return;
      }
    }

    confirmMut.mutate({
      requestId: pending.requestId,
      variationId: variationId,
      ...form,
      complement: form.complement || undefined,
      traderNotes: form.traderNotes || undefined,
    });
  };

  const handleCancel = () => {
    if (
      confirm(
        "Tem certeza que não quer receber este brinde? Esta ação não pode ser desfeita."
      )
    ) {
      cancelMut.mutate({ requestId: pending.requestId });
    }
  };

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-[#D4AF37]/20 to-emerald-500/20 flex items-center justify-center ${copy.color}`}>
              <PartyPopper className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl flex items-center gap-2">
                {copy.title}
                <Sparkles className="w-5 h-5 text-[#D4AF37]" />
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm">
                {copy.subtitle}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="bg-gradient-to-br from-[#D4AF37]/5 to-transparent rounded-lg p-4 border border-[#D4AF37]/20">
          <div className="flex gap-4">
            <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted/30 flex-shrink-0 flex items-center justify-center">
              {pending.catalog.imageUrl ? (
                <img
                  src={pending.catalog.imageUrl}
                  alt={pending.catalog.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <ImageIcon className="w-8 h-8 text-muted-foreground/30" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <Badge
                className={
                  pending.catalog.category === "approval"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : "bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/30"
                }
              >
                <HeaderIcon className="w-3 h-3 mr-1" />
                {pending.catalog.category === "approval" ? "Aprovação" : "Inner Circle"}
              </Badge>
              <h3 className="font-bold text-lg mt-2">{pending.catalog.name}</h3>
              {pending.catalog.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {pending.catalog.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {pending.catalog.hasVariations && (
          <div>
            <Label>Tamanho *</Label>
            {pending.variations.length === 0 ? (
              <p className="text-sm text-orange-400 mt-1">
                Nenhum tamanho disponível em estoque no momento. Tente novamente mais tarde.
              </p>
            ) : (
              <div className="flex gap-2 flex-wrap mt-1">
                {pending.variations.map((v: any) => (
                  <Button
                    key={v.id}
                    variant={variationId === v.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setVariationId(v.id)}
                    className="font-mono"
                  >
                    {v.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="space-y-3">
          <p className="text-sm font-semibold">Endereço de entrega</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Nome do destinatário *</Label>
              <Input
                value={form.recipientName}
                onChange={(e) => setForm({ ...form, recipientName: e.target.value })}
                placeholder="Nome completo"
              />
            </div>
            <div>
              <Label className="text-xs">Telefone *</Label>
              <Input
                value={form.recipientPhone}
                onChange={(e) => handlePhone(e.target.value)}
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">CEP *</Label>
              <Input
                value={form.zipCode}
                onChange={(e) => handleZipCode(e.target.value)}
                placeholder="00000-000"
              />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs">Rua *</Label>
              <Input
                value={form.street}
                onChange={(e) => setForm({ ...form, street: e.target.value })}
                placeholder="Nome da rua"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Número *</Label>
              <Input
                value={form.number}
                onChange={(e) => setForm({ ...form, number: e.target.value })}
                placeholder="123"
              />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs">Complemento</Label>
              <Input
                value={form.complement}
                onChange={(e) => setForm({ ...form, complement: e.target.value })}
                placeholder="Apto, bloco, etc."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <Label className="text-xs">Bairro *</Label>
              <Input
                value={form.neighborhood}
                onChange={(e) => setForm({ ...form, neighborhood: e.target.value })}
                placeholder="Nome do bairro"
              />
            </div>
            <div>
              <Label className="text-xs">Estado *</Label>
              <Select value={form.state} onValueChange={(v) => setForm({ ...form, state: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="UF" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {BRAZIL_STATES.map((uf) => (
                    <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs">Cidade *</Label>
            <Input
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              placeholder="Nome da cidade"
            />
          </div>

          <div>
            <Label className="text-xs">Observações (opcional)</Label>
            <Textarea
              value={form.traderNotes}
              onChange={(e) => setForm({ ...form, traderNotes: e.target.value })}
              placeholder="Alguma instrução especial pra entrega?"
              rows={2}
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-border/50">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            disabled={cancelMut.isPending || confirmMut.isPending}
            className="text-muted-foreground hover:text-destructive"
          >
            <X className="w-4 h-4 mr-1.5" />
            Não quero o brinde
          </Button>
          <Button
            className="flex-1"
            onClick={handleSubmit}
            disabled={confirmMut.isPending}
          >
            {confirmMut.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Confirmar endereço
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Após confirmar, nossa equipe processará o envio em até 5 dias úteis.
        </p>
      </DialogContent>
    </Dialog>
  );
}
