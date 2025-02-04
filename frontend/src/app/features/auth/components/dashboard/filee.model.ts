// file.model.ts
export interface Filee {
    id: number;
    filename: string;
    status: string;
    file_url: string;
    created_at: string;
    updated_at: string;
    error_message: string;
    invalid_records_excel_url?: string;  // Optional because it might not be available if no error occurs
  }
  