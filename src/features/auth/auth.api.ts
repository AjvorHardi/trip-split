import { supabase } from "../../lib/supabase";

export async function signInWithEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
}

export async function signUpWithEmail(email: string, password: string) {
  return supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
  });
}

export async function signOutCurrentUser() {
  return supabase.auth.signOut();
}
