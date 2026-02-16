import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

type SettingsContextValue = {
  username: string;
  setUsername: (username: string) => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

const STORAGE_KEY = 'chess-dashboard-username';

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [username, setUsernameState] = useState(() => {
    if (typeof window === 'undefined') {
      return '';
    }
    return localStorage.getItem(STORAGE_KEY) || '';
  });

  const setUsername = (nextUsername: string) => {
    const normalized = nextUsername.trim();
    setUsernameState(normalized);
    if (typeof window !== 'undefined') {
      if (normalized) {
        localStorage.setItem(STORAGE_KEY, normalized);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  };

  const value = useMemo(
    () => ({
      username,
      setUsername
    }),
    [username]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used inside SettingsProvider');
  }
  return context;
}
