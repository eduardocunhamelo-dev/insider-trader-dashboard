import { createContext, useContext } from "react";

export type SectionId =
  | "dashboard"
  | "accounts"
  | "payouts"
  | "academy"
  | "certificates"
  | "inner-circle"
  | "leaderboard"
  | "referrals"
  | "rules"
  | "support"
  | "profile"
  | "notifications"
  | "payment-history"
  | "plans"
  | "plan-store"
  | "calculator"
  | "tournaments"
  | "account-details"
  | "allowed-assets";

interface ClientNavContextType {
  activeSection: SectionId;
  navigateTo: (section: SectionId) => void;
  selectedAccountId: number | null;
  navigateToAccountDetails: (accountId: number) => void;
}

export const ClientNavContext = createContext<ClientNavContextType>({
  activeSection: "dashboard",
  navigateTo: () => {},
  selectedAccountId: null,
  navigateToAccountDetails: () => {},
});

export function useClientNav() {
  return useContext(ClientNavContext);
}
