import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { Task, TaskSessionStats, Session } from '../types';
import { loadData, saveData, KEYS } from './storage';

interface TaskContextType {
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'order'>) => Task;
  updateTask: (task: Task) => void;
  deleteTask: (id: string) => void;
  getTask: (id: string) => Task | undefined;
  getSubtasks: (parentId: string | null) => Task[];
  getTaskPath: (taskId: string) => string;
  loaded: boolean;
}

const TaskContext = createContext<TaskContextType>({
  tasks: [],
  addTask: () => ({ id: '', name: '', parentId: null, tags: [], info: '', completed: false, order: 0 }),
  updateTask: () => {},
  deleteTask: () => {},
  getTask: () => undefined,
  getSubtasks: () => [],
  getTaskPath: () => '',
  loaded: false,
});

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadData<Task[]>(KEYS.TASKS).then((data) => {
      if (data) setTasks(data);
      setLoaded(true);
    });
  }, []);

  const persist = useCallback((newTasks: Task[]) => {
    setTasks(newTasks);
    saveData(KEYS.TASKS, newTasks);
  }, []);

  const addTask = useCallback((taskData: Omit<Task, 'id' | 'order'>): Task => {
    const siblings = tasks.filter((t) => t.parentId === taskData.parentId);
    const newTask: Task = {
      ...taskData,
      id: uuidv4(),
      order: siblings.length,
    };
    persist([...tasks, newTask]);
    return newTask;
  }, [tasks, persist]);

  const updateTask = useCallback((task: Task) => {
    persist(tasks.map((t) => (t.id === task.id ? task : t)));
  }, [tasks, persist]);

  const deleteTaskRecursive = useCallback((id: string) => {
    const idsToDelete = new Set<string>();
    const collectIds = (parentId: string) => {
      idsToDelete.add(parentId);
      tasks.filter((t) => t.parentId === parentId).forEach((t) => collectIds(t.id));
    };
    collectIds(id);
    persist(tasks.filter((t) => !idsToDelete.has(t.id)));
  }, [tasks, persist]);

  const getTask = useCallback((id: string) => {
    return tasks.find((t) => t.id === id);
  }, [tasks]);

  const getSubtasks = useCallback((parentId: string | null) => {
    return tasks.filter((t) => t.parentId === parentId).sort((a, b) => a.order - b.order);
  }, [tasks]);

  const getTaskPath = useCallback((taskId: string): string => {
    const parts: string[] = [];
    let current = tasks.find((t) => t.id === taskId);
    while (current) {
      parts.unshift(current.name || 'Untitled');
      current = current.parentId ? tasks.find((t) => t.id === current!.parentId) : undefined;
    }
    return parts.join(' › ');
  }, [tasks]);

  return (
    <TaskContext.Provider
      value={{
        tasks,
        addTask,
        updateTask,
        deleteTask: deleteTaskRecursive,
        getTask,
        getSubtasks,
        getTaskPath,
        loaded,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks() {
  return useContext(TaskContext);
}

export function useTaskSessionStats(taskId: string, sessions: Session[]): TaskSessionStats {
  const linked = sessions.filter((s) => s.taskId === taskId);
  const totalTime = linked.reduce((sum, s) => sum + s.duration, 0);
  return {
    totalTime,
    sessionCount: linked.length,
    averageTime: linked.length > 0 ? totalTime / linked.length : 0,
  };
}
