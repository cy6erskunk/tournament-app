import Navbar from "@/components/navbar";
import TournamentButtons from "@/components/Tournaments/TournamentButtons";
import { TournamentContextProvider } from "@/context/TournamentContext";
import TournamentInfo from "@/components/Tournaments/TournamentInfo";
import { getSession } from "@/helpers/getsession";
import { notFound, redirect } from "next/navigation";
import TournamentNavbarContent from "@/components/tournamentNavbarContent";
import { getTournamentWithId } from "@/database/getTournament";

interface PageProps {
  params: Promise<{ id: string }>;
}

const Page = async ({ params }: PageProps) => {
  const { id } = await params;
  const [tournamentResult, session] = await Promise.all([
    getTournamentWithId(Number(id)),
    getSession(),
  ]);

  if (!tournamentResult.success) {
    // Don't reveal whether a tournament exists to unauthenticated users
    if (!session.success) {
      redirect("/");
    }
    notFound();
  }

  const tournament = tournamentResult.value;

  if (!session.success && !tournament.public_results) {
    redirect("/");
  }

  return (
    <>
      <TournamentContextProvider initialTournament={tournament}>
        <Navbar>
          <TournamentNavbarContent />
        </Navbar>
        <TournamentButtons />
        <TournamentInfo />
      </TournamentContextProvider>
    </>
  );
};

export default Page;
