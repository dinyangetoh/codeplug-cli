import { useState } from 'react';

export function useAuth() {
  const [user, setUser] = useState<{ name: string; createdAt: Date } | null>(null);
  return { user, setUser };
}
