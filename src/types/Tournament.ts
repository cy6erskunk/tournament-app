import { Tournaments } from "@/types/Kysely";

// Wrapper type for Tournaments with a normalized id, date, and require_submitter_identity
// types instead of the generated ones from Kysely
type Tournament = Tournaments & {
  id: number;
  date: Date;
  require_submitter_identity: boolean;
};
export default Tournament;
