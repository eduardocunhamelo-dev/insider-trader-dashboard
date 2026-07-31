// Types for GET /api/dashboard/:account_operation_id
// Derived from backend schema v4 (dashboardRoute.ts)

export type DashboardResponse = {
  account: {
    id: number;
    mt5_login: number;
    status: number;
    days_running: number | null;
  };
  summary: {
    balance_initial: number;
    balance_current: number;
    profit_total: number;
    profit_pct: number;
    drawdown_floor: number;
    drawdown_max: number;
    drawdown_consumed: number;
    drawdown_used_pct: number;
    days_traded: number;
    days_minimum: number | null;
    days_remaining: number | null;
    profit_target: number;
    profit_target_pct: number;
    daily_loss_limit: number;
    withdrawal_limit: number;
    profit_share_pct: number;
    consistence: number;
    // Rule status from test_account_operation (1=ok, 0=violated, null=unavailable)
    rule_status_profit: number | null;
    rule_status_max_loss: number | null;
    rule_status_min_days: number | null;
  };
  plan: {
    id: number;
    name: string | null;
    value_account: number;
    profit_target: number;
    drawdown_max: number;
    daily_loss_limit: number;
    withdrawal_limit: number;
    minimum_days: number | null;
    profit_share_pct: number;
    total_first_transfer: number;
  };
  equity_curve: Array<{
    index: number;
    date: string | null;
    balance: number;
    drawdown_floor: number;
    target: number;
  }>;
  operations: Array<{
    id: number;
    date: string;
    time: string;
    date_closed: string | null;
    time_closed: string | null;
    asset: string;
    contracts: number;
    operation_type: number; // 1=compra, 2=venda
    type: number;           // 1=aberta, 2=fechada
    input_value: number;
    output_value: number;
    value: number;
    points: number | null;
  }>;
  meta: {
    is_fresh_account: boolean;
    last_sync_at: string;
  };
};

export type AccountStatus = 1 | 2 | 3 | 4 | 5;

export const ACCOUNT_STATUS_LABELS: Record<number, string> = {
  1: "Em análise",
  2: "Ativa",
  3: "Aprovada",
  4: "Reprovada",
  5: "Expirada",
};
