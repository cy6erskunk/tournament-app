import { useContext } from "react";

// Source: https://medium.com/@nitinjha5121/mastering-react-context-with-typescript-a-comprehensive-tutorial-5bab5ef48a3b

interface Config {
  contextName: string;
  providerName: string;
}

function useContextWrapper<T>(ReactContext: React.Context<T>, config: Config) {
  const context = useContext(ReactContext);
  const { contextName, providerName } = config;

  if (!context) {
    throw new Error(`${contextName} must be used within a ${providerName}`);
  }

  return context;
}

export default useContextWrapper;
