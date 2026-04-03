import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router";
import { AppHeader } from "../components/layout/AppHeader";
import { PageContainer } from "../components/layout/PageContainer";
import { useAuth } from "../features/auth/useAuth";

export function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await signIn(email, password);
      navigate("/app/groups", { replace: true });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to log in.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="ts-app-bg min-h-screen text-[var(--ts-ink)]">
      <AppHeader />
      <PageContainer className="py-10 sm:py-14">
        <section className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[minmax(0,1fr)_28rem]">
          <div className="ts-panel-dark p-8 text-white sm:p-10">
            <p className="ts-kicker text-[var(--ts-cyan-soft)]">Log in</p>
            <h1 className="ts-display mt-4 text-[3.2rem] sm:text-[4.4rem]">
              Re-enter the trip ledger.
            </h1>
            <p className="mt-5 max-w-md text-sm leading-7 text-[#d8dbde]">
              Use the same email you plan to use for invitations. Once Supabase
              accepts the credentials, the route guard opens the private app area.
            </p>
          </div>

          <div className="ts-panel-light p-8 sm:p-10">
            <p className="ts-kicker text-[var(--ts-muted)]">Session access</p>
            <h2 className="ts-display mt-4 text-[2.5rem] text-[var(--ts-ink)]">
              Log in
            </h2>
            <p className="ts-copy mt-4 text-sm">
              Enter your email and password to restore your workspace.
            </p>
            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <label className="block">
                <span className="ts-label">Email</span>
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="ts-input"
                  placeholder="you@example.com"
                />
              </label>

              <label className="block">
                <span className="ts-label">Password</span>
                <input
                  type="password"
                  autoComplete="current-password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="ts-input"
                  placeholder="Your password"
                />
              </label>

              {errorMessage ? (
                <div className="ts-alert px-4 py-3 text-sm" role="alert">
                  {errorMessage}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="ts-button-primary w-full px-5 py-3 text-xs"
              >
                {isSubmitting ? "Logging in..." : "Log in"}
              </button>
            </form>
            <p className="mt-6 text-sm text-[var(--ts-muted)]">
              Need an account?{" "}
              <Link
                to="/signup"
                className="font-bold uppercase tracking-[0.06em] text-[var(--ts-ink)] underline"
              >
                Create one here
              </Link>
              .
            </p>
          </div>
        </section>
      </PageContainer>
    </div>
  );
}
