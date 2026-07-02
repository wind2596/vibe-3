export type ExcelInspectResponse = {
  sheet_names: string[];
  selected_sheet: string;
  columns: string[];
  row_count: number;
  preview_rows: Array<Record<string, string | number | boolean | null>>;
};

export type ExcelPreviewResponse = {
  mode: 'split' | 'merge';
  sheet_name: string;
  key_columns: string[];
  group_count: number;
  total_rows: number;
  summary_rows: Array<{
    index: number;
    label: string;
    row_count: number;
  }>;
  preview_rows: Array<Record<string, string | number | boolean | null>>;
  output_sheet_names: string[];
};
