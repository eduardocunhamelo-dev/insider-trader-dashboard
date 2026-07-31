import { useTraderAuth } from "@/hooks/useTraderAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Mail,
  Phone,
  CreditCard,
  Save,
  Loader2,
  Shield,
  Key,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function Profile() {
  const { trader: user } = useTraderAuth();

  const { data: profile, isLoading, refetch } = trpc.trader.profile.useQuery(undefined, {
    enabled: !!user,
    retry: false,
  });

  const updateMutation = trpc.trader.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Perfil atualizado com sucesso!");
      refetch();
      setEditing(false);
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao atualizar perfil.");
    },
  });

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    pixKey: "",
  });

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name ?? "",
        phone: profile.phone ?? "",
        pixKey: profile.pixKey ?? "",
      });
    }
  }, [profile]);

  function handleSave() {
    updateMutation.mutate({
      name: form.name || undefined,
      phone: form.phone || undefined,
      pixKey: form.pixKey || undefined,
    });
  }

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-7 w-32 bg-muted/30 rounded animate-pulse" />
            <div className="h-4 w-56 bg-muted/20 rounded animate-pulse mt-2" />
          </div>
          <div className="h-9 w-16 bg-muted/30 rounded-lg animate-pulse" />
        </div>
        <Card className="bg-card/50 border-white/[0.06]">
          <CardContent className="p-6 space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-background/30 rounded-lg border border-white/[0.06]">
                <div className="w-4 h-4 bg-muted/30 rounded animate-pulse" />
                <div className="flex-1">
                  <div className="h-3 w-16 bg-muted/20 rounded animate-pulse" />
                  <div className="h-4 w-40 bg-muted/30 rounded animate-pulse mt-1" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-white/[0.06]">
          <CardContent className="p-6">
            <div className="grid sm:grid-cols-2 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-1.5">
                  <div className="h-3 w-16 bg-muted/20 rounded animate-pulse" />
                  <div className="h-9 bg-muted/10 rounded-lg animate-pulse" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>Perfil não encontrado. Faça login para acessar.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <User className="w-6 h-6 text-primary" />
            Meu Perfil
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie suas informações pessoais</p>
        </div>
        {!editing ? (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            Editar
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : (
                <Save className="w-4 h-4 mr-1" />
              )}
              Salvar
            </Button>
          </div>
        )}
      </div>

      {/* Account Info */}
      <Card className="bg-card/50 border-white/[0.06]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            Informações da Conta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-background/30 rounded-lg border border-white/[0.06]">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">E-mail</p>
                <p className="text-sm font-medium">{profile.email}</p>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px]">Verificado</Badge>
          </div>
          <div className="flex items-center justify-between p-3 bg-background/30 rounded-lg border border-white/[0.06]">
            <div className="flex items-center gap-3">
              <CreditCard className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Plano Ativo</p>
                <p className="text-sm font-medium">{profile.activePlan?.toUpperCase() ?? "Nenhum"}</p>
              </div>
            </div>
            {profile.isInnerCircle && (
              <Badge className="bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/30 text-[10px]">
                Inner Circle
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Editable Fields — email (read-only), name, phone */}
      <Card className="bg-card/50 border-white/[0.06]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            Dados Pessoais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Email — always read-only */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Mail className="w-3 h-3" /> E-mail
            </Label>
            <Input
              value={profile.email}
              disabled
              className="h-9 opacity-60 cursor-not-allowed"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <User className="w-3 h-3" /> Nome
              </Label>
              {editing ? (
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Seu nome completo"
                  className="h-9"
                />
              ) : (
                <p className="text-sm font-medium py-1.5">{form.name || "—"}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Phone className="w-3 h-3" /> Telefone
              </Label>
              {editing ? (
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="(11) 99999-9999"
                  className="h-9"
                />
              ) : (
                <p className="text-sm font-medium py-1.5">{form.phone || "—"}</p>
              )}
            </div>
          </div>
          {/* PIX Key */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Key className="w-3 h-3" /> Chave PIX
            </Label>
            {editing ? (
              <Input
                value={form.pixKey}
                onChange={(e) => setForm({ ...form, pixKey: e.target.value })}
                placeholder="CPF, e-mail, telefone ou chave aleatória"
                className="h-9"
              />
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium py-1.5 font-mono">
                  {form.pixKey || <span className="text-muted-foreground/50 font-sans font-normal">Não cadastrada</span>}
                </p>
                {form.pixKey && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Cadastrada
                  </span>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
