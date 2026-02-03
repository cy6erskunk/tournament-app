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
  const session = await getSession();
  if (!session.success) {
    redirect("/");
  }

  const { id } = await params;
  const tournamentResult = await getTournamentWithId(Number(id));

  if (!tournamentResult.success) {
    notFound();
  }

  return (
    <>
      <TournamentContextProvider initialTournament={tournamentResult.value}>
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
