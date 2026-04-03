import type { Session, User } from "@supabase/supabase-js";
import type { PropsWithChildren } from "react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { signInWithEmail, signOutCurrentUser, signUpWithEmail } from "./auth.api";
import type { AuthContextValue } from "./auth.types";
import { AuthContext } from "./context";

function buildAuthState(session: Session | null): Pick<AuthContextValue, "session" | "user"> {
  return {
    session,
    user: session?.user ?? null,
  };
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const applySession = (nextSession: Session | null) => {
      if (!isMounted) {
        return;
      }

      const nextState = buildAuthState(nextSession);
      setSession(nextState.session);
      setUser(nextState.user);
      setIsLoading(false);
    };

    void supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error("Failed to get auth session", error);
      }

      applySession(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      applySession(nextSession);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoading,
      session,
      user,
      async signIn(email, password) {
        const { error } = await signInWithEmail(email, password);

        if (error) {
          throw error;
        }
      },
      async signUp(email, password) {
        const { data, error } = await signUpWithEmail(email, password);

        if (error) {
          throw error;
        }

        if (!data.session) {
          throw new Error(
            "Account created, but no session was returned. Check whether email confirmation is disabled in Supabase.",
          );
        }
      },
      async signOut() {
        const { error } = await signOutCurrentUser();

        if (error) {
          throw error;
        }
      },
    }),
    [isLoading, session, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
