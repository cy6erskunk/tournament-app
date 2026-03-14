import { Tournaments } from "@/types/Kysely";

// Use Omit to properly override Generated<T> columns with their runtime types
type Tournament = Omit<Tournaments, "id" | "date" | "require_submitter_identity" | "public_results"> & {
  id: number;
  date: Date;
  require_submitter_identity: boolean;
  public_results: boolean;
  placement_size: number | null;
};
export default Tournament;
