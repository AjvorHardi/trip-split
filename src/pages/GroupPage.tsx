import { Link, useParams } from "react-router";

export function GroupPage() {
  const { groupId } = useParams();

  return (
    <section className="ts-panel-light p-8">
      <p className="ts-kicker text-[var(--ts-muted)]">Group page</p>
      <h1 className="ts-display mt-3 text-[2.8rem] text-[var(--ts-ink)] sm:text-[4rem]">
        Group detail scaffold
      </h1>
      <p className="ts-copy mt-4 max-w-2xl text-sm">
        This route is reserved for members, expenses, invitations, and balances in
        phase 3 and phase 4. The current route parameter is{" "}
        <span className="font-bold uppercase tracking-[0.06em] text-[var(--ts-ink)]">
          {groupId ?? "missing"}
        </span>
        .
      </p>
      <Link to="/app/groups" className="ts-button-secondary mt-6 px-4 py-2 text-xs">
        Back to groups
      </Link>
    </section>
  );
}
