import { useParams, useLocation } from "wouter";
import DashboardPage from "./DashboardPage";

/**
 * Standalone wrapper for the trader dashboard.
 * Accessible at /dashboard/:accountOperationId
 * Used for direct URL access (e.g., admin links, email links).
 */
export default function TraderDashboardStandalone() {
  const params = useParams<{ accountOperationId: string }>();
  const [, navigate] = useLocation();
  const accountOperationId = Number(params.accountOperationId);

  if (!accountOperationId || isNaN(accountOperationId)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">ID de conta inválido.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-5xl py-6">
        <DashboardPage
          accountOperationId={accountOperationId}
          onBack={() => navigate("/cliente?section=accounts")}
        />
      </div>
    </div>
  );
}
