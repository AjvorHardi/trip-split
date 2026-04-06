import { supabase } from "../../lib/supabase";
import type {
  GroupDetail,
  GroupInvite,
  GroupMember,
  GroupSummary,
  PendingInvite,
} from "./groups.types";

type PendingInviteRow = {
  created_at: string;
  group_id: string;
  group_name: string;
  invite_id: string;
};

type GroupMemberRow = {
  joined_at: string;
  profile:
    | {
        email: string;
      }
    | {
        email: string;
      }[]
    | null;
  user_id: string;
};

function getProfileEmail(
  profile: GroupMemberRow["profile"],
) {
  if (Array.isArray(profile)) {
    return profile[0]?.email ?? "Unknown member";
  }

  if (!profile) {
    return "Unknown member";
  }

  return profile.email;
}

type GroupInviteRow = {
  created_at: string;
  email: string;
  id: string;
  status: "accepted" | "pending";
};

type GroupRow = {
  archived_at: string | null;
  created_at: string;
  created_by: string;
  id: string;
  name: string;
};

function throwSupabaseError(error: unknown) {
  if (!error) {
    return;
  }

  if (error instanceof Error) {
    throw error;
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    throw new Error(String(error.message));
  }

  throw new Error("Unexpected Supabase error.");
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function mapGroup(row: GroupRow): GroupSummary {
  return {
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    createdBy: row.created_by,
    id: row.id,
    name: row.name,
  };
}

export async function listGroups() {
  const { data, error } = await supabase
    .from("groups")
    .select("id, name, created_at, created_by, archived_at")
    .is("archived_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    throwSupabaseError(error);
  }

  return ((data ?? []) as GroupRow[]).map(mapGroup);
}

export async function createGroup(name: string) {
  const { data, error } = await supabase.rpc("create_group_with_creator_membership", {
    group_name: name,
  });

  if (error) {
    throwSupabaseError(error);
  }

  if (typeof data !== "string") {
    throw new Error("Supabase did not return the new group id.");
  }

  return data;
}

export async function listPendingInvites() {
  const { data, error } = await supabase.rpc("list_pending_group_invites");

  if (error) {
    throwSupabaseError(error);
  }

  return ((data ?? []) as PendingInviteRow[]).map<PendingInvite>((row) => ({
    createdAt: row.created_at,
    groupId: row.group_id,
    groupName: row.group_name,
    id: row.invite_id,
  }));
}

export async function acceptGroupInvite(inviteId: string) {
  const { data, error } = await supabase.rpc("accept_group_invite", {
    target_invite_id: inviteId,
  });

  if (error) {
    throwSupabaseError(error);
  }

  if (typeof data !== "string") {
    throw new Error("Supabase did not return the accepted group id.");
  }

  return data;
}

export async function getGroup(groupId: string) {
  const { data, error } = await supabase
    .from("groups")
    .select("id, name, created_at, created_by, archived_at")
    .eq("id", groupId)
    .maybeSingle();

  if (error) {
    throwSupabaseError(error);
  }

  if (!data) {
    throw new Error("You are not a member of this group.");
  }

  return mapGroup(data as GroupRow) as GroupDetail;
}

export async function listGroupMembers(groupId: string) {
  const { data, error } = await supabase
    .from("group_members")
    .select("user_id, joined_at, profile:profiles(email)")
    .eq("group_id", groupId)
    .order("joined_at", { ascending: true });

  if (error) {
    throwSupabaseError(error);
  }

  return ((data ?? []) as GroupMemberRow[]).map<GroupMember>((row) => ({
    email: getProfileEmail(row.profile),
    joinedAt: row.joined_at,
    userId: row.user_id,
  }));
}

export async function listGroupInvites(groupId: string) {
  const { data, error } = await supabase
    .from("group_invites")
    .select("id, email, status, created_at")
    .eq("group_id", groupId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    throwSupabaseError(error);
  }

  return ((data ?? []) as GroupInviteRow[]).map<GroupInvite>((row) => ({
    createdAt: row.created_at,
    email: row.email,
    id: row.id,
    status: row.status,
  }));
}

export async function inviteToGroup(groupId: string, email: string) {
  const { data, error } = await supabase.rpc("invite_to_group", {
    invite_email: normalizeEmail(email),
    target_group_id: groupId,
  });

  if (error) {
    throwSupabaseError(error);
  }

  if (typeof data !== "string") {
    throw new Error("Supabase did not return the new invite id.");
  }

  return data;
}
