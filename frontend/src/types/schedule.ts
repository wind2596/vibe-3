export type ScheduleItem = {
  id: number;
  member_id: number;
  member_name: string | null;
  category: string;
  title: string;
  start_at: string;
  end_at: string;
  memo: string | null;
  all_day: boolean;
  created_at: string;
  updated_at: string | null;
};

export type ScheduleFormState = {
  member_id: string;
  category: string;
  title: string;
  start_at: string;
  end_at: string;
  memo: string;
  all_day: boolean;
};
