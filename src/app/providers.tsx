import type { PropsWithChildren } from "react";
import { BrowserRouter } from "react-router";
import { AuthProvider } from "../features/auth/AuthProvider";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <BrowserRouter>
      <AuthProvider>{children}</AuthProvider>
    </BrowserRouter>
  );
}
