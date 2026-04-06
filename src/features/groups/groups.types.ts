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
