import SelectTournament from "@/components/selectTournament";
import { getRecentTournaments } from "@/database/getTournament";
import { getSession } from "@/helpers/getsession";
import { redirect } from "next/navigation";
import Navbar from "@/components/navbar";

export default async function Page() {
  const session = await getSession();
  if (!session.success) {
    redirect("/");
  }
  const tournaments = await getTournaments();

  async function getTournaments() {
    const recentTournaments = await getRecentTournaments();
    if (!recentTournaments.success) {
      return [];
    }
    return recentTournaments.value;
  }

  return (
    <>
      <Navbar showNewPlayerButton={false} />
      <SelectTournament recentTournaments={tournaments} />
    </>
  );
}
