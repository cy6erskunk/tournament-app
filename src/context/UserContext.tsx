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

export function UserContextProvider({ children }: React.PropsWithChildren<{}>) {
  const [user, setUser] = useState<UserContext["user"]>(null);

  useEffect(() => {
    async function getUserData() {
      const session = await getSession();
      if (!session.success) {
        setUser(null);
        return;
      }

      setUser(session.value);
    }
    getUserData();
  }, []);

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
