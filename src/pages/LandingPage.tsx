import { Link } from "react-router";
import { AppHeader } from "../components/layout/AppHeader";
import { PageContainer } from "../components/layout/PageContainer";

const productPoints = [
  "Create trip groups with only the people involved.",
  "Track shared expenses in cents with a single payer.",
  "Keep invitations and balances inside the app.",
];

export function LandingPage() {
  return (
    <div className="ts-app-bg min-h-screen text-[var(--ts-ink)]">
      <AppHeader />
      <PageContainer className="py-10 sm:py-14">
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
          <div className="ts-panel-light p-7 sm:p-10">
            <p className="ts-kicker text-[var(--ts-muted)]">
              Shared expense tracker
            </p>
            <h1 className="ts-display mt-5 max-w-4xl text-[3.6rem] text-[var(--ts-ink)] sm:text-[5.6rem]">
              Sharp group tracking for trips, cabins, weekends, and chaos.
            </h1>
            <p className="ts-copy mt-6 max-w-2xl">
              Trip-Split keeps shared costs visible without turning the trip into an
              accounting exercise. Create a group, invite people by email, log what
              happened, and keep the totals readable.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/signup" className="ts-button-primary px-5 py-3 text-xs">
                Create an account
              </Link>
              <Link to="/login" className="ts-button-secondary px-5 py-3 text-xs">
                Log in
              </Link>
            </div>
          </div>

          <div className="ts-panel-dark p-7 text-white">
            <p className="ts-kicker text-[var(--ts-cyan-soft)]">MVP scope</p>
            <ul className="mt-5 space-y-3 text-sm leading-7 text-[#d8dbde]">
              {productPoints.map((point) => (
                <li
                  key={point}
                  className="border border-white/14 bg-white/4 px-4 py-3 uppercase tracking-[0.04em]"
                >
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-3">
          <article className="ts-panel-light p-6">
            <p className="ts-kicker text-[var(--ts-cyan)]">Groups</p>
            <h2 className="ts-display mt-3 text-4xl">Private by default</h2>
            <p className="ts-copy mt-4 text-sm">
              Each person only sees the groups they belong to. No shared mess across
              unrelated trips.
            </p>
          </article>
          <article className="ts-panel-light p-6">
            <p className="ts-kicker text-[var(--ts-cyan)]">Invites</p>
            <h2 className="ts-display mt-3 text-4xl">Email first</h2>
            <p className="ts-copy mt-4 text-sm">
              Invite by email even before someone registers. Pending invites stay
              visible in the app.
            </p>
          </article>
          <article className="ts-panel-light p-6">
            <p className="ts-kicker text-[var(--ts-cyan)]">Expenses</p>
            <h2 className="ts-display mt-3 text-4xl">Cents stay exact</h2>
            <p className="ts-copy mt-4 text-sm">
              Expenses are stored in integer cents, one payer at a time, with equal
              split only for the MVP.
            </p>
          </article>
        </section>
      </PageContainer>
    </div>
  );
}
