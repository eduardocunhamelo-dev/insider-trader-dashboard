// Mock de autenticação — dados de demonstração para desenvolvimento standalone
// Quando conectar ao backend do insider-landing, substituir por implementação real

export function useAuth(_options?: { redirectOnUnauthenticated?: boolean; redirectPath?: string }) {
  return {
    user: {
      id: "1",
      name: "Eduardo Cunha",
      email: "eduardo@insiderinveste.com",
      role: "user" as const,
    },
    loading: false,
    error: null,
    isAuthenticated: true,
    logout: () => { window.location.href = "/"; },
    refresh: () => {},
  };
}
