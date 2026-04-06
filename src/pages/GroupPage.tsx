import { type FormEvent, useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { LoadingBlock } from "../components/feedback/LoadingBlock";
import { useAuth } from "../features/auth/useAuth";
import {
  getGroup,
  inviteToGroup,
  listGroupInvites,
  listGroupMembers,
} from "../features/groups/groups.api";
import type {
  GroupDetail,
  GroupInvite,
  GroupMember,
} from "../features/groups/groups.types";

function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function GroupPage() {
  const { groupId } = useParams();
  const { user } = useAuth();
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [invites, setInvites] = useState<GroupInvite[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviting, setIsInviting] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const loadGroupPage = async () => {
      if (!groupId) {
        setErrorMessage("Group id is missing from the route.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const [nextGroup, nextMembers, nextInvites] = await Promise.all([
          getGroup(groupId),
          listGroupMembers(groupId),
          listGroupInvites(groupId),
        ]);

        if (!isMounted) {
          return;
        }

        setGroup(nextGroup);
        setMembers(nextMembers);
        setInvites(nextInvites);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(
          error instanceof Error ? error.message : "Unable to load this group.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadGroupPage();

    return () => {
      isMounted = false;
    };
  }, [groupId, reloadKey]);

  const handleInviteSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!groupId) {
      return;
    }

    const normalizedInviteEmail = normalizeEmail(inviteEmail);

    if (invites.some((invite) => normalizeEmail(invite.email) === normalizedInviteEmail)) {
      setSuccessMessage(null);
      setErrorMessage("An invitation is already pending for that email.");
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsInviting(true);

    try {
      await inviteToGroup(groupId, normalizedInviteEmail);
      setInviteEmail("");
      setSuccessMessage("Invitation saved.");
      setReloadKey((value) => value + 1);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to send the invitation.",
      );
    } finally {
      setIsInviting(false);
    }
  };

  if (isLoading) {
    return (
      <LoadingBlock
        title="Loading group"
        message="Trip-Split is pulling members and invitations for this group."
      />
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="ts-kicker text-[var(--ts-muted)]">Group page</p>
          <h1 className="ts-display mt-3 text-[2.8rem] text-[var(--ts-ink)] sm:text-[4rem]">
            {group?.name ?? "Unknown group"}
          </h1>
          {group ? (
            <p className="ts-copy mt-4 max-w-2xl text-sm">
              Created {formatDateLabel(group.createdAt)}. Members can invite by email
              and review who already has access.
            </p>
          ) : null}
        </div>
        <Link to="/app/groups" className="ts-button-secondary px-4 py-2 text-xs">
          Back to groups
        </Link>
      </div>

      {errorMessage ? (
        <div className="ts-alert px-4 py-3 text-sm" role="alert">
          {errorMessage}
        </div>
      ) : null}

      {successMessage ? (
        <div
          className="border-2 border-[rgba(0,168,232,0.32)] bg-[rgba(0,168,232,0.08)] px-4 py-3 text-sm text-[var(--ts-ink)]"
          role="status"
        >
          {successMessage}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="ts-panel-light p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="ts-kicker text-[var(--ts-muted)]">Members</p>
              <h2 className="ts-display mt-3 text-[2.4rem] text-[var(--ts-ink)]">
                Who is in
              </h2>
            </div>
            <p className="text-sm uppercase tracking-[0.08em] text-[var(--ts-muted)]">
              {members.length} total
            </p>
          </div>

          {members.length === 0 ? (
            <div className="ts-muted-box mt-6 px-5 py-6 text-sm text-[var(--ts-muted)]">
              No members are attached to this group yet.
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {members.map((member) => (
                <div key={member.userId} className="ts-list-tile px-5 py-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="ts-kicker text-[var(--ts-muted)]">Member</p>
                      <h3 className="mt-2 text-lg font-bold text-[var(--ts-ink)]">
                        {member.email}
                      </h3>
                    </div>
                    {user?.id === member.userId ? (
                      <span className="text-xs uppercase tracking-[0.08em] text-[var(--ts-muted)]">
                        You
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-3 text-sm text-[var(--ts-muted)]">
                    Joined {formatDateLabel(member.joinedAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="ts-panel-dark p-8 text-white">
            <p className="ts-kicker text-[var(--ts-cyan-soft)]">Invite by email</p>
            <h2 className="ts-display mt-3 text-[2.3rem]">Bring someone in</h2>
            <p className="mt-4 text-sm leading-7 text-[#d8dbde]">
              Invitations stay pending until the invited account accepts from the
              dashboard.
            </p>
            <form className="mt-6 space-y-4" onSubmit={handleInviteSubmit}>
              <label className="block">
                <span className="ts-label text-white">Email</span>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(event) => setInviteEmail(event.target.value)}
                  className="ts-input bg-[#fffdf8]"
                  placeholder="friend@example.com"
                />
              </label>
              <button
                type="submit"
                disabled={isInviting}
                className="ts-button-primary w-full px-5 py-3 text-xs"
              >
                {isInviting ? "Sending..." : "Send invite"}
              </button>
            </form>
          </div>

          <div className="ts-panel-light p-8">
            <p className="ts-kicker text-[var(--ts-muted)]">Pending invites</p>
            <h2 className="ts-display mt-3 text-[2.2rem] text-[var(--ts-ink)]">
              Waiting to join
            </h2>

            {invites.length === 0 ? (
              <div className="ts-muted-box mt-6 px-5 py-6 text-sm text-[var(--ts-muted)]">
                No open invites for this group.
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {invites.map((invite) => (
                  <div key={invite.id} className="ts-list-tile px-5 py-5">
                    <p className="ts-kicker text-[var(--ts-muted)]">Invite</p>
                    <h3 className="mt-2 text-lg font-bold text-[var(--ts-ink)]">
                      {invite.email}
                    </h3>
                    <p className="mt-3 text-sm text-[var(--ts-muted)]">
                      Sent {formatDateLabel(invite.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
