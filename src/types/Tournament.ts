import { Tournaments } from "@/types/Kysely";

// Wrapper type for Tournaments with a normalized id and date
// types instead of the generated ones from Kysely
type Tournament = Tournaments & { id: number; date: Date };
export default Tournament;
