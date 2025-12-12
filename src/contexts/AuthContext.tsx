import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
  };
}

interface AuthContextType {
  user: User | null;
  session: any | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Check localStorage for existing session
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setSession({ user: parsedUser });
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    // Mock authentication - in production, replace with your auth API
    const mockUser: User = {
      id: '1',
      email,
      user_metadata: { full_name: 'User' },
    };
    setUser(mockUser);
    setSession({ user: mockUser });
    localStorage.setItem('user', JSON.stringify(mockUser));
  };

  const signUp = async (email: string, password: string, name: string) => {
    // Mock signup - in production, replace with your auth API
    const mockUser: User = {
      id: '1',
      email,
      user_metadata: { full_name: name },
    };
    setUser(mockUser);
    setSession({ user: mockUser });
    localStorage.setItem('user', JSON.stringify(mockUser));
  };

  const signOut = async () => {
    setUser(null);
    setSession(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut, signIn, signUp }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
