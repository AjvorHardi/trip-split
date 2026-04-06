import { type FormEvent, useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { LoadingBlock } from "../components/feedback/LoadingBlock";
import { useAuth } from "../features/auth/useAuth";
import {
  createGroupExpense,
  deleteGroupExpense,
  getGroup,
  inviteToGroup,
  listGroupExpenses,
  listGroupInvites,
  listGroupMembers,
  updateGroupExpense,
} from "../features/groups/groups.api";
import type {
  GroupDetail,
  GroupExpense,
  GroupExpenseInput,
  GroupInvite,
  MemberBalance,
  GroupMember,
} from "../features/groups/groups.types";
import { formatCents, parseAmountInputToCents } from "../lib/money";

function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function getDefaultPayerUserId(members: GroupMember[], currentUserId: string | undefined) {
  if (currentUserId && members.some((member) => member.userId === currentUserId)) {
    return currentUserId;
  }

  return members[0]?.userId ?? "";
}

function getDefaultParticipantIds(members: GroupMember[]) {
  return members.map((member) => member.userId);
}

function getBalanceLabel(netCents: number) {
  if (netCents > 0) {
    return `Gets back ${formatCents(netCents)}`;
  }

  if (netCents < 0) {
    return `Owes ${formatCents(Math.abs(netCents))}`;
  }

  return "Settled up";
}

function buildBalances(members: GroupMember[], expenses: GroupExpense[]): MemberBalance[] {
  const balanceByUserId = new Map(
    members.map((member) => [
      member.userId,
      {
        email: member.email,
        netCents: 0,
        userId: member.userId,
      },
    ]),
  );

  expenses.forEach((expense) => {
    const payerBalance = balanceByUserId.get(expense.payerUserId);

    if (payerBalance) {
      payerBalance.netCents += expense.amountCents;
    }

    expense.participants.forEach((participant) => {
      const participantBalance = balanceByUserId.get(participant.userId);

      if (participantBalance) {
        participantBalance.netCents -= participant.owedCents;
      }
    });
  });

  return members.map((member) => balanceByUserId.get(member.userId) ?? {
    email: member.email,
    netCents: 0,
    userId: member.userId,
  });
}

export function GroupPage() {
  const { groupId } = useParams();
  const { user } = useAuth();
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [expenses, setExpenses] = useState<GroupExpense[]>([]);
  const [invites, setInvites] = useState<GroupInvite[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [expenseDescription, setExpenseDescription] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [payerUserId, setPayerUserId] = useState("");
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<string[]>([]);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviting, setIsInviting] = useState(false);
  const [isSavingExpense, setIsSavingExpense] = useState(false);
  const [activeDeleteExpenseId, setActiveDeleteExpenseId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (members.length === 0) {
      setPayerUserId("");
      setSelectedParticipantIds([]);
      return;
    }

    setPayerUserId((currentValue) => {
      if (currentValue && members.some((member) => member.userId === currentValue)) {
        return currentValue;
      }

      return getDefaultPayerUserId(members, user?.id);
    });

    setSelectedParticipantIds((currentValue) => {
      const validSelection = currentValue.filter((userId) =>
        members.some((member) => member.userId === userId),
      );

      if (validSelection.length > 0) {
        return validSelection;
      }

      return getDefaultParticipantIds(members);
    });
  }, [members, user?.id]);

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
        const [nextGroup, nextMembers, nextInvites, nextExpenses] = await Promise.all([
          getGroup(groupId),
          listGroupMembers(groupId),
          listGroupInvites(groupId),
          listGroupExpenses(groupId),
        ]);

        if (!isMounted) {
          return;
        }

        setGroup(nextGroup);
        setMembers(nextMembers);
        setInvites(nextInvites);
        setExpenses(nextExpenses);
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

  const balances = buildBalances(members, expenses);
  const memberEmailById = new Map(members.map((member) => [member.userId, member.email]));
  const selectedParticipantCount = selectedParticipantIds.length;

  const resetExpenseForm = () => {
    setEditingExpenseId(null);
    setExpenseDescription("");
    setAmountInput("");
    setPayerUserId(getDefaultPayerUserId(members, user?.id));
    setSelectedParticipantIds(getDefaultParticipantIds(members));
  };

  const handleParticipantToggle = (participantUserId: string) => {
    setSelectedParticipantIds((currentValue) =>
      currentValue.includes(participantUserId)
        ? currentValue.filter((userId) => userId !== participantUserId)
        : [...currentValue, participantUserId],
    );
  };

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

  const handleExpenseSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!groupId) {
      return;
    }

    const amountCents = parseAmountInputToCents(amountInput);

    if (!amountCents) {
      setSuccessMessage(null);
      setErrorMessage("Enter a valid amount with up to two decimals.");
      return;
    }

    if (!payerUserId) {
      setSuccessMessage(null);
      setErrorMessage("Select a payer for this expense.");
      return;
    }

    if (selectedParticipantIds.length === 0) {
      setSuccessMessage(null);
      setErrorMessage("Select at least one participant.");
      return;
    }

    const input: GroupExpenseInput = {
      amountCents,
      description: expenseDescription.trim(),
      participantUserIds: selectedParticipantIds,
      payerUserId,
    };

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSavingExpense(true);

    try {
      if (editingExpenseId) {
        await updateGroupExpense(editingExpenseId, input);
        setSuccessMessage("Expense updated.");
      } else {
        await createGroupExpense(groupId, input);
        setSuccessMessage("Expense saved.");
      }

      resetExpenseForm();
      setReloadKey((value) => value + 1);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to save the expense.",
      );
    } finally {
      setIsSavingExpense(false);
    }
  };

  const handleEditExpense = (expense: GroupExpense) => {
    setEditingExpenseId(expense.id);
    setExpenseDescription(expense.description);
    setAmountInput(formatCents(expense.amountCents));
    setPayerUserId(expense.payerUserId);
    setSelectedParticipantIds(expense.participants.map((participant) => participant.userId));
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const handleDeleteExpense = async (expenseId: string) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setActiveDeleteExpenseId(expenseId);

    try {
      await deleteGroupExpense(expenseId);

      if (editingExpenseId === expenseId) {
        resetExpenseForm();
      }

      setSuccessMessage("Expense deleted.");
      setReloadKey((value) => value + 1);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to delete the expense.",
      );
    } finally {
      setActiveDeleteExpenseId(null);
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
              <p className="ts-kicker text-[var(--ts-muted)]">Balances</p>
              <h2 className="ts-display mt-3 text-[2.4rem] text-[var(--ts-ink)]">
                Who is owed what
              </h2>
            </div>
            <p className="text-sm uppercase tracking-[0.08em] text-[var(--ts-muted)]">
              {expenses.length} expenses
            </p>
          </div>

          {balances.length === 0 ? (
            <div className="ts-muted-box mt-6 px-5 py-6 text-sm text-[var(--ts-muted)]">
              Add members and expenses to calculate balances.
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {balances.map((balance) => (
                <div key={balance.userId} className="ts-list-tile px-5 py-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="ts-kicker text-[var(--ts-muted)]">Member</p>
                      <h3 className="mt-2 text-lg font-bold text-[var(--ts-ink)]">
                        {balance.email}
                      </h3>
                    </div>
                    {user?.id === balance.userId ? (
                      <span className="text-xs uppercase tracking-[0.08em] text-[var(--ts-muted)]">
                        You
                      </span>
                    ) : null}
                  </div>
                  <p
                    className={[
                      "mt-3 text-sm font-bold uppercase tracking-[0.08em]",
                      balance.netCents > 0
                        ? "text-[#136f3a]"
                        : balance.netCents < 0
                          ? "text-[var(--ts-danger)]"
                          : "text-[var(--ts-muted)]",
                    ].join(" ")}
                  >
                    {getBalanceLabel(balance.netCents)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="ts-panel-dark p-8 text-white">
          <p className="ts-kicker text-[var(--ts-cyan-soft)]">
            {editingExpenseId ? "Edit expense" : "Add expense"}
          </p>
          <h2 className="ts-display mt-3 text-[2.3rem]">
            {editingExpenseId ? "Update the split" : "Record a shared cost"}
          </h2>
          <p className="mt-4 text-sm leading-7 text-[#d8dbde]">
            Equal split only. Amounts are stored as integer cents in the database.
          </p>
          <form className="mt-6 space-y-4" onSubmit={handleExpenseSubmit}>
            <label className="block">
              <span className="ts-label text-white">Description</span>
              <input
                type="text"
                required
                maxLength={160}
                value={expenseDescription}
                onChange={(event) => setExpenseDescription(event.target.value)}
                className="ts-input bg-[#fffdf8]"
                placeholder="Dinner at the harbor"
              />
            </label>

            <label className="block">
              <span className="ts-label text-white">Amount</span>
              <input
                type="text"
                inputMode="decimal"
                required
                value={amountInput}
                onChange={(event) => setAmountInput(event.target.value)}
                className="ts-input bg-[#fffdf8]"
                placeholder="48.90"
              />
            </label>

            <label className="block">
              <span className="ts-label text-white">Payer</span>
              <select
                value={payerUserId}
                onChange={(event) => setPayerUserId(event.target.value)}
                className="ts-input bg-[#fffdf8]"
              >
                {members.map((member) => (
                  <option key={member.userId} value={member.userId}>
                    {member.email}
                  </option>
                ))}
              </select>
            </label>

            <fieldset>
              <legend className="ts-label text-white">Participants</legend>
              <div className="mt-2 space-y-3">
                {members.map((member) => (
                  <label
                    key={member.userId}
                    className="flex items-center gap-3 border-2 border-white/15 bg-white/6 px-3 py-3 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={selectedParticipantIds.includes(member.userId)}
                      onChange={() => handleParticipantToggle(member.userId)}
                      className="h-4 w-4 accent-[var(--ts-cyan)]"
                    />
                    <span>{member.email}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <p className="text-xs uppercase tracking-[0.08em] text-[#d8dbde]">
              Split equally across {selectedParticipantCount || 0} selected{" "}
              {selectedParticipantCount === 1 ? "person" : "people"}.
            </p>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSavingExpense}
                className="ts-button-primary flex-1 px-5 py-3 text-xs"
              >
                {isSavingExpense
                  ? editingExpenseId
                    ? "Updating..."
                    : "Saving..."
                  : editingExpenseId
                    ? "Update expense"
                    : "Save expense"}
              </button>
              {editingExpenseId ? (
                <button
                  type="button"
                  onClick={resetExpenseForm}
                  className="ts-button-secondary px-4 py-3 text-xs text-white"
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </form>
        </div>
      </div>

      <div className="ts-panel-light p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="ts-kicker text-[var(--ts-muted)]">Expenses</p>
            <h2 className="ts-display mt-3 text-[2.4rem] text-[var(--ts-ink)]">
              Group ledger
            </h2>
          </div>
          <p className="text-sm uppercase tracking-[0.08em] text-[var(--ts-muted)]">
            {expenses.length} recorded
          </p>
        </div>

        {expenses.length === 0 ? (
          <div className="ts-muted-box mt-6 px-5 py-6 text-sm text-[var(--ts-muted)]">
            No expenses yet. Add the first shared cost to start the ledger.
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {expenses.map((expense) => {
              const isCreator = expense.createdBy === user?.id;
              const isDeleting = activeDeleteExpenseId === expense.id;

              return (
                <div key={expense.id} className="ts-list-tile px-5 py-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="ts-kicker text-[var(--ts-muted)]">Expense</p>
                      <h3 className="ts-display mt-2 text-[1.9rem] text-[var(--ts-ink)]">
                        {expense.description}
                      </h3>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-[0.08em] text-[var(--ts-muted)]">
                        Total
                      </p>
                      <p className="mt-2 text-2xl font-bold text-[var(--ts-ink)]">
                        {formatCents(expense.amountCents)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
                    <div className="space-y-2 text-sm text-[var(--ts-muted)]">
                      <p>
                        Paid by{" "}
                        <span className="font-bold text-[var(--ts-ink)]">
                          {memberEmailById.get(expense.payerUserId) ?? "Unknown member"}
                        </span>
                      </p>
                      <p>Added {formatDateLabel(expense.createdAt)}</p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {expense.participants.map((participant) => (
                          <span
                            key={`${expense.id}-${participant.userId}`}
                            className="border-2 border-black/10 bg-white/55 px-3 py-2 text-xs uppercase tracking-[0.06em] text-[var(--ts-ink)]"
                          >
                            {(memberEmailById.get(participant.userId) ?? "Unknown member")
                              .split("@")[0]}
                            : {formatCents(participant.owedCents)}
                          </span>
                        ))}
                      </div>
                    </div>

                    {isCreator ? (
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => handleEditExpense(expense)}
                          className="ts-button-secondary px-4 py-2 text-xs"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeleteExpense(expense.id)}
                          disabled={isDeleting}
                          className="border-2 border-[var(--ts-danger)] px-4 py-2 text-xs font-bold uppercase tracking-[0.08em] text-[var(--ts-danger)] transition hover:bg-[var(--ts-danger)] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isDeleting ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

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
