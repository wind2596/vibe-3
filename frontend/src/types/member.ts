export type MemberItem = {
  id: number;
  team_id: number | null;
  name: string;
  role: string;
  created_at: string;
  updated_at: string | null;
};

export type MemberFormState = {
  team_id: string;
  name: string;
  role: string;
};
