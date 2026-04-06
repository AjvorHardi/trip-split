export type GroupSummary = {
  archivedAt: string | null;
  createdAt: string;
  createdBy: string;
  id: string;
  name: string;
};

export type PendingInvite = {
  createdAt: string;
  groupId: string;
  groupName: string;
  id: string;
};

export type GroupMember = {
  email: string;
  joinedAt: string;
  userId: string;
};

export type GroupInvite = {
  createdAt: string;
  email: string;
  id: string;
  status: "accepted" | "pending";
};

export type GroupDetail = GroupSummary;

export type ExpenseParticipant = {
  expenseId: string;
  owedCents: number;
  userId: string;
};

export type GroupExpense = {
  amountCents: number;
  createdAt: string;
  createdBy: string;
  description: string;
  id: string;
  participants: ExpenseParticipant[];
  payerUserId: string;
};

export type GroupExpenseInput = {
  amountCents: number;
  description: string;
  participantUserIds: string[];
  payerUserId: string;
};

export type MemberBalance = {
  email: string;
  netCents: number;
  userId: string;
};
