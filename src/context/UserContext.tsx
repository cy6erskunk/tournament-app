"use client";

import { createContext, useMemo, useState } from "react";
import useContextWrapper from "./hooks/TournamentContextHook";

// Source: https://medium.com/@nitinjha5121/mastering-react-context-with-typescript-a-comprehensive-tutorial-5bab5ef48a3b

type User = {
  name: string;
  role: string;
};

interface UserContext {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<UserContext["user"]>>;
}

export const UserContext = createContext<UserContext | null>(null);

export function UserContextProvider({ children }: React.PropsWithChildren<{}>) {
  const [user, setUser] = useState<UserContext["user"]>({
    name: "",
    role: "",
  });

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
