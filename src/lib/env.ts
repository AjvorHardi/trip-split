function getRequiredEnv(key: "VITE_SUPABASE_URL" | "VITE_SUPABASE_ANON_KEY") {
  const value = import.meta.env[key];

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

export const env = {
  supabaseAnonKey: getRequiredEnv("VITE_SUPABASE_ANON_KEY"),
  supabaseUrl: getRequiredEnv("VITE_SUPABASE_URL"),
};
