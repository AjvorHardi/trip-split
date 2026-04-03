import { NavLink, Outlet } from "react-router";
import { AppHeader } from "../components/layout/AppHeader";
import { PageContainer } from "../components/layout/PageContainer";

export function AppShell() {
  return (
    <div className="ts-app-bg min-h-screen text-[var(--ts-ink)]">
      <AppHeader />
      <PageContainer className="py-8 sm:py-10">
        <div className="grid gap-8 lg:grid-cols-[16rem_minmax(0,1fr)]">
          <aside className="ts-dark-stage h-fit border-2 border-black p-5 text-white">
            <p className="ts-kicker text-[var(--ts-cyan-soft)]">Workspace</p>
            <nav className="mt-4 space-y-2">
              <NavLink
                to="/app/groups"
                className={({ isActive }) =>
                  ["ts-nav-link", isActive ? "ts-nav-link-active" : ""].join(" ")
                }
              >
                Groups
              </NavLink>
            </nav>
          </aside>
          <main className="min-w-0">
            <Outlet />
          </main>
        </div>
      </PageContainer>
    </div>
  );
}
