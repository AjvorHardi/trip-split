import type { PropsWithChildren } from "react";
import { Navigate } from "react-router";
import { LoadingBlock } from "../components/feedback/LoadingBlock";
import { useAuth } from "../features/auth/useAuth";

export function PublicOnlyRoute({ children }: PropsWithChildren) {
  const { isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <LoadingBlock
        title="Loading"
        message="Trip-Split is restoring your session."
        fullScreen
      />
    );
  }

  if (user) {
    return <Navigate to="/app/groups" replace />;
  }

  return children;
}
