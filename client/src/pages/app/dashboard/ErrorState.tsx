import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  error: Error & { status?: number };
  onRetry: () => void;
}

function getErrorMessage(error: Error & { status?: number }): string {
  const status = error?.status ?? 0;
  if (status === 403) return "Você não tem acesso a essa conta.";
  if (status === 404) return "Conta não encontrada.";
  if (status === 502 || status === 504)
    return "Problema temporário no servidor. Tente em alguns minutos.";
  return "Não conseguimos buscar seus dados. Tente novamente em alguns minutos.";
}

export default function ErrorState({ error, onRetry }: ErrorStateProps) {
  const message = getErrorMessage(error);
  const is403 = error?.status === 403;

  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center py-20 gap-4 text-center"
    >
      <AlertTriangle className="w-12 h-12 text-yellow-500" />
      <div className="space-y-1">
        <p className="text-base font-semibold text-foreground">{message}</p>
        {is403 && (
          <p className="text-sm text-muted-foreground">
            Verifique se você está logado com a conta correta.
          </p>
        )}
      </div>
      {!is403 && (
        <Button variant="outline" onClick={onRetry}>
          Tentar novamente
        </Button>
      )}
    </div>
  );
}
