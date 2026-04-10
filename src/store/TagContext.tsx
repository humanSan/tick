import React, { createContext, useContext, useMemo } from 'react';
import { useSessions } from './SessionContext';
import { useTasks } from './TaskContext';

interface TagContextType {
  allTags: string[];
}

const TagContext = createContext<TagContextType>({ allTags: [] });

export function TagProvider({ children }: { children: React.ReactNode }) {
  const { sessions } = useSessions();
  const { tasks } = useTasks();

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    sessions.forEach((s) => s.tags.forEach((t) => tagSet.add(t)));
    tasks.forEach((t) => t.tags.forEach((tag) => tagSet.add(tag)));
    return Array.from(tagSet).sort();
  }, [sessions, tasks]);

  return (
    <TagContext.Provider value={{ allTags }}>
      {children}
    </TagContext.Provider>
  );
}

export function useTags() {
  return useContext(TagContext);
}
