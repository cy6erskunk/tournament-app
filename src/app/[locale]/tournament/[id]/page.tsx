import Navbar from "@/components/navbar";
import TournamentButtons from "@/components/Tournaments/TournamentButtons";
import { TournamentContextProvider } from "@/context/TournamentContext";
import TournamentInfo from "@/components/Tournaments/TournamentInfo";
import { getSession } from "@/helpers/getsession";
import { redirect } from "next/navigation";

const Page = async () => {
  const session = await getSession();
  if (!session.success) {
    redirect("/");
  }

  return (
    <>
      <TournamentContextProvider>
        <Navbar showNewPlayerButton={true}/>
        <TournamentButtons />
        <TournamentInfo />
      </TournamentContextProvider>
    </>
  );
};

export default Page;
