import { Link } from "react-router";
import { AppHeader } from "../components/layout/AppHeader";
import { PageContainer } from "../components/layout/PageContainer";

export function NotFoundPage() {
  return (
    <div className="ts-app-bg min-h-screen text-[var(--ts-ink)]">
      <AppHeader />
      <PageContainer className="py-12 sm:py-16">
        <section className="ts-panel-light mx-auto max-w-2xl p-10 text-center">
          <p className="ts-kicker text-[var(--ts-muted)]">404</p>
          <h1 className="ts-display mt-4 text-[3rem] text-[var(--ts-ink)] sm:text-[4.4rem]">
            That page is off the map.
          </h1>
          <p className="ts-copy mt-4 text-sm">
            The route you opened is outside the current Trip-Split scaffold.
          </p>
          <Link to="/" className="ts-button-primary mt-8 px-5 py-3 text-xs">
            Return home
          </Link>
        </section>
      </PageContainer>
    </div>
  );
}
