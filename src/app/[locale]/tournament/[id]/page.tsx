import Navbar from "@/components/navbar";
import TournamentButtons from "@/components/Tournaments/TournamentButtons";
import { TournamentContextProvider } from "@/context/TournamentContext";
import TournamentInfo from "@/components/Tournaments/TournamentInfo";

const Page = async () => {
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
