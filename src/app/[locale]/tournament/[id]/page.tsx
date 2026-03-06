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
  const tournamentResult = await getTournamentWithId(Number(id));

  if (!tournamentResult.success) {
    notFound();
  }

  const tournament = tournamentResult.value;
  const session = await getSession();
  const isPublicRoundRobin =
    tournament.format === "Round Robin" && tournament.public_results;

  if (!session.success && !isPublicRoundRobin) {
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
