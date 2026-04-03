import { Link } from "react-router";
import { useAuth } from "../../features/auth/useAuth";

export function AppHeader() {
  const { signOut, user } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Failed to sign out", error);
    }
  };

  return (
    <header className="border-b-2 border-black/80 bg-[rgba(249,245,237,0.94)] backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link
          to="/"
          className="ts-display inline-flex text-[2.2rem] text-[var(--ts-ink)] sm:text-[2.8rem]"
        >
          Trip-Split
        </Link>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <p className="hidden max-w-56 truncate text-sm uppercase tracking-[0.08em] text-[var(--ts-muted)] sm:block">
                {user.email}
              </p>
              <button
                type="button"
                onClick={handleSignOut}
                className="ts-button-secondary px-4 py-2 text-xs"
              >
                Sign out
              </button>
            </>
          ) : (
            <nav className="flex items-center gap-3">
              <Link to="/login" className="ts-button-secondary px-4 py-2 text-xs">
                Log in
              </Link>
              <Link to="/signup" className="ts-button-primary px-4 py-2 text-xs">
                Sign up
              </Link>
            </nav>
          )}
        </div>
      </div>
    </header>
  );
}
