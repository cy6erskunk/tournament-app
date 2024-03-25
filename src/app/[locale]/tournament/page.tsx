import Navbar from "@/components/navbar";
import TournamentButtons from "@/components/Tournaments/TournamentButtons";
import { TournamentContextProvider } from "@/context/TournamentContext";
import TournamentInfo from "@/components/Tournaments/TournamentInfo";

const Page = async () => {
  return (
    <>
      <Navbar />
      {/*Style later when everything figured out, desktop view looks bad  */}
      <TournamentContextProvider>
        <TournamentButtons />
        <TournamentInfo />
      </TournamentContextProvider>
    </>
  );
};

export default Page;
