export interface Session {
  id: string;
  name: string;
  taskId: string | null;
  tags: string[];
  startTime: number; // epoch ms
  endTime: number;   // epoch ms
  duration: number;  // ms
}

export interface Task {
  id: string;
  name: string;
  parentId: string | null;
  tags: string[];
  info: string;
  completed: boolean;
  order: number;
}

export interface TaskSessionStats {
  totalTime: number;
  sessionCount: number;
  averageTime: number;
}
