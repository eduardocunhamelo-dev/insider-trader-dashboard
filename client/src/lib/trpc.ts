// Mock tRPC client — sem backend real neste projeto
// Todas as chamadas retornam dados de demonstração
// Quando conectar ao backend, substituir por implementação real

export const trpc = {
  useUtils: () => ({ invalidate: () => {} }),
} as any;
