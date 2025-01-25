export type TaskManagerStatus = "pending" | "processing" | "completed" | "failed" | "not_found";

export interface Task {
  date: string;
  status: TaskManagerStatus;
  data: Record<string, string | number>;
}
