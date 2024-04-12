import { Result } from "@/types/result";

// SOURCE: https://dev.to/maafaishal/safely-use-jsonparse-in-typescript-12e7
const jsonParser = <T>(str: string): Result<T, string> => {
  try {
    const value: T = JSON.parse(str);

    return { success: true, value };
  } catch {
    return { success: false, error: "Could not parse recieved body"};
  }
};

export { jsonParser }
