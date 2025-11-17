import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { db } from './db';

interface DBContextType {
  isInitialized: boolean;
  error: Error | null;
}

const DBContext = createContext<DBContextType>({
  isInitialized: false,
  error: null,
});

export function DBProvider({ children }: { children: ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    db.init()
      .then(() => setIsInitialized(true))
      .catch((err) => setError(err));
  }, []);

  return (
    <DBContext.Provider value={{ isInitialized, error }}>
      {children}
    </DBContext.Provider>
  );
}

export function useDB() {
  const context = useContext(DBContext);
  return context;
}

export { db };
