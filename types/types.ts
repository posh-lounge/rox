export type Priority = 'High' | 'Medium' | 'Low';
export type Status = 'Pending' | 'In Progress' | 'Completed' | 'Canceled';

export interface Task {
  taskId: string;       // unique identifier
  title: string;
  description: string | null;
  priority: Priority;
  status: Status;
  cancel_reason: string | null;
  task_date: string;        // YYYY-MM-DD
  start_time: string;       // HH:MM:SS or HH:MM
  end_time: string;         // HH:MM:SS or HH:MM
  created_by: string;       // userId
  created_at: string;       // ISO timestamp
  updated_at: string;       // ISO timestamp
}

// Optional: form data type (no id, timestamps, etc.)
export type TaskFormData = Omit<Task, 'id' | 'created_at' | 'updated_at'>;
export type Profile = {
    userno:string;
    first_name:string;
    last_name:string;
    email:string;
    phonenumber:string;
    added_by:string;
    added_date:string;
}