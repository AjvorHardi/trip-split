import { Link } from "react-router";

const nextSteps = [
  "List the groups the signed-in user belongs to.",
  "Show pending invitations matched by the current auth email.",
  "Create the first group through an RPC-backed form.",
];

export function GroupsPage() {
  return (
    <section className="space-y-6">
      <div className="ts-panel-light p-8">
        <p className="ts-kicker text-[var(--ts-muted)]">Dashboard</p>
        <h1 className="ts-display mt-3 text-[3rem] text-[var(--ts-ink)] sm:text-[4.5rem]">
          Groups and invites arrive next.
        </h1>
        <p className="ts-copy mt-4 max-w-2xl text-sm">
          Auth is already live. The next phase connects this protected area to real
          group membership, pending invitations, and RPC-backed writes.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="ts-panel-light p-8">
          <h2 className="ts-display text-[2.4rem] text-[var(--ts-ink)]">
            Next build targets
          </h2>
          <ul className="mt-5 space-y-3 text-sm leading-6 text-[var(--ts-muted)]">
            {nextSteps.map((step) => (
              <li key={step} className="ts-list-tile px-4 py-3 uppercase tracking-[0.05em]">
                {step}
              </li>
            ))}
          </ul>
        </div>

        <div className="ts-panel-dark p-8 text-white">
          <p className="ts-kicker text-[var(--ts-cyan-soft)]">Preview route</p>
          <h2 className="ts-display mt-3 text-[2.3rem]">Group detail placeholder</h2>
          <p className="mt-4 text-sm leading-7 text-[#d8dbde]">
            Use the scaffolded detail route to confirm protected nested routing is
            wired correctly before phase 3 starts.
          </p>
          <Link
            to="/app/groups/sample-group"
            className="ts-button-primary mt-6 px-4 py-2 text-xs"
          >
            Open sample route
          </Link>
        </div>
      </div>
    </section>
  );
}
