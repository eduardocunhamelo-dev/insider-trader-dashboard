// Mock de autenticação do trader — dados de demonstração
// Quando conectar ao backend do insider-landing, substituir por implementação real

export type TraderProfile = {
  id: number;
  name: string;
  email: string;
  activePlan: string;
  status: string;
  capitalUsd?: number;
  phone?: string | null;
  cpf?: string | null;
  city?: string | null;
  state?: string | null;
  isInnerCircle?: number;
  totalProfitCents?: number;
  totalPayoutCents?: number;
  consecutiveCycles?: number;
  profileImage?: string | null;
};

const MOCK_TRADER: TraderProfile = {
  id: 1,
  name: "Eduardo Cunha",
  email: "eduardo@insiderinveste.com",
  activePlan: "FAST 50k",
  status: "active",
  capitalUsd: 50000,
  city: "São Paulo",
  state: "SP",
  isInnerCircle: 0,
  totalProfitCents: 1250000,
  totalPayoutCents: 800000,
  consecutiveCycles: 3,
};

export function useTraderAuth() {
  return {
    trader: MOCK_TRADER,
    loading: false,
    error: null,
    isAuthenticated: true,
    logout: () => { window.location.href = "/"; },
    refresh: () => {},
  };
}
