import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router";
import { AppHeader } from "../components/layout/AppHeader";
import { PageContainer } from "../components/layout/PageContainer";
import { useAuth } from "../features/auth/useAuth";

export function SignupPage() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await signUp(email, password);
      navigate("/app/groups", { replace: true });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to create your account.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="ts-app-bg min-h-screen text-[var(--ts-ink)]">
      <AppHeader />
      <PageContainer className="py-10 sm:py-14">
        <section className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[minmax(0,1fr)_30rem]">
          <div className="ts-panel-light p-8 sm:p-10">
            <p className="ts-kicker text-[var(--ts-muted)]">Sign up</p>
            <h1 className="ts-display mt-4 text-[3.2rem] text-[var(--ts-ink)] sm:text-[4.5rem]">
              Start a clean shared ledger.
            </h1>
            <p className="ts-copy mt-5 max-w-lg">
              The MVP is configured for direct access after signup. Create an account
              and the app should open your protected workspace immediately.
            </p>
          </div>

          <div className="ts-panel-dark p-8 text-white sm:p-10">
            <p className="ts-kicker text-[var(--ts-cyan-soft)]">Account access</p>
            <h2 className="ts-display mt-4 text-[2.6rem]">Create account</h2>
            <p className="mt-4 text-sm leading-7 text-[#d8dbde]">
              Use the email address that should receive future group invitations.
            </p>
            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <label className="block">
                <span className="ts-label text-white">Email</span>
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="ts-input bg-[#fffdf8]"
                  placeholder="you@example.com"
                />
              </label>

              <label className="block">
                <span className="ts-label text-white">Password</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="ts-input bg-[#fffdf8]"
                  placeholder="At least 6 characters"
                />
              </label>

              <label className="block">
                <span className="ts-label text-white">Confirm password</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="ts-input bg-[#fffdf8]"
                  placeholder="Repeat your password"
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
                {isSubmitting ? "Creating account..." : "Create account"}
              </button>
            </form>
            <p className="mt-6 text-sm text-[#d8dbde]">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-bold uppercase tracking-[0.06em] text-white underline"
              >
                Log in instead
              </Link>
              .
            </p>
          </div>
        </section>
      </PageContainer>
    </div>
  );
}
