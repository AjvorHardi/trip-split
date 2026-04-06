import { type FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { LoadingBlock } from "../components/feedback/LoadingBlock";
import {
  acceptGroupInvite,
  createGroup,
  listGroups,
  listPendingInvites,
} from "../features/groups/groups.api";
import type { GroupSummary, PendingInvite } from "../features/groups/groups.types";

function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export function GroupsPage() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [groupName, setGroupName] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [activeInviteId, setActiveInviteId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const [nextGroups, nextInvites] = await Promise.all([listGroups(), listPendingInvites()]);

        if (!isMounted) {
          return;
        }

        setGroups(nextGroups);
        setPendingInvites(nextInvites);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(
          error instanceof Error ? error.message : "Unable to load groups right now.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [reloadKey]);

  const handleCreateGroup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setErrorMessage(null);
    setIsCreating(true);

    try {
      const nextGroupId = await createGroup(groupName);
      setGroupName("");
      navigate(`/app/groups/${nextGroupId}`);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to create the group.",
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleAcceptInvite = async (inviteId: string) => {
    setErrorMessage(null);
    setActiveInviteId(inviteId);

    try {
      const groupId = await acceptGroupInvite(inviteId);
      navigate(`/app/groups/${groupId}`);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to accept the invitation.",
      );
      setActiveInviteId(null);
      setReloadKey((value) => value + 1);
    }
  };

  if (isLoading) {
    return (
      <LoadingBlock
        title="Loading groups"
        message="Trip-Split is pulling your memberships and open invitations."
      />
    );
  }

  return (
    <section className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="ts-panel-light p-8">
          <p className="ts-kicker text-[var(--ts-muted)]">Dashboard</p>
          <h1 className="ts-display mt-3 text-[3rem] text-[var(--ts-ink)] sm:text-[4.5rem]">
            Shared groups, no guesswork.
          </h1>
          <p className="ts-copy mt-4 max-w-2xl text-sm">
            This area now shows the groups you belong to and the invitations waiting
            on your account email.
          </p>
        </div>

        <div className="ts-panel-dark p-8 text-white">
          <p className="ts-kicker text-[var(--ts-cyan-soft)]">Create group</p>
          <h2 className="ts-display mt-3 text-[2.3rem]">Start a new ledger</h2>
          <p className="mt-4 text-sm leading-7 text-[#d8dbde]">
            Creating a group adds you as the first member immediately.
          </p>
          <form className="mt-6 space-y-4" onSubmit={handleCreateGroup}>
            <label className="block">
              <span className="ts-label text-white">Group name</span>
              <input
                type="text"
                required
                maxLength={80}
                value={groupName}
                onChange={(event) => setGroupName(event.target.value)}
                className="ts-input bg-[#fffdf8]"
                placeholder="Summer coast trip"
              />
            </label>
            <button
              type="submit"
              disabled={isCreating}
              className="ts-button-primary w-full px-5 py-3 text-xs"
            >
              {isCreating ? "Creating..." : "Create group"}
            </button>
          </form>
        </div>
      </div>

      {errorMessage ? (
        <div className="ts-alert px-4 py-3 text-sm" role="alert">
          {errorMessage}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="ts-panel-light p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="ts-kicker text-[var(--ts-muted)]">Your groups</p>
              <h2 className="ts-display mt-3 text-[2.4rem] text-[var(--ts-ink)]">
                Memberships
              </h2>
            </div>
            <p className="text-sm uppercase tracking-[0.08em] text-[var(--ts-muted)]">
              {groups.length} total
            </p>
          </div>

          {groups.length === 0 ? (
            <div className="ts-muted-box mt-6 px-5 py-6 text-sm text-[var(--ts-muted)]">
              You are not a member of any groups yet. Create one or accept an invite.
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {groups.map((group) => (
                <Link
                  key={group.id}
                  to={`/app/groups/${group.id}`}
                  className="ts-list-tile block px-5 py-5 transition-transform duration-150 hover:-translate-x-[2px] hover:-translate-y-[2px]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="ts-kicker text-[var(--ts-muted)]">Group</p>
                      <h3 className="ts-display mt-2 text-[2rem] text-[var(--ts-ink)]">
                        {group.name}
                      </h3>
                    </div>
                    <span className="text-xs uppercase tracking-[0.08em] text-[var(--ts-muted)]">
                      {formatDateLabel(group.createdAt)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="ts-panel-light p-8">
          <p className="ts-kicker text-[var(--ts-muted)]">Pending invites</p>
          <h2 className="ts-display mt-3 text-[2.3rem] text-[var(--ts-ink)]">
            Awaiting your reply
          </h2>

          {pendingInvites.length === 0 ? (
            <div className="ts-muted-box mt-6 px-5 py-6 text-sm text-[var(--ts-muted)]">
              No open invitations for your current account email.
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {pendingInvites.map((invite) => {
                const isAccepting = activeInviteId === invite.id;

                return (
                  <div key={invite.id} className="ts-list-tile px-5 py-5">
                    <p className="ts-kicker text-[var(--ts-muted)]">Invitation</p>
                    <h3 className="ts-display mt-2 text-[1.8rem] text-[var(--ts-ink)]">
                      {invite.groupName}
                    </h3>
                    <p className="mt-3 text-sm text-[var(--ts-muted)]">
                      Sent {formatDateLabel(invite.createdAt)}
                    </p>
                    <button
                      type="button"
                      onClick={() => void handleAcceptInvite(invite.id)}
                      disabled={isAccepting}
                      className="ts-button-primary mt-5 w-full px-4 py-3 text-xs"
                    >
                      {isAccepting ? "Joining..." : "Accept invite"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
