import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { Session } from '../types';
import { loadData, saveData, KEYS } from './storage';

interface SessionContextType {
  sessions: Session[];
  addSession: (session: Omit<Session, 'id'>) => Session;
  updateSession: (session: Session) => void;
  deleteSession: (id: string) => void;
  getSession: (id: string) => Session | undefined;
  loaded: boolean;
}

const SessionContext = createContext<SessionContextType>({
  sessions: [],
  addSession: () => ({ id: '', name: '', taskId: null, tags: [], startTime: 0, endTime: 0, duration: 0 }),
  updateSession: () => {},
  deleteSession: () => {},
  getSession: () => undefined,
  loaded: false,
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadData<Session[]>(KEYS.SESSIONS).then((data) => {
      if (data) setSessions(data);
      setLoaded(true);
    });
  }, []);

  const persist = useCallback((newSessions: Session[]) => {
    setSessions(newSessions);
    saveData(KEYS.SESSIONS, newSessions);
  }, []);

  const addSession = useCallback((sessionData: Omit<Session, 'id'>): Session => {
    const newSession: Session = { ...sessionData, id: uuidv4() };
    persist([...sessions, newSession]);
    return newSession;
  }, [sessions, persist]);

  const updateSession = useCallback((session: Session) => {
    persist(sessions.map((s) => (s.id === session.id ? session : s)));
  }, [sessions, persist]);

  const deleteSession = useCallback((id: string) => {
    persist(sessions.filter((s) => s.id !== id));
  }, [sessions, persist]);

  const getSession = useCallback((id: string) => {
    return sessions.find((s) => s.id === id);
  }, [sessions]);

  return (
    <SessionContext.Provider value={{ sessions, addSession, updateSession, deleteSession, getSession, loaded }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSessions() {
  return useContext(SessionContext);
}
