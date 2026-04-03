import type { Session, User } from "@supabase/supabase-js";

export type AuthContextValue = {
  isLoading: boolean;
  session: Session | null;
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};
