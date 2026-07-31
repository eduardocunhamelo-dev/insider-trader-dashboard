// Tipos compartilhados — versão standalone (sem dependências do backend)
export type UserRole = "admin" | "user";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  openId?: string;
  avatarUrl?: string;
  createdAt?: Date;
}
