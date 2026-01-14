"use client";

import { createContext, useEffect, useMemo, useState } from "react";
import useContextWrapper from "./hooks/TournamentContextHook";
import { getSession } from "@/helpers/getsession";

// Source: https://medium.com/@nitinjha5121/mastering-react-context-with-typescript-a-comprehensive-tutorial-5bab5ef48a3b

export type UserAccountInfo = {
  name: string;
  role: "user" | "admin";
};

interface UserContext {
  user: UserAccountInfo | null;
  setUser: React.Dispatch<React.SetStateAction<UserContext["user"]>>;
}

export const UserContext = createContext<UserContext | null>(null);

interface UserContextProviderProps extends React.PropsWithChildren {
  initialUser?: UserAccountInfo | null;
}

export function UserContextProvider({ children, initialUser }: UserContextProviderProps) {
  const [user, setUser] = useState<UserContext["user"]>(initialUser ?? null);

  useEffect(() => {
    // Only fetch if we don't have initial user data
    if (initialUser !== undefined) {
      return;
    }

    async function getUserData() {
      const session = await getSession();
      if (!session.success) {
        setUser(null);
        return;
      }

      setUser(session.value);
    }
    getUserData();
  }, [initialUser]);

  const value = useMemo(
    () => ({
      user,
      setUser,
    }),
    [user],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUserContext() {
  return useContextWrapper(UserContext, {
    contextName: useUserContext.name,
    providerName: UserContextProvider.name,
  });
}
