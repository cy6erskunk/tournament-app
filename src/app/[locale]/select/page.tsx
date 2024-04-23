import SelectTournament from "@/components/selectTournament";
import { getSession } from "@/helpers/getsession";
import { redirect } from "next/navigation";
import Navbar from "@/components/navbar";

export default async function Page() {
  const session = await getSession();
  if (!session.success) {
    redirect("/");
  }

  return (
    <>
      <Navbar showNewPlayerButton={false} isTournamentSelectionPage={true} />
      <SelectTournament />
    </>
  );
}
