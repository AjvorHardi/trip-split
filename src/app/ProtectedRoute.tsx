import type { PropsWithChildren } from "react";
import { Navigate } from "react-router";
import { LoadingBlock } from "../components/feedback/LoadingBlock";
import { useAuth } from "../features/auth/useAuth";

export function ProtectedRoute({ children }: PropsWithChildren) {
  const { isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <LoadingBlock
        title="Checking your session"
        message="Trip-Split is verifying whether you already have access."
        fullScreen
      />
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
