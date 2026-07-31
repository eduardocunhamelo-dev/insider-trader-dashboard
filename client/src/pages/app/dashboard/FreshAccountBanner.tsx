import { Clock } from "lucide-react";

export default function FreshAccountBanner() {
  return (
    <div
      role="status"
      aria-label="Conta em sincronização inicial"
      className="flex gap-3 p-4 rounded-lg bg-yellow-50 border border-yellow-200 border-l-4 border-l-yellow-400 dark:bg-yellow-950/20 dark:border-yellow-800 dark:border-l-yellow-500"
    >
      <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
      <div>
        <p className="font-semibold text-yellow-800 dark:text-yellow-300 text-sm">
          Sincronização inicial em andamento
        </p>
        <p className="text-yellow-700 dark:text-yellow-400 text-sm mt-1">
          Seus dados de trading aparecem aqui em até 24h após o início do desafio.
          Enquanto isso, você pode ver os limites do seu plano abaixo.
        </p>
      </div>
    </div>
  );
}
